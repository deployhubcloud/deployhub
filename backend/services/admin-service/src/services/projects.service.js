import { projectClient } from '../utils/serviceClient.js';
import { cacheKeys, delCache, getCache, invalidateAdminCache, setCache } from '../utils/cache.js';

export async function listProjects({ userId, page = 1, limit = 50, q = '' } = {}) {
    const cacheKey = `${cacheKeys.projectsList(userId)}:${page}:${limit}:${q || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await projectClient().get('/admin/projects', {
        params: { userId, page, limit, q },
    });

    await setCache(cacheKey, data);
    return { ...data, cached: false };
}

export async function getProject(projectId) {
    const cacheKey = cacheKeys.project(projectId);
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await projectClient().get(`/admin/projects/${projectId}`);
    await setCache(cacheKey, data);
    return { ...data, cached: false };
}

export async function updateProject(projectId, body) {
    const { data } = await projectClient().patch(`/admin/projects/${projectId}`, body);
    await delCache(cacheKeys.project(projectId));
    await invalidateAdminCache();
    return data;
}

export async function deleteProject(projectId) {
    const { data } = await projectClient().delete(`/admin/projects/${projectId}`);
    await delCache(cacheKeys.project(projectId));
    await invalidateAdminCache();
    return data;
}
