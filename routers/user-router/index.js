import express from "express";
import http from "http";
import httpProxy from "http-proxy";
import compression from "compression";
import dotenv from "dotenv";
import { Queue } from "bullmq";
import { redisclient, redisConnect } from "./src/configs/redis.js";
import { RateLimiterRedis } from "rate-limiter-flexible";

dotenv.config();
await redisConnect();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", true);
app.use(compression());


app.get("/user-router-health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        router: "User-router"
    });
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


// yeha pe maine 12 hr ka ratelimit kiya hai
const limiters = {
    free: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_free",
        points: 20000,          // free plan quota
        duration: 60 * 60 * 12 // 12h window in seconds
    }),
    starter: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_starter",
        points: 200000,  // starter plan quota
        duration: 60 * 60 * 12 // 12 hr in seconds
    }),
    pro: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_pro",
        points: 500000, // pro plan quota
        duration: 60 * 60 * 12  // 12 hr in seconds
    }),

};


// yeha pe maine rate limti kiya hai 1 minute ka 
const burstLimiters = {
    free: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_free_burst",
        points: 150,
        duration: 60  // yeha pe ye seconds hai
    }),
    starter: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_starter_burst",
        points: 500,
        duration: 60  // yeha pe ye seconds hai
    }),
    pro: new RateLimiterRedis({
        storeClient: redisclient,
        keyPrefix: "rl_pro_burst",
        points: 1000,
        duration: 60  // yeha pe ye seconds hai
    })
};


const PLAN_LIMITS = {
    free: {
        requests: 20000,
    },
    starter: {
        requests: 200000,
    },
    pro: {
        requests: 500000,
    }
}
function getSubdomain(domain, root) {
    if (!domain.endsWith(root)) return null;
    const withoutRoot = domain.slice(0, -(root.length + 1));
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
            target: `http://${custom.subdomain}:${custom.port}`,
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
    connection: {
        host: "localhost",
        port: 6379,
    },
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

// ── HTTP routing ─────────────────────────────────────────
app.use(async (req, res) => {
    try {
        const host = req.headers.host?.toLowerCase();
        if (!host) return res.status(400).send("Invalid host");

        const resolved = await resolveDomain(host);
        if (!resolved) return res.status(404).send("Domain not configured");


        const plan = resolved.plan || "free";
        const limiter = limiters[plan];

        // ye daily ke liye hai
        await limiter.consume(resolved.projectId);

        // Burst quota agar eak daam se direct aagya to
        await burstLimiters[plan].consume(resolved.projectId);

        trackRequest(resolved.projectId);

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

// ── WebSocket routing ────────────────────────────────────
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

// ── Proxy errors ─────────────────────────────────────────
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

// ── Graceful shutdown — flush before exit ────────────────
async function shutdown() {
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
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(8081, () => {
    console.log("Production Router running on port 8081");
});