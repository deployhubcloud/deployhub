import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js";
import { getRedis } from '../core/redis/client.js'
import { clearCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";
import { subdomainChangeQueue } from "../utils/queues.js";
import { isBlockedDomain } from "../utils/blockedDomains.js";
import { writeNginxConfig } from "../../../../shared/nginx/writeNginx.js";
import { execInContainer } from "../utils/execInContainer.js";
import { generateCertificate } from "../utils/sslUtils.js";
import { project_env } from "../lib/env.js";
import path from 'path';
import fs from 'fs';
import { writeNginxFileToHost } from "../utils/nginx/writeNginxFileToHost.js";


export const changeSubdomain = async (projectId, oldsubDomain, userId, newSubdomain) => {

    const redis = getRedis()

    console.log()
    const existing = await Project.exists({
        subdomain: newSubdomain
    })

    console.log(existing)

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

    project.subdomain = newSubdomain;
    await project.save({ validateBeforeSave: false });

    await clearCacheProjectData(projectId, redis)

    await subdomainChangeQueue.add('subdomain-change', {
        projectId,
        userId,
        oldSubdomain: oldsubDomain,
        newSubdomain,
        projectType: project.type,
        assignedPort: project.assignedPort,
    });

    await redis.hset(`deployhub:users:subdomain:${newSubdomain}`, {
        port: project.assignedPort,
        projectId: project._id.toString(),
        plan: project.plan,
    });

    return true
}


export const getDomainSettings = async (projectId) => {
    const domainSettings = await Project.findById(projectId).select("subdomain customDomains internalUrl isMicroservice plan").lean();

    if (!domainSettings) {
        throw new AppError("Invalid Project id or Project not Found", 404)
    }

    return domainSettings

}


export const addCustomDomainService = async (domain, projectId, userId) => {
    console.log(domain, projectId, userId)
    if (!domain) throw new AppError("Domain required", 400);

    if (isBlockedDomain(domain)) {
        throw new AppError("This domain is reserved and cannot be used", 403)
    }


    const project = await Project.findOne({ _id: projectId, userId: userId })
    if (!project) throw new AppError('Project not found', 404)


    if (project.plan === 'free') {
        throw new AppError("Custom domains not Applied for free Plan", 403)
    }


    const conflict = await Project.findOne({ customDomains: domain, _id: { $ne: projectId } })
    if (conflict) throw new AppError("Domain already in use", 409);


    let nginxContainer = null;

    try {
        const isProduction = project_env.NODE_ENV === 'production';

        const localNginxCustomDomainDir = path.join(process.cwd(), 'nginx/custom-domains')
        if (!fs.existsSync(localNginxCustomDomainDir)) {
            fs.mkdirSync(localNginxCustomDomainDir, { recursive: true })
        };

        const nginxCustomDomainDir = isProduction ? '/home/rahul/docker/nginx/custom-domains' : localNginxCustomDomainDir

        const result = await generateCertificate(domain, projectId);
        if (!result) {
            throw new AppError("Error While Generating Your SSl Certificated, please check Domain is not pointing to this server", 400)
        }

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
            type: projectType === 'static' ? 'static' : 'backend',
            staticPath: projectType === 'static' ? `/data/static/${projectId}` : undefined,
            target: projectType !== 'static' ? `http://host.docker.internal:8081` : undefined,
            domain: `${domain}`,
            sslDomain: `${domain}`,
            outputPath: null,
        });

        await writeNginxFileToHost(nginxContainer, nginxConfig, '/data/nginx/custom-domains', `${domain}.conf`);
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
