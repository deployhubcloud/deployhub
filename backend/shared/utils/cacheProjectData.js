export const cacheProjectData = async (redis, projectData, expiryTime) => {
    try {

        const TTL = parseInt(expiryTime) * 5
        const redisProjectKey = `deployhub:users:project:${projectData._id}`;

        await redis
            .multi()
            .hset(redisProjectKey, JSON.stringify(projectData))
            .expire(redisProjectKey, TTL)
            .exec();

    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getCacheProjectData = async (projectId, redis) => {

    try {
        const redisProjectKey = `deployhub:users:project:${projectId}`;

        const data = await redis.hgetall(redisProjectKey);
        return JSON.parse(data);
    } catch (error) {
        console.log(error);
        throw error;
    }
}


export const clearCacheProjectData = async (projectId, redis) => {

    try {
        const redisProjectKey = `deployhub:users:project:${projectId}`;
        await redis.del(redisProjectKey);
    } catch (error) {

        console.log(error);
        throw error;
    }

}