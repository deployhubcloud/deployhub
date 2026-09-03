import { AppError } from '../../../../shared/errors/AppError.js';
import {
    CONTAINER_BY_ID,
    HOST_PROCESSES,
    PLATFORM_CONTAINERS,
} from '../constants/platformContainers.js';
import { docker } from '../utils/docker.js';

function round(n, d = 1) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    const p = 10 ** d;
    return Math.round(x * p) / p;
}

function cpuPercent(stats) {
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

async function readStats(container) {
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

async function inspectByName(name) {
    try {
        const container = docker.getContainer(name);
        const info = await container.inspect();
        return { container, info };
    } catch (err) {
        if (err?.statusCode === 404) return null;
        throw err;
    }
}

function mapContainer(meta, info, usage) {
    const state = info?.State || {};
    const running = Boolean(state.Running);
    return {
        id: meta.id,
        name: meta.name,
        label: meta.label,
        group: meta.group,
        description: meta.description,
        critical: Boolean(meta.critical),
        self: Boolean(meta.self),
        present: Boolean(info),
        running,
        status: info ? (state.Status || (running ? 'running' : 'exited')) : 'missing',
        health: state.Health?.Status || null,
        startedAt: running ? state.StartedAt : null,
        finishedAt: !running ? state.FinishedAt : null,
        restartCount: info?.RestartCount ?? 0,
        image: info?.Config?.Image || null,
        ports: Object.keys(info?.NetworkSettings?.Ports || {}).filter(Boolean),
        usage: running ? usage : null,
        canStart: Boolean(info) && !running,
        canStop: Boolean(info) && running && !meta.self,
        canRestart: Boolean(info) && !meta.self,
    };
}

export async function getFleet() {
    let host = null;
    try {
        const info = await docker.info();
        host = {
            name: info.Name,
            os: info.OperatingSystem,
            dockerVersion: info.ServerVersion,
            cpus: info.NCPU,
            memory: info.MemTotal,
            containers: info.Containers,
            running: info.ContainersRunning,
            paused: info.ContainersPaused,
            stopped: info.ContainersStopped,
        };
    } catch (err) {
        throw new AppError(
            `Docker is not reachable from admin-service (${err.message}). Mount /var/run/docker.sock.`,
            503
        );
    }

    const units = await Promise.all(
        PLATFORM_CONTAINERS.map(async (meta) => {
            const found = await inspectByName(meta.name);
            if (!found) return mapContainer(meta, null, null);
            const usage = found.info.State?.Running ? await readStats(found.container) : null;
            return mapContainer(meta, found.info, usage);
        })
    );

    const running = units.filter((u) => u.running).length;
    const missing = units.filter((u) => !u.present).length;
    const stopped = units.filter((u) => u.present && !u.running).length;

    return {
        host,
        excluded: HOST_PROCESSES,
        summary: {
            total: units.length,
            running,
            stopped,
            missing,
        },
        units,
    };
}

export async function controlUnit(id, action) {
    const allowed = new Set(['start', 'stop', 'restart']);
    if (!allowed.has(action)) throw new AppError('Invalid action', 400);
    const meta = CONTAINER_BY_ID[id];
    if (!meta) throw new AppError('Unknown platform unit', 404);

    if (meta.self && action !== 'inspect') {
        throw new AppError('Cannot stop or restart admin-service from itself', 400);
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
    } else {
        throw new AppError('Invalid action', 400);
    }

    const after = await inspectByName(meta.name);
    const usage = after?.info?.State?.Running ? await readStats(after.container) : null;
    return mapContainer(meta, after?.info, usage);
}
