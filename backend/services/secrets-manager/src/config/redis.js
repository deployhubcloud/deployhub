import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let client = null;

export async function connectRedis() {

  client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true
  });

  client.on('connect', () => {
    logger.info('Redis connected')
  });

  client.on('error', (err) => {
    logger.error('Redis error', { err: err.message })
  });

  client.on('reconnecting', () => {
    logger.warn('Redis reconnecting')
  });

  await client.connect();
  return client;
}

export function getRedis() {
  if (!client) throw new Error('Redis not initialised');
  return client;
}
