import { Redis } from 'ioredis';
import { DEPLOY_SERVICE_ENV } from '../../lib/env.js';
import { createRedisClient } from '../../../../../shared/redis/createRedisClient.js';

let redisClient;


export const connectRedis = async () => {

    redisClient = createRedisClient({
        Redis,
        logger: console,
        options: {
        host: DEPLOY_SERVICE_ENV.REDIS_HOST,
        port: DEPLOY_SERVICE_ENV.REDIS_PORT,
        password: DEPLOY_SERVICE_ENV.REDIS_PASSWORD,
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
