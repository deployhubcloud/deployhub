export const cacheProjectData = async (projectId, redis, projectData, expiryTime) => {
    try {

        const TTL = 60 * parseInt(expiryTime)
        const redisProjectKey = `deployhub:users:project:${projectId}`;

        await redis
            .multi()
            .set(redisProjectKey, JSON.stringify(projectData))
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

        const data = await redis.get(redisProjectKey);
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