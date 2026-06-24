import express from "express";
import http from "http";
import compression from "compression";
import dotenv from "dotenv";
import { PORT } from "./src/config.js";
import { createUserDomainResolver } from "./src/domainResolver.js";
import { getRequestHost } from "./src/host.js";
import { createProxyServers } from "./src/proxy.js";
import { createUserRateLimiters, isRateLimitError } from "./src/rateLimit.js";
import { redisclient, redisConnect } from "./src/redis.js";
import { createRequestCounter } from "./src/requestCounter.js";
import { createThreatIntelligence } from "./src/threatIntel.js";
import { createSecurityMiddleware, runProjectLevelAnalysis } from "./src/security.js";
import { createSecurityAdminRouter } from "./src/securityAdmin.js";

dotenv.config();
await redisConnect();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(compression());
app.use(express.json()); 

const { httpProxyServer, wsProxyServer, close: closeProxyServers } = createProxyServers("user-router");
const domainResolver = createUserDomainResolver({ redisclient });
const rateLimiters = createUserRateLimiters({ redisclient });
const requestCounter = createRequestCounter();

const threatIntel = createThreatIntelligence({ redisclient });
const securityMiddleware = createSecurityMiddleware({ threatIntel });

app.use(securityMiddleware);

app.use("/admin/security", createSecurityAdminRouter({ threatIntel, redisclient }));

app.get(["/routerhealth"], (_req, res) => {
  res.status(200).json({
    status: "ok",
    router: "user",
    uptime: Math.round(process.uptime()),
  });
});


app.use(async (req, res) => {
  const host = getRequestHost(req.headers.host);
  if (!host) return res.status(400).send("Invalid host");

  try {
    const resolved = await domainResolver.resolve(host);
    if (!resolved) return res.status(404).send("User domain not configured");

    if (resolved.projectId && req.security) {
      const threat = await runProjectLevelAnalysis({
        threatIntel,
        req,
        projectId: resolved.projectId,
      });

      if (threat.shouldBlock) {
        const status = threat.blockType === "bot" ? 403 : 429;
        return res.status(status).send(
          status === 429 ? "Too many requests" : "Access denied"
        );
      }
    }

    if (resolved.projectId) {
      await rateLimiters.consume(resolved.projectId, resolved.plan);
      requestCounter.track(resolved.projectId);
    }

    httpProxyServer.web(req, res, { target: resolved.target });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set("Retry-After", String(Math.ceil(err.msBeforeNext / 1000)));
      return res.status(429).send("Rate limit exceeded, try again later");
    }

    console.error("[UserRouter] HTTP error:", err);
    if (!res.headersSent) res.status(500).send("Internal server error");
  }
});

// WebSocket upgrades
server.on("upgrade", async (req, socket, head) => {
  const host = getRequestHost(req.headers.host);
  if (!host) return socket.destroy();

  try {
    const resolved = await domainResolver.resolve(host);
    if (!resolved) return socket.destroy();

    requestCounter.track(resolved.projectId);

    wsProxyServer.ws(req, socket, head, {
      target: resolved.target,
      changeOrigin: false,
    });
  } catch (err) {
    console.error("[UserRouter] WS error:", err);
    socket.destroy();
  }
});

// Graceful shutdown
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[UserRouter] Received ${signal}, shutting down`);

  const forceTimer = setTimeout(() => {
    console.error("[UserRouter] Forced shutdown timeout");
    process.exit(1);
  }, 15_000);
  forceTimer.unref();

  server.close(async () => {
    try {
      await requestCounter.close();
      closeProxyServers();
      await redisclient.quit();
      clearTimeout(forceTimer);
      process.exit(0);
    } catch (err) {
      console.error("[UserRouter] Shutdown failed:", err);
      process.exit(1);
    }
  });

  setTimeout(() => server.closeAllConnections?.(), 7_500).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.listen(PORT, () => {
  console.log(`User Router running on port ${PORT}`);
});
