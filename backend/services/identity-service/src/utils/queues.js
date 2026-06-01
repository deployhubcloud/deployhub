import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';

const connection = await import('./connection.js');

export const welcomeQueue = new Queue(QUEUE_NAMES.WELCOME, { connection });