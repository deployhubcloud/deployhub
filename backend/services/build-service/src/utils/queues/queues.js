import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../../shared/queues/queueNames.js';
import { buildEnv } from '../../lib/env.js';

export const connection = {
    host: buildEnv.REDIS_HOST,
    port: Number(buildEnv.REDIS_PORT),
    password: buildEnv.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

export const deployQueue = new Queue(QUEUE_NAMES.DEPLOY, { connection });
