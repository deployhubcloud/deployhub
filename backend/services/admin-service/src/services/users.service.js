import { identityClient, projectClient } from '../utils/serviceClient.js';
import { cacheKeys, getCache, invalidateAdminCache, setCache } from '../utils/cache.js';

export async function listUsers(params = {}) {
    const cacheKey = `${cacheKeys.usersList()}:${JSON.stringify(params)}`;
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await identityClient().get('/admin/users', { params });
    await setCache(cacheKey, data);
    return { ...data, cached: false };
}

export async function getUserDeep(userId) {
    const cacheKey = `deployhub:admin:cache:user:deep:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const [userRes, projectsRes] = await Promise.all([
        identityClient().get(`/admin/users/${userId}`),
        projectClient().get('/admin/projects', { params: { userId, limit: 100 } }).catch(() => ({ data: { projects: [], pagination: { total: 0 } } })),
    ]);

    const payload = {
        ...userRes.data,
        projects: projectsRes.data?.projects || [],
        projectCount: projectsRes.data?.pagination?.total ?? (projectsRes.data?.projects?.length || 0),
    };

    await setCache(cacheKey, payload);
    return { ...payload, cached: false };
}

export async function updateUser(userId, body) {
    const { data } = await identityClient().patch(`/admin/users/${userId}`, body);
    await invalidateAdminCache();
    return data;
}

export async function deleteUser(userId, { deleteProjects = true } = {}) {
    if (deleteProjects) {
        await projectClient().delete(`/admin/users/${userId}/projects`).catch(() => null);
    }
    const { data } = await identityClient().delete(`/admin/users/${userId}`);
    await invalidateAdminCache();
    return data;
}

export async function revokeSessions(userId) {
    const { data } = await identityClient().post(`/admin/users/${userId}/revoke-sessions`);
    await invalidateAdminCache();
    return data;
}

export async function deleteUserProjects(userId) {
    const { data } = await projectClient().delete(`/admin/users/${userId}/projects`);
    await invalidateAdminCache();
    return data;
}
