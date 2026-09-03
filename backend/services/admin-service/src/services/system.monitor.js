import { getRedis } from '../core/redis/client.js';
import { adminEnv } from '../lib/env.js';
import { CONTAINER_BY_NAME, PLATFORM_CONTAINERS } from '../constants/platformContainers.js';
import { transporter } from '../utils/transporter.js';
import { docker } from '../utils/docker.js';

const METRICS_TTL = 30 * 60;
const METRICS_KEEP = 90; // 15 min at 10s
const EVENTS_KEEP = 80;
const ALERT_COOLDOWN = 30 * 60;
const SAMPLE_MS = 10_000;

function metricsKey(id) {
    return `deployhub:admin:metrics:${id}`;
}
function eventsKey() {
    return 'deployhub:admin:docker-events';
}
function alertKey(id, type) {
    return `deployhub:admin:alert:${id}:${type}`;
}

export async function pushSample(id, sample) {
    const redis = getRedis();
    const key = metricsKey(id);
    await redis.lpush(key, JSON.stringify(sample));
    await redis.ltrim(key, 0, METRICS_KEEP - 1);
    await redis.expire(key, METRICS_TTL);
}

export async function readHistory(id) {
    try {
        const redis = getRedis();
        const rows = await redis.lrange(metricsKey(id), 0, METRICS_KEEP - 1);
        return rows
            .map((row) => {
                try {
                    return JSON.parse(row);
                } catch {
                    return null;
                }
            })
            .filter(Boolean)
            .reverse();
    } catch {
        return [];
    }
}

export async function readAllHistory() {
    const out = {};
    await Promise.all(
        PLATFORM_CONTAINERS.map(async (meta) => {
            out[meta.id] = await readHistory(meta.id);
        })
    );
    return out;
}

export async function pushEvent(event) {
    try {
        const redis = getRedis();
        await redis.lpush(eventsKey(), JSON.stringify(event));
        await redis.ltrim(eventsKey(), 0, EVENTS_KEEP - 1);
        await redis.expire(eventsKey(), 24 * 60 * 60);
    } catch (err) {
        console.warn('[system] event store failed:', err.message);
    }
}

export async function listEvents() {
    try {
        const redis = getRedis();
        const rows = await redis.lrange(eventsKey(), 0, EVENTS_KEEP - 1);
        return rows
            .map((row) => {
                try {
                    return JSON.parse(row);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
    } catch {
        return [];
    }
}

async function maybeAlert(id, type, subject, text) {
    try {
        const redis = getRedis();
        const ok = await redis.set(alertKey(id, type), '1', 'EX', ALERT_COOLDOWN, 'NX');
        if (!ok) return;
        await transporter.sendMail({
            from: adminEnv.EMAIL_USER,
            to: adminEnv.ADMIN_EMAIL,
            subject,
            text,
        });
    } catch (err) {
        console.warn('[system] alert email failed:', err.message);
    }
}

export async function evaluateAlerts({ unit, sample, probe }) {
    if (!unit) return;
    if (sample && Number(sample.cpuPercent) >= 85) {
        await maybeAlert(
            unit.id,
            'cpu',
            `[DeployHub] High CPU: ${unit.label}`,
            `${unit.label} (${unit.name}) CPU is ${sample.cpuPercent}%.\nTime: ${new Date().toISOString()}`
        );
    }
    if (sample && Number(sample.memPercent) >= 90) {
        await maybeAlert(
            unit.id,
            'mem',
            `[DeployHub] High memory: ${unit.label}`,
            `${unit.label} (${unit.name}) memory is ${sample.memPercent}%.\nTime: ${new Date().toISOString()}`
        );
    }
    if (probe && probe.ok === false) {
        await maybeAlert(
            unit.id,
            'health',
            `[DeployHub] Health failed: ${unit.label}`,
            `${unit.label} probe ${probe.url || ''} failed: ${probe.error || 'unhealthy'}\nTime: ${new Date().toISOString()}`
        );
    }
}

let sampleTimer = null;
let eventStream = null;

export function startSystemMonitor({ inspectByName, readStats, probeHealth }) {
    if (sampleTimer) return;

    const tick = async () => {
        for (const meta of PLATFORM_CONTAINERS) {
            try {
                const found = await inspectByName(meta.name);
                if (!found?.info?.State?.Running) continue;
                const usage = await readStats(found.container);
                const probe = await probeHealth(meta);
                const sample = {
                    ts: Date.now(),
                    cpuPercent: usage?.cpuPercent || 0,
                    memPercent: usage?.memory?.percent || 0,
                    memUsed: usage?.memory?.used || 0,
                    probeOk: probe?.ok !== false,
                    probeMs: probe?.ms ?? null,
                };
                await pushSample(meta.id, sample);
                await evaluateAlerts({ unit: meta, sample, probe });
            } catch (err) {
                console.warn(`[system] sample failed ${meta.id}:`, err.message);
            }
        }
    };

    tick().catch(() => {});
    sampleTimer = setInterval(() => tick().catch(() => {}), SAMPLE_MS);

    ;(async () => {
        try {
            const stream = await docker.getEvents({ filters: { type: ['container'] } });
            eventStream = stream;
            let buf = '';
            stream.on('data', (chunk) => {
                buf += chunk.toString('utf8');
                const lines = buf.split('\n');
                buf = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const ev = JSON.parse(line);
                        const name = ev.Actor?.Attributes?.name || '';
                        const meta = CONTAINER_BY_NAME[name];
                        if (!meta) continue;
                        const status = ev.status || ev.Action || 'event';
                        if (!/start|die|oom|restart|stop|kill|health_status/i.test(status)) continue;
                        pushEvent({
                            ts: Number(ev.time) ? Number(ev.time) * 1000 : Date.now(),
                            id: meta.id,
                            name,
                            label: meta.label,
                            status,
                            from: ev.from || ev.Actor?.Attributes?.image || null,
                        }).catch(() => {});
                        if (/die|oom|kill/i.test(status)) {
                            evaluateAlerts({
                                unit: meta,
                                probe: { ok: false, error: `docker ${status}` },
                            }).catch(() => {});
                        }
                    } catch {
                    }
                }
            });
            stream.on('error', (e) => console.warn('[system] events stream:', e.message));
        } catch (err) {
            console.warn('[system] docker events failed:', err.message);
        }
    })();

    return () => {
        if (sampleTimer) clearInterval(sampleTimer);
        sampleTimer = null;
        try {
            eventStream?.destroy?.();
        } catch {
        }
        eventStream = null;
    };
}
