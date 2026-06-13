import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js";

export const getProjects = async (userId) => {

    const projects = await Project.find({ userId })
        .select("name type status version isMicroservice internalUrl subdomain customDomains totalBuilds plan monitor notifications cretedAt updatedAt")
        .sort({ cretedAt: -1 })
        .lean();

    const formetedProject = projects.map((p) => ({
        _id: p._id,
        name: p.name,
        type: p.type,
        version: p.version,
        status: p.status,
        isMicroservice: p?.isMicroservice,
        internalUrl: p?.internalUrl,
        domain: p.customDomains.length > 0 ? p.customDomains : `${p.subdomain}.deployhub.online`,
        totalBuilds: p.totalBuilds,
        plan: p.plan,
        monitorEnabled: p.monitor.enabled,
        notification: {
            discord: p.notifications.discord.enabled,
            telegram: p.notifications.telegram.enabled,
            email: p.notifications.email.enabled
        },
        credtedAt: p.createdAt,
        updatedAt: p.updatedAt
    }));

    return formetedProject

}

export const getProjectMetaService = async (projectId) => {

    const projectData = await Project.findById(projectId).select('plan name').lean();
    if (!projectData) {
        throw new AppError("Invalid ProjectId", 404)
    }

    return {
        name: projectData.name,
        plan: projectData.plan
    }
}