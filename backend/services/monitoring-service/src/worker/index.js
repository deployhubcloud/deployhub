import { schedulerWorker } from './SchedulerWorker.js'
import { cacheSheduleData } from './cacheSheduleDataWhenServerStart.js';
import './healthCheckWorker.js'
import './monitoringQueue.worker.js'
import './helathCheakStartStop.worker.js'
import './delete.worker.js'

schedulerWorker();
await cacheSheduleData()
