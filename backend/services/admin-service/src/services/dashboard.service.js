import { identityClient, projectClient, buildClient, deployClient } from '../utils/serviceClient.js';
import { getCache, setCache } from '../utils/cache.js';

export async function getDashboardStats({ fresh = false } = {}) {
    const cacheKey = 'deployhub:admin:cache:dashboard:stats:v2';
    const cached = fresh ? null : await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const [users, projects, builds, deployments] = await Promise.all([
        identityClient().get('/admin/stats').then((r) => r.data).catch(() => null),
        projectClient().get('/admin/stats').then((r) => r.data).catch(() => null),
        buildClient().get('/admin/stats').then((r) => r.data).catch(() => null),
        deployClient().get('/admin/stats').then((r) => r.data).catch(() => null),
    ]);

    const payload = {
        users, projects, builds, deployments,
        availability: { users: Boolean(users), projects: Boolean(projects), builds: Boolean(builds), deployments: Boolean(deployments) },
        sampledAt: new Date().toISOString(),
    };
    // Partial snapshots stay visible, but are never cached as a healthy zero.
    if (Object.values(payload.availability).every(Boolean)) await setCache(cacheKey, payload, 30);
    return { ...payload, cached: false };
}
