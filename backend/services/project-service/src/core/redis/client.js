import { Redis } from 'ioredis';
import { project_env } from '../../lib/env.js';
import { createRedisClient } from '../../../../../shared/redis/createRedisClient.js';

let redisClient;


export const connectRedis = async () => {

    redisClient = createRedisClient({
        Redis,
        logger: console,
        options: {
        host: project_env.REDIS_HOST,
        port: project_env.REDIS_PORT,
        password: project_env.REDIS_PASSWORD,
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
