import { AppError } from "../../../../shared/errors/AppError.js";
import { getBuildDataById } from "../../../../shared/utils/getBuildDataById.js";
import { Project } from "../models/project.model.js";
import axios from 'axios';
import { project_env } from "../lib/env.js"
import { cacheProjectData, getCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";
import { getRedis } from "../core/redis/client.js";

export const getProjects = async (userId) => {

    const projects = await Project.find({ userId, status: { $ne: 'deleted' } })
        .select("name type status version isMicroservice internalUrl subdomain customDomains totalBuilds plan monitor notifications cretedAt updatedAt")
        .sort({ createdAt: -1 })
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


    const redis = getRedis()

    const raw = await redis.get(`deployhub:users:project:${projectId}:meta`)
    if (!raw) {
        const projectData = await Project.findById({ _id: projectId, $ne: { status: 'deleted' } }).select('plan name type').lean();
        if (!projectData) {
            throw new AppError("Invalid ProjectId", 404)
        }

        await redis.set(`deployhub:users:project:${projectId}:meta`, JSON.stringify(projectData));

        return {
            name: projectData.name,
            plan: projectData.plan,
            type: projectData.type
        }
    }

    const userProjectMetaData = JSON.parse(raw)

    return {
        name: userProjectMetaData.name,
        plan: userProjectMetaData.plan,
        type: userProjectMetaData.type
    }
}

export const getProjectDataByIdService = async (projectId) => {

    const redis = getRedis()

    const cacheData = await getCacheProjectData(projectId, redis);
    if (!cacheData) {

        const projectData = await Project.findById({
            _id: projectId,
            $ne: { status: 'deleted' }
        }).select('name type version status isMicroservice repoUrl branch buildCommand startCommand internalUrl subdomain customDomains monitor notifications buildId totalBuilds').lean();


        if (!projectData) {
            throw new AppError("Invalid ProjectId", 404)
        }

        const domain = projectData?.customDomains.length > 0 ? projectData.customDomains : `${projectData.subdomain}.deployhub.online`;

        const buildData = await getBuildDataById(axios, projectData.buildId, project_env.BUILD_SERVICE_URL, project_env.INTERNAL_SECRET, project_env.INTERNAL_SERVICE_TALKING_SECRET);

        const timeTakenSeconds = Math.floor((new Date(buildData.finishedAt) - new Date(buildData.startedAt)) / 1000);


        const enabledNotification = {
            discord: projectData.notifications.discord.enabled,
            telegram: projectData.notifications.telegram.enabled,
            email: projectData.notifications.email.enabled,
        };

        const formetedProjectData = {
            name: projectData.name,
            type: projectData.type,
            version: projectData.version,
            stats: projectData.status,
            domain: domain,
            isMicroservice: projectData.isMicroservice,
            repoUrl: projectData.repoUrl,
            branch: projectData.branch,
            buildCommand: projectData.buildCommand,
            startCommand: projectData.startCommand,
            internalUrl: projectData.internalUrl,
            monitorEnabled: projectData.monitor.enabled,
            monitorIntervalSeconds: projectData.monitor.intervalSeconds,
            monitorHealthPath: projectData.monitor.healthPath,
            notifications: enabledNotification,
            latestBuildData: {
                commitSha: buildData.commitSha,
                status: buildData.status,
                timeTaken: timeTakenSeconds,
                createdAt: buildData.createdAt
            },
            totalBuilds: projectData.totalBuilds
        }

        await cacheProjectData(projectData._id, redis, formetedProjectData, 60)

        return formetedProjectData;
    }

    return cacheData;
}