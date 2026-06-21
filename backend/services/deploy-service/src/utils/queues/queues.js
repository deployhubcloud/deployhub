import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../../shared/queues/queueNames.js';
import { DEPLOY_SERVICE_ENV } from '../../lib/env.js';

export const connection = {
    host: DEPLOY_SERVICE_ENV.REDIS_HOST,
    port: Number(DEPLOY_SERVICE_ENV.REDIS_PORT),
    password: DEPLOY_SERVICE_ENV.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

export const deployQueue = new Queue(QUEUE_NAMES.DEPLOY, { connection });
export const monitoringQueue = new Queue(QUEUE_NAMES.MONITORING, { connection });
