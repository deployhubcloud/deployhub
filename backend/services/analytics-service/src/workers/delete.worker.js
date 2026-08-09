import Redis from "ioredis";
import RedisPubSub from "../../../../shared/redis/pubSubRedis.js";
import { REDIS_CHANNELS } from "../../../../shared/redis/channels.js";
import { env } from "../lib/env.js";
import { getRedis } from "../redis/client.js";

const redisPubSub = new RedisPubSub(Redis, {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
});

async function deleteKeysByPattern(redis, pattern) {
    let cursor = "0";
    let deleted = 0;

    do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
        cursor = nextCursor;

        if (keys.length > 0) {
            deleted += await redis.del(...keys);
        }
    } while (cursor !== "0");

    return deleted;
}

redisPubSub.consume(REDIS_CHANNELS.PROJECT_DELETED, async (message) => {
    try {
        const { projectId } = JSON.parse(message);
        if (!projectId) {
            console.warn("[analytics-delete] Missing projectId in project-deleted event");
            return;
        }

        const redis = getRedis();
        const deleted = await deleteKeysByPattern(
            redis,
            `deployhub:user:analytics:${projectId}*`
        );

        console.log(`[analytics-delete] Deleted ${deleted} analytics keys for project ${projectId}`);
    } catch (error) {
        console.error("[analytics-delete] Failed:", error?.message || error);
        throw error;
    }
});

console.log(`[analytics-delete] Listening on ${REDIS_CHANNELS.PROJECT_DELETED}`);
