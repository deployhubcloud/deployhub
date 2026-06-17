import { schedulerWorker } from './SchedulerWorker.js'
import { cacheSheduleData } from './cacheSheduleDataWhenServerStart.js';
import './healthCheckWorker.js'
import './monitoringQueue.worker.js'


schedulerWorker();
await cacheSheduleData()