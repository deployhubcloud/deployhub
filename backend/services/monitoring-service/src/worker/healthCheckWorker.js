import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { Worker } from "bullmq";
import { healthCheckQueue } from "../utils/queues.js";
import axios from 'axios'
import Uptime from "../models/uptime.model.js";
import { getRedis } from "../core/redis/client.js";


const redis = getRedis();


const healthCheckWorker = new Worker(QUEUE_NAMES.HEALTH_CHECK_QUEUE, async () => {
    const { projectId } = job.data;
    try {
        const monitorData = await redis.hgetall(`deployhub:user:project:${projectId}:monitoring`);

        const result = await axios.get(
            monitorData.pingUrl
        );

        if (result.status !== 200) {

            await redis.xadd(
                `deployhub:users:projects:status:${projectId}`,
                "*",
                "projectId",
                String(projectId),
                "status",
                "crash",
                "timestamp",
                String(Date.now())
            );

            const uptimeData = await Uptime.findOne({ projectId });
            uptimeData.lastDownAt = Date.now()
            await uptimeData.save({ validateBeforeSave: false });
        }

        // next schedule
        const nextPingAt = Date.now() + (Number(monitorData.monitorIntervalSeconds) * 1000);

        await redis.zadd("deployhub:monitoring:schedule", nextPingAt, projectId);

    } catch (error) {


        await redis.xadd(
            `deployhub:users:projects:status:${projectId}`,
            "*",
            "projectId",
            String(projectId),
            "status",
            "crash",
            "timestamp",
            String(Date.now())
        );

        const uptimeData = await Uptime.findOne({ projectId });
        uptimeData.lastDownAt = Date.now()
        await uptimeData.save({ validateBeforeSave: false });

        return
    }
})


