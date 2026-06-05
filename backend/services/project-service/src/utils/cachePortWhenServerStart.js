import { getRedis } from '../core/redis/client.js'

const redis = getRedis()

export const cachePortWhenServerStart = async (portModel) => {

    const ports = await portModel.find().lean()

    for (const item of ports) {

        const exists = await redis.exists(`deployhub:port:${item.port}`);

        if (exists) {
            continue;
        }

        await redis.set(`deployhub:port:${item.port}`, item.projectId);
    }

}