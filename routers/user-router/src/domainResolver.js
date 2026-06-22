import { DOMAIN_CACHE_TTL_MS, USER_ROOT_DOMAIN } from "./config.js";
import { getSubdomain } from "./host.js";
import { TtlCache } from "./ttlCache.js";

function normalizePlan(plan) {
  return plan === "pro" ? "pro" : "free";
}

function buildResolvedRoute({ subdomain, port, projectId, plan, source }) {
  if (!subdomain || !port) return null;

  return {
    source,
    target: `http://localhost:${port}`,
    projectId: projectId || null,
    plan: normalizePlan(plan),
  };
}

export function createUserDomainResolver({ redisclient }) {
  const cache = new TtlCache(DOMAIN_CACHE_TTL_MS);

  async function resolveSubdomain(host) {
    const subdomain = getSubdomain(host, USER_ROOT_DOMAIN);
    if (!subdomain) return null;

    const project = await redisclient.hgetall(`deployhub:users:subdomain:${subdomain}`);
    return buildResolvedRoute({
      source: "subdomain",
      subdomain,
      port: project?.port,
      projectId: project?.projectId,
      plan: project?.plan,
    });
  }

  async function resolveCustomDomain(host) {
    const custom = await redisclient.hgetall(`deployhub:users:scustomdomain:${host}`);
    return buildResolvedRoute({
      source: "custom-domain",
      subdomain: custom?.subdomain,
      port: custom?.port,
      projectId: custom?.projectId,
      plan: custom?.plan,
    });
  }

  async function resolve(host) {
    const cached = cache.get(host);
    if (cached) return cached;

    const resolved = (await resolveSubdomain(host)) || (await resolveCustomDomain(host));
    if (resolved) cache.set(host, resolved);

    return resolved;
  }

  return {
    resolve,
    clearCache: () => cache.clear(),
  };
}
