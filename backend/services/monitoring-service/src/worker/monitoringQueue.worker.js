import { Worker } from "bullmq";
import { connection, monitoringQueue } from "../utils/queues.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import Uptime from "../models/uptime.model.js";
import { getRedis } from "../core/redis/client.js";

const redis = getRedis();

const worker = new Worker(QUEUE_NAMES.MONITORING, async (job) => {

    const { projectId, projectName, pingUrl, monitorIntervalSeconds, monitorfailedTries } = job.data

    try {

        await Uptime.create({
            projectId,
            projectName,
            url: pingUrl,
            intervalSeconds: monitorIntervalSeconds,
            failedTries: monitorfailedTries,
        });

        const nextPingAt = Date.now() + (monitorIntervalSeconds * 1000);

        await redis.zadd(
            "deployhub:monitoring:schedule",
            nextPingAt,
            projectId.toString()
        );


    } catch (error) {
        throw error;
    }
})


worker.on("completed", () => {
    console.log("job completed for monitoring worker");
});

worker.on("failed", () => {
    console.log("job failed for monitoring worker")
});