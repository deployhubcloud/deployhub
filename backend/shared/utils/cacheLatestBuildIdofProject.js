export const cacheLatestBuildIdOfProject = async (projectid, redis, data) => {
    try {
        const redisKey = `deployhub:project:latestbuildId:${projectid}`;
        await redis.hset(redisKey, data);
    } catch (error) {
        throw error;
    }
};


export const getCacheLatestBuildIdOfProject = async (projectid, redis) => {
    try {
        const redisKey = `deployhub:project:latestbuildId:${projectid}`;
        const data = await redis.hgetall(redisKey);
        return data;
    } catch (error) {
        throw error;
    }
};