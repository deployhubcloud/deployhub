import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { project_env } from '../lib/env.js';

const connection = {
    host: project_env.REDIS_HOST,
    port: Number(project_env.REDIS_PORT),
    password: project_env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

export const buildQueue = new Queue(QUEUE_NAMES.BUILD, { connection });
