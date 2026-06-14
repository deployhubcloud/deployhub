export const publishProjectStatus = async (redis, streamKey, payload) => {

    const { projectId, status } = payload;

    await redis.xadd(
        `project:status:${projectId}`,
        "*",
        "projectId",
        String(projectId),
        "status",
        String(status),
        "timestamp",
        String(Date.now())
    );
};