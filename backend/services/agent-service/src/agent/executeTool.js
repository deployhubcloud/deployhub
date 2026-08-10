import { createUserClient, summarizeAxiosError } from '../services/httpClients.js';
import { fetchRuntimeLogs, fetchUrlText } from '../services/logs.js';
import { getDeployCacheInfo, getLiveProjectStatus } from '../services/status.js';


export const DESTRUCTIVE_TOOLS = new Set([
    'redeploy_project',
    'update_build_and_start_settings',
    'update_env_settings',
    'update_monitoring_and_notifications',
    'change_subdomain',
    'add_custom_domain',
    'remove_custom_domain',
    'delete_project',
    'revoke_session',
    'revoke_all_sessions',
]);

function requireConfirmed(name, args) {
    if (!DESTRUCTIVE_TOOLS.has(name)) return null;
    if (args?.confirmed === true) return null;
    return {
        ok: false,
        needsConfirmation: true,
        message:
            `Blocked: "${name}" is destructive. Do not run it yet. ` +
            'Ask the user a clear yes/no confirmation (include project/session details and what will change). ' +
            'Only call this tool again with confirmed=true after they explicitly agree.',
    };
}

function needIdentity(clients) {
    if (!clients.identity) {
        return {
            ok: false,
            message: 'Identity tools unavailable — missing user access token on this request.',
        };
    }
    return null;
}

async function assertOwnsProject(clients, projectId) {
    const { data } = await clients.project.get('/projects');
    const projects = data?.projects || [];
    const owned = projects.find((p) => String(p._id) === String(projectId));
    if (!owned) {
        const err = new Error('Project not found or not owned by this user');
        err.status = 404;
        throw err;
    }
    return owned;
}

async function listOwnedProjects(clients) {
    const { data } = await clients.project.get('/projects');
    return data?.projects || [];
}

function mapProject(p) {
    return {
        id: p._id,
        name: p.name,
        type: p.type,
        status: p.status,
        plan: p.plan,
        domain: p.domain,
        totalBuilds: p.totalBuilds,
        isMicroservice: p.isMicroservice,
        monitorEnabled: p.monitorEnabled,
    };
}

function isFailedStatus(s = '') {
    const v = String(s).toLowerCase();
    return v === 'failed' || v === 'failure' || v === 'error';
}

