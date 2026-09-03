import { AppError } from '../../../../shared/errors/AppError.js';
import {
    CONTAINER_BY_ID,
    HOST_PROCESSES,
    PLATFORM_CONTAINERS,
} from '../constants/platformContainers.js';
import { docker } from '../utils/docker.js';
import { AdminAuditLog } from '../models/adminAuditLog.model.js';
import { listEvents, readAllHistory, startSystemMonitor } from './system.monitor.js';

function round(n, d = 1) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    const p = 10 ** d;
    return Math.round(x * p) / p;
}

export function cpuPercent(stats) {
    const cpu = stats?.cpu_stats;
    const pre = stats?.precpu_stats;
    const cpuDelta = (cpu?.cpu_usage?.total_usage || 0) - (pre?.cpu_usage?.total_usage || 0);
    const systemDelta = (cpu?.system_cpu_usage || 0) - (pre?.system_cpu_usage || 0);
    const online = cpu?.online_cpus || cpu?.cpu_usage?.percpu_usage?.length || 1;
    if (cpuDelta > 0 && systemDelta > 0) {
        return round((cpuDelta / systemDelta) * online * 100, 2);
    }
    return 0;
}

function memStats(stats) {
    const used = Number(stats?.memory_stats?.usage || 0);
    const limit = Number(stats?.memory_stats?.limit || 0);
    return {
        used,
        limit,
        percent: limit > 0 ? round((used / limit) * 100, 2) : 0,
    };
}

function netStats(stats) {
    const nets = stats?.networks || {};
    let rx = 0;
    let tx = 0;
    for (const n of Object.values(nets)) {
        rx += Number(n.rx_bytes || 0);
        tx += Number(n.tx_bytes || 0);
    }
    return { rx, tx };
}

export async function readStats(container) {
    try {
        const stats = await container.stats({ stream: false });
        if (!stats || typeof stats !== 'object') return null;
        return {
            cpuPercent: cpuPercent(stats),
            memory: memStats(stats),
            network: netStats(stats),
        };
    } catch {
        return null;
    }
}

export async function inspectByName(name) {
    try {
        const container = docker.getContainer(name);
        const info = await container.inspect();
        return { container, info };
    } catch (err) {
        if (err?.statusCode === 404) return null;
        throw err;
    }
}

export async function probeHealth(meta) {
    const port = meta.port;
    const path = meta.healthPath || '/health';
    if (!port) return null;
    const url = `http://${meta.name}:${port}${path}`;
    const started = Date.now();
    try {
        const res = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(2500),
            redirect: 'follow',
        });
        const ms = Date.now() - started;
        return {
            ok: res.status < 500,
            status: res.status,
            ms,
            url,
        };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            ms: Date.now() - started,
            url,
            error: err.message || 'probe failed',
        };
    }
}

function isLocked(meta) {
    return Boolean(meta.self || meta.locked);
}

function mapContainer(meta, info, usage, extra = {}) {
    const state = info?.State || {};
    const running = Boolean(state.Running);
    const locked = isLocked(meta);
    return {
        id: meta.id,
        name: meta.name,
        label: meta.label,
        group: meta.group,
        description: meta.description,
        critical: Boolean(meta.critical),
        self: Boolean(meta.self),
        locked,
        present: Boolean(info),
        running,
        status: info ? (state.Status || (running ? 'running' : 'exited')) : 'missing',
        dockerHealth: state.Health?.Status || null,
        startedAt: running ? state.StartedAt : null,
        finishedAt: !running ? state.FinishedAt : null,
        restartCount: info?.RestartCount ?? 0,
        image: info?.Config?.Image || null,
        ports: Object.keys(info?.NetworkSettings?.Ports || {}).filter(Boolean),
        usage: running ? usage : null,
        canStart: Boolean(info) && !running && !locked,
        canStop: Boolean(info) && running && !locked,
        canRestart: Boolean(info) && !locked,
        ...extra,
    };
}

async function readDisk() {
    try {
        const df = await docker.df();
        const layersSize = Number(df.LayersSize || 0);
        const images = (df.Images || []).length;
        const volumes = (df.Volumes || []).length;
        const containers = (df.Containers || []).length;
        return { layersSize, images, volumes, containers };
    } catch {
        return null;
    }
}

