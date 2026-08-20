import { Redis } from 'ioredis';
import { createRedisClient } from '../../../../shared/redis/createRedisClient.js';
import { env } from '../lib/env.js';

let redisClient;


export const connectRedis = async () => {

    redisClient = createRedisClient({
        Redis,
        logger: console,
        options: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 10,
            enableReadyCheck: true,
            lazyConnect: true
        }
    });

    await redisClient.connect();
    return redisClient;

}


export function getRedis() {
    if (!redisClient) {
        throw new Error('redis not initialised')
    }
    return redisClient;
}