export async function executeTool(name, args, user, auth = {}) {
    args = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
    const blocked = requireConfirmed(name, args);
    if (blocked) return blocked;

    const clients = createUserClient(user, auth);
    const projectId = args?.projectId;

    try {
        switch (name) {
            case 'list_projects': {
                const projects = await listOwnedProjects(clients);
                return { ok: true, count: projects.length, projects: projects.map(mapProject) };
            }

            case 'find_project': {
                const q = String(args.query || '').trim().toLowerCase();
                if (!q) return { ok: false, message: 'query is required' };
                const projects = await listOwnedProjects(clients);
                const matches = projects
                    .filter((p) => String(p.name || '').toLowerCase().includes(q) || String(p._id) === q)
                    .map(mapProject);
                return { ok: true, query: args.query, count: matches.length, projects: matches };
            }

            case 'get_project_overview': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.get(`/overview/${projectId}`);
                return { ok: true, data: data?.data };
            }

            case 'get_project_settings': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.get(`/settings/${projectId}`);
                const settings = data?.settings || {};
                const envKeys = settings.env ? Object.keys(settings.env) : [];
                return {
                    ok: true,
                    settings: { ...settings, env: undefined, envKeys, envCount: envKeys.length },
                };
            }

            case 'get_project_live_status': {
                await assertOwnsProject(clients, projectId);
                return getLiveProjectStatus(projectId);
            }

            case 'get_domain_settings': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.get(`/settings/domain/${projectId}`);
                return { ok: true, domainSettings: data?.domainSettings };
            }

            case 'get_project_billing': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.get(`/billing/${projectId}`);
                return { ok: true, billing: data?.data };
            }

            case 'list_plans': {
                const { data } = await clients.project.get('/plans');
                return { ok: true, plans: data };
            }

            case 'get_analytics_summary': {
                await assertOwnsProject(clients, projectId);
                if (!clients.analytics) {
                    return { ok: false, message: 'Analytics service URL not configured for agent-service' };
                }
                const { data } = await clients.analytics.get(`/summary/${projectId}`);
                return { ok: true, analytics: data?.data };
            }

            case 'list_all_builds': {
                const { data } = await clients.build.get('/builds');
                return { ok: true, builds: (data?.builds || []).slice(0, 50) };
            }

            case 'list_project_builds': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.build.get(`/builds/${projectId}`);
                return { ok: true, builds: data?.data || [] };
            }

            case 'get_failed_builds': {
                const limit = Math.min(Number(args.limit) || 10, 30);
                let builds = [];
                if (projectId) {
                    await assertOwnsProject(clients, projectId);
                    const { data } = await clients.build.get(`/builds/${projectId}`);
                    builds = (data?.data || []).map((b) => ({
                        ...b,
                        projectId,
                        buildStaus: b.status,
                    }));
                } else {
                    const { data } = await clients.build.get('/builds');
                    builds = data?.builds || [];
                }
                const failed = builds
                    .filter((b) => isFailedStatus(b.buildStaus ?? b.buildStatus ?? b.status))
                    .slice(0, limit);
                return { ok: true, count: failed.length, builds: failed };
            }

            case 'get_build_logs': {
                await assertOwnsProject(clients, projectId);
                let url = args.logsUrl;
                if (!url) {
                    const { data } = await clients.build.get(`/builds/${projectId}`);
                    const builds = data?.data || [];
                    const withLogs = builds.find((b) => b.logsUrl);
                    url = withLogs?.logsUrl;
                }
                if (!url) return { ok: false, message: 'No build log URL available for this project.' };
                const text = await fetchUrlText(url);
                return { ok: true, logsUrl: url, logs: text };
            }

            case 'get_runtime_logs': {
                await assertOwnsProject(clients, projectId);
                return fetchRuntimeLogs(projectId, { tail: args.tail });
            }

            case 'get_deploy_cache_info': {
                await assertOwnsProject(clients, projectId);
                return getDeployCacheInfo(projectId);
            }

            case 'diagnose_project': {
                const owned = await assertOwnsProject(clients, projectId);
                const [live, overviewRes, buildsRes, cache, runtime] = await Promise.all([
                    getLiveProjectStatus(projectId),
                    clients.project.get(`/overview/${projectId}`).catch((e) => ({ error: e })),
                    clients.build.get(`/builds/${projectId}`).catch((e) => ({ error: e })),
                    getDeployCacheInfo(projectId),
                    fetchRuntimeLogs(projectId, { tail: 80 }),
                ]);

                let analytics = null;
                if (clients.analytics) {
                    try {
                        const { data } = await clients.analytics.get(`/summary/${projectId}`);
                        analytics = data?.data;
                    } catch {
                        analytics = null;
                    }
                }

                const overview = overviewRes?.data?.data || null;
                const builds = buildsRes?.data?.data || [];
                const recent = builds.slice(0, 5);
                const latestFailed = builds.find((b) => isFailedStatus(b.status));

                let logSample = null;
                if (runtime?.ok && runtime.logs) {
                    logSample = { source: 'runtime', logs: String(runtime.logs).slice(-4000) };
                } else if (latestFailed?.logsUrl || recent[0]?.logsUrl) {
                    try {
                        const url = latestFailed?.logsUrl || recent[0].logsUrl;
                        const text = await fetchUrlText(url, { maxChars: 4000 });
                        logSample = { source: 'build', logsUrl: url, logs: text };
                    } catch {
                        logSample = null;
                    }
                }

                return {
                    ok: true,
                    project: mapProject(owned),
                    liveStatus: live,
                    overview,
                    recentBuilds: recent,
                    latestFailedBuild: latestFailed || null,
                    deployCache: cache.cache,
                    analytics: analytics
                        ? {
                            requests: analytics.requests,
                            errors: analytics.error,
                            uniqueVisitors: analytics.uniqueVisitors,
                            topEndpoints: (analytics.topEndpoints || []).slice(0, 5),
                        }
                        : null,
                    logSample,
                    hints: [
                        live.status ? `Live status is "${live.status}".` : 'No live status yet.',
                        latestFailed ? 'There is a recent failed build — inspect build logs.' : 'No recent failed build found.',
                        analytics?.error?.['5xx'] > 0 ? 'Analytics shows recent 5xx errors.' : null,
                    ].filter(Boolean),
                };
            }

            case 'account_summary': {
                const projects = await listOwnedProjects(clients);
                const byStatus = {};
                const byType = {};
                const byPlan = {};
                for (const p of projects) {
                    byStatus[p.status || 'unknown'] = (byStatus[p.status || 'unknown'] || 0) + 1;
                    byType[p.type || 'unknown'] = (byType[p.type || 'unknown'] || 0) + 1;
                    byPlan[p.plan || 'unknown'] = (byPlan[p.plan || 'unknown'] || 0) + 1;
                }

                let failedBuilds = 0;
                try {
                    const { data } = await clients.build.get('/builds');
                    failedBuilds = (data?.builds || []).filter((b) =>
                        isFailedStatus(b.buildStaus ?? b.buildStatus ?? b.status)
                    ).length;
                } catch {
                    failedBuilds = null;
                }

                let profile = null;
                if (clients.identity) {
                    try {
                        const { data } = await clients.identity.get('/user/profile');
                        profile = data?.userData || data?.user || data;
                    } catch {
                        profile = null;
                    }
                }

                return {
                    ok: true,
                    projectCount: projects.length,
                    byStatus,
                    byType,
                    byPlan,
                    failedBuildsRecent: failedBuilds,
                    projects: projects.slice(0, 20).map(mapProject),
                    profile,
                };
            }

            case 'get_user_profile': {
                const missing = needIdentity(clients);
                if (missing) return missing;
                const { data } = await clients.identity.get('/user/profile');
                return { ok: true, profile: data?.userData || data?.user || data };
            }

            case 'list_sessions': {
                const missing = needIdentity(clients);
                if (missing) return missing;
                const { data } = await clients.identity.get('/sessions');
                return { ok: true, sessions: data?.sessions || data };
            }

            case 'list_github_repos': {
                const missing = needIdentity(clients);
                if (missing) return missing;
                const { data } = await clients.identity.get('/user/repos');
                let repos = data?.repositories || data?.repos || data || [];
                if (!Array.isArray(repos)) repos = [];
                const q = String(args.query || '').trim().toLowerCase();
                if (q) {
                    repos = repos.filter((r) =>
                        String(r.name || r.full_name || '').toLowerCase().includes(q)
                    );
                }
                const limit = Math.min(Number(args.limit) || 30, 50);
                return {
                    ok: true,
                    count: repos.length,
                    repositories: repos.slice(0, limit).map((r) => ({
                        name: r.name,
                        fullName: r.full_name,
                        private: r.private,
                        defaultBranch: r.default_branch,
                        url: r.html_url || r.clone_url,
                        language: r.language,
                        updatedAt: r.updated_at,
                    })),
                };
            }

            case 'redeploy_project': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.post(`/redeploy/${projectId}`);
                return { ok: true, ...data };
            }

            case 'update_build_and_start_settings': {
                await assertOwnsProject(clients, projectId);
                const body = {
                    buildCommand: args.buildCommand ?? '',
                    publishDir: args.publishDir ?? '',
                    startCommand: args.startCommand ?? '',
                    port: args.port ?? 3000,
                    rootDirectory: args.rootDirectory ?? '',
                };
                const { data } = await clients.project.patch(
                    `/settings/build-and-start/${projectId}`,
                    body
                );
                return { ok: true, ...data };
            }

            case 'update_env_settings': {
                await assertOwnsProject(clients, projectId);
                let env = args.env;
                if (typeof args.envJson === 'string') {
                    try {
                        env = JSON.parse(args.envJson);
                    } catch {
                        return { ok: false, message: 'envJson must be valid JSON' };
                    }
                }
                if (!env || typeof env !== 'object' || Array.isArray(env)) {
                    return { ok: false, message: 'env must be a key-value object' };
                }
                const { data } = await clients.project.patch(`/settings/env/${projectId}`, { env });
                return { ok: true, ...data, envKeys: Object.keys(env) };
            }

            case 'update_monitoring_and_notifications': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.patch(
                    `/settings/notification/${projectId}`,
                    {
                        projectPlan: args.projectPlan,
                        monitor: args.monitor,
                        notifications: args.notifications || {},
                    }
                );
                return { ok: true, ...data };
            }

            case 'change_subdomain': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.put(`/subdomain/${projectId}`, {
                    oldSubdomain: args.oldSubdomain,
                    newSubdomain: args.newSubdomain,
                });
                return { ok: true, ...data };
            }

            case 'add_custom_domain': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.post(`/custom-domain/${projectId}`, {
                    domain: args.domain,
                });
                return { ok: true, ...data };
            }

            case 'remove_custom_domain': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.delete(`/custom-domain/${projectId}`, {
                    data: { domain: args.domain },
                });
                return { ok: true, ...data };
            }

            case 'delete_project': {
                const owned = await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.delete(`/project/${projectId}`);
                return {
                    ok: true,
                    deleted: true,
                    projectId,
                    projectName: owned.name,
                    ...data,
                };
            }

            case 'revoke_session': {
                const missing = needIdentity(clients);
                if (missing) return missing;
                const { data } = await clients.identity.delete(`/sessions/${args.tokenId}`);
                return { ok: true, ...data };
            }

            case 'revoke_all_sessions': {
                const missing = needIdentity(clients);
                if (missing) return missing;
                const { data } = await clients.identity.delete('/sessions');
                return { ok: true, ...data };
            }

            default:
                return { ok: false, message: `Unknown tool: ${name}` };
        }
    } catch (error) {
        if (error.status === 404) {
            return { ok: false, message: error.message };
        }
        return summarizeAxiosError(error);
    }
}
