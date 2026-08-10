import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js";
import { getRedis } from '../core/redis/client.js'
import { clearCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";
import { subdomainChangeQueue } from "../utils/queues.js";
import { isBlockedDomain } from "../utils/blockedDomains.js";
import { writeNginxConfig } from "../../../../shared/nginx/writeNginx.js";
import { execInContainer } from "../utils/execInContainer.js";
import { project_env } from "../lib/env.js";
import path from 'path';
import fs from 'fs';
import { writeNginxFileToHost } from "../utils/nginx/writeNginxFileToHost.js";
import { checkAndPullImage } from "../../../../shared/docker/checkAndPullImage.js";
import { docker } from "../utils/docker.js";
import { reloadNginx } from "../../../../shared/nginx/reloadNginx.js";
import { Resolver } from 'dns/promises';
import { SslCertificate } from "../models/sslCertificate.js";


export async function isDomainPointingToServer(domain) {
    try {
        const records = await resolver.resolve4(domain);
        return records.includes(SERVER_IP);
    } catch (error) {
        console.log(error)
        return false
    }
}

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);


const SERVER_IP = process.env.SERVER_IP
const CERTBOT_EMAIL = process.env.CERTBOT_EMAIL

const LETSENCRYPT_DIR = '/etc/letsencrypt/live'
const LETSENCRYPT_BIND = '/home/rahul/docker/letsencrypt:/etc/letsencrypt'
const NGINX_HTML_BIND = '/home/rahul/docker/nginx/html:/var/www/html'
const NETWORK_MODE = 'proxy-net'

export const changeSubdomain = async (projectId, oldsubDomain, userId, newSubdomain) => {

    const redis = getRedis()

    const normalizedNewSubDomain = newSubdomain.toLowerCase()

    console.log()
    const existing = await Project.exists({
        subdomain: normalizedNewSubDomain
    })

    if (existing) {
        throw new AppError("This subdomain is already taken. Please choose another", 409)
    }

    console.log(projectId, userId)

    const project = await Project.findOne({
        _id: projectId,
        userId,
        subdomain: oldsubDomain
    });

    if (!project) throw new AppError("Project not found", 404);
    if (project.isMicroservice) throw new AppError("You cant add or change subdomain");
    if (project.status === "building" || project.status === "queued") throw new AppError("you cant change subdomain while proejct is building or in queued")

    project.subdomain = normalizedNewSubDomain;
    await project.save({ validateBeforeSave: false });

    await clearCacheProjectData(projectId, redis)

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

    return true
}


export const getDomainSettings = async (projectId, userId) => {
    const filter = { _id: projectId };
    if (userId) filter.userId = userId;
    const domainSettings = await Project.findOne(filter).select("subdomain customDomains internalUrl isMicroservice plan").lean();

    if (!domainSettings) {
        throw new AppError("Invalid Project id or Project not Found", 404)
    }

    return domainSettings

}


