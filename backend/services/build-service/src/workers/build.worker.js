import Worker from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { connection } from '../utils/connection.js';
import { getRedis } from '../core/redis/client.js';

const redis = await getRedis();

export const buildWorker = new Worker(QUEUE_NAMES.BUILD, async (job) => {
    try {

        // data from the queue
        const { projectId, plan } = job.data;

        



    } catch (error) {
        throw error.message;
    }
})