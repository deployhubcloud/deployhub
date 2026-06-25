import express from "express";
import http from "http";
import compression from "compression";
import dotenv from "dotenv";
import { PORT } from "./src/config.js";
import { getRequestHost } from "./src/host.js";
import { createProxyServers } from "./src/proxy.js";
import { getPlatformRoute } from "./src/routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(compression());

const { httpProxyServer, wsProxyServer, close: closeProxyServers } = createProxyServers("platform-router");

app.get(["/routerhealth"], (_req, res) => {
  res.status(200).json({
    status: "ok",
    router: "platform",
    uptime: Math.round(process.uptime()),
  });
});

app.use((req, res) => {
  const host = getRequestHost(req.headers.host);
  if (!host) return res.status(400).send("Invalid host");

  const route = getPlatformRoute(host);
  if (!route) return res.status(404).send("Platform domain not configured");

  httpProxyServer.web(req, res, { target: route.target });
});

server.on("upgrade", (req, socket, head) => {
  const host = getRequestHost(req.headers.host);
  if (!host) return socket.destroy();

  const route = getPlatformRoute(host);
  if (!route) return socket.destroy();

  wsProxyServer.ws(req, socket, head, {
    target: route.target,
    changeOrigin: true,
  });
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[PlatformRouter] Received ${signal}, shutting down`);

  const forceTimer = setTimeout(() => {
    console.error("[PlatformRouter] Forced shutdown timeout");
    process.exit(1);
  }, 15_000);
  forceTimer.unref();

  server.close(() => {
    closeProxyServers();
    clearTimeout(forceTimer);
    process.exit(0);
  });

  setTimeout(() => server.closeAllConnections?.(), 7_500).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.listen(PORT, () => {
  console.log(`Platform Router running on port ${PORT}`);
});
