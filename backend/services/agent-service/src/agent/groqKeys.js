import Groq from 'groq-sdk';

function uniqueKeys(list) {
    const seen = new Set();
    const out = [];
    for (const raw of list) {
        const key = String(raw || '').trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(key);
    }
    return out;
}

/**
 * Collect up to 5 Groq API keys from:
 * - GROQ_API_KEYS (comma/newline separated)
 * - GROQ_API_KEY, GROQ_API_KEY_2 … GROQ_API_KEY_5
 */
export function loadGroqApiKeys(env = process.env) {
    const fromList = String(env.GROQ_API_KEYS || '')
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const numbered = [
        env.GROQ_API_KEY,
        env.GROQ_API_KEY_2,
        env.GROQ_API_KEY_3,
        env.GROQ_API_KEY_4,
        env.GROQ_API_KEY_5,
    ].filter(Boolean);

    const keys = uniqueKeys([...numbered, ...fromList]).slice(0, 5);
    if (!keys.length) {
        throw new Error('No Groq API keys configured (set GROQ_API_KEY or GROQ_API_KEYS)');
    }
    return keys;
}

function isQuotaOrRateLimitError(error) {
    const status = error?.status || error?.error?.code || error?.code || error?.statusCode;
    const message = String(
        error?.error?.message || error?.message || error?.statusText || ''
    ).toLowerCase();

    if (status === 429 || status === 403) return true;
    return (
        message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('rate_limit') ||
        message.includes('too many requests') ||
        message.includes('exceeded') ||
        message.includes('tpm') ||
        message.includes('rpm')
    );
}

let rrIndex = 0;

export function createGroqKeyPool(keys) {
    const apiKeys = uniqueKeys(keys);
    if (!apiKeys.length) {
        throw new Error('Groq key pool is empty');
    }

    const clients = apiKeys.map((apiKey) => new Groq({ apiKey }));

    return {
        size: apiKeys.length,

        nextStartIndex() {
            const start = rrIndex % clients.length;
            rrIndex = (rrIndex + 1) % clients.length;
            return start;
        },

        async chatCompletions(request, { startIndex = this.nextStartIndex() } = {}) {
            let lastError;
            for (let attempt = 0; attempt < clients.length; attempt++) {
                const idx = (startIndex + attempt) % clients.length;
                const client = clients[idx];
                try {
                    const response = await client.chat.completions.create(request);
                    if (attempt > 0) {
                        console.warn(`[groq] succeeded on key #${idx + 1} after failover`);
                    }
                    return { response, keyIndex: idx };
                } catch (error) {
                    lastError = error;
                    if (isQuotaOrRateLimitError(error) && attempt < clients.length - 1) {
                        console.warn(`[groq] key #${idx + 1} limited/exhausted — trying next key`);
                        continue;
                    }
                    throw error;
                }
            }
            throw lastError;
        },
    };
}
