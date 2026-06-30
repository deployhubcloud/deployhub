import { getRedis } from '../../core/redis/client.js';
import { docker } from '../../utils/docker.js';
import { getCacheLatestBuildIdOfProject } from '../../../../../shared/utils/cacheLatestBuildIdofProject.js';


const globalStreams = new Map();         
const projectSockets = new Map();         
const stopTimers = new Map();         


function demuxChunk(chunk) {
  let offset = 0;
  const logs = [];
  while (offset < chunk.length) {
    if (offset + 8 > chunk.length) break;          
    const type = chunk[offset];                     
    const length = chunk.readUInt32BE(offset + 4);
    offset += 8;
    if (offset + length > chunk.length) break;     
    if (type === 1 || type === 2) {
      logs.push(chunk.slice(offset, offset + length).toString());
    }
    offset += length;
  }
  return logs.join('');
}

async function ensureGlobalDockerStream(projectId, containerName) {
  if (globalStreams.has(projectId)) return;

  try {
    const container = docker.getContainer(containerName);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 100,
    });

    let active = true;
    const stop = () => {
      active = false;
      try { stream.destroy(); } catch (e) {}
    };

    globalStreams.set(projectId, { stream, stop, containerName });

    stream.on('data', (chunk) => {
      if (!active) return;
      const sockets = projectSockets.get(projectId);
      if (!sockets) return;
      const cleanLog = demuxChunk(chunk);
      if (!cleanLog) return;
      for (const sock of sockets) {
        if (sock.connected) {
          sock.emit('build_log', {
            projectId,
            type: 'log',
            log: cleanLog,
          });
        }
      }
    });

    stream.on('end', () => {
      globalStreams.delete(projectId);
    });

    stream.on('error', (err) => {
      console.error(`[Global stream ${projectId}] error:`, err.message);
      globalStreams.delete(projectId);
      setTimeout(() => {
        if (projectSockets.has(projectId) && projectSockets.get(projectId).size > 0) {
          ensureGlobalDockerStream(projectId, containerName);
        }
      }, 5000);
    });

    stream.on('close', () => {
      globalStreams.delete(projectId);
    });
  } catch (err) {
    console.error(`[Global stream ${projectId}] failed to start:`, err.message);
  }
}

function stopGlobalStream(projectId) {
  const entry = globalStreams.get(projectId);
  if (entry) {
    entry.stop();
    globalStreams.delete(projectId);
  }
}

function scheduleStop(projectId) {
  if (stopTimers.has(projectId)) {
    clearTimeout(stopTimers.get(projectId));
    stopTimers.delete(projectId);
  }
  const timer = setTimeout(() => {
    stopTimers.delete(projectId);
    const sockets = projectSockets.get(projectId);
    if (!sockets || sockets.size === 0) {
      stopGlobalStream(projectId);
    }
  }, 30_000);
  stopTimers.set(projectId, timer);
}

async function subscribeSocketToProject(socket, projectId, containerName) {
  if (!projectSockets.has(projectId)) {
    projectSockets.set(projectId, new Set());
  }
  const sockets = projectSockets.get(projectId);
  sockets.add(socket);


  if (stopTimers.has(projectId)) {
    clearTimeout(stopTimers.get(projectId));
    stopTimers.delete(projectId);
  }

  await ensureGlobalDockerStream(projectId, containerName);
}

function unsubscribeSocketFromProject(socket, projectId) {
  const sockets = projectSockets.get(projectId);
  if (sockets) {
    sockets.delete(socket);
    if (sockets.size === 0) {
      scheduleStop(projectId);
    }
  }
}


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
        const cache = await getCacheLatestBuildIdOfProject(projectId, redis);
        if (!cache) {
          socket.emit('build_log', { projectId, type: 'error', message: 'Project not found.' });
          return;
        }

        const { projectContainerName, projectType } = cache;
        const type = (projectType || '').trim().toLowerCase();

        if (type !== 'static' && projectContainerName) {
          await subscribeSocketToProject(socket, projectId, projectContainerName);
        }


        const watcher = new ProjectLogsWatcher(socket, projectId, redis);
        currentWatcher = watcher;
        await watcher.start();
      } catch (error) {
        console.error(`Log subscription error for ${projectId}:`, error);
        socket.emit('build_log', { projectId, type: 'error', message: 'Failed to subscribe to logs.' });
      }
    });

    socket.on('unsubscribe_logs', ({ projectId }) => {
      if (currentWatcher && currentWatcher.projectId === projectId) {
        currentWatcher.stop();
        currentWatcher = null;
      }
      unsubscribeSocketFromProject(socket, projectId);
    });

    socket.on('disconnect', () => {
      if (currentWatcher) {
        currentWatcher.stop();
        currentWatcher = null;
      }
      for (const [pid, sockets] of projectSockets) {
        if (sockets.has(socket)) {
          unsubscribeSocketFromProject(socket, pid);
        }
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
    await this.refreshAndSwitch();
    this.watchStatusStream();
  }

  stop() {
    this.active = false;
    if (this.currentStream) {
      this.currentStream.stop();
      this.currentStream = null;
    }
  }

  async refreshAndSwitch() {
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

    if (!status) {
      neededType = 'none';
    } else if (status === 'building' || status === 'queued') {
      neededType = buildId ? 'build' : 'none';
    } else if (status === 'running') {
      if (type === 'static') {
        neededType = logsUrl ? 'static' : 'none';
        if (!logsUrl) this.emitInfo('Static project is running, but logs URL is not yet available. Waiting...');
      } else {
        neededType = 'docker';
      }
    } else if (status === 'failed' && type === 'static') {
      neededType = logsUrl ? 'static' : 'none';
      if (!logsUrl) this.emitInfo('Static build failed, but logs URL is not available.');
    } else {
      neededType = 'none';
    }

    
    if (neededType === 'docker') {
      const isSwitch = !this.currentStream || this.currentStream.type !== 'docker';
      if (isSwitch) {
        this.socket.emit('build_log', { projectId: this.projectId, type: 'reset' });
      }
      if (this.currentStream && this.currentStream.type !== 'docker') {
        this.currentStream.stop();
      }
      this.currentStream = { type: 'docker', stop: () => {} };
      return;
    }

   
    if (this.currentStream && this.currentStream.type !== neededType) {
      this.currentStream.stop();
      this.currentStream = null;
    }

    if (this.currentStream && this.currentStream.type === neededType) {
      return; 
    }

    this.socket.emit('build_log', { projectId: this.projectId, type: 'reset' });

    switch (neededType) {
      case 'build':
        this.currentStream = await this.startBuildLogStream(buildId);
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
      '+', '-', 'COUNT', 1
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