import { getRedis } from '../../core/redis/client.js';
import { docker } from '../../utils/docker.js';
import { getCacheLatestBuildIdofProject } from '../../../../../shared/utils/cacheLatestBuildIdofProject.js';

export function registerLogsStreamHandler(io) {

    io.on('connection', (socket) => {

        socket.on('subscribe_logs', async ({ projectId }) => {
            if (!projectId) return;

            try {

                const redis = getRedis();

                const cache = await getCacheLatestBuildIdofProject(
                    projectId,
                    redis
                );

                if (!cache) {

                    return socket.emit('build_log', {
                        projectId,
                        type: 'info',
                        message: 'No logs available.'
                    });

                }

                const {
                    buildId,
                    projectContainerName,
                    projectType
                } = cache;

                const type =
                    String(projectType || '')
                        .trim()
                        .toLowerCase();

                let status = null;

                const entries = await redis.xrevrange(
                    `project:status:${projectId}`,
                    '+',
                    '-',
                    'COUNT',
                    1
                );

                if (entries?.length) {

                    const [, fields] = entries[0];

                    const payload = {};

                    for (
                        let i = 0;
                        i < fields.length;
                        i += 2
                    ) {

                        payload[fields[i]] =
                            fields[i + 1];

                    }

                    status = payload.status;

                }

                if (!status) {

                    return socket.emit('build_log', {
                        projectId,
                        type: 'info',
                        message: 'No logs available.'
                    });

                }

                [...socket.rooms]
                    .filter(room =>
                        room.startsWith('logs:')
                    )
                    .forEach(room =>
                        socket.leave(room)
                    );

                socket.join(`logs:${projectId}`);

                /**
                 * BUILDING / QUEUED
                 * Redis Build Logs
                 */
                if (
                    status === 'building' ||
                    status === 'queued'
                ) {

                    if (!buildId) {

                        return socket.emit('build_log', {
                            projectId,
                            type: 'info',
                            message: 'Build logs are not available.'
                        });

                    }

                    return streamBuildLogs(
                        socket,
                        projectId,
                        buildId,
                        redis
                    );

                }

                /**
                 * RUNNING STATIC
                 * No Logs
                 */
                if (
                    status === 'running' &&
                    type === 'static'
                ) {

                    return socket.emit('build_log', {
                        projectId,
                        type: 'info',
                        message: 'Logs are not available for this project.'
                    });

                }

                /**
                 * RUNNING CONTAINER
                 * Docker Logs
                 */
                if (
                    status === 'running' &&
                    type !== 'static'
                ) {

                    if (!projectContainerName) {

                        return socket.emit('build_log', {
                            projectId,
                            type: 'info',
                            message: 'Logs are not available.'
                        });

                    }

                    return streamDockerLogs(
                        socket,
                        projectId,
                        projectContainerName
                    );

                }

            } catch (error) {
                return socket.emit('build_log', {
                    projectId,
                    type: 'info',
                    message: 'No logs available.'
                });
            }
        });

        socket.on('unsubscribe_logs', ({ projectId }) => {
            if (!projectId) return;
            socket.leave(`logs:${projectId}`);
        });

    });

}

async function streamBuildLogs(socket, projectId, buildId, redis) {

    const streamKey = `build:logs:${buildId}`;
    let lastId = '0';
    let active = true;

    const cleanup = () => {
        active = false;
        socket.off('disconnect', cleanup);
        socket.off('unsubscribe_logs', unsubHandler);
    };

    const unsubHandler = ({ projectId: unsub }) => {
        if (unsub === projectId) cleanup();
    };

    socket.once('disconnect', cleanup);
    socket.on('unsubscribe_logs', unsubHandler);

    while (active && socket.connected) {

        try {

            const results = await redis.xread('COUNT', 100, 'STREAMS', streamKey, lastId);

            if (!results) {
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
            }

            const messages = results[0][1];

            for (const [id, fields] of messages) {
                lastId = id;
                const data = {};
                for (let i = 0; i < fields.length; i += 2) {
                    data[fields[i]] = fields[i + 1];
                }

                socket.emit('build_log', {
                    projectId,
                    type: data.type || 'log',
                    log: data.log || ''
                });

                if (data.type === 'complete') {
                    cleanup();
                    return;
                }
            }

        } catch {
            socket.emit('build_log', {
                projectId,
                type: 'error',
                message: 'Build log stream error.'
            });
            cleanup();
        }

    }

}

async function streamDockerLogs(socket, projectId, containerName) {

    let active = true;

    try {

        const container = docker.getContainer(containerName);
        const stream = await container.logs({
            stdout: true,
            stderr: true,
            follow: true,
            tail: 100
        });

        const unsubDockerHandler = ({ projectId: unsub }) => {
            if (unsub === projectId) cleanup();
        };

        const cleanup = () => {
            active = false;
            socket.off('disconnect', cleanup);
            socket.off('unsubscribe_logs', unsubDockerHandler);
            try { stream.destroy(); } catch { }
        };

        socket.once('disconnect', cleanup);
        socket.on('unsubscribe_logs', unsubDockerHandler);

        stream.on('data', chunk => {
            if (!active) return;
            socket.emit('build_log', {
                projectId,
                type: 'log',
                log: chunk.toString()
            });
        });

        stream.on('end', () => {
            socket.emit('build_log', {
                projectId,
                type: 'complete',
                log: 'Container log stream ended.'
            });
            cleanup();
        });

        stream.on('error', error => {
            socket.emit('build_log', {
                projectId,
                type: 'error',
                message: error.message
            });
            cleanup();
        });

    } catch (error) {
        socket.emit('build_log', {
            projectId,
            type: 'error',
            message: error.message
        });
    }

}