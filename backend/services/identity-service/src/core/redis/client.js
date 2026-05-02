import { Redis } from 'ioredis';
import { AUTH_ENV } from '../../lib/env.js';

let redisClient;


export const connectRedis = async () => {

    redisClient = new Redis({
        host: AUTH_ENV.REDIS_HOST,
        port: AUTH_ENV.REDIS_PORT,
        password: AUTH_ENV.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
    });

    redisClient.on("connect", () => {
        console.log("redis client connected")
    })

    redisClient.on('error', () => {
        console.log('Error While connecting to redis')
    })

    redisClient.on('reconnecting', () => {
        console.log('redis reconnecting')
    })

    await redisClient.connect();
    return redisClient;

}


export function getRedis(){
    if(!redisClient){
        throw new Error('redis not initialised')
    }
    return redisClient;
}