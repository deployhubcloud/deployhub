import { AppError } from '../../../../shared/errors/AppError.js';
import { Project } from '../models/project.model.js';
import { getRedis } from '../core/redis/client.js';
import { clearCacheProjectData } from '../../../../shared/utils/cacheProjectData.js';
import { subdomainChangeQueue } from '../utils/queues.js';
import { isBlockedDomain } from '../utils/blockedDomains.js';
import { writeNginxConfig } from '../../../../shared/nginx/writeNginx.js';
import { execInContainer } from '../utils/execInContainer.js';
import { project_env } from '../lib/env.js';
import path from 'path';
import fs from 'fs';
import { writeNginxFileToHost } from '../utils/nginx/writeNginxFileToHost.js';
import { checkAndPullImage } from '../../../../shared/docker/checkAndPullImage.js';
import { docker } from '../utils/docker.js';
import { reloadNginx } from '../../../../shared/nginx/reloadNginx.js';
import { Resolver } from 'dns/promises';
import { SslCertificate } from '../models/sslCertificate.js';
import { plans } from '../../../../shared/constants/plan.js';
import { issueOrReuseCertificate, renewCertificate } from '../utils/sslUtils.js';

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

const SERVER_IP = process.env.SERVER_IP || '194.164.150.185';
const CNAME_TARGET = (process.env.CNAME_TARGET || 'cname.deployhub.online').toLowerCase();
const NETWORK_MODE = process.env.DOCKER_PROXY_NETWORK || 'proxy-net';

function isProduction() {
    return project_env.NODE_ENV === 'production';
}

function nginxCustomDomainsHostDir() {
    if (process.env.NGINX_CUSTOM_DOMAINS_HOST_DIR) {
        return process.env.NGINX_CUSTOM_DOMAINS_HOST_DIR;
    }
    if (isProduction()) return '/home/rahul/docker/nginx/custom-domains';
    const localDir = path.join(process.cwd(), 'nginx/custom-domains');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    return localDir;
}

function normalizeDomain(domain) {
    return String(domain || '')
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/\.$/, '');
}

export async function isDomainPointingToServer(domain) {
    const host = normalizeDomain(domain);
    if (!host) return false;

    try {
        if (SERVER_IP) {
            const aRecords = await resolver.resolve4(host).catch(() => []);
            if (aRecords.includes(SERVER_IP)) return true;
        }
    } catch {
    }

    try {
        const cnames = await resolver.resolveCname(host).catch(() => []);
        const wanted = CNAME_TARGET.replace(/\.$/, '');
        if (cnames.some((c) => String(c).replace(/\.$/, '').toLowerCase() === wanted)) {
            return true;
        }
    } catch {
    }

    return false;
}

export const changeSubdomain = async (projectId, oldsubDomain, userId, newSubdomain) => {
    const redis = getRedis();
    const normalizedNewSubDomain = newSubdomain.toLowerCase();

    const existing = await Project.exists({
        subdomain: normalizedNewSubDomain,
    });

    if (existing) {
        throw new AppError('This subdomain is already taken. Please choose another', 409);
    }

    const project = await Project.findOne({
        _id: projectId,
        userId,
        subdomain: oldsubDomain,
    });

    if (!project) throw new AppError('Project not found', 404);
    if (project.isMicroservice) throw new AppError('You cant add or change subdomain');
    if (project.status === 'building' || project.status === 'queued') {
        throw new AppError('you cant change subdomain while proejct is building or in queued');
    }

    project.subdomain = normalizedNewSubDomain;
    await project.save({ validateBeforeSave: false });

    await clearCacheProjectData(projectId, redis);

    await subdomainChangeQueue.add('subdomain-change', {
        projectId,
        userId,
        oldSubdomain: oldsubDomain,
        newSubdomain: normalizedNewSubDomain,
        projectType: project.type,
        assignedPort: project.assignedPort,
    });

    await redis.hset(`deployhub:users:subdomain:${newSubdomain}`, {
        port: project.assignedPort,
        projectId: project._id.toString(),
        plan: project.plan,
    });

    await redis.del(`deployhub:users:subdomain:${oldsubDomain}`);

    return true;
};

export const getDomainSettings = async (projectId, userId) => {
    const filter = { _id: projectId };
    if (userId) filter.userId = userId;
    const domainSettings = await Project.findOne(filter)
        .select('subdomain customDomains internalUrl isMicroservice plan assignedPort')
        .lean();

    if (!domainSettings) {
        throw new AppError('Invalid Project id or Project not Found', 404);
    }

    const domains = domainSettings.customDomains || [];
    const certificates = domains.length
        ? await SslCertificate.find({ domain: { $in: domains }, projectId })
            .select('domain issuedAt expiresAt nextRenewAt status lastRenewAttempt lastError')
            .lean()
        : [];

    return {
        ...domainSettings,
        certificates,
        dns: {
            aRecord: SERVER_IP || null,
            cnameTarget: CNAME_TARGET,
        },
    };
};

