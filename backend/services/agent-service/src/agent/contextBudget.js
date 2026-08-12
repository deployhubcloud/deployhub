export const MEMORY_MAX_CHARS = 1200;
export const RECENT_MSG_MAX = 4;
export const MSG_CONTENT_MAX = 600;
export const TOOL_RESULT_MAX = 1800;

export function clip(text, max) {
    const s = String(text ?? '');
    if (s.length <= max) return s;
    return `${s.slice(0, Math.max(0, max - 1))}…`;
}


export function updateConversationMemory(prevMemory, userMsg, assistantReply, toolsUsed = []) {
    const lines = [];
    const prev = String(prevMemory || '').trim();
    if (prev) lines.push(prev);

    lines.push(`U: ${clip(userMsg, 140)}`);
    lines.push(`A: ${clip(assistantReply, 220)}`);

    if (toolsUsed.length) {
        const names = toolsUsed
            .map((t) => t?.name)
            .filter(Boolean)
            .slice(0, 8);
        if (names.length) lines.push(`T: ${names.join(',')}`);
    }

    return clip(lines.join('\n'), MEMORY_MAX_CHARS);
}

export function normalizeRecentMessages(recent = []) {
    if (!Array.isArray(recent)) return [];
    return recent
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .slice(-RECENT_MSG_MAX)
        .map((m) => ({
            role: m.role,
            content: clip(m.content, MSG_CONTENT_MAX),
        }));
}

export function buildLlmMessages({ systemInstruction, memory, recent, message }) {
    const out = [{ role: 'system', content: systemInstruction }];

    const mem = String(memory || '').trim();
    if (mem) {
        out.push({
            role: 'system',
            content:
                'Compressed prior conversation memory (facts only; may be incomplete). ' +
                'Use tools to verify current state.\n' +
                clip(mem, MEMORY_MAX_CHARS),
        });
    }

    for (const m of normalizeRecentMessages(recent)) {
        out.push({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
        });
    }

    const userText = String(message || '').trim();
    if (userText) {
        out.push({ role: 'user', content: clip(userText, 2000) });
    } else if (out.length === 1) {
        out.push({ role: 'user', content: 'Hi' });
    }

    return out;
}

export function compactToolResult(result) {
    try {
        const raw = JSON.stringify(result ?? { ok: false });
        if (raw.length <= TOOL_RESULT_MAX) return raw;

        if (result && typeof result === 'object') {
            const slim = { ...result };
            for (const key of ['logs', 'logSample', 'logTail', 'errorLines', 'builds', 'repositories', 'projects']) {
                if (slim[key] == null) continue;
                if (typeof slim[key] === 'string') {
                    slim[key] = clip(slim[key], 400);
                } else if (Array.isArray(slim[key])) {
                    slim[key] = slim[key].slice(0, 5);
                    slim[`${key}Truncated`] = true;
                }
            }
            const again = JSON.stringify(slim);
            if (again.length <= TOOL_RESULT_MAX) return again;
            return clip(again, TOOL_RESULT_MAX);
        }

        return clip(raw, TOOL_RESULT_MAX);
    } catch {
        return '{"ok":false,"message":"Failed to serialize tool result"}';
    }
}
