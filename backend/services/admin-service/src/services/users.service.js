import { identityClient } from '../utils/serviceClient.js';
import { cacheKeys, getCache, invalidateAdminCache, setCache } from '../utils/cache.js';

export async function listUsers({ page = 1, limit = 50, q = '' } = {}) {
    const cacheKey = `${cacheKeys.usersList()}:${page}:${limit}:${q || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await identityClient().get('/admin/users', {
        params: { page, limit, q },
    });

    await setCache(cacheKey, data);
    return { ...data, cached: false };
}

export async function getUser(userId) {
    const cacheKey = cacheKeys.user(userId);
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await identityClient().get(`/admin/users/${userId}`);
    await setCache(cacheKey, data);
    return { ...data, cached: false };
}

export async function updateUser(userId, body) {
    const { data } = await identityClient().patch(`/admin/users/${userId}`, body);
    await invalidateAdminCache();
    return data;
}

export async function deleteUser(userId) {
    const { data } = await identityClient().delete(`/admin/users/${userId}`);
    await invalidateAdminCache();
    return data;
}
