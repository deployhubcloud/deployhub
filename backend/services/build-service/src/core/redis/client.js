import { Redis } from 'ioredis';
import { buildEnv } from '../../lib/env.js';
import { createRedisClient } from '../../../../../shared/redis/createRedisClient.js';

let redisClient;


export const connectRedis = async () => {

    redisClient = createRedisClient({
        Redis,
        logger: console,
        options: {
        host: buildEnv.REDIS_HOST,
        port: buildEnv.REDIS_PORT,
        password: buildEnv.REDIS_PASSWORD,
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
