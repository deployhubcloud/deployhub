export const cacheLatestBuildIdofProject = (projectid, redis, buildId) => {
    try {

        const redisKey = `deployhub:project:latestbuildId:${projectid}`;
        await redis.set(redisKey, buildId.toString());

    } catch (error) {
        throw error;
    }
}

export const getCacheLatestBuildIdofProject = (projectid, redis) => {
    try {

        const redisKey = `deployhub:project:latestbuildId:${projectid}`;
        return await redis.get(redisKey);

    } catch (error) {
        throw error
    }
}