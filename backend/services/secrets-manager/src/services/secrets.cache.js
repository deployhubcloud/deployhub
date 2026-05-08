import { getRedis } from '../config/redis.js';
import { logger } from '../config/logger.js';

const CACHE_TTL_SECONDS = 300;
const KEY_PREFIX = 'deployhub:secrets:bundle:';


export async function getCachedBundle(serviceName) {
  try {
    const redis = getRedis();
    const raw = await redis.get(`${KEY_PREFIX}${serviceName}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    logger.warn('Cache read failed — will serve from registry', { err: err.message });
    return null;
  }
}


export async function setCachedBundle(serviceName, bundle) {
  try {
    const redis = getRedis();
    await redis.setex(
      `${KEY_PREFIX}${serviceName}`,
      CACHE_TTL_SECONDS,
      JSON.stringify(bundle)
    );
  } catch (err) {
    logger.warn('Cache write failed', { err: err.message });
  }
}

export async function invalidateBundle(serviceName) {
  const redis = getRedis();
  await redis.del(`${KEY_PREFIX}${serviceName}`);
  logger.info('Cache invalidated', { serviceName });
}


export async function invalidateAll() {
  const redis = getRedis();
  const keys = await redis.keys(`${KEY_PREFIX}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
    logger.info(`All secret caches cleared — ${keys.length} keys removed`);
  }
}
