import { identityClient, projectClient } from '../utils/serviceClient.js';
import { cacheKeys, getCache, invalidateAdminCache, setCache } from '../utils/cache.js';

export async function listUsers(params = {}) {
    const { fresh, ...query } = params;
    const cacheKey = `${cacheKeys.usersList()}:${JSON.stringify(query)}`;
    const cached = fresh === '1' ? null : await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await identityClient().get('/admin/users', { params: query });
    await setCache(cacheKey, data, 30);
    return { ...data, cached: false };
}

export async function getUserDeep(userId, { fresh = false } = {}) {
    const cacheKey = `deployhub:admin:cache:user:deep:${userId}`;
    const cached = fresh ? null : await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const [userRes, projectsRes] = await Promise.all([
        identityClient().get(`/admin/users/${userId}`),
        projectClient().get('/admin/projects', { params: { userId, limit: 100 } }).catch(() => null),
    ]);

    const payload = {
        ...userRes.data,
        projects: projectsRes?.data?.projects || [],
        projectCount: projectsRes ? (projectsRes.data?.pagination?.total ?? projectsRes.data?.projects?.length ?? 0) : null,
        availability: { projects: Boolean(projectsRes) },
    };

    if (projectsRes) await setCache(cacheKey, payload, 30);
    return { ...payload, cached: false };
}

export async function updateUser(userId, body) {
    const { data } = await identityClient().patch(`/admin/users/${userId}`, body);
    await invalidateAdminCache();
    return data;
}

export async function deleteUser(userId, { deleteProjects = true } = {}) {
    if (deleteProjects) {
        await projectClient().delete(`/admin/users/${userId}/projects`);
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
