import { identityClient, projectClient, buildClient, deployClient } from '../utils/serviceClient.js';
import { getCache, setCache } from '../utils/cache.js';

export async function getDashboardStats() {
    const cacheKey = 'deployhub:admin:cache:dashboard:stats';
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const [users, projects, builds, deployments] = await Promise.all([
        identityClient().get('/admin/stats').then((r) => r.data).catch(() => ({ total: 0 })),
        projectClient().get('/admin/stats').then((r) => r.data).catch(() => ({ total: 0 })),
        buildClient().get('/admin/stats').then((r) => r.data).catch(() => ({ total: 0 })),
        deployClient().get('/admin/stats').then((r) => r.data).catch(() => ({ total: 0 })),
    ]);

    const payload = { users, projects, builds, deployments };
    await setCache(cacheKey, payload, 60 * 5);
    return { ...payload, cached: false };
}
