import { createUserClient, summarizeAxiosError } from '../services/httpClients.js';
import { fetchRuntimeLogs, fetchUrlText } from '../services/logs.js';
import { getDeployCacheInfo, getLiveProjectStatus, getMonitoringRedisStatus } from '../services/status.js';
import {
    checkDns,
    checkSsl,
    fetchPublicPage,
    getGithubRepoInsights,
    lookupDomainWhois,
    lookupNpmPackage,
    lookupPypiPackage,
    probeUrl,
    searchWeb,
} from '../services/externalTools.js';
import { agentEnv } from '../lib/env.js';
import axios from 'axios';


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
    'upsert_env_vars',
    'create_free_project',
    'update_display_name',
    'merge_env_vars',
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

async function fetchUserGithubToken(userId) {
    if (!agentEnv.IDENTITY_SERVICE_URL || !agentEnv.INTERNAL_SERVICE_TALKING_SECRET) {
        return null;
    }
    try {
        const { data } = await axios.get(
            `${agentEnv.IDENTITY_SERVICE_URL}/users/${userId}/github-access-token`,
            {
                headers: {
                    'x-internal-secret': agentEnv.INTERNAL_SECRET,
                    'x-microservice-secret': agentEnv.INTERNAL_SERVICE_TALKING_SECRET,
                },
                timeout: 10000,
            }
        );
        return data?.accessToken || null;
    } catch {
        return null;
    }
}

