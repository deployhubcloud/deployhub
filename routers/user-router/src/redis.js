import Redis from "ioredis";
import { REDIS_CONNECTION } from "./config.js";

const redisclient = new Redis({
  ...REDIS_CONNECTION,
  maxRetriesPerRequest: null,
});

let listenersAttached = false;

async function redisConnect() {
  if (!listenersAttached) {
    redisclient.on("error", (err) => console.error("[Redis] Client error:", err.message));
    redisclient.on("connect", () => console.log("[Redis] Connected"));
    listenersAttached = true;
  }
}

export { redisclient, redisConnect };
