import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';
import { createRedisClient } from '../../../../shared/redis/createRedisClient.js';

let client = null;

export async function connectRedis() {

  client = createRedisClient({
    Redis,
    logger,
    options: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true
    }
  });

  await client.connect();
  return client;
}

export function getRedis() {
  if (!client) throw new Error('Redis not initialised');
  return client;
}
