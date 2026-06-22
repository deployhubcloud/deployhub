import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js";
import { getRedis } from '../core/redis/client.js'
import { clearCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";

export const changeSubdomain = (projectId, oldsubDomain, userId, newSubdomain) => {

    const redis = getRedis()

    const existing = await Project.findOne({
        subdomain: newSubdomain
    });

    if (existing) {
        throw new AppError("This subdomain is already taken. Please choose another", 409)
    }

    const project = await Project.findOne({
        _id: projectId,
        userId,
    });

    if (!project) throw new AppError("Project not found", 404);

    project.subdomain = newSubdomain;
    await project.save({ validateBeforeSave: false });

    await clearCacheProjectData(projectId, redis)

    await redis.hset(`deployhub:users:subdomain:${newSubdomain}`, {
        port: assignedPort,
        projectId: project._id.toString(),
        plan: project.plan,
    });

    return true
}

