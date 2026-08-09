import { getRedis } from '../core/redis/client.js';

const DEFAULT_TTL = 60 * 60; // 1 hour

export async function getCache(key) {
    const redis = getRedis();
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export async function setCache(key, value, ttlSeconds = DEFAULT_TTL) {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function delCache(...keys) {
    if (!keys.length) return;
    const redis = getRedis();
    await redis.del(...keys);
}

export async function invalidateAdminCache() {
    const redis = getRedis();
    let cursor = '0';
    do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', 'deployhub:admin:cache:*', 'COUNT', 200);
        cursor = next;
        if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
}

export const cacheKeys = {
    usersList: () => 'deployhub:admin:cache:users:list',
    user: (userId) => `deployhub:admin:cache:user:${userId}`,
    projectsList: (userId) => `deployhub:admin:cache:projects:user:${userId || 'all'}`,
    project: (projectId) => `deployhub:admin:cache:project:${projectId}`,
};
