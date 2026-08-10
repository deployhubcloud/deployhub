import { Redis } from 'ioredis';
import { createRedisClient } from '../../../../../shared/redis/createRedisClient.js';
import { agentEnv } from '../../lib/env.js';

let redisClient;

export const connectRedis = async () => {
    redisClient = createRedisClient({
        Redis,
        logger: console,
        options: {
            host: agentEnv.REDIS_HOST,
            port: agentEnv.REDIS_PORT,
            password: agentEnv.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
        },
    });

    await redisClient.connect();
    return redisClient;
};

export function getRedis() {
    if (!redisClient) throw new Error('redis not initialised');
    return redisClient;
}
