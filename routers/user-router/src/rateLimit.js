import { RateLimiterRedis } from "rate-limiter-flexible";
import { PLAN_LIMITS } from "./config.js";

function normalizePlan(plan) {
  return PLAN_LIMITS[plan] ? plan : "free";
}

export function createUserRateLimiters({ redisclient }) {
  const dailyLimiters = {};
  const burstLimiters = {};

  for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
    dailyLimiters[plan] = new RateLimiterRedis({
      storeClient: redisclient,
      keyPrefix: `rl_${plan}`,
      points: limits.dailyRequests,
      duration: 60 * 60 * 24,
    });

    burstLimiters[plan] = new RateLimiterRedis({
      storeClient: redisclient,
      keyPrefix: `rl_${plan}_burst`,
      points: limits.burstRequests,
      duration: 60,
    });
  }

  async function consume(projectId, plan) {
    const activePlan = normalizePlan(plan);
    await dailyLimiters[activePlan].consume(projectId);
    await burstLimiters[activePlan].consume(projectId);
  }

  return {
    consume,
    limits: PLAN_LIMITS,
  };
}

export function isRateLimitError(err) {
  return Number.isFinite(err?.msBeforeNext);
}
