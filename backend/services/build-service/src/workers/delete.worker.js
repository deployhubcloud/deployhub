import { Worker } from "bullmq";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { Build } from "../models/build.model.js";
import { deleteCacheBuildData } from "../utils/cacheBuildData.js";
import { getRedis } from "../core/redis/client.js";
import { connection } from "../utils/queues/queues.js";

const deleteWorker = new Worker(
    QUEUE_NAMES.DELETE_PROJECT_BUILD,
    async (job) => {
        const { projectId } = job.data;
        if (!projectId) {
            console.warn("[build-delete] Missing projectId");
            return;
        }

        const redis = getRedis();

        const deleteResult = await Build.deleteMany({ project: projectId });
        await deleteCacheBuildData(projectId);
        await redis.del(`deployhub:project:latestbuildId:${projectId}`);

        console.log(
            `[build-delete] Deleted ${deleteResult.deletedCount} builds for project ${projectId}`
        );
    },
    {
        connection,
        concurrency: 1,
    }
);

deleteWorker.on("completed", (job) => {
    console.log(`[build-delete] Job completed for projectId: ${job.data.projectId}`);
});

deleteWorker.on("failed", (job, err) => {
    console.error(`[build-delete] Job failed for projectId: ${job?.data?.projectId}`, err);
});

export default deleteWorker;
