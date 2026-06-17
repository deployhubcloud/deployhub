import { getRedis } from "../core/redis/client.js";
import Uptime from "../models/uptime.model.js";

export const cacheSheduleData = async (params) => {

    const redis = getRedis()
    try {
        const count = await redis.zcard(
            "deployhub:monitoring:schedule"
        );

        if (count === 0) {

            const monitors =
                await Uptime.find({
                    isActive: true
                });

            for (const monitor of monitors) {

                await redis.hset(`deployhub:user:project:${monitor.projectId}:monitoring`, {
                    projectId: monitor.projectId,
                    projectName: monitor.projectName,
                    pingUrl: monitor.url,
                    monitorIntervalSeconds: monitor.intervalSeconds,
                    monitorfailedTries: monitor.failedTries,
                });

                const nextPingAt = Date.now() + (Number(monitor.intervalSeconds) * 1000);

                await redis.zadd(
                    "deployhub:monitoring:schedule",
                    nextPingAt,
                    monitor.projectId
                );
            }
        }
    } catch (error) {
        throw error
    }
}