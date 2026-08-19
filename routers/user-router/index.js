import express from "express";
import http from "http";
import httpProxy from "http-proxy";
import compression from "compression";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Queue } from "bullmq";
import { redisclient, redisConnect } from "./src/configs/redis.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import geoip from "geoip-lite";
const { lookup } = geoip;


dotenv.config();
await redisConnect();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", true);
app.use(compression());

const ACME_ROOT = "/home/rahul/docker/nginx/html";

app.get("/.well-known/acme-challenge/:token", (req, res) => {
    try {
        const token = String(req.params.token || "");
        if (!/^[\w-]+$/.test(token)) {
            return res.status(400).send("Invalid token");
        }

        const challengeDir = path.join(ACME_ROOT, ".well-known", "acme-challenge");
        const filePath = path.join(challengeDir, token);
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(path.resolve(challengeDir) + path.sep)) {
            return res.status(400).send("Invalid path");
        }

        if (!fs.existsSync(resolved)) {
            console.warn(`[acme] challenge missing: ${resolved}`);
            return res.status(404).send("Not found");
        }

        res.setHeader("Content-Type", "text/plain");
        return fs.createReadStream(resolved).pipe(res);
    } catch (err) {
        console.error("[acme] serve failed:", err.message);
        return res.status(500).send("ACME error");
    }
});

app.get("/user-router-health", (_req, res) => {
    res.status(200).json({ status: "ok", router: "User-router" });
});

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 1000 });

const httpProxyServer = httpProxy.createProxyServer({
    changeOrigin: true, xfwd: true, agent: httpAgent,
});

const wsProxyServer = httpProxy.createProxyServer({
    changeOrigin: true, ws: true, xfwd: true,
});


const domainCache = new Map();
const CACHE_TTL = 30_000;

function setCache(key, value) {
    domainCache.set(key, { value, expires: Date.now() + CACHE_TTL });
}
function getCache(key) {
    const entry = domainCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { domainCache.delete(key); return null; }
    return entry.value;
}


const limiters = {
    free: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_free",
        points: 20000,
        duration: 60 * 60 * 12
    }),
    starter: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_starter",
        points: 200000,
        duration: 60 * 60 * 12
    }),
    pro: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_pro",
        points: 500000,
        duration: 60 * 60 * 12
    }),
};

const burstLimiters = {
    free: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_free_burst",
        points: 150,
        duration: 60
    }),
    starter: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_starter_burst",
        points: 500,
        duration: 60
    }),
    pro: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_pro_burst",
        points: 1000,
        duration: 60
    })
};


function getSubdomain(domain, root) {
    const cleanDomain = domain.replace(/^\\+/, '');
    if (!cleanDomain.endsWith(root)) return null;
    const withoutRoot = cleanDomain.slice(0, -(root.length + 1));
    return withoutRoot || null;
}

async function resolveDomain(domain) {
    const cached = getCache(domain);
    if (cached) return cached;

    const subdomain = getSubdomain(domain, "deployhub.online");
    if (subdomain) {
        const project = await redisclient.hgetall(`deployhub:users:subdomain:${subdomain}`);
        if (project?.port) {
            const resolved = {
                target: `http://127.0.0.1:${project.port}`,
                projectId: project.projectId || null,
                plan: project.plan || null
            };
            setCache(domain, resolved);
            return resolved;
        }
    }

    const custom = await redisclient.hgetall(`deployhub:users:customdomain:${domain}`);
    if (custom?.port) {
        const resolved = {
            target: `http://127.0.0.1:${custom.port}`,
            projectId: custom.projectId || null,
            plan: custom.plan || null
        };
        setCache(domain, resolved);
        return resolved;
    }

    return null;
}


const requestCounts = new Map();

function trackRequest(projectId) {
    if (!projectId) return;
    requestCounts.set(projectId, (requestCounts.get(projectId) || 0) + 1);
}

const flushQueue = new Queue("request-count-flush", {
    connection: { host: "localhost", port: 6379 },
});

