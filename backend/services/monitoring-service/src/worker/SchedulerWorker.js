import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { healthCheckQueue } from "../utils/queues.js";

const schedulerWorker = async () => {
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

            await healthCheckQueue.add(QUEUE_NAMES.HEALTH_CHECK_QUEUE, { projectId });
        }

        await sleep(1000);
    }
}

schedulerWorker()