function redactSecrets(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = JSON.parse(JSON.stringify(obj));
    const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        for (const [k, v] of Object.entries(node)) {
            const key = k.toLowerCase();
            if (typeof v === 'string' && /(token|secret|password|webhook|pass)/i.test(key) && v) {
                node[k] = v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-2)}` : '***';
            } else if (v && typeof v === 'object') {
                walk(v);
            }
        }
    };
    walk(clone);
    return clone;
}

function extractErrorLines(text, max = 40) {
    const lines = String(text || '').split(/\r?\n/);
    const hits = lines.filter((l) =>
        /error|failed|exception|fatal|enoent|eacces|cannot|not found|module not found|syntaxerror/i.test(l)
    );
    return (hits.length ? hits : lines.slice(-25)).slice(-max);
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

            case 'get_project_meta': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.project.get(`/${projectId}/meta`);
                return { ok: true, projectData: data?.projectData || data };
            }

            case 'list_projects_filtered': {
                const projects = await listOwnedProjects(clients);
                const status = args.status ? String(args.status).toLowerCase() : null;
                const type = args.type ? String(args.type).toLowerCase() : null;
                const plan = args.plan ? String(args.plan).toLowerCase() : null;
                const filtered = projects.filter((p) => {
                    if (status && String(p.status || '').toLowerCase() !== status) return false;
                    if (type && String(p.type || '').toLowerCase() !== type) return false;
                    if (plan && String(p.plan || '').toLowerCase() !== plan) return false;
                    return true;
                });
                return {
                    ok: true,
                    count: filtered.length,
                    filters: { status, type, plan },
                    projects: filtered.map(mapProject),
                };
            }

            case 'get_build_details': {
                if (!args.buildId) return { ok: false, message: 'buildId is required' };
                const { data } = await clients.build.get(`/builds/detail/${args.buildId}`);
                return { ok: true, build: data?.build || data };
            }

            case 'get_latest_build_id': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.build.get(`/builds/${projectId}/latest`);
                return { ok: true, buildId: data?.build?._id || data?.build?.id, build: data?.build };
            }

            case 'get_monitoring_status': {
                await assertOwnsProject(clients, projectId);
                if (clients.monitoring) {
                    try {
                        const { data } = await clients.monitoring.get(`/uptime/${projectId}`);
                        return { ok: true, ...data };
                    } catch {
                    }
                }
                return getMonitoringRedisStatus(projectId);
            }

            case 'get_notification_settings': {
                await assertOwnsProject(clients, projectId);
                if (!clients.projectInternal) {
                    return { ok: false, message: 'Internal project client unavailable' };
                }
                const { data } = await clients.projectInternal.get(
                    `/for-other-service/${projectId}/notification-settings`
                );
                return { ok: true, notifications: redactSecrets(data) };
            }

            case 'check_fleet_health': {
                const projects = await listOwnedProjects(clients);
                const results = await Promise.all(
                    projects.map(async (p) => {
                        const live = await getLiveProjectStatus(p._id);
                        return {
                            ...mapProject(p),
                            liveStatus: live.status,
                            liveTimestamp: live.timestamp || null,
                        };
                    })
                );
                const unhealthy = results.filter((r) =>
                    /fail|error|stopped|crash/i.test(String(r.liveStatus || ''))
                );
                return {
                    ok: true,
                    count: results.length,
                    unhealthyCount: unhealthy.length,
                    unhealthy,
                    projects: results,
                };
            }

            case 'compare_projects': {
                const a = await assertOwnsProject(clients, args.projectIdA);
                const b = await assertOwnsProject(clients, args.projectIdB);
                const [liveA, liveB, ovA, ovB] = await Promise.all([
                    getLiveProjectStatus(args.projectIdA),
                    getLiveProjectStatus(args.projectIdB),
                    clients.project.get(`/overview/${args.projectIdA}`).catch(() => null),
                    clients.project.get(`/overview/${args.projectIdB}`).catch(() => null),
                ]);
                return {
                    ok: true,
                    a: {
                        ...mapProject(a),
                        liveStatus: liveA.status,
                        overview: ovA?.data?.data || null,
                    },
                    b: {
                        ...mapProject(b),
                        liveStatus: liveB.status,
                        overview: ovB?.data?.data || null,
                    },
                };
            }

            case 'analyze_build_failure': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.build.get(`/builds/${projectId}`);
                const builds = data?.data || [];
                const failed = builds.find((b) => isFailedStatus(b.status));
                if (!failed) {
                    return { ok: true, hasFailure: false, message: 'No failed builds found for this project.' };
                }
                if (!failed.logsUrl) {
                    return {
                        ok: true,
                        hasFailure: true,
                        build: failed,
                        message: 'Failed build found but no logsUrl available.',
                    };
                }
                const logs = await fetchUrlText(failed.logsUrl, { maxChars: 16000 });
                const errorLines = extractErrorLines(logs);
                return {
                    ok: true,
                    hasFailure: true,
                    build: failed,
                    errorLines,
                    logTail: logs.slice(-3000),
                };
            }

            case 'explain_plan': {
                const { data } = await clients.project.get('/plans');
                const plans = data?.plans || data;
                if (args.plan) {
                    const key = String(args.plan).toLowerCase();
                    return { ok: true, plan: key, details: plans?.[key] || null };
                }
                return { ok: true, plans };
            }

            case 'upsert_env_vars': {
                await assertOwnsProject(clients, projectId);
                let patch = {};
                try {
                    patch = JSON.parse(args.patchJson);
                } catch {
                    return { ok: false, message: 'patchJson must be valid JSON object' };
                }
                if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
                    return { ok: false, message: 'patchJson must be an object' };
                }
                let removeKeys = [];
                if (args.removeKeysJson) {
                    try {
                        removeKeys = JSON.parse(args.removeKeysJson);
                    } catch {
                        return { ok: false, message: 'removeKeysJson must be a JSON array' };
                    }
                    if (!Array.isArray(removeKeys)) {
                        return { ok: false, message: 'removeKeysJson must be an array' };
                    }
                }
                const { data: settingsRes } = await clients.project.get(`/settings/${projectId}`);
                const currentEnv = { ...(settingsRes?.settings?.env || {}) };
                for (const [k, v] of Object.entries(patch)) {
                    currentEnv[k] = String(v);
                }
                for (const k of removeKeys) {
                    delete currentEnv[k];
                }
                const { data } = await clients.project.patch(`/settings/env/${projectId}`, {
                    env: currentEnv,
                });
                return {
                    ok: true,
                    ...data,
                    envKeys: Object.keys(currentEnv),
                    updatedKeys: Object.keys(patch),
                    removedKeys: removeKeys,
                };
            }

            case 'create_free_project': {
                let env;
                if (args.envJson) {
                    try {
                        env = JSON.parse(args.envJson);
                    } catch {
                        return { ok: false, message: 'envJson must be valid JSON' };
                    }
                }
                const body = {
                    plan: 'free',
                    projectName: args.projectName,
                    projectType: 'static',
                    version: String(args.version),
                    repoUrl: args.repoUrl,
                    branch: args.branch,
                    rootDirectory: args.rootDirectory || '.',
                    buildCommand: args.buildCommand,
                    publishDir: args.publishDir,
                    ...(args.subdomain ? { subdomain: args.subdomain } : {}),
                    ...(env ? { env } : {}),
                };
                const { data } = await clients.project.post('/projects', body);
                return {
                    ok: true,
                    ...data,
                    note: 'Free plan only supports static sites. Paid plans require dashboard payment flow.',
                };
            }

            case 'update_display_name': {
                const missing = needIdentity(clients);
                if (missing) return missing;
                const { data } = await clients.identity.put('/user/fullname', {
                    fullname: args.fullname,
                });
                return { ok: true, ...data };
            }

            case 'get_build_stats': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.build.get(`/builds/${projectId}/stats`);
                return { ok: true, stats: data?.stats || data };
            }

            case 'get_latest_build': {
                await assertOwnsProject(clients, projectId);
                const { data } = await clients.build.get(`/builds/${projectId}/latest`);
                return { ok: true, build: data?.build || data };
            }

            case 'get_project_live_status_api': {
                const { data } = await clients.project.get(`/status/${projectId}`);
                return { ok: true, data: data?.data || data };
            }

            case 'get_env_keys': {
                const { data } = await clients.project.get(`/settings/${projectId}/env-keys`);
                return { ok: true, ...data };
            }

            case 'merge_env_vars': {
                await assertOwnsProject(clients, projectId);
                let patch = {};
                try {
                    patch = JSON.parse(args.patchJson);
                } catch {
                    return { ok: false, message: 'patchJson must be valid JSON object' };
                }
                let removeKeys = [];
                if (args.removeKeysJson) {
                    try {
                        removeKeys = JSON.parse(args.removeKeysJson);
                    } catch {
                        return { ok: false, message: 'removeKeysJson must be a JSON array' };
                    }
                }
                const { data } = await clients.project.patch(
                    `/settings/env/${projectId}/merge`,
                    { patch, removeKeys }
                );
                return { ok: true, ...data };
            }

            case 'list_deployments': {
                if (!clients.deploy) {
                    return { ok: false, message: 'Deploy service URL not configured' };
                }
                const limit = args.limit ? `?limit=${Number(args.limit)}` : '';
                const { data } = await clients.deploy.get(
                    `/deployments/project/${projectId}${limit}`
                );
                return { ok: true, ...data };
            }

            case 'get_latest_deployment': {
                if (!clients.deploy) {
                    return { ok: false, message: 'Deploy service URL not configured' };
                }
                const { data } = await clients.deploy.get(
                    `/deployments/project/${projectId}/latest`
                );
                return { ok: true, deployment: data?.deployment || data };
            }

            case 'get_uptime_status': {
                if (!clients.monitoring) {
                    await assertOwnsProject(clients, projectId);
                    return getMonitoringRedisStatus(projectId);
                }
                const { data } = await clients.monitoring.get(`/uptime/${projectId}`);
                return { ok: true, ...(data?.data ? { data: data.data } : data) };
            }

            case 'get_analytics_health_score': {
                if (!clients.analytics) {
                    return { ok: false, message: 'Analytics service URL not configured' };
                }
                const { data } = await clients.analytics.get(`/health-score/${projectId}`);
                return { ok: true, data: data?.data || data };
            }

            case 'probe_url': {
                const url = args.url || args.href;
                if (!url) return { ok: false, message: 'url is required' };
                return probeUrl(url, { method: args.method || 'GET' });
            }

            case 'check_dns': {
                const host = args.hostname || args.domain || args.url;
                if (!host) return { ok: false, message: 'hostname/domain is required' };
                return checkDns(host);
            }

            case 'check_ssl': {
                const host = args.hostname || args.domain || args.url;
                if (!host) return { ok: false, message: 'hostname/domain is required' };
                return checkSsl(host, { port: args.port });
            }

            case 'search_error_docs': {
                const query = args.query || args.error;
                if (!query) return { ok: false, message: 'query/error text is required' };
                return searchWeb(query, { maxResults: args.maxResults });
            }

            case 'lookup_npm_package': {
                if (!args.name && !args.package) {
                    return { ok: false, message: 'name is required' };
                }
                return lookupNpmPackage(args.name || args.package, { version: args.version });
            }

            case 'lookup_pypi_package': {
                if (!args.name && !args.package) {
                    return { ok: false, message: 'name is required' };
                }
                return lookupPypiPackage(args.name || args.package);
            }

            case 'lookup_domain_whois': {
                const domain = args.domain || args.hostname || args.url;
                if (!domain) return { ok: false, message: 'domain is required' };
                return lookupDomainWhois(domain);
            }

            case 'fetch_public_page': {
                if (!args.url) return { ok: false, message: 'url is required' };
                return fetchPublicPage(args.url, { maxChars: args.maxChars });
            }

            case 'get_github_repo_insights': {
                const repo = args.repo || args.fullName || args.repository;
                if (!repo) return { ok: false, message: 'repo (owner/name) is required' };
                const token = await fetchUserGithubToken(user._id);
                if (!token) {
                    return {
                        ok: false,
                        message:
                            'GitHub token unavailable — user must be logged in with GitHub linked.',
                    };
                }
                return getGithubRepoInsights(token, repo, { branch: args.branch });
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
