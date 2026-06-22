import { Queue } from "bullmq";
import {
  REDIS_CONNECTION,
  REQUEST_COUNT_FLUSH_INTERVAL_MS,
  REQUEST_COUNT_QUEUE,
} from "./config.js";

function getTotalRequests(counts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

export function createRequestCounter() {
  const requestCounts = new Map();
  const flushQueue = new Queue(REQUEST_COUNT_QUEUE, {
    connection: {
      ...REDIS_CONNECTION,
      maxRetriesPerRequest: null,
    },
  });

  function track(projectId) {
    if (!projectId) return;
    requestCounts.set(projectId, (requestCounts.get(projectId) || 0) + 1);
  }

  async function flush(reason = "interval") {
    if (requestCounts.size === 0) return;

    const counts = Object.fromEntries(requestCounts);
    requestCounts.clear();

    try {
      await flushQueue.add(
        "flush",
        {
          counts,
          flushedAt: new Date().toISOString(),
          reason,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        },
      );

      console.log(
        `[Counter] Queued ${reason} flush - ${Object.keys(counts).length} projects, ${getTotalRequests(counts)} total requests`,
      );
    } catch (err) {
      console.error("[Counter] Queue enqueue failed, restoring counts:", err.message);

      for (const [projectId, count] of Object.entries(counts)) {
        requestCounts.set(projectId, (requestCounts.get(projectId) || 0) + count);
      }
    }
  }

  const timer = setInterval(() => {
    flush().catch((err) => {
      console.error("[Counter] Scheduled flush failed:", err.message);
    });
  }, REQUEST_COUNT_FLUSH_INTERVAL_MS);

  timer.unref?.();

  async function close() {
    clearInterval(timer);
    await flush("shutdown");
    await flushQueue.close();
  }

  return {
    track,
    flush,
    close,
  };
}
