import { Build } from "../models/build.model.js"
import { cacheBuildsData, getCahceBuildData } from "../utils/cacheBuildData.js";
import { AppError } from "../../../../shared/errors/AppError.js"

export const getBuilds = async (userId) => {
    const builds = await Build.find({ userId })
        .select('project projectName commitSha status startedAt finishedAt logUrl updatedAt createdAt _id')
        .sort({ createdAt: -1 })
        .lean()

    return builds.map((b) => ({
        _id: b._id,
        projectName: b.projectName,
        projectId: b.project,
        commitSha: b.commitSha,
        buildStaus: b.status,
        status: b.status,
        logsUrl: b.logUrl,
        startedAt: b.startedAt,
        finishedAt: b.finishedAt,
        createdAt: b.createdAt
    }));
}

/** Only returns builds that belong to this user for the project. */
export const getBuildByProjectId = async (projectId, userId) => {
    const cacheKeySuffix = `${projectId}:${userId}`;
    const cacheData = await getCahceBuildData(cacheKeySuffix);
    if (!cacheData) {
        const buildsData = await Build.find({ project: projectId, userId })
            .select('commitSha status startedAt finishedAt logUrl createdAt _id')
            .sort({ createdAt: -1 })
            .lean();

        const formetedBuilds = buildsData.map((b) => ({
            _id: b._id,
            commitSha: b.commitSha,
            status: b.status,
            logsUrl: b.logUrl,
            startedAt: b.startedAt,
            finishedAt: b.finishedAt,
            createdAt: b.createdAt
        }));

        await cacheBuildsData(cacheKeySuffix, formetedBuilds, 60)
        return formetedBuilds;
    }

    return cacheData
}

export const getBuildByIdForUser = async (buildId, userId) => {
    const build = await Build.findOne({ _id: buildId, userId })
        .select('_id project projectName commitSha status startedAt finishedAt logUrl dockerImage createdAt updatedAt')
        .lean();

    if (!build) {
        throw new AppError('Build not found', 404);
    }

    return {
        _id: build._id,
        projectId: build.project,
        projectName: build.projectName,
        commitSha: build.commitSha,
        status: build.status,
        logsUrl: build.logUrl,
        dockerImage: build.dockerImage,
        startedAt: build.startedAt,
        finishedAt: build.finishedAt,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt,
    };
}

export const getLatestBuildForUser = async (projectId, userId) => {
    const build = await Build.findOne({ project: projectId, userId })
        .select('_id project projectName commitSha status startedAt finishedAt logUrl createdAt')
        .sort({ createdAt: -1 })
        .lean();

    if (!build) {
        throw new AppError('No builds found for this project', 404);
    }

    return {
        _id: build._id,
        projectId: build.project,
        projectName: build.projectName,
        commitSha: build.commitSha,
        status: build.status,
        logsUrl: build.logUrl,
        startedAt: build.startedAt,
        finishedAt: build.finishedAt,
        createdAt: build.createdAt,
    };
}

export const getBuildStatsForUser = async (projectId, userId) => {
    const owned = await Build.findOne({ project: projectId, userId }).select('_id').lean();
    if (!owned) {
        // Distinguish empty project vs not owned: if any builds exist for project without user → 404
        const any = await Build.findOne({ project: projectId }).select('_id').lean();
        if (any) throw new AppError('Build not found', 404);
        return {
            projectId,
            total: 0,
            success: 0,
            failed: 0,
            pending: 0,
        };
    }

    const [total, success, failed, pending] = await Promise.all([
        Build.countDocuments({ project: projectId, userId }),
        Build.countDocuments({ project: projectId, userId, status: 'success' }),
        Build.countDocuments({ project: projectId, userId, status: 'failed' }),
        Build.countDocuments({ project: projectId, userId, status: 'pending' }),
    ]);

    return { projectId, total, success, failed, pending };
}

export const getLatestBuildIdService = async (projectId) => {
    const latestBuildId = await Build.findOne({ project: projectId })
        .select('_id')
        .sort({ createdAt: -1 })
        .lean();
    if (!latestBuildId) {
        throw new AppError('invalid ProjectId', 404)
    }
    return latestBuildId;
}
