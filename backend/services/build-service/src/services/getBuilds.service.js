import { Build } from "../models/build.model.js"

export const getBuilds = async (userid) => {

    const builds = await Build.find({ userId }).select('project projectName commitSha status startedAt finishedAt logUrl updatedAt createdAt');

    const formentedBuilds = builds.map((b) => ({
        projectName: b.projectName,
        projectId: b.project,
        commitSha: b.commitSha,
        buildStaus: b.status,
        logsUrl: b.logsUrl,
        startedAt: b.startedAt,
        finishedAt: b.finishedAt,
        createdAt: b.createdAt
    }));

    return formentedBuilds;
}