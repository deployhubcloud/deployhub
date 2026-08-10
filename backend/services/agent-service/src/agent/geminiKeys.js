import { GoogleGenAI } from '@google/genai';

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


export function loadGeminiApiKeys(env = process.env) {
    const fromList = String(env.GEMINI_API_KEYS || '')
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const numbered = [
        env.GEMINI_API_KEY,
        env.GEMINI_API_KEY_2,
        env.GEMINI_API_KEY_3,
        env.GEMINI_API_KEY_4,
        env.GEMINI_API_KEY_5,
    ].filter(Boolean);

    const keys = uniqueKeys([...numbered, ...fromList]).slice(0, 5);
    if (!keys.length) {
        throw new Error('No Gemini API keys configured (set GEMINI_API_KEY or GEMINI_API_KEYS)');
    }
    return keys;
}

function isQuotaOrRateLimitError(error) {
    const status = error?.status || error?.error?.code || error?.code;
    const message = String(
        error?.error?.message || error?.message || error?.statusText || ''
    ).toLowerCase();

    if (status === 429 || status === 403) return true;
    if (String(status).toUpperCase() === 'RESOURCE_EXHAUSTED') return true;
    return (
        message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('rate_limit') ||
        message.includes('resource_exhausted') ||
        message.includes('too many requests') ||
        message.includes('exceeded')
    );
}

let rrIndex = 0;

export function createGeminiKeyPool(keys) {
    const apiKeys = uniqueKeys(keys);
    if (!apiKeys.length) {
        throw new Error('Gemini key pool is empty');
    }

    const clients = apiKeys.map((apiKey) => new GoogleGenAI({ apiKey }));

    return {
        size: apiKeys.length,

        nextStartIndex() {
            const start = rrIndex % clients.length;
            rrIndex = (rrIndex + 1) % clients.length;
            return start;
        },

        
        async generateContent(request, { startIndex = this.nextStartIndex() } = {}) {
            let lastError;
            for (let attempt = 0; attempt < clients.length; attempt++) {
                const idx = (startIndex + attempt) % clients.length;
                const ai = clients[idx];
                try {
                    const response = await ai.models.generateContent(request);
                    if (attempt > 0) {
                        console.warn(`[gemini] succeeded on key #${idx + 1} after failover`);
                    }
                    return { response, keyIndex: idx };
                } catch (error) {
                    lastError = error;
                    if (isQuotaOrRateLimitError(error) && attempt < clients.length - 1) {
                        console.warn(
                            `[gemini] key #${idx + 1} limited/exhausted — trying next key`
                        );
                        continue;
                    }
                    throw error;
                }
            }
            throw lastError;
        },
    };
}
