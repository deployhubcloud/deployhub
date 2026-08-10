import { getRedis } from '../core/redis/client.js';
import { getCacheLatestBuildIdOfProject } from '../../../../shared/utils/cacheLatestBuildIdofProject.js';

function fieldsToObject(fields) {
    const payload = {};
    for (let i = 0; i < fields.length; i += 2) {
        payload[fields[i]] = fields[i + 1];
    }
    return payload;
}

export async function getLiveProjectStatus(projectId) {
    const redis = getRedis();
    const streamKey = `deployhub:users:projects:status:${projectId}`;
    const entries = await redis.xrevrange(streamKey, '+', '-', 'COUNT', 1);
    if (!entries?.length) {
        return { ok: true, projectId, status: null, message: 'No live status recorded yet.' };
    }
    const [, fields] = entries[0];
    const payload = fieldsToObject(fields);
    return {
        ok: true,
        projectId,
        status: payload.status || null,
        timestamp: payload.timestamp ? Number(payload.timestamp) : null,
    };
}

export async function getDeployCacheInfo(projectId) {
    const redis = getRedis();
    const cache = await getCacheLatestBuildIdOfProject(projectId, redis);
    if (!cache || !Object.keys(cache).length) {
        return { ok: true, projectId, cache: null, message: 'No deploy cache for this project yet.' };
    }
    return {
        ok: true,
        projectId,
        cache: {
            buildId: cache.buildId || null,
            projectContainerName: cache.projectContainerName || null,
            projectType: cache.projectType || null,
            logsUrl: cache.logsUrl || null,
        },
    };
}

export async function getMonitoringRedisStatus(projectId) {
    const redis = getRedis();
    const key = `deployhub:user:project:${projectId}:monitoring`;
    const data = await redis.hgetall(key);
    if (!data || !Object.keys(data).length) {
        return {
            ok: true,
            projectId,
            enabled: false,
            message: 'No active monitoring schedule found for this project.',
        };
    }

    let nextPingAt = null;
    try {
        const score = await redis.zscore('deployhub:monitoring:schedule', String(projectId));
        nextPingAt = score != null ? Number(score) : null;
    } catch {
        nextPingAt = null;
    }

    return {
        ok: true,
        projectId,
        enabled: true,
        monitoring: {
            projectName: data.projectName || null,
            pingUrl: data.pingUrl || null,
            intervalSeconds: data.monitorIntervalSeconds
                ? Number(data.monitorIntervalSeconds)
                : null,
            failedTries: data.monitorfailedTries ? Number(data.monitorfailedTries) : null,
            nextPingAt,
            nextPingInSeconds:
                nextPingAt != null ? Math.max(0, Math.round((nextPingAt - Date.now()) / 1000)) : null,
        },
    };
}
