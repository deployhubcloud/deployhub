import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js";
import { subdomainChangeQueue } from "../utils/queues.js";


export const changeSubdomain = (projectId, oldsubDomain, userId, newSubdomain) => {

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

    
    await subdomainChangeQueue.add('subdomain-change', {
        projectId,
        userId,
        oldSubdomain: oldSubdomainSaved,
        newSubdomain,
        projectType: project.type,
        assignedPort: project.assignedPort,
    });

    return project
}

