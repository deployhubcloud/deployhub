import express from "express";
import http from "http";
import httpProxy from "http-proxy";
import compression from "compression";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", true);
app.use(compression());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok"
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

const staticMap = {
  "deployhub.cloud": "http://deployhub:80",
  "www.deployhub.cloud": "http://deployhub:80",
  "api.deployhub.cloud": "http://deployhubapigateway:4999",
  "cloudcoderhub.in": "http://cloucoderhub:80",
  "www.cloudcoderhub.in": "http://cloucoderhub:80",
  "console.cloudcoderhub.in": "http://minio:9000",
  "storage.cloudcoderhub.in": "http://minio:9001",
  "devload.cloudcoderhub.in": "http://devload:80",
  "app-devload.cloudcoderhub.in": "http://appdevload:80",
  "api-devload.cloudcoderhub.in": "http://apidevload:6700",
  "dashboard.deployhub.cloud": "http://appdeployhub:80",
  "ws.deployhub.cloud": "http://deployhubstreamservice:4008"
};


async function resolveDomain(domain) {
  const host = domain.split(":")[0];

  const cached = getCache(host);
  if (cached) return cached;

  if (staticMap[host]) {
    const resolved = { target: staticMap[host], projectId: null };
    setCache(host, resolved);
    return resolved;
  }

  return null;
}

// ── HTTP routing ─────────────────────────────────────────
app.use(async (req, res) => {
  try {
    const host = req.headers.host?.toLowerCase();
    if (!host) return res.status(400).send("Invalid host");

    const resolved = await resolveDomain(host);
    if (!resolved) return res.status(404).send("Domain not configured");

    return httpProxyServer.web(req, res, { target: resolved.target });

  } catch (err) {
    console.error("Router error:", err);
    res.status(500).send("Internal server error");
  }
});

// ── WebSocket routing ────────────────────────────────────
server.on("upgrade", async (req, socket, head) => {
  try {
    const rawHost = req.headers.host?.toLowerCase().split(":")[0];
    if (!rawHost) return socket.destroy();

    const resolved = await resolveDomain(rawHost);
    if (!resolved) {
      console.log("No route for WS host:", rawHost);
      return socket.destroy();
    }

    console.log("WS upgrade →", rawHost, "→", resolved.target);
    wsProxyServer.ws(req, socket, head, { target: resolved.target });
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


async function shutdown() {
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(8080, () => {
  console.log("Production Router running on port 8080");
});