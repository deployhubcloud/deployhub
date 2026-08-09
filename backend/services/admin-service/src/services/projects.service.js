import { projectClient, identityClient, buildClient, deployClient } from '../utils/serviceClient.js';
import { cacheKeys, getCache, invalidateAdminCache, setCache } from '../utils/cache.js';

export async function listProjects(params = {}) {
    const cacheKey = `${cacheKeys.projectsList(params.userId)}:${JSON.stringify(params)}`;
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await projectClient().get('/admin/projects', { params });
    await setCache(cacheKey, data, 60 * 60);
    return { ...data, cached: false };
}

export async function getProjectDeep(projectId) {
    const cacheKey = `deployhub:admin:cache:project:deep:${projectId}`;
    const cached = await getCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const [projectRes, buildsRes, deploymentsRes] = await Promise.all([
        projectClient().get(`/admin/projects/${projectId}`),
        buildClient().get('/admin/builds', { params: { projectId, limit: 50 } }).catch(() => ({ data: { builds: [] } })),
        deployClient().get('/admin/deployments', { params: { projectId, limit: 50 } }).catch(() => ({ data: { deployments: [] } })),
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
        builds: buildsRes.data?.builds || [],
        deployments: deploymentsRes.data?.deployments || [],
        counts: {
            builds: buildsRes.data?.pagination?.total ?? (buildsRes.data?.builds?.length || 0),
            deployments: deploymentsRes.data?.pagination?.total ?? (deploymentsRes.data?.deployments?.length || 0),
            ssl: projectRes.data?.sslCertificates?.length || 0,
            pendingOrders: projectRes.data?.billing?.pendingOrders?.length || 0,
            completedOrders: projectRes.data?.billing?.completedOrders?.length || 0,
        },
    };

    await setCache(cacheKey, payload, 60 * 60);
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
