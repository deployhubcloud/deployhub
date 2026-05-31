import { Redis } from 'ioredis';
import { env } from '../../lib/env.js';
import { createRedisClient } from '../../../../../shared/redis/createRedisClient.js';

let redisClient;


export const connectRedis = async () => {

    redisClient = createRedisClient({
        Redis,
        logger: console,
        options: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
        }
    });

    await redisClient.connect();
    return redisClient;

}


export function getRedis(){
    if(!redisClient){
        throw new Error('redis not initialised')
    }
    return redisClient;
}
