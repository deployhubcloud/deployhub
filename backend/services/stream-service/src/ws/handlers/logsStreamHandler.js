import { getRedis } from '../../core/redis/client.js';
import { docker } from '../../utils/docker.js';
import { getCacheLatestBuildIdOfProject } from '../../../../../shared/utils/cacheLatestBuildIdofProject.js';

export function registerLogsStreamHandler(io) {
    io.on('connection', (socket) => {
        let currentWatcher = null;

        socket.on('subscribe_logs', async ({ projectId }) => {
            if (!projectId) return;

            if (currentWatcher) {
                currentWatcher.stop();
                currentWatcher = null;
            }

            try {
                const redis = getRedis();
                const watcher = new ProjectLogsWatcher(socket, projectId, redis);
                currentWatcher = watcher;
                await watcher.start();
            } catch (error) {
                console.error(`Log subscription error for ${projectId}:`, error);
                socket.emit('build_log', {
                    projectId,
                    type: 'error',
                    message: 'Failed to subscribe to logs.'
                });
            }
        });

        socket.on('unsubscribe_logs', ({ projectId }) => {
            if (currentWatcher && currentWatcher.projectId === projectId) {
                currentWatcher.stop();
                currentWatcher = null;
            }
        });

        socket.on('disconnect', () => {
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
        this.refreshTimer = null;   // NEW: reconnection timer
    }

    async start() {
        await this.refreshAndSwitch();
        this.watchStatusStream();
    }

    stop() {
        this.active = false;
        // NEW: clear any pending reconnection timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        if (this.currentStream) {
            this.currentStream.stop();
            this.currentStream = null;
        }
    }

    emitReset() {
        this.socket.emit('build_log', {
            projectId: this.projectId,
            type: 'reset'
        });
    }

    async refreshAndSwitch() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        if (!this.active) return;

        const status = await this.getCurrentStatus();
        const cache = await getCacheLatestBuildIdOfProject(this.projectId, this.redis);
        if (!cache) {
            this.emitInfo('No build information available yet.');
            return;
        }

        const { buildId, projectContainerName, projectType, logsUrl } = cache;
        const type = (projectType || '').trim().toLowerCase();

        let neededType = null;
        let neededParams = null;

        if (!status) {
            neededType = 'none';
        } else if (status === 'building' || status === 'queued') {
            if (buildId) {
                neededType = 'build';
                neededParams = { buildId };
            } else {
                neededType = 'none';
            }
        } else if (status === 'running') {
            if (type === 'static') {
                if (logsUrl) {
                    neededType = 'static';
                    neededParams = { logsUrl };
                } else {
                    neededType = 'none';
                    this.emitInfo('Static project is running, but logs URL is not yet available. Waiting...');
                }
            } else {
                if (projectContainerName) {
                    neededType = 'docker';
                    neededParams = { containerName: projectContainerName };
                } else {
                    neededType = 'none';
                }
            }
        }

        else if (status === 'failed' && type === 'static') {
            if (logsUrl) {
                neededType = 'static';
                neededParams = { logsUrl };
            } else {
                neededType = 'none';
                this.emitInfo('Static build failed, but logs URL is not available.');
            }
        }
        else {
            neededType = 'none';
        }

        if (this.currentStream && this.currentStream.type === neededType) {
            if (neededType === 'static' && this.currentStream.logsUrl !== logsUrl) {
                this.currentStream.stop();
                this.currentStream = null;
            } else {
                return;
            }
        }

        if (this.currentStream) {
            this.currentStream.stop();
            this.currentStream = null;
        }

        this.emitReset();

        switch (neededType) {
            case 'build':
                this.currentStream = await this.startBuildLogStream(buildId);
                break;
            case 'docker':
                this.currentStream = await this.startDockerLogStream(projectContainerName);
                break;
            case 'static':
                this.currentStream = this.startStaticLogStream(logsUrl);
                break;
            case 'none':
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
                        if (newStatus && newStatus !== this.lastStatus) {
                            this.lastStatus = newStatus;
                            await this.refreshAndSwitch();
                        }
                    }
                }
            } catch (err) {
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
        let active = true;
        let stream = null;
        let ended = false;

        const handleStreamEnd = (messageType, message) => {
            if (ended) return;
            ended = true;
            active = false;
            if (stream) {
                try { stream.destroy(); } catch (e) {}
            }

            this.socket.emit('build_log', {
                projectId: this.projectId,
                type: messageType,
                message: message,
                log: messageType === 'complete' ? 'Container log stream ended.' : undefined
            });

            this.currentStream = null;

            if (this.active && this.socket.connected) {
                this.refreshTimer = setTimeout(() => {
                    this.refreshTimer = null;
                    if (this.active && this.socket.connected) {
                        this.refreshAndSwitch();
                    }
                }, 5000);
            }
        };

        try {
            const container = docker.getContainer(containerName);
            stream = await container.logs({
                stdout: true,
                stderr: true,
                follow: true,
                tail: 100
            });

            stream.on('data', (chunk) => {
                if (!active) return;
                this.socket.emit('build_log', {
                    projectId: this.projectId,
                    type: 'log',
                    log: chunk.toString()
                });
            });

            stream.on('end', () => handleStreamEnd('complete', 'Container log stream ended.'));
            stream.on('error', (err) => handleStreamEnd('error', err.message));

        } catch (err) {
            this.socket.emit('build_log', {
                projectId: this.projectId,
                type: 'error',
                message: err.message
            });
            return { type: 'docker', stop: () => {}, dockerError: true };
        }

        return {
            type: 'docker',
            stop: () => {
                active = false;
                if (stream) try { stream.destroy(); } catch (e) {}
            },
            containerName
        };
    }

    startStaticLogStream(logsUrl) {
        this.socket.emit('build_log', {
            projectId: this.projectId,
            type: 'static_project',
            logsUrl: logsUrl
        });
        return { type: 'static', stop: () => { }, logsUrl };
    }

    emitInfo(message) {
        this.socket.emit('build_log', {
            projectId: this.projectId,
            type: 'info',
            message
        });
    }
}