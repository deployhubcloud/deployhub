import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { Worker } from "bullmq";
import { connection } from "../utils/queues.js";
import axios from "axios";
import Uptime from "../models/uptime.model.js";
import { getRedis } from "../core/redis/client.js";

const healthCheckWorker = new Worker(QUEUE_NAMES.HEALTH_CHECK_QUEUE, async (job) => {
    const redis = getRedis();
    const { projectId } = job.data;
    try {
        const monitorData = await redis.hgetall(
            `deployhub:user:project:${projectId}:monitoring`
        );

        if (!monitorData?.pingUrl) {
            return;
        }

        let status = "crash";

        try {
            const response = await axios.get(monitorData.pingUrl, {
                timeout: 10000,
            });

            if (response.status === 200) {
                status = "running";
            }
        } catch {
            status = "crash";
        }

        const currentStatusData = await redis.xrevrange(
            `deployhub:users:projects:status:${projectId}`,
            "+",
            "-",
            "COUNT",
            1
        );

        const previousStatus = currentStatusData?.[0]?.[1]?.[currentStatusData[0][1].indexOf("status") + 1];


        if (previousStatus !== status) {
            await redis.xadd(
                `deployhub:users:projects:status:${projectId}`,
                "MAXLEN",
                "=",
                1,
                "*",
                "projectId",
                String(projectId),
                "status",
                status,
                "timestamp",
                String(Date.now())
            );

            await redis.publish(
                "deployhub:users:projects:status:updates",
                JSON.stringify({
                    projectId: String(projectId),
                    status,
                })
            );

            if (status === "crash") {
                const uptimeData = await Uptime.findOne({ projectId });

                if (uptimeData) {
                    uptimeData.lastDownAt = Date.now();
                    await uptimeData.save({
                        validateBeforeSave: false,
                    });
                }

                await redis.publish(
                    "deployhub:users:build:status",
                    JSON.stringify({
                        projectId,
                        projectstatus: "crash",
                        projectName: monitorData.projectName,
                    })
                );
            }
        }

        const nextPingAt =
            Date.now() +
            Number(monitorData.monitorIntervalSeconds) * 1000;

        await redis.zadd(
            "deployhub:monitoring:schedule",
            nextPingAt,
            projectId
        );
    } catch (error) {
        console.error(
            `Health check failed for project ${projectId}:`,
            error
        );
    }
}, { connection, concurrency: 50 });

healthCheckWorker.on("completed", () => {
    console.log("healthCheckWorker job completed");
});

healthCheckWorker.on("failed", (job, error) => {
    console.log(error);
    console.log("healthCheckWorker job failed");
});