async function withNginxHelper(projectId, fn) {
    let nginxContainer = null;
    try {
        await checkAndPullImage(docker, `${project_env.DOCKER_USERNAME}/deployhub-static-helper`);
        const hostDir = nginxCustomDomainsHostDir();
        nginxContainer = await docker.createContainer({
            Image: `${project_env.DOCKER_USERNAME}/deployhub-static-helper`,
            name: `deployhub-nginx-helper-${projectId}-custom-domain-${Date.now()}`,
            HostConfig: {
                Binds: [`${hostDir}:/data/nginx/custom-domains`],
                AutoRemove: false,
            },
        });
        await nginxContainer.start();
        return await fn(nginxContainer);
    } finally {
        if (nginxContainer) {
            try {
                const info = await nginxContainer.inspect();
                if (info.State.Running) await nginxContainer.stop({ t: 5 });
            } catch (e) {
                console.warn(`[custom-domain] stop failed: ${e.message}`);
            }
            try {
                await nginxContainer.remove({ force: true });
            } catch (e) {
                console.warn(`[custom-domain] remove failed: ${e.message}`);
            }
        }
    }
}

function assertPlanAllowsCustomDomain(project) {
    if (project.isMicroservice) {
        throw new AppError('Custom domains are not supported for microservices', 403);
    }
    const plan = plans?.[project.plan];
    if (project.plan === 'free' || plan?.customDomain === false) {
        throw new AppError('Custom domains not available on free plan', 403);
    }
}

export const addCustomDomainService = async (domain, projectId, userId) => {
    const redis = getRedis();
    if (!domain) throw new AppError('Domain required', 400);

    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) throw new AppError('Domain required', 400);
    if (isBlockedDomain(normalizedDomain)) {
        throw new AppError('This domain is reserved and cannot be used', 403);
    }

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) throw new AppError('Project not found', 404);
    assertPlanAllowsCustomDomain(project);

    if ((project.customDomains || []).includes(normalizedDomain)) {
        throw new AppError('Domain already attached to this project', 409);
    }

    const conflict = await Project.exists({
        customDomains: normalizedDomain,
        _id: { $ne: projectId },
    });
    if (conflict) throw new AppError('Domain already in use', 409);

    if (isProduction() || process.env.FORCE_DOMAIN_DNS_CHECK === 'true') {
        const isValid = await isDomainPointingToServer(normalizedDomain);
        if (!isValid) {
            throw new AppError(
                `Domain is not pointing to this server. Add an A record to ${SERVER_IP || 'SERVER_IP'} or a CNAME to ${CNAME_TARGET}`,
                400
            );
        }
    }

    if (isProduction() && !process.env.CERTBOT_EMAIL) {
        throw new AppError('CERTBOT_EMAIL is not configured', 500);
    }

    const ssl = await issueOrReuseCertificate({
        domain: normalizedDomain,
        userId: project.userId,
        projectId,
        email: process.env.CERTBOT_EMAIL,
        networkMode: NETWORK_MODE,
    });

    const nginxConfig = writeNginxConfig({
        type: project.type === 'static' ? 'static' : 'backend',
        staticPath: project.type === 'static' ? `/data/static/${projectId}` : undefined,
        target: project.type !== 'static' ? 'http://host.docker.internal:8081' : undefined,
        domain: normalizedDomain,
        sslDomain: normalizedDomain,
        outputPath: null,
    });

    await withNginxHelper(projectId, async (nginxContainer) => {
        await writeNginxFileToHost(
            nginxContainer,
            nginxConfig,
            '/data/nginx/custom-domains',
            `${normalizedDomain}.conf`
        );
    });

    await redis.hset(`deployhub:users:customdomain:${normalizedDomain}`, {
        port: String(project.assignedPort || ''),
        projectId: project._id.toString(),
        plan: project.plan || '',
        subdomain: project.subdomain || '',
        type: project.type || '',
    });

    project.customDomains = [...new Set([...(project.customDomains || []), normalizedDomain])];
    await project.save();
    await clearCacheProjectData(projectId, redis);

    if (isProduction()) await reloadNginx(docker);

    return {
        domain: normalizedDomain,
        issuedAt: ssl.issuedAt,
        expiresAt: ssl.expiresAt,
        nextRenewAt: ssl.nextRenewAt,
        reused: Boolean(ssl.reused),
    };
};

export const removeCustomDomainService = async (domain, projectId, userId) => {
    const redis = getRedis();
    if (!domain) throw new AppError('Domain required', 400);

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) throw new AppError('Project not found', 404);

    const normalizedDomain = normalizeDomain(domain);
    if (!(project.customDomains || []).includes(normalizedDomain)) {
        throw new AppError('Domain is not attached to this project', 404);
    }

    await withNginxHelper(projectId, async (nginxContainer) => {
        await execInContainer(nginxContainer, [
            'rm',
            '-f',
            `/data/nginx/custom-domains/${normalizedDomain}.conf`,
        ]);
    });

    project.customDomains = (project.customDomains || []).filter((d) => d !== normalizedDomain);
    await project.save();
    await clearCacheProjectData(projectId, redis);

    await SslCertificate.findOneAndDelete({ domain: normalizedDomain, projectId });
    await redis.del(`deployhub:users:customdomain:${normalizedDomain}`);

    if (isProduction()) await reloadNginx(docker);

    return { domain: normalizedDomain };
};

export const renewCustomDomainService = async (domain, projectId, userId) => {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) throw new AppError('Project not found', 404);
    assertPlanAllowsCustomDomain(project);

    const normalizedDomain = normalizeDomain(domain);
    if (!(project.customDomains || []).includes(normalizedDomain)) {
        throw new AppError('Domain is not attached to this project', 404);
    }

    const result = await renewCertificate({
        domain: normalizedDomain,
        projectId,
        email: process.env.CERTBOT_EMAIL,
        networkMode: NETWORK_MODE,
    });

    if (isProduction()) await reloadNginx(docker);
    return result;
};
