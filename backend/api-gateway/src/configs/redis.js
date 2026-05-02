import Redis from 'ioredis';
import { ENV } from '../lib/env.js';

let redis;

export const connectRedis = async () => {

    redis = new Redis({
        host: ENV.REDIS_HOST,
        port: ENV.REDIS_PORT,
        password: ENV.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
    })

    redis.on('connect', () => {
        console.log('Redis Connected Successfully')
    });

    redis.on('error', () => {
        console.log('Error While Connect to Redis')
    });

    redis.on('reconnecting', () => {
        console.log('Redis reconnecting')
    });

    await redis.connect();
    return redis;
}

export const getRedis = () => {

    if (!redis) {
        throw new Error('Redis not Initialised')
    }

    return redis;
}

