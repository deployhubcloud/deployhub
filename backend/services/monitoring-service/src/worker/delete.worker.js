import { Worker } from "bullmq";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { getRedis } from "../core/redis/client.js";
import Uptime from "../models/uptime.model.js";
import { connection } from "../utils/queues.js";

const deleteWorker = new Worker(
    QUEUE_NAMES.DELETE_PROJECT_MONITORING,
    async (job) => {
        const { projectId } = job.data;
        if (!projectId) {
            console.warn("[monitoring-delete] Missing projectId");
            return;
        }

        const redis = getRedis();

        await Uptime.deleteMany({ projectId });
        await redis.zrem("deployhub:monitoring:schedule", projectId.toString());
        await redis.del(`deployhub:user:project:${projectId}:monitoring`);

        console.log(`[monitoring-delete] Cleanup done for project ${projectId}`);
    },
    {
        connection,
        concurrency: 1,
    }
);

deleteWorker.on("completed", (job) => {
    console.log(`[monitoring-delete] Job completed for projectId: ${job.data.projectId}`);
});

deleteWorker.on("failed", (job, err) => {
    console.error(`[monitoring-delete] Job failed for projectId: ${job?.data?.projectId}`, err);
});

export default deleteWorker;
