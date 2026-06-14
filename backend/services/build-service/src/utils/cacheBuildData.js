import { getRedis } from '../core/redis/client.js';

export const cacheBuildsData = async (userId, buildData, expireTime) => {
    try {

        const TTL = 60 * expireTime || 60
        const redis = getRedis();
        const cacheKey = `deployhub:user:builds:${userId}`

        await redis
            .multi()
            .set(cacheKey, JSON.stringify(buildData))
            .expire(cacheKey, TTL)
            .exec();



    } catch (error) {
        console.log('Error While Cache Builds Data')
        throw error
    }
}

export const getCahceBuildData = async (userId) => {
    try {

        const redis = getRedis();
        const cacheKey = `deployhub:user:builds:${userId}`

        const data = await redis.get(cacheKey);
        return JSON.parse(data)

    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteCacheBuildData = async (userId) => {

    try {
        const redis = getRedis();
        const cacheKey = `deployhub:user:builds:${userId}`

        await redis.del(cacheKey);
    } catch (error) {
        console.log(error)
        throw error;
    }
}