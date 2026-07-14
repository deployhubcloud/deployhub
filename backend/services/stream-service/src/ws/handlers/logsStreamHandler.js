import { getRedis } from '../../core/redis/client.js';
import { docker } from '../../utils/docker.js';
import { getCacheLatestBuildIdOfProject } from '../../../../../shared/utils/cacheLatestBuildIdofProject.js';

export function registerLogsStreamHandler(io) {
    io.on('connection', (socket) => {
        let currentWatcher = null;

        socket.on('subscribe_logs', async ({ projectId }) => {
            console.log(`[LogsWatcher] subscribe_logs for ${projectId}`);
            if (!projectId) return;

            if (currentWatcher) {
                console.log(`[LogsWatcher] stopping previous watcher for ${currentWatcher.projectId}`);
                currentWatcher.stop();
                currentWatcher = null;
            }

            try {
                const redis = getRedis();
                const watcher = new ProjectLogsWatcher(socket, projectId, redis);
                currentWatcher = watcher;
                await watcher.start();
            } catch (error) {
                console.error(`[LogsWatcher] Log subscription error for ${projectId}:`, error);
                socket.emit('build_log', {
                    projectId,
                    type: 'error',
                    message: 'Failed to subscribe to logs.'
                });
            }
        });

        socket.on('unsubscribe_logs', ({ projectId }) => {
            console.log(`[LogsWatcher] unsubscribe_logs for ${projectId}`);
            if (currentWatcher && currentWatcher.projectId === projectId) {
                currentWatcher.stop();
                currentWatcher = null;
            }
        });

        socket.on('disconnect', () => {
            console.log(`[LogsWatcher] disconnect, cleaning watcher`);
            if (currentWatcher) {
                currentWatcher.stop();
                currentWatcher = null;
            }
        });
    });
}

class ProjectLogsWatcher {
    constructor(socket, projectId, redis) {
        this.socket = socket;
        this.projectId = projectId;
        this.redis = redis;
        this.active = true;
        this.currentStream = null;
        this.lastStatus = null;
    }

    async start() {
        console.log(`[LogsWatcher] start() for ${this.projectId}`);
        await this.refreshAndSwitch();
        this.watchStatusStream();
    }

    stop() {
        console.log(`[LogsWatcher] stop() for ${this.projectId}`);
        this.active = false;
        if (this.currentStream) {
            this.currentStream.stop();
            this.currentStream = null;
        }
    }

    emitReset() {
        console.log(`[LogsWatcher] emitReset() to socket`);
        this.socket.emit('build_log', {
            projectId: this.projectId,
            type: 'reset'
        });
    }

    async refreshAndSwitch() {
        console.log(`[LogsWatcher] refreshAndSwitch() start, active=${this.active}`);
        if (!this.active) return;

        const status = await this.getCurrentStatus();
        console.log(`[LogsWatcher] current status:`, status);

        const cache = await getCacheLatestBuildIdOfProject(this.projectId, this.redis);
        console.log(`[LogsWatcher] cache from redis:`, cache);
        if (!cache) {
            console.log(`[LogsWatcher] no cache, emitting info`);
            this.emitInfo('No build information available yet.');
            return;
        }

        const { buildId, projectContainerName, projectType, logsUrl } = cache;
        const type = (projectType || '').trim().toLowerCase();
        console.log(`[LogsWatcher] parsed cache -> buildId: ${buildId}, container: ${projectContainerName}, type: ${type}, logsUrl: ${logsUrl}`);

        let neededType = null;
        let neededParams = null;

        
        if (!status) neededType = 'none';
        else if (status === 'building' || status === 'queued') {
            neededType = buildId ? 'build' : 'none';
            if (buildId) neededParams = { buildId };
        } else if (status === 'running') {
            if (type === 'static') {
                neededType = logsUrl ? 'static' : 'none';
                if (logsUrl) neededParams = { logsUrl };
                else this.emitInfo('Static project is running, but logs URL is not yet available. Waiting...');
            } else {
                neededType = projectContainerName ? 'docker' : 'none';
                if (projectContainerName) neededParams = { containerName: projectContainerName };
            }
        } else if (status === 'failed' && type === 'static') {
            neededType = logsUrl ? 'static' : 'none';
            if (logsUrl) neededParams = { logsUrl };
            else this.emitInfo('Static build failed, but logs URL is not available.');
        } else {
            neededType = 'none';
        }
        console.log(`[LogsWatcher] decided neededType: ${neededType}, params:`, neededParams);

        // Same-type check
        if (this.currentStream && this.currentStream.type === neededType) {
            if (neededType === 'static' && this.currentStream.logsUrl !== logsUrl) {
                console.log(`[LogsWatcher] static URL changed, stopping current stream`);
                this.currentStream.stop();
                this.currentStream = null;
            } else {
                console.log(`[LogsWatcher] stream same type, no change`);
                return;
            }
        }

        // Stop old stream
        if (this.currentStream) {
            console.log(`[LogsWatcher] stopping old stream of type ${this.currentStream.type}`);
            this.currentStream.stop();
            this.currentStream = null;
        }

        // Start new stream
        switch (neededType) {
            case 'build':
                console.log(`[LogsWatcher] starting BUILD stream for buildId ${buildId}`);
                this.emitReset();
                this.currentStream = await this.startBuildLogStream(buildId);
                break;
            case 'docker':
                console.log(`[LogsWatcher] starting DOCKER stream for container ${projectContainerName}`);
                this.emitReset();
                this.currentStream = await this.startDockerLogStream(projectContainerName);
                break;
            case 'static':
                console.log(`[LogsWatcher] starting STATIC stream for url ${logsUrl}`);
                this.emitReset();
                this.currentStream = this.startStaticLogStream(logsUrl);
                break;
            case 'none':
                console.log(`[LogsWatcher] no stream to start, sending info`);
                this.emitInfo('No logs available at this moment.');
                this.currentStream = null;
                break;
        }
    }

    async getCurrentStatus() {
        const entries = await this.redis.xrevrange(
            `deployhub:users:projects:status:${this.projectId}`,
            '+',
            '-',
            'COUNT',
            1
        );
        if (entries?.length) {
            const [, fields] = entries[0];
            const payload = {};
            for (let i = 0; i < fields.length; i += 2) {
                payload[fields[i]] = fields[i + 1];
            }
            return payload.status;
        }
        return null;
    }

