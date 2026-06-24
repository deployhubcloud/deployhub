import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.USER_ROUTER_PORT || process.env.PORT || 8081);
export const USER_ROOT_DOMAIN = process.env.USER_ROOT_DOMAIN || "deployhub.online";
export const DOMAIN_CACHE_TTL_MS = Number(process.env.DOMAIN_CACHE_TTL_MS || 30_000);
export const REQUEST_COUNT_FLUSH_INTERVAL_MS = Number(
  process.env.REQUEST_COUNT_FLUSH_INTERVAL_MS || 5 * 60 * 1000,
);
export const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 30_000);
export const HTTP_MAX_SOCKETS = Number(process.env.HTTP_MAX_SOCKETS || 1000);
export const REQUEST_COUNT_QUEUE = process.env.REQUEST_COUNT_QUEUE || "request-count-flush";

export const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
};

export const PLAN_LIMITS = {
  free: {
    dailyRequests: Number(10000),
    burstRequests: Number(150),
  },
  starter: {
    dailyRequests: Number(200000),
    burstRequests: Number(500),
  },
  pro: {
    dailyRequests: Number(1000000),
    burstRequests: Number(1000),
  },
};
