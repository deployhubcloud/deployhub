import { agentEnv } from '../lib/env.js';
import { toolDeclarations } from './toolDeclarations.js';
import { executeTool } from './executeTool.js';
import { createGeminiKeyPool, loadGeminiApiKeys } from './geminiKeys.js';

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

const geminiPool = createGeminiKeyPool(loadGeminiApiKeys(process.env));
console.log(`[gemini] loaded ${geminiPool.size} API key(s) for rotation`);

function extractText(response) {
    const parts = response?.candidates?.[0]?.content?.parts || [];
    return parts
        .filter((p) => typeof p.text === 'string')
        .map((p) => p.text)
        .join('\n')
        .trim();
}

function extractFunctionCalls(response) {
    const parts = response?.candidates?.[0]?.content?.parts || [];
    return parts
        .filter((p) => p.functionCall)
        .map((p) => p.functionCall);
}

export async function runAgentChat({ user, messages, auth }) {
    const model = agentEnv.GEMINI_MODEL;
    let keyIndex = geminiPool.nextStartIndex();

    const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }],
    }));

    if (!contents.length) {
        contents.push({ role: 'user', parts: [{ text: 'Hi' }] });
    }

    const toolsUsed = [];
    const maxRounds = 10;

    for (let round = 0; round < maxRounds; round++) {
        const { response, keyIndex: usedKey } = await geminiPool.generateContent(
            {
                model,
                contents,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    tools: [{ functionDeclarations: toolDeclarations }],
                    temperature: 0.25,
                },
            },
            { startIndex: keyIndex }
        );
        keyIndex = usedKey;

        const calls = extractFunctionCalls(response);
        if (!calls.length) {
            const text = extractText(response) || 'How can I help with your DeployHub projects?';
            return { reply: text, toolsUsed };
        }

        const modelContent = response.candidates[0].content;
        contents.push(modelContent);

        const functionResponseParts = [];
        for (const call of calls) {
            const name = call.name;
            const args = call.args || {};
            const result = await executeTool(name, args, user, auth);
            toolsUsed.push({ name, args: { ...args, confirmed: args.confirmed === true } });
            functionResponseParts.push({
                functionResponse: {
                    name,
                    response: result,
                },
            });
        }

        contents.push({
            role: 'user',
            parts: functionResponseParts,
        });
    }

    return {
        reply: 'I hit the tool-call limit for this turn. Please try a more specific question.',
        toolsUsed,
    };
}