export async function getFleet() {
    let host = null;
    try {
        const info = await docker.info();
        host = {
            name: info.Name,
            os: info.OperatingSystem,
            kernel: info.KernelVersion,
            dockerVersion: info.ServerVersion,
            cpus: info.NCPU,
            memory: info.MemTotal,
            containers: info.Containers,
            running: info.ContainersRunning,
            paused: info.ContainersPaused,
            stopped: info.ContainersStopped,
            driver: info.Driver,
        };
    } catch (err) {
        throw new AppError(
            `Docker is not reachable from admin-service (${err.message}). Mount /var/run/docker.sock.`,
            503
        );
    }

    const [historyMap, events, disk] = await Promise.all([
        readAllHistory(),
        listEvents(),
        readDisk(),
    ]);

    const units = await Promise.all(
        PLATFORM_CONTAINERS.map(async (meta) => {
            const found = await inspectByName(meta.name);
            if (!found) {
                return mapContainer(meta, null, null, {
                    probe: null,
                    history: historyMap[meta.id] || [],
                });
            }
            const [usage, probe] = await Promise.all([
                found.info.State?.Running ? readStats(found.container) : null,
                found.info.State?.Running ? probeHealth(meta) : null,
            ]);
            return mapContainer(meta, found.info, usage, {
                probe,
                history: historyMap[meta.id] || [],
            });
        })
    );

    const running = units.filter((u) => u.running).length;
    const missing = units.filter((u) => !u.present).length;
    const stopped = units.filter((u) => u.present && !u.running).length;
    const unhealthy = units.filter((u) => u.running && u.probe && u.probe.ok === false).length;

    return {
        host,
        disk,
        events,
        excluded: HOST_PROCESSES,
        summary: {
            total: units.length,
            running,
            stopped,
            missing,
            unhealthy,
        },
        units,
    };
}

export async function controlUnit(id, action, actor = {}) {
    const allowed = new Set(['start', 'stop', 'restart']);
    if (!allowed.has(action)) throw new AppError('Invalid action', 400);
    const meta = CONTAINER_BY_ID[id];
    if (!meta) throw new AppError('Unknown platform unit', 404);

    if (meta.self || meta.locked) {
        throw new AppError(`${meta.label} cannot be started, stopped, or restarted from this panel`, 400);
    }

    const found = await inspectByName(meta.name);
    if (!found) {
        throw new AppError(
            `${meta.label} container (${meta.name}) is not present. Redeploy it from CI.`,
            404
        );
    }

    if (action === 'start') {
        if (found.info.State?.Running) throw new AppError('Already running', 409);
        await found.container.start();
    } else if (action === 'stop') {
        if (!found.info.State?.Running) throw new AppError('Already stopped', 409);
        await found.container.stop({ t: 12 });
    } else if (action === 'restart') {
        await found.container.restart({ t: 12 });
    }

    AdminAuditLog.create({
        actorUsername: actor.username || 'admin',
        actorRole: actor.role || 'super_admin',
        actorAccountId: actor.accountId || null,
        action: `system ${action} ${meta.id}`,
        method: 'POST',
        path: `/system/${id}/${action}`,
        statusCode: 200,
        targetType: 'container',
        targetId: meta.name,
        meta: { container: meta.name, action },
        ip: actor.ip || '',
        userAgent: actor.userAgent || '',
    }).catch((err) => console.warn('[system] audit failed:', err.message));

    const after = await inspectByName(meta.name);
    const usage = after?.info?.State?.Running ? await readStats(after.container) : null;
    const probe = after?.info?.State?.Running ? await probeHealth(meta) : null;
    return mapContainer(meta, after?.info, usage, { probe, history: [] });
}

function demuxDockerLogs(buffer) {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || '');
    if (buf.length < 8) return buf.toString('utf8');
    let out = '';
    let offset = 0;
    let multiplexed = true;
    while (offset + 8 <= buf.length) {
        const streamType = buf[offset];
        const size = buf.readUInt32BE(offset + 4);
        if (streamType > 2 || size > 1024 * 1024 || offset + 8 + size > buf.length) {
            multiplexed = false;
            break;
        }
        out += buf.slice(offset + 8, offset + 8 + size).toString('utf8');
        offset += 8 + size;
    }
    if (!multiplexed || !out) return buf.toString('utf8').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
    return out;
}

export async function getUnitLogs(id, tail = 250) {
    const meta = CONTAINER_BY_ID[id];
    if (!meta) throw new AppError('Unknown platform unit', 404);
    const found = await inspectByName(meta.name);
    if (!found) throw new AppError(`${meta.label} container is not present`, 404);

    const n = Math.min(1000, Math.max(50, Number(tail) || 250));
    const raw = await found.container.logs({
        stdout: true,
        stderr: true,
        timestamps: true,
        tail: n,
        follow: false,
    });
    const text = demuxDockerLogs(raw);
    return {
        id: meta.id,
        name: meta.name,
        label: meta.label,
        tail: n,
        text,
    };
}

export function bootSystemMonitor() {
    return startSystemMonitor({ inspectByName, readStats, probeHealth });
}
