import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { getRedis } from '../core/redis/client.js';

const connection = getRedis();


export const monitoringQueue = new Queue(QUEUE_NAMES.MONITORING, { connection });