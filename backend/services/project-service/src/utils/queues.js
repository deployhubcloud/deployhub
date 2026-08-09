import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { project_env } from '../lib/env.js';

const connection = {
    host: project_env.REDIS_HOST,
    port: Number(project_env.REDIS_PORT),
    maxRetriesPerRequest: null,
};

export { connection };

export const buildQueue = new Queue(QUEUE_NAMES.BUILD, { connection });
export const subdomainChangeQueue = new Queue(QUEUE_NAMES.SUBDOMAIN_CHANGE, { connection });
export const startStopHealthCheck = new Queue(QUEUE_NAMES.START_STOP_HEALTH_CHECK, { connection });
export const deleteProjectQueue = new Queue(QUEUE_NAMES.DELETE_PROJECT, { connection });

export const deleteProjectBuildQueue = new Queue(QUEUE_NAMES.DELETE_PROJECT_BUILD, { connection });
export const deleteProjectDeployQueue = new Queue(QUEUE_NAMES.DELETE_PROJECT_DEPLOY, { connection });
export const deleteProjectMonitoringQueue = new Queue(QUEUE_NAMES.DELETE_PROJECT_MONITORING, { connection });
export const deleteProjectAnalyticsQueue = new Queue(QUEUE_NAMES.DELETE_PROJECT_ANALYTICS, { connection });
