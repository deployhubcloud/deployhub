import { agentEnv } from '../lib/env.js';
import { groqTools } from './toolDeclarations.js';
import { executeTool } from './executeTool.js';
import { createGroqKeyPool, loadGroqApiKeys } from './groqKeys.js';
import {
    buildLlmMessages,
    compactToolResult,
    updateConversationMemory,
} from './contextBudget.js';

const INTENT_INSTRUCTION = `You are DeployHub Assistant. First understand what the user wants.

Decide:
A) Direct reply — if no DeployHub data/action is needed:
   - greetings, thanks, bye, jokes, random bakwas, unclear chatter
   - general questions you can answer without live project/account facts
   Reply briefly in your own words. Do NOT invent project names, status, IDs, or logs.
   Ask how you can help with DeployHub if useful.

B) Need tools — if they ask about projects, status, builds, deploys, logs, domains,
   billing, env, sessions, create/redeploy/delete, compare, fleet health, analytics,
   site reachability, DNS/SSL, package versions, GitHub repo/commits/Actions,
   error/docs lookup, or anything that needs live data / an action.
   Reply with ONLY this exact token (nothing else):
   USE_TOOLS

Never call tools in this step (you have none). Only choose A or B.
`;

const SYSTEM_INSTRUCTION = `You are DeployHub Assistant — a smart ops copilot for the logged-in user only.
The user already needs DeployHub data or an action — use tools wisely.

## How you work
1. Understand the goal from the message + recent context.
2. Pick the smallest tool set that gathers real facts. Never invent IDs/status/logs/domains/prices.
3. Parallel tools: when independent, request MULTIPLE tools in ONE response.
4. Sequential only when needed: resolve name→id with find_project first, then call the rest together.
5. Prefer composite tools: diagnose_project, check_fleet_health, account_summary, compare_projects, analyze_build_failure.
6. Mix external tools when useful — call them in parallel with DeployHub tools:
   - Site down / not loading → diagnose_project + probe_url (+ check_dns / check_ssl on the domain).
   - Custom domain issues → check_dns + check_ssl + lookup_domain_whois + get_domain_settings.
   - Build/runtime error text → analyze_build_failure + search_error_docs (and lookup_npm_package / lookup_pypi_package if dependency-related).
   - "Did code push?" / CI → get_github_repo_insights with owner/repo.
   - Docs/status pages → fetch_public_page.
7. After tool results: answer in your own clear words. Lead with the answer; short facts. No raw JSON dumps.

## Routing
- Named project → find_project first (unless projectId known).
- Down/failing → diagnose_project or analyze_build_failure; also probe_url on the project domain when available.
- Fleet / any down? → check_fleet_health.
- Env tweak → merge_env_vars (not full replace).
- Free create → create_free_project (static only). Paid → dashboard payment.
- Logs → highlight errors/warnings only; search_error_docs for stubborn errors.

## Safety
Destructive (redeploy/settings/env/domain/delete/create/sessions/name): explain → ask yes/no → only then confirmed=true.
Never dump secret env values. Memory is a hint — verify with tools when state matters.
Be concise.
`;

const USE_TOOLS_TOKEN = 'USE_TOOLS';

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

function wantsTools(text) {
    const t = String(text || '').trim();
    if (!t) return true;
    if (t === USE_TOOLS_TOKEN) return true;
    if (/^\s*USE_TOOLS\s*$/i.test(t)) return true;
    if (/^\{?\s*"?action"?\s*:\s*"?use_tools"?\s*\}?$/i.test(t)) return true;
    if (/^\s*USE_TOOLS\b/i.test(t) && t.length < 40) return true;
    return false;
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


async function understandIntent({ message, memory, recent, keyIndex }) {
    const intentMessages = buildLlmMessages({
        systemInstruction: INTENT_INSTRUCTION,
        memory,
        recent,
        message,
    });

    const { response, keyIndex: usedKey } = await groqPool.chatCompletions(
        {
            model: agentEnv.GROQ_MODEL,
            messages: intentMessages,
            temperature: 0.2,
            max_tokens: 220,
        },
        { startIndex: keyIndex }
    );

    const text = (response?.choices?.[0]?.message?.content || '').trim();
    if (!text || wantsTools(text)) {
        return { needsTools: true, keyIndex: usedKey };
    }

    return { needsTools: false, reply: text, keyIndex: usedKey };
}

export async function runAgentChat({ user, message, memory, recent, auth }) {
    let keyIndex = await groqPool.acquireStartIndex();

    const intent = await understandIntent({ message, memory, recent, keyIndex });
    keyIndex = intent.keyIndex;

    if (!intent.needsTools) {
        return {
            reply: intent.reply,
            memory: updateConversationMemory(memory, message, intent.reply, []),
            toolsUsed: [],
        };
    }

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
                model: agentEnv.GROQ_MODEL,
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
