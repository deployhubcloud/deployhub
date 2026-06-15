export const publishProjectStatus = async (redis, payload) => {

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

    await redis.publish('project:status:updates', JSON.stringify({ projectId: String(projectId), status: String(status) }))
};