import { Worker } from "bullmq";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { getRedis } from "../redis/client.js";
import { connection } from "../utils/queues.js";

async function deleteKeysByPattern(redis, pattern) {
    let cursor = "0";
    let deleted = 0;

    do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
        cursor = nextCursor;

        if (keys.length > 0) {
            deleted += await redis.del(...keys);
        }
    } while (cursor !== "0");

    return deleted;
}

const deleteWorker = new Worker(
    QUEUE_NAMES.DELETE_PROJECT_ANALYTICS,
    async (job) => {
        const { projectId } = job.data;
        if (!projectId) {
            console.warn("[analytics-delete] Missing projectId");
            return;
        }

        const redis = getRedis();
        const deleted = await deleteKeysByPattern(
            redis,
            `deployhub:user:analytics:${projectId}*`
        );

        console.log(`[analytics-delete] Deleted ${deleted} analytics keys for project ${projectId}`);
    },
    {
        connection,
        concurrency: 1,
    }
);

deleteWorker.on("completed", (job) => {
    console.log(`[analytics-delete] Job completed for projectId: ${job.data.projectId}`);
});

deleteWorker.on("failed", (job, err) => {
    console.error(`[analytics-delete] Job failed for projectId: ${job?.data?.projectId}`, err);
});

export default deleteWorker;