    async watchStatusStream() {
        if (!this.active) return;
        console.log(`[LogsWatcher] watching status stream for ${this.projectId}`);
        const streamKey = `deployhub:users:projects:status:${this.projectId}`;
        let lastId = '$';

        while (this.active && this.socket.connected) {
            try {
                const results = await this.redis.xread('BLOCK', 2000, 'STREAMS', streamKey, lastId);
                if (!this.active) break;

                if (results) {
                    const messages = results[0][1];
                    for (const [id, fields] of messages) {
                        lastId = id;
                        const payload = {};
                        for (let i = 0; i < fields.length; i += 2) {
                            payload[fields[i]] = fields[i + 1];
                        }
                        const newStatus = payload.status;
                        console.log(`[LogsWatcher] status change: ${this.lastStatus} -> ${newStatus}`);
                        if (newStatus && newStatus !== this.lastStatus) {
                            this.lastStatus = newStatus;
                            await this.refreshAndSwitch();
                        }
                    }
                }
            } catch (err) {
                console.error(`[LogsWatcher] watchStatusStream error:`, err);
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    async startBuildLogStream(buildId) {
        const streamKey = `build:logs:${buildId}`;
        let lastId = '0';
        let active = true;
        const stop = () => { active = false; };
        const run = async () => {
            while (active && this.active && this.socket.connected) {
                try {
                    const results = await this.redis.xread('COUNT', 100, 'STREAMS', streamKey, lastId);
                    if (!results) {
                        await new Promise(r => setTimeout(r, 500));
                        continue;
                    }
                    const messages = results[0][1];
                    for (const [id, fields] of messages) {
                        lastId = id;
                        const data = {};
                        for (let i = 0; i < fields.length; i += 2) {
                            data[fields[i]] = fields[i + 1];
                        }
                        this.socket.emit('build_log', {
                            projectId: this.projectId,
                            type: data.type || 'log',
                            log: data.log || ''
                        });
                        if (data.type === 'complete') {
                            active = false;
                            return;
                        }
                    }
                } catch (err) {
                    this.socket.emit('build_log', {
                        projectId: this.projectId,
                        type: 'error',
                        message: 'Build log stream error.'
                    });
                    active = false;
                }
            }
        };
        run();
        return { type: 'build', stop, buildId };
    }

    async startDockerLogStream(containerName) {
        console.log(`[LogsWatcher] startDockerLogStream for container ${containerName}`);
        let active = true;
        let liveStream = null;
        const stop = () => {
            console.log(`[LogsWatcher] docker stream stop requested`);
            active = false;
            if (liveStream) try { liveStream.destroy(); } catch (e) { }
        };

        try {
            const container = docker.getContainer(containerName);
            console.log(`[LogsWatcher] got docker container object`);

            const snapshotBuffer = await new Promise((resolve, reject) => {
                container.logs(
                    { stdout: true, stderr: true, follow: false, tail: 500 },
                    (err, data) => {
                        if (err) {
                            console.error(`[LogsWatcher] snapshot error:`, err);
                            return reject(err);
                        }
                        console.log(`[LogsWatcher] snapshot received, length: ${data?.length || 0}`);
                        resolve(data);
                    }
                );
            });

            if (active && snapshotBuffer && snapshotBuffer.length > 0) {
                console.log(`[LogsWatcher] emitting snapshot logs (${snapshotBuffer.length} bytes)`);
                this.socket.emit('build_log', {
                    projectId: this.projectId,
                    type: 'log',
                    log: snapshotBuffer.toString()
                });
            } else if (active) {
                console.log(`[LogsWatcher] snapshot empty, emitting info`);
                this.socket.emit('build_log', {
                    projectId: this.projectId,
                    type: 'info',
                    message: 'Connected to container logs. No recent output, waiting for new logs...'
                });
            }

            if (!active) {
                console.log(`[LogsWatcher] no longer active after snapshot, returning`);
                return { type: 'docker', stop, containerName };
            }

            console.log(`[LogsWatcher] starting live docker log stream`);
            liveStream = await container.logs({
                stdout: true,
                stderr: true,
                follow: true,
                tail: 0
            });

            liveStream.on('data', (chunk) => {
                if (!active) return;
                console.log(`[LogsWatcher] live data chunk, length: ${chunk.length}`);
                this.socket.emit('build_log', {
                    projectId: this.projectId,
                    type: 'log',
                    log: chunk.toString()
                });
            });

            liveStream.on('end', () => {
                console.log(`[LogsWatcher] live stream ended`);
                if (active) {
                    this.socket.emit('build_log', {
                        projectId: this.projectId,
                        type: 'complete',
                        log: 'Container log stream ended.'
                    });
                }
                active = false;
            });

            liveStream.on('error', (err) => {
                console.error(`[LogsWatcher] live stream error:`, err);
                if (active) {
                    this.socket.emit('build_log', {
                        projectId: this.projectId,
                        type: 'error',
                        message: err.message
                    });
                }
                active = false;
            });

        } catch (err) {
            console.error(`[LogsWatcher] startDockerLogStream catch:`, err);
            this.socket.emit('build_log', {
                projectId: this.projectId,
                type: 'error',
                message: err.message
            });
            return { type: 'docker', stop: () => { }, dockerError: true };
        }

        console.log(`[LogsWatcher] docker stream setup complete`);
        return { type: 'docker', stop, containerName };
    }

    startStaticLogStream(logsUrl) {
        console.log(`[LogsWatcher] startStaticLogStream with url ${logsUrl}`);
        this.socket.emit('build_log', {
            projectId: this.projectId,
            type: 'static_project',
            logsUrl: logsUrl
        });
        return { type: 'static', stop: () => { }, logsUrl };
    }

    emitInfo(message) {
        console.log(`[LogsWatcher] emitInfo: ${message}`);
        this.socket.emit('build_log', {
            projectId: this.projectId,
            type: 'info',
            message
        });
    }
}