import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { healthCheckQueue } from "../utils/queues.js";
import { getRedis } from "../core/redis/client.js";
import { setTimeout as sleep } from "node:timers/promises";

export const schedulerWorker = async () => {

    const redis = getRedis();

    while (true) {
        const now = Date.now();

        const dueProjects = await redis.zrangebyscore(
            "deployhub:monitoring:schedule",
            0,
            now
        );

        for (const projectId of dueProjects) {
            await redis.zrem(
                "deployhub:monitoring:schedule",
                projectId
            );

            await healthCheckQueue.add('health-check', { projectId });
        }

        await sleep(1000);
    }
}