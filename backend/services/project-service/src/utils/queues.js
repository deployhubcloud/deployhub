// project-service/src/utils/queues.js
import { Queue } from 'bullmq';
import { getRedis } from '../core/redis/client.js';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';

const connection = getRedis();

export const buildQueue = new Queue(QUEUE_NAMES.BUILD, { connection });