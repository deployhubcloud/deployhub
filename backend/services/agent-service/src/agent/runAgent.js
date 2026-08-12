import { agentEnv } from '../lib/env.js';
import { groqTools } from './toolDeclarations.js';
import { executeTool } from './executeTool.js';
import { createGroqKeyPool, loadGroqApiKeys } from './groqKeys.js';
import {
    buildLlmMessages,
    compactToolResult,
    updateConversationMemory,
} from './contextBudget.js';

const SYSTEM_INSTRUCTION = `You are DeployHub Assistant — a smart ops copilot for the logged-in user only.

## Every turn — think then act
1. Understand intent: what does the user want? (status, why down, logs, billing, settings change, create project, compare, account overview, etc.)
2. Decide tools: pick the smallest set that answers that intent with real data. Never invent IDs, status, logs, domains, or prices.
3. Parallel tools: when calls are independent, request MULTIPLE tools in ONE response (same turn). Example: after you know projectId, call live status + analytics + uptime together.
4. Sequential only when needed: if you need an id/name first, call find_project (or list_projects), then in the next round call the rest together.
5. Prefer composite tools when they fit: diagnose_project, check_fleet_health, account_summary, compare_projects, analyze_build_failure.
6. After tools return: read the results carefully, then answer in your own clear words. Lead with the answer; add short supporting facts. Do not dump raw JSON or tool names unless useful. Suggest one next step when helpful.

## Routing hints
- User names a project → find_project first (unless projectId already known).
- Down / failing / broken → diagnose_project or analyze_build_failure.
- "Any projects down?" / fleet → check_fleet_health.
- Env tweak → merge_env_vars (not full replace). Prefer merge over update_env_settings.
- Free create → create_free_project (static only). Paid plans → tell them to use dashboard payment.
- Logs → highlight errors/warnings only.

## Safety
Destructive actions (redeploy, settings, env, domain, delete, create, sessions, name change): briefly explain impact → ask yes/no → only then call the tool with confirmed=true.
Never dump secret env values (keys/names only).
Compressed memory is a hint — verify with tools when the answer depends on current state.
Be concise and helpful.
`;

const groqPool = createGroqKeyPool(loadGroqApiKeys(process.env));
console.log(`[groq] loaded ${groqPool.size} API key(s) for rotation`);

function parseToolArgs(raw) {
    if (raw == null || raw === '') return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        return {};
    } catch {
        return {};
    }
}

async function runToolsInParallel(toolCalls, user, auth) {
    return Promise.all(
        toolCalls.map(async (call) => {
            const name = call.function?.name || 'unknown';
            const args = parseToolArgs(call.function?.arguments);
            try {
                const result = await executeTool(name, args, user, auth);
                return { call, name, args, result };
            } catch (error) {
                return {
                    call,
                    name,
                    args,
                    result: {
                        ok: false,
                        message: error?.message || 'Tool execution failed',
                    },
                };
            }
        })
    );
}

export async function runAgentChat({ user, message, memory, recent, auth }) {
    const model = agentEnv.GROQ_MODEL;
    let keyIndex = await groqPool.acquireStartIndex();

    const chatMessages = buildLlmMessages({
        systemInstruction: SYSTEM_INSTRUCTION,
        memory,
        recent,
        message,
    });

    const toolsUsed = [];
    const maxRounds = 8;
    let synthesisNudgeSent = false;

    for (let round = 0; round < maxRounds; round++) {
        const nearLimit = round >= maxRounds - 2;
        const { response, keyIndex: usedKey } = await groqPool.chatCompletions(
            {
                model,
                messages: chatMessages,
                tools: groqTools,
                tool_choice: nearLimit && toolsUsed.length ? 'none' : 'auto',
                temperature: 0.3,
                max_tokens: 1400,
            },
            { startIndex: keyIndex }
        );
        keyIndex = usedKey;

        const msg = response?.choices?.[0]?.message;
        if (!msg) {
            const reply = 'How can I help with your DeployHub projects?';
            return {
                reply,
                memory: updateConversationMemory(memory, message, reply, toolsUsed),
                toolsUsed,
            };
        }

        const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];

        if (!toolCalls.length) {
            let text = (msg.content || '').trim();

            // Model finished tools but returned empty — nudge once to synthesize
            if (!text && toolsUsed.length && !synthesisNudgeSent && round < maxRounds - 1) {
                synthesisNudgeSent = true;
                chatMessages.push({
                    role: 'assistant',
                    content: msg.content || '',
                });
                chatMessages.push({
                    role: 'user',
                    content:
                        'Using the tool results above, answer my question clearly in plain language. ' +
                        'Do not call more tools unless critical data is still missing.',
                });
                continue;
            }

            if (!text) {
                text = toolsUsed.length
                    ? 'I gathered the data but could not format a reply. Please ask again more specifically.'
                    : 'How can I help with your DeployHub projects?';
            }

            return {
                reply: text,
                memory: updateConversationMemory(memory, message, text, toolsUsed),
                toolsUsed,
            };
        }

        chatMessages.push({
            role: 'assistant',
            content: msg.content || null,
            tool_calls: toolCalls,
        });

        // Independent tools in this round run in parallel
        const executed = await runToolsInParallel(toolCalls, user, auth);

        for (const { call, name, args, result } of executed) {
            toolsUsed.push({
                name,
                args: { ...args, confirmed: args?.confirmed === true },
            });
            chatMessages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: compactToolResult(result),
            });
        }
    }

    const reply = 'I hit the tool-call limit for this turn. Please try a more specific question.';
    return {
        reply,
        memory: updateConversationMemory(memory, message, reply, toolsUsed),
        toolsUsed,
    };
}
