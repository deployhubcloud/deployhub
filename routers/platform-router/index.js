import express from "express";
import http from "http";
import httpProxy from "http-proxy";
import compression from "compression";
import dotenv from "dotenv";
import { sendErrorPage } from "./errorPage.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);
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
  // "console.cloudcoderhub.in": "http://minio:9000",
  // "storage.cloudcoderhub.in": "http://minio:9001",
  "devload.cloudcoderhub.in": "http://devload:80",
  "app-devload.cloudcoderhub.in": "http://appdevload:80",
  "api-devload.cloudcoderhub.in": "http://apidevload:6700",
  "dashboard.deployhub.cloud": "http://appdeployhub:80",
  "ws.deployhub.cloud": "http://deployhubstreamservice:4008",
  "admin.deployhub.cloud": "http://adminfrontend:80",
  "adminapi.deployhub.cloud": "http://deployhubadminservice:4010",
};


async function resolveDomain(domain) {
  const cached = getCache(domain);
  if (cached) return cached;

  if (staticMap[domain]) {
    const resolved = { target: staticMap[domain], projectId: null };
    setCache(domain, resolved);
    return resolved;
  }

  return null;
}

// ── HTTP routing ─────────────────────────────────────────
app.use(async (req, res) => {
  try {
    const host = req.headers.host?.toLowerCase();
    if (!host) return sendErrorPage(res, 400);

    const resolved = await resolveDomain(host.split(":")[0]);
    if (!resolved) return sendErrorPage(res, 404);

    return httpProxyServer.web(req, res, { target: resolved.target });

  } catch (err) {
    console.error("Router error:", err);
    sendErrorPage(res, 500);
  }
});

// ── WebSocket routing ────────────────────────────────────
server.on("upgrade", async (req, socket, head) => {
  try {
    const host = req.headers.host?.toLowerCase();
    if (!host) return socket.destroy();

    const resolved = await resolveDomain(host);
    if (!resolved) return socket.destroy();

    wsProxyServer.ws(req, socket, head, { target: resolved.target, changeOrigin: false });
  } catch (err) {
    console.error("WS Error:", err);
    socket.destroy();
  }
});

// ── Proxy errors ─────────────────────────────────────────
httpProxyServer.on("error", (err, req, res) => {
  console.error("HTTP Proxy error:", err.message);
  sendErrorPage(res, 502);
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