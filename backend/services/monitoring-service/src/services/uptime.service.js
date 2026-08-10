import { assertUserOwnsProject } from '../../../../shared/utils/assertUserOwnsProject.js';
import Uptime from '../models/uptime.model.js';
import { getRedis } from '../core/redis/client.js';
import { env } from '../lib/env.js';

export const getUptimeForUser = async (userId, projectId) => {
    await assertUserOwnsProject({
        projectServiceUrl: env.PROJECT_SERVICE_URL,
        internalSecret: env.INTERNAL_SECRET,
        talkingSecret: env.INTERNAL_SERVICE_TALKING_SECRET,
        projectId,
        userId,
    });

    const redis = getRedis();
    const redisHash = await redis.hgetall(`deployhub:user:project:${projectId}:monitoring`);
    let nextPingAt = null;
    try {
        const score = await redis.zscore('deployhub:monitoring:schedule', String(projectId));
        nextPingAt = score != null ? Number(score) : null;
    } catch {
        nextPingAt = null;
    }

    const doc = await Uptime.findOne({ projectId }).lean();

    return {
        projectId,
        scheduleActive: Boolean(redisHash && Object.keys(redisHash).length),
        schedule: redisHash && Object.keys(redisHash).length
            ? {
                projectName: redisHash.projectName || null,
                pingUrl: redisHash.pingUrl || null,
                intervalSeconds: redisHash.monitorIntervalSeconds
                    ? Number(redisHash.monitorIntervalSeconds)
                    : null,
                failedTries: redisHash.monitorfailedTries
                    ? Number(redisHash.monitorfailedTries)
                    : null,
                nextPingAt,
                nextPingInSeconds:
                    nextPingAt != null
                        ? Math.max(0, Math.round((nextPingAt - Date.now()) / 1000))
                        : null,
            }
            : null,
        record: doc
            ? {
                projectName: doc.projectName,
                url: doc.url,
                isActive: doc.isActive,
                lastDownAt: doc.lastDownAt || null,
                failedTries: doc.failedTries,
                intervalSeconds: doc.intervalSeconds,
                updatedAt: doc.updatedAt,
            }
            : null,
    };
};
