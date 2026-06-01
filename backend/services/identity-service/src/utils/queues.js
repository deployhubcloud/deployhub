import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { AUTH_ENV } from '../lib/env.js';

const connection = {
    host: AUTH_ENV.REDIS_HOST,
    port: Number(AUTH_ENV.REDIS_PORT),
    password: AUTH_ENV.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

export const welcomeQueue = new Queue(QUEUE_NAMES.WELCOME, { connection });
