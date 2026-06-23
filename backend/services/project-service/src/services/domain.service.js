import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js";
import { getRedis } from '../core/redis/client.js'
import { clearCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";
import { subdomainChangeQueue } from "../utils/queues.js";

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
