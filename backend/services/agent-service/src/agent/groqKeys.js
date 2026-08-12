import Groq from 'groq-sdk';
import { getRedis } from '../core/redis/client.js';

const RR_KEY = 'deployhub:agent:groq:rr';
const CURRENT_KEY = 'deployhub:agent:groq:current';
const COOLDOWN_PREFIX = 'deployhub:agent:groq:cooldown:';
const COOLDOWN_SECONDS = Number(process.env.GROQ_KEY_COOLDOWN_SECONDS || 60);

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
 * Load keys only from GROQ_API_KEYS (comma / newline separated).
 * Example: GROQ_API_KEYS=key1,key2,key3
 */
export function loadGroqApiKeys(env = process.env) {
    const keys = uniqueKeys(
        String(env.GROQ_API_KEYS || '')
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
    );

    if (!keys.length) {
        throw new Error('No Groq API keys configured — set GROQ_API_KEYS=key1,key2,...');
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

function cooldownKey(idx) {
    return `${COOLDOWN_PREFIX}${idx}`;
}

/**
 * Redis-backed round-robin + cooldown pool over GROQ_API_KEYS list.
 */
export function createGroqKeyPool(keys) {
    const apiKeys = uniqueKeys(keys);
    if (!apiKeys.length) {
        throw new Error('Groq key pool is empty');
    }

    const clients = apiKeys.map((apiKey) => new Groq({ apiKey }));
    const n = clients.length;

    async function setCurrent(idx) {
        try {
            const redis = getRedis();
            await redis.set(CURRENT_KEY, String(idx));
        } catch {
            /* ignore */
        }
    }

    async function markCooldown(idx) {
        try {
            const redis = getRedis();
            await redis.set(cooldownKey(idx), '1', 'EX', COOLDOWN_SECONDS);
            console.warn(
                `[groq] key #${idx + 1}/${n} on cooldown for ${COOLDOWN_SECONDS}s after rate limit`
            );
        } catch (error) {
            console.warn('[groq] failed to set cooldown in redis:', error.message);
        }
    }

    async function isCooling(idx) {
        try {
            const redis = getRedis();
            const v = await redis.get(cooldownKey(idx));
            return Boolean(v);
        } catch {
            return false;
        }
    }

    async function acquireStartIndex() {
        try {
            const redis = getRedis();
            for (let attempt = 0; attempt < n; attempt++) {
                const raw = await redis.incr(RR_KEY);
                const idx = (Number(raw) - 1) % n;
                if (!(await isCooling(idx))) {
                    await setCurrent(idx);
                    return idx;
                }
            }
            const raw = await redis.incr(RR_KEY);
            const idx = (Number(raw) - 1) % n;
            await setCurrent(idx);
            return idx;
        } catch (error) {
            console.warn('[groq] redis rotate failed, using local fallback:', error.message);
            return Date.now() % n;
        }
    }

    return {
        size: n,

        acquireStartIndex,

        async chatCompletions(request, { startIndex } = {}) {
            let idx =
                typeof startIndex === 'number' && Number.isInteger(startIndex)
                    ? ((startIndex % n) + n) % n
                    : await acquireStartIndex();

            let lastError;

            for (let attempt = 0; attempt < n; attempt++) {
                const useIdx = (idx + attempt) % n;

                if (attempt < n - 1 && (await isCooling(useIdx))) {
                    continue;
                }

                const client = clients[useIdx];
                try {
                    const response = await client.chat.completions.create(request);
                    await setCurrent(useIdx);
                    if (attempt > 0) {
                        console.warn(`[groq] succeeded on key #${useIdx + 1}/${n} after failover`);
                    }
                    return { response, keyIndex: useIdx };
                } catch (error) {
                    lastError = error;
                    if (isQuotaOrRateLimitError(error)) {
                        await markCooldown(useIdx);
                        try {
                            const redis = getRedis();
                            await redis.set(RR_KEY, String(useIdx + 1));
                            await setCurrent((useIdx + 1) % n);
                        } catch {
                            /* ignore */
                        }
                        if (attempt < n - 1) {
                            console.warn(
                                `[groq] key #${useIdx + 1}/${n} limited — rotating to next key`
                            );
                            continue;
                        }
                    }
                    throw error;
                }
            }

            throw lastError;
        },
    };
}