export const addCustomDomainService = async (domain, projectId, userId) => {
    console.log(domain, projectId, userId)

    const redis = getRedis()


    if (!domain) throw new AppError("Domain required", 400);

    if (isBlockedDomain(domain)) {
        throw new AppError("This domain is reserved and cannot be used", 403)
    }


    const project = await Project.findOne({ _id: projectId, userId: userId })
    if (!project) throw new AppError('Project not found', 404)


    if (project.plan === 'free') {
        throw new AppError("Custom domains not Applied for free Plan", 403)
    }


    const normalizedDomain = domain.trim().toLowerCase();

    const conflict = await Project.exists({ customDomains: normalizedDomain, _id: { $ne: projectId } })
    if (conflict) throw new AppError("Domain already in use", 409);


    let nginxContainer = null;

    try {
        const isProduction = project_env.NODE_ENV === 'production';

        const localNginxCustomDomainDir = path.join(process.cwd(), 'nginx/custom-domains')
        if (!fs.existsSync(localNginxCustomDomainDir)) {
            fs.mkdirSync(localNginxCustomDomainDir, { recursive: true })
        };

        const nginxCustomDomainDir = isProduction ? '/home/rahul/docker/nginx/custom-domains' : localNginxCustomDomainDir


        const isValid = await isDomainPointingToServer(domain)
        if (!isValid) throw new AppError("Domain is Not Pointing to server", 400);

        const certPath = `${LETSENCRYPT_DIR}/${domain}/fullchain.pem`;
        const existing = fs.existsSync(certPath);

        if (!existing) {

            await checkAndPullImage(docker, `certbot/certbot`);

            const container = await docker.createContainer({
                Image: 'certbot/certbot',
                Cmd: [
                    'certonly',
                    '--webroot',
                    '--webroot-path', '/var/www/html',
                    '--non-interactive',
                    '--agree-tos',
                    '--no-eff-email',
                    '--email', CERTBOT_EMAIL,
                    '--cert-name', domain,
                    '-d', domain,
                ],
                HostConfig: {
                    Binds: [LETSENCRYPT_BIND, NGINX_HTML_BIND],
                    AutoRemove: true,
                    NetworkMode: NETWORK_MODE,
                }
            })

            await container.start()
            const result = await container.wait()
            console.log(result)
            if (result.StatusCode !== 0) return null

            await container.stop();
            await container.remove({ force: true })
        }

        const issuedAt = new Date()
        const expiresAt = new Date(issuedAt)
        expiresAt.setDate(expiresAt.getDate() + 90)
        const nextRenewAt = new Date(expiresAt)
        nextRenewAt.setDate(nextRenewAt.getDate() - 5)

        await SslCertificate.findOneAndUpdate(
            { domain: normalizedDomain },
            {
                $set: {
                    userId: project?.userId,
                    projectId,
                    domain: normalizedDomain,
                    issuedAt: issuedAt.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    nextRenewAt,
                    lastRenewAttempt: new Date(),
                    status: 'active',
                }
            },
            { upsert: true, new: true }
        )

        return { issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString() }

        await checkAndPullImage(docker, `${project_env.DOCKER_USERNAME}/deployhub-static-helper`);

        nginxContainer = await docker.createContainer({
            Image: `${project_env.DOCKER_USERNAME}/deployhub-static-helper`,
            name: `deployhub-nginx-helper-${projectId}-custom-domain`,
            HostConfig: {
                Binds: [`${nginxCustomDomainDir}:/data/nginx/custom-domains`],
                AutoRemove: false,
            },
        });
        await nginxContainer.start();


        const nginxConfig = writeNginxConfig({
            type: project.type === 'static' ? 'static' : 'backend',
            staticPath: project.type === 'static' ? `/data/static/${projectId}` : undefined,
            target: project.type !== 'static' ? `http://host.docker.internal:8081` : undefined,
            domain: `${domain}`,
            sslDomain: `${domain}`,
            outputPath: null,
        });

        await writeNginxFileToHost(nginxContainer, nginxConfig, '/data/nginx/custom-domains', `${domain}.conf`);

        await redis.hset(`deployhub:users:customdomain:${domain}`, {
            port: project.assignedPort,
            projectId: project._id.toString(),
            plan: project.plan,
        });

        if (isProduction) await reloadNginx(docker);

        project.customDomains = [...new Set([...project.customDomains, normalizedDomain])];

        await project.save();

        if (nginxContainer) {
            try {
                const info = await nginxContainer.inspect();
                if (info.State.Running) await nginxContainer.stop({ t: 5 });
            } catch (e) { console.warn(`[custom domain] stop failed: ${e.message}`); }
            try {
                await nginxContainer.remove({ force: true });
            } catch (e) { console.warn(`[custom domain] remove failed: ${e.message}`); }
        }
    } catch (error) {
        if (nginxContainer) {
            try {
                const info = await nginxContainer.inspect();
                if (info.State.Running) await nginxContainer.stop({ t: 5 });
            } catch (e) { console.warn(`[custom domain] stop failed: ${e.message}`); }
            try {
                await nginxContainer.remove({ force: true });
            } catch (e) { console.warn(`[custom domain] remove failed: ${e.message}`); }
        }

        throw error;
    }
}

export const removeCustomDomainService = async (domain, projectId, userId) => {

    const redis = getRedis()

    if (!domain) throw new AppError("Domain required", 400);


    const project = await Project.findOne({ _id: projectId, userId: userId })
    if (!project) throw new AppError('Project not found', 404)

    const normalizedDomain = domain.toLowerCase();
    if (project.customDomains.includes(normalizedDomain)) {
        let nginxContainer = null;
        try {
            const isProduction = project_env.NODE_ENV === 'production';

            const localNginxCustomDomainDir = path.join(process.cwd(), 'nginx/custom-domains')
            if (!fs.existsSync(localNginxCustomDomainDir)) {
                fs.mkdirSync(localNginxCustomDomainDir, { recursive: true })
            };

            const nginxCustomDomainDir = isProduction ? '/home/rahul/docker/nginx/custom-domains' : localNginxCustomDomainDir

            await checkAndPullImage(docker, `${project_env.DOCKER_USERNAME}/deployhub-static-helper`);

            nginxContainer = await docker.createContainer({
                Image: `${project_env.DOCKER_USERNAME}/deployhub-static-helper`,
                name: `deployhub-nginx-helper-${projectId}-custom-domain`,
                HostConfig: {
                    Binds: [`${nginxCustomDomainDir}:/data/nginx/custom-domains`],
                    AutoRemove: false,
                },
            });

            await nginxContainer.start();

            await execInContainer(nginxContainer, ['rm', '-f', `/data/nginx/custom-domains/${normalizedDomain}.conf`]);


            project.customDomains = project.customDomains.filter(d => d !== normalizedDomain);
            await project.save();

            await SslCertificate.findByIdAndDelete({ domain: normalizedDomain });

            if (nginxContainer) {
                try {
                    const info = await nginxContainer.inspect();
                    if (info.State.Running) await nginxContainer.stop();
                } catch (e) { console.warn(`[custom domain] stop failed: ${e.message}`); }
                try {
                    await nginxContainer.remove({ force: true });
                } catch (e) { console.warn(`[custom domain] remove failed: ${e.message}`); }
            }

            if (isProduction) await reloadNginx(docker);

            await redis.del(`deployhub:users:customdomain:${domain}`)
        } catch (error) {
            if (nginxContainer) {
                try {
                    const info = await nginxContainer.inspect();
                    if (info.State.Running) await nginxContainer.stop();
                } catch (e) { console.warn(`[custom domain] stop failed: ${e.message}`); }
                try {
                    await nginxContainer.remove({ force: true });
                } catch (e) { console.warn(`[custom domain] remove failed: ${e.message}`); }
            }
        }

    } else {
        throw new AppError("ye Domain Attach nhi hai , so remove nhi ho sakta")
    }
}
