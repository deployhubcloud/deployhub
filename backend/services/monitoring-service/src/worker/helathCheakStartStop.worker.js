import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { Worker } from 'bullmq';
import Uptime from "../models/uptime.model.js";
import { getRedis } from "../core/redis/client.js";
import { connection } from "../utils/queues.js";


const worker = new Worker(QUEUE_NAMES.START_STOP_HEALTH_CHECK, async (job) => {

    const { projectId, enabled, intervalSeconds } = job.data

    try {

        const redis = getRedis()
        const uptime = await Uptime.findOneAndUpdate(
            { projectId },
            { isActive: enabled, intervalSeconds },
            { returnDocument: 'after' },
        );

        if (enabled) {

            const nextPingAt = Date.now() + (uptime.intervalSeconds * 1000);

            await redis.zadd(
                "deployhub:monitoring:schedule",
                nextPingAt,
                projectId.toString()
            );

            await redis.hset(`deployhub:user:project:${projectId}:monitoring`, {
                projectId,
                projectName: uptime.projectName,
                pingUrl: uptime.url,
                monitorIntervalSeconds: uptime.intervalSeconds,
                monitorfailedTries: uptime.failedTries,
            });
        } else {
            await redis.zrem(
                "deployhub:monitoring:schedule",
                projectId.toString()
            );

            await redis.del(`deployhub:user:project:${projectId}:monitoring`)
        }



    } catch (error) {
        throw error
    }
}, {
    connection: connection,
    concurrency: 1
})


worker.on("completed", () => {
    console.log("job completed for  worker");
});

worker.on("failed", () => {
    console.log("job failed for worker")
});

