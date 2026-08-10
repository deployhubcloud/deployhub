import { agentEnv } from '../lib/env.js';
import { groqTools } from './toolDeclarations.js';
import { executeTool } from './executeTool.js';
import { createGroqKeyPool, loadGroqApiKeys } from './groqKeys.js';

const SYSTEM_INSTRUCTION = `You are DeployHub Assistant — an advanced ops helper for a logged-in DeployHub user.

Capabilities (use tools; never invent data):
- Projects: list/filter/find, overview, meta, settings, domains, billing, plans, create FREE static project
- Builds: list, failed builds, build details, latest build, build stats, logs, analyze_build_failure
- Deployments: list_deployments, get_latest_deployment
- Runtime/Monitoring: live status APIs, deploy cache, docker logs, get_uptime_status
- Analytics: summary + get_analytics_health_score
- Env: get_env_keys, merge_env_vars (preferred), update_env_settings (full replace)
- Fleet: check_fleet_health, compare_projects, account_summary, diagnose_project

How to work:
- Prefer tools over guessing. Never invent IDs, statuses, logs, or analytics.
- If the user names a project, call find_project first (unless they gave a clear projectId).
- For "why is X down / failing / broken", prefer diagnose_project or analyze_build_failure.
- For "are any projects down?", use check_fleet_health.
- For env changes of a few keys, prefer upsert_env_vars (merge) over update_env_settings (full replace).
- Free create_free_project is static-only. Paid plans require the dashboard payment UI — explain that; do not fake payment.
- Be concise, structured, and actionable. When showing logs, highlight errors.

Destructive actions (redeploy, settings/env/domain, delete, create project, revoke sessions, rename):
1) Explain what will happen with concrete names/ids.
2) Ask a clear yes/no.
3) Only after explicit confirmation, call the tool with confirmed=true.
4) Never set confirmed=true on the first ask. If needsConfirmation=true, ask the user.

Security:
- Only this user's data.
- Do not dump full env secret values (tools redact them).
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
