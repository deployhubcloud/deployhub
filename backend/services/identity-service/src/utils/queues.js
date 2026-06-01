// project-service/src/utils/queues.js
import { Queue } from 'bullmq';
import { getRedis } from '../core/redis/client.js';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { connection } from '../../../../shared/redis/connection.js';

export const welcomeQueue = new Queue(QUEUE_NAMES.WELCOME, { connection: connection(getRedis) });