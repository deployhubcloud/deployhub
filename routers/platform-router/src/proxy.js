import http from "http";
import httpProxy from "http-proxy";
import { HTTP_MAX_SOCKETS, PROXY_TIMEOUT_MS } from "./config.js";

export function createProxyServers(routerName) {
  const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: HTTP_MAX_SOCKETS,
  });

  const httpProxyServer = httpProxy.createProxyServer({
    changeOrigin: true,
    xfwd: true,
    agent: httpAgent,
    proxyTimeout: PROXY_TIMEOUT_MS,
    timeout: PROXY_TIMEOUT_MS,
  });

  const wsProxyServer = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true,
    xfwd: true,
    proxyTimeout: PROXY_TIMEOUT_MS,
    timeout: PROXY_TIMEOUT_MS,
  });

  httpProxyServer.on("proxyReq", (proxyReq) => {
    proxyReq.setHeader("x-router-service", routerName);
  });

  httpProxyServer.on("error", (err, req, res) => {
    console.error(`[${routerName}] HTTP proxy error:`, err.message);

    if (res && !res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Service unavailable");
    }
  });

  wsProxyServer.on("error", (err, req, socket) => {
    console.error(`[${routerName}] WS proxy error:`, err.message);
    if (socket) socket.destroy();
  });

  return {
    httpProxyServer,
    wsProxyServer,
    close() {
      httpAgent.destroy();
    },
  };
}
