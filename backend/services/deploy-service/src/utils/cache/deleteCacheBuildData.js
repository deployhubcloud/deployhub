import { getRedis } from "../../core/redis/client.js";

export const deleteCacheBuildData = async (projectId) => {
    try {
        const redis = getRedis();
        const cacheKey = `deployhub:users:project:${projectId}:builds`

        await redis.del(cacheKey);
    } catch (error) {
        console.log(error)
        throw error;
    }
}