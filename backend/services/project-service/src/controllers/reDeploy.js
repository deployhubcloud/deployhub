import { clearCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";
import { publishProjectStatus } from "../../../../shared/utils/publishProjectStatus.js";
import { getRedis } from "../core/redis/client.js";
import { reDeployment } from "../services/redeploy.service.js";
import { deleteCacheBuildData } from "../utils/cache/deleteCacheBuildData.js";

export const reDeployController = async (req, res) => {
    try {

        const redis = getRedis()

        const projectId = req.params.projectId;

        await reDeployment(projectId);


        await deleteCacheBuildData(projectId);
        await clearCacheProjectData(projectId, redis)
        await publishProjectStatus(redis, { projectId: projectId, status: 'queued' })

        return res.status(200).json({
            message: "Redeployment in queue"
        });

    } catch (error) {
        res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}