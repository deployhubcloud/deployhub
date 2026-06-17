import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { getRedis } from '../core/redis/client.js';
import { env } from '../lib/env.js';

export const connection = {
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};


export const monitoringQueue = new Queue(QUEUE_NAMES.MONITORING, { connection });
export const healthCheckQueue = new Queue(QUEUE_NAMES.HEALTH_CHECK_QUEUE, { connection })