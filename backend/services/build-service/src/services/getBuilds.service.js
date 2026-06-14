import { Build } from "../models/build.model.js"
import { cacheBuildsData, getCahceBuildData } from "../utils/cacheBuildData.js";

export const getBuilds = async (userId) => {

    const builds = await Build.find({ userId }).select('project projectName commitSha status startedAt finishedAt logUrl updatedAt createdAt').lean()

    const formentedBuilds = builds.map((b) => ({
        projectName: b.projectName,
        projectId: b.project,
        commitSha: b.commitSha,
        buildStaus: b.status,
        logsUrl: b.logUrl,
        startedAt: b.startedAt,
        finishedAt: b.finishedAt,
        createdAt: b.createdAt
    }));

    return formentedBuilds;
}

export const getBuildByProjectId = async (projectId) => {

    const cacheData = await getCahceBuildData(projectId);
    if (!cacheData) {

        const buildsData = await Build.find({ project: projectId }).select('commitSha status startedAt finishedAt logUrl createdAt _id').sort({ createdAt: -1 }).lean();
        const formetedBuilds = buildsData.map((b) => ({
            _id: b._id,
            commitSha: b.commitSha,
            status: b.status,
            logsUrl: b.logUrl,
            startedAt: b.startedAt,
            finishedAt: b.finishedAt,
            createdAt: b.createdAt
        }));

        await cacheBuildsData(projectId, formetedBuilds, 60)

        return formetedBuilds;
    }

    return cacheData
}