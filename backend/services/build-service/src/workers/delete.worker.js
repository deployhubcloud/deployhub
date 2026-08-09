import Redis from "ioredis";
import RedisPubSub from "../../../../shared/redis/pubSubRedis.js";
import { REDIS_CHANNELS } from "../../../../shared/redis/channels.js";
import { buildEnv } from "../lib/env.js";
import { Build } from "../models/build.model.js";
import { deleteCacheBuildData } from "../utils/cacheBuildData.js";
import { getRedis } from "../core/redis/client.js";

const redisPubSub = new RedisPubSub(Redis, {
    host: buildEnv.REDIS_HOST,
    port: buildEnv.REDIS_PORT,
    password: buildEnv.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
});

redisPubSub.consume(REDIS_CHANNELS.PROJECT_DELETED, async (message) => {
    try {
        const { projectId } = JSON.parse(message);
        if (!projectId) {
            console.warn("[build-delete] Missing projectId in project-deleted event");
            return;
        }

        const redis = getRedis();

        const deleteResult = await Build.deleteMany({ project: projectId });
        await deleteCacheBuildData(projectId);
        await redis.del(`deployhub:project:latestbuildId:${projectId}`);

        console.log(
            `[build-delete] Deleted ${deleteResult.deletedCount} builds for project ${projectId}`
        );
    } catch (error) {
        console.error("[build-delete] Failed to delete build data:", error?.message || error);
        throw error;
    }
});

console.log(`[build-delete] Listening on ${REDIS_CHANNELS.PROJECT_DELETED}`);
