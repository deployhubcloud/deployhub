import { agentEnv } from '../lib/env.js';
import { groqTools } from './toolDeclarations.js';
import { executeTool } from './executeTool.js';
import { createGroqKeyPool, loadGroqApiKeys } from './groqKeys.js';
import {
    buildLlmMessages,
    compactToolResult,
    updateConversationMemory,
} from './contextBudget.js';

const SYSTEM_INSTRUCTION = `You are DeployHub Assistant for the logged-in user.

Use tools for facts — never invent IDs/status/logs.
If user names a project, find_project first.
Down/failing → diagnose_project or analyze_build_failure.
Fleet down? → check_fleet_health.
Env tweaks → merge_env_vars (not full replace).
Free create_free_project = static only; paid needs dashboard payment.
Be concise. For logs, highlight errors only.

Destructive (redeploy/settings/env/domain/delete/create/sessions): explain → ask yes/no → only then confirmed=true.
Only this user's data. Never dump secret env values.
If compressed memory is present, treat it as hints and verify with tools when needed.
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

    for (let round = 0; round < maxRounds; round++) {
        const { response, keyIndex: usedKey } = await groqPool.chatCompletions(
            {
                model,
                messages: chatMessages,
                tools: groqTools,
                tool_choice: 'auto',
                temperature: 0.25,
                max_tokens: 1024,
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

        const toolCalls = msg.tool_calls || [];
        if (!toolCalls.length) {
            const text = (msg.content || '').trim() || 'How can I help with your DeployHub projects?';
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

        for (const call of toolCalls) {
            const name = call.function?.name;
            const args = parseToolArgs(call.function?.arguments);
            const result = await executeTool(name, args, user, auth);
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
