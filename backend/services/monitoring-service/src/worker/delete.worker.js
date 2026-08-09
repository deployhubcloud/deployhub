import Redis from "ioredis";
import RedisPubSub from "../../../../shared/redis/pubSubRedis.js";
import { REDIS_CHANNELS } from "../../../../shared/redis/channels.js";
import { env } from "../lib/env.js";
import { getRedis } from "../core/redis/client.js";
import Uptime from "../models/uptime.model.js";

const redisPubSub = new RedisPubSub(Redis, {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
});

redisPubSub.consume(REDIS_CHANNELS.PROJECT_DELETED, async (message) => {
    try {
        const { projectId } = JSON.parse(message);
        if (!projectId) {
            console.warn("[monitoring-delete] Missing projectId in project-deleted event");
            return;
        }

        const redis = getRedis();

        await Uptime.deleteMany({ projectId });
        await redis.zrem("deployhub:monitoring:schedule", projectId.toString());
        await redis.del(`deployhub:user:project:${projectId}:monitoring`);

        console.log(`[monitoring-delete] Cleanup done for project ${projectId}`);
    } catch (error) {
        console.error("[monitoring-delete] Failed:", error?.message || error);
        throw error;
    }
});

console.log(`[monitoring-delete] Listening on ${REDIS_CHANNELS.PROJECT_DELETED}`);
