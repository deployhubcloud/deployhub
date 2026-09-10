import { projectClient, identityClient, buildClient, deployClient } from '../utils/serviceClient.js';
import { cacheKeys, getCache, invalidateAdminCache, setCache } from '../utils/cache.js';

export async function listProjects(params = {}) {
    const { fresh, ...query } = params;
    const cacheKey = `${cacheKeys.projectsList(query.userId)}:${JSON.stringify(query)}`;
    const cached = fresh === '1' ? null : await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await projectClient().get('/admin/projects', { params: query });
    await setCache(cacheKey, data, 30);
    return { ...data, cached: false };
}

export async function getProjectDeep(projectId, { fresh = false } = {}) {
    const cacheKey = `deployhub:admin:cache:project:deep:${projectId}`;
    const cached = fresh ? null : await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const [projectRes, buildsRes, deploymentsRes] = await Promise.all([
        projectClient().get(`/admin/projects/${projectId}`),
        buildClient().get('/admin/builds', { params: { projectId, limit: 50 } }).catch(() => null),
        deployClient().get('/admin/deployments', { params: { projectId, limit: 50 } }).catch(() => null),
    ]);

    let owner = null;
    const userId = projectRes.data?.project?.userId;
    if (userId) {
        try {
            const userRes = await identityClient().get(`/admin/users/${userId}`);
            owner = userRes.data?.user || null;
        } catch {
            owner = null;
        }
    }

    const payload = {
        ...projectRes.data,
        owner,
        builds: buildsRes?.data?.builds || [],
        deployments: deploymentsRes?.data?.deployments || [],
        availability: { builds: Boolean(buildsRes), deployments: Boolean(deploymentsRes), owner: Boolean(owner) },
        counts: {
            builds: buildsRes ? (buildsRes.data?.pagination?.total ?? buildsRes.data?.builds?.length ?? 0) : null,
            deployments: deploymentsRes ? (deploymentsRes.data?.pagination?.total ?? deploymentsRes.data?.deployments?.length ?? 0) : null,
            ssl: projectRes.data?.sslCertificates?.length || 0,
            pendingOrders: projectRes.data?.billing?.pendingOrders?.length || 0,
            completedOrders: projectRes.data?.billing?.completedOrders?.length || 0,
        },
    };

    if (buildsRes && deploymentsRes && owner) await setCache(cacheKey, payload, 30);
    return { ...payload, cached: false };
}

export async function updateProject(projectId, body) {
    const { data } = await projectClient().patch(`/admin/projects/${projectId}`, body);
    await invalidateAdminCache();
    return data;
}

export async function deleteProject(projectId) {
    const { data } = await projectClient().delete(`/admin/projects/${projectId}`);
    await invalidateAdminCache();
    return data;
}

export async function purgeProjectCache(projectId) {
    const { data } = await projectClient().post(`/admin/projects/${projectId}/purge-cache`);
    await invalidateAdminCache();
    return data;
}

export async function deleteProjectBuilds(projectId) {
    const { data } = await buildClient().delete(`/admin/projects/${projectId}/builds`);
    await invalidateAdminCache();
    return data;
}

export async function deleteProjectDeployments(projectId) {
    const { data } = await deployClient().delete(`/admin/projects/${projectId}/deployments`);
    await invalidateAdminCache();
    return data;
}

export async function deleteBuild(buildId) {
    const { data } = await buildClient().delete(`/admin/builds/${buildId}`);
    await invalidateAdminCache();
    return data;
}

export async function deleteDeployment(deploymentId) {
    const { data } = await deployClient().delete(`/admin/deployments/${deploymentId}`);
    await invalidateAdminCache();
    return data;
}

export async function listProjectHistory(projectId, type, params = {}) {
    const page = Number(params.page ?? 1);
    const requestedLimit = Number(params.limit ?? 25);
    if (!['builds', 'deployments'].includes(type) || !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
        const error = new Error('Invalid history pagination');
        error.status = 400;
        throw error;
    }
    const limit = Math.min(100, requestedLimit);
    const client = type === 'builds' ? buildClient() : deployClient();
    const { data } = await client.get('/admin/' + type, { params: { projectId, page, limit } });
    return data;
}
