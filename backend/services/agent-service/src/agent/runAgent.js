import { agentEnv } from '../lib/env.js';
import { groqTools } from './toolDeclarations.js';
import { executeTool } from './executeTool.js';
import { createGroqKeyPool, loadGroqApiKeys } from './groqKeys.js';

const SYSTEM_INSTRUCTION = `You are DeployHub Assistant — an advanced ops helper for a logged-in DeployHub user.

You can discover projects, diagnose failures, read builds/logs/analytics/billing/domains, and perform write actions after confirmation.

How to work:
- Prefer tools over guessing. Never invent IDs, statuses, logs, or analytics.
- If the user names a project, call find_project first (unless they gave a clear projectId).
- For "why is X down / failing / broken", call diagnose_project, then dig into get_build_logs or get_runtime_logs as needed.
- For account-wide questions ("how many projects", "any failures"), use account_summary or list_projects / get_failed_builds.
- Be concise, structured, and actionable. When showing logs, highlight errors and the last meaningful lines.

Destructive actions (redeploy, settings/env/domain changes, delete project, revoke sessions):
1) Explain what will happen with concrete names/ids.
2) Ask a clear yes/no.
3) Only after the user clearly confirms, call the tool with confirmed=true.
4) Never set confirmed=true on the first ask. If a tool returns needsConfirmation=true, ask the user — do not invent confirmation.

Security:
- Only this user's data. Never claim access to other accounts.
- Do not dump full env secret values (tools already redact them).
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

export async function runAgentChat({ user, messages, auth }) {
    const model = agentEnv.GROQ_MODEL;
    let keyIndex = groqPool.nextStartIndex();

    const chatMessages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content || ''),
        })),
    ];

    if (chatMessages.length === 1) {
        chatMessages.push({ role: 'user', content: 'Hi' });
    }

    const toolsUsed = [];
    const maxRounds = 10;

    for (let round = 0; round < maxRounds; round++) {
        const { response, keyIndex: usedKey } = await groqPool.chatCompletions(
            {
                model,
                messages: chatMessages,
                tools: groqTools,
                tool_choice: 'auto',
                temperature: 0.25,
            },
            { startIndex: keyIndex }
        );
        keyIndex = usedKey;

        const msg = response?.choices?.[0]?.message;
        if (!msg) {
            return { reply: 'How can I help with your DeployHub projects?', toolsUsed };
        }

        const toolCalls = msg.tool_calls || [];
        if (!toolCalls.length) {
            const text = (msg.content || '').trim() || 'How can I help with your DeployHub projects?';
            return { reply: text, toolsUsed };
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
                content: JSON.stringify(result ?? { ok: false, message: 'Empty tool result' }),
            });
        }
    }

    return {
        reply: 'I hit the tool-call limit for this turn. Please try a more specific question.',
        toolsUsed,
    };
}