setInterval(async () => {
    if (requestCounts.size === 0) return;
    const counts = Object.fromEntries(requestCounts);
    requestCounts.clear();
    try {
        await flushQueue.add(
            "flush",
            { counts, flushedAt: new Date().toISOString() },
            { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
        );
        console.log(`[Counter] Queued flush — ${Object.keys(counts).length} projects, ${Object.values(counts).reduce((a, b) => a + b, 0)} total requests`);
    } catch (err) {
        console.error("[Counter] Queue enqueue failed, restoring counts:", err.message);
        for (const [projectId, count] of Object.entries(counts)) {
            requestCounts.set(projectId, (requestCounts.get(projectId) || 0) + count);
        }
    }
}, 5 * 60 * 1000);


const analyticsBuffer = new Map();
const previousWindow = new Map();

const spikeQueue = new Queue("spike-alert", {
    connection: { host: "localhost", port: 6379 }
});

function getAnalyticsEntry(projectId) {
    if (!analyticsBuffer.has(projectId)) {
        analyticsBuffer.set(projectId, {
            requests: 0,
            errors4xx: 0,
            errors5xx: 0,
            endpoints: {},
            countries: {},
        });
    }
    return analyticsBuffer.get(projectId);
}

function trackAnalytics(projectId, statusCode, ip, endpoint) {
    if (!projectId) return;
    const entry = getAnalyticsEntry(projectId);
    entry.requests++;
    if (statusCode >= 400 && statusCode < 500) entry.errors4xx++;
    if (statusCode >= 500) entry.errors5xx++;


    if (endpoint) {
        entry.endpoints[endpoint] = (entry.endpoints[endpoint] || 0) + 1;
    }


    const geo = lookup(ip);
    const country = geo?.country || "unknown";
    entry.countries[country] = (entry.countries[country] || 0) + 1;
}

async function checkSpikes() {
    for (const [projectId, data] of analyticsBuffer.entries()) {
        const current = data.requests;
        const prev = previousWindow.get(projectId) || 0;

        if (prev > 0 && current >= prev * 3) {
            try {
                await spikeQueue.add("spike", {
                    projectId,
                    current,
                    previous: prev,
                    detectedAt: new Date().toISOString()
                }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
                console.log(`[Spike] Project ${projectId} — ${prev} → ${current} requests`);
            } catch (err) {
                console.error("[Spike] Queue failed:", err.message);
            }
        }

        previousWindow.set(projectId, current);
    }
}

async function flushAnalytics() {
    if (analyticsBuffer.size === 0) return;

    const pipeline = redisclient.pipeline();

    for (const [projectId, data] of analyticsBuffer.entries()) {
        const base = `deployhub:user:analytics:${projectId}`;

        // existing
        pipeline.incrby(`${base}:5m:req`, data.requests);
        pipeline.expire(`${base}:5m:req`, 300);

        pipeline.incrby(`${base}:1h:req`, data.requests);
        pipeline.expire(`${base}:1h:req`, 3600);

        pipeline.incrby(`${base}:24h:req`, data.requests);
        pipeline.expire(`${base}:24h:req`, 86400);

        pipeline.incrby(`${base}:5m:err4xx`, data.errors4xx);
        pipeline.expire(`${base}:5m:err4xx`, 300);

        pipeline.incrby(`${base}:5m:err5xx`, data.errors5xx);
        pipeline.expire(`${base}:5m:err5xx`, 300);

        // 3. geographic — hash mein store
        for (const [country, count] of Object.entries(data.countries)) {
            pipeline.hincrby(`${base}:24h:geo`, country, count);
        }
        pipeline.expire(`${base}:24h:geo`, 86400);

        // 4. top endpoints — hash mein store
        for (const [endpoint, count] of Object.entries(data.endpoints)) {
            pipeline.hincrby(`${base}:24h:endpoints`, endpoint, count);
        }
        pipeline.expire(`${base}:24h:endpoints`, 86400);
    }

    await pipeline.exec();
    analyticsBuffer.clear();
}

setInterval(async () => {
    await checkSpikes();
    await flushAnalytics();
}, 5 * 60 * 1000);


app.use(async (req, res) => {
    try {
        const host = req.headers.host?.toLowerCase();
        if (!host) return res.status(400).send("Invalid host");
        const cleanDomain = host.replace(/^\\+/, '');

        const resolved = await resolveDomain(cleanDomain);
        if (!resolved) return res.status(404).send("Domain not configured");

        const plan = resolved.plan || "free";
        await limiters[plan].consume(resolved.projectId);
        await burstLimiters[plan].consume(resolved.projectId);

        trackRequest(resolved.projectId);

        // 2. unique visitors — HyperLogLog
        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
            || req.socket.remoteAddress
            || "unknown";

        await redisclient.pfadd(
            `deployhub:user:analytics:${resolved.projectId}:24h:uv`,
            ip
        );
        await redisclient.expire(
            `deployhub:user:analytics:${resolved.projectId}:24h:uv`,
            86400
        );

        // endpoint normalize — query string hata do
        const endpoint = req.path || "/";

        res.on("finish", () => {
            trackAnalytics(resolved.projectId, res.statusCode, ip, endpoint);
        });

        httpProxyServer.web(req, res, { target: resolved.target });
    } catch (err) {
        if (err.msBeforeNext) {
            res.set("Retry-After", String(Math.ceil(err.msBeforeNext / 1000)));
            return res.status(429).send("Rate limit exceeded, try again later");
        }
        console.error("Router error:", err);
        res.status(500).send("Internal server error");
    }
});


server.on("upgrade", async (req, socket, head) => {
    try {
        const host = req.headers.host?.toLowerCase();
        if (!host) return socket.destroy();

        const resolved = await resolveDomain(host);
        if (!resolved) return socket.destroy();

        trackRequest(resolved.projectId);

        wsProxyServer.ws(req, socket, head, { target: resolved.target, changeOrigin: false });
    } catch (err) {
        console.error("WS Error:", err);
        socket.destroy();
    }
});


httpProxyServer.on("error", (err, req, res) => {
    console.error("HTTP Proxy error:", err.message);
    if (res && !res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end("Service unavailable");
    }
});

wsProxyServer.on("error", (err, req, socket) => {
    console.error("WS Proxy error:", err.message);
    if (socket) socket.destroy();
});


async function shutdown() {
    await checkSpikes();
    await flushAnalytics();

    if (requestCounts.size > 0) {
        const counts = Object.fromEntries(requestCounts);
        requestCounts.clear();
        try {
            await flushQueue.add("flush", { counts, flushedAt: new Date().toISOString() });
            console.log("[Counter] Shutdown flush queued");
        } catch (err) {
            console.error("[Counter] Shutdown flush failed:", err.message);
        }
    }

    await flushQueue.close();
    await spikeQueue.close();
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(8081, () => {
    console.log("Production Router running on port 8081");
});