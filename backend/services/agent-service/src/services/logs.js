import http from 'http';
import { getRedis } from '../core/redis/client.js';
import { getCacheLatestBuildIdOfProject } from '../../../../shared/utils/cacheLatestBuildIdofProject.js';

const DOCKER_SOCK = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';

function dockerRequest(path) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            socketPath: DOCKER_SOCK,
            path,
            method: 'GET',
        }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                if (res.statusCode !== 200) {
                    reject(new Error(`Docker API ${res.statusCode}: ${buf.toString().slice(0, 200)}`));
                    return;
                }
                resolve(buf);
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function decodeDockerLogFrames(buf, maxLines = 200) {
    const lines = [];
    let leftover = buf;
    while (leftover.length >= 8) {
        const streamType = leftover[0];
        const length = leftover.readUInt32BE(4);
        if (leftover.length < 8 + length) break;
        const payload = leftover.slice(8, 8 + length);
        leftover = leftover.slice(8 + length);
        if (streamType === 1 || streamType === 2) {
            lines.push(payload.toString());
        }
    }
    
    if (!lines.length && buf.length) {
        return buf.toString().split(/\r?\n/).filter(Boolean).slice(-maxLines).join('\n');
    }
    return lines.slice(-maxLines).join('');
}

export async function fetchRuntimeLogs(projectId, { tail = 150 } = {}) {
    const redis = getRedis();
    const cache = await getCacheLatestBuildIdOfProject(projectId, redis);
    if (!cache || !Object.keys(cache).length) {
        return { ok: false, message: 'No runtime/build cache for this project yet.' };
    }

    const containerName = cache.projectContainerName;
    const logsUrl = cache.logsUrl;
    const projectType = (cache.projectType || '').trim().toLowerCase();

    if (projectType === 'static' || !containerName) {
        if (logsUrl) {
            return {
                ok: true,
                source: 'build_logs_url',
                hint: 'Static or no running container — use build logs instead.',
                logsUrl,
            };
        }
        return { ok: false, message: 'No running container and no build log URL available.' };
    }

    try {
        const inspectBuf = await dockerRequest(`/containers/${encodeURIComponent(containerName)}/json`);
        const inspect = JSON.parse(inspectBuf.toString());
        const containerId = inspect.Id;
        const logBuf = await dockerRequest(
            `/containers/${containerId}/logs?stdout=1&stderr=1&tail=${Math.min(Number(tail) || 150, 500)}&timestamps=1`
        );
        const text = decodeDockerLogFrames(logBuf, Math.min(Number(tail) || 150, 500));
        return {
            ok: true,
            source: 'docker',
            containerName,
            status: inspect.State?.Status,
            logs: text.slice(-12000),
        };
    } catch (error) {
        return {
            ok: false,
            message: `Could not read docker logs: ${error.message}`,
            containerName,
            logsUrl: logsUrl || null,
        };
    }
}

export async function fetchUrlText(url, { maxChars = 12000 } = {}) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch logs (${res.status})`);
    }
    const text = await res.text();
    return text.slice(-maxChars);
}
