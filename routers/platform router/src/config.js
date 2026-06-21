import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PLATFORM_ROUTER_PORT || process.env.PORT || 8081);
export const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 30_000);
export const HTTP_MAX_SOCKETS = Number(process.env.HTTP_MAX_SOCKETS || 1000);
