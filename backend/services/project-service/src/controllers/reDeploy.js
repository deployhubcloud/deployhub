import { clearCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";
import { getRedis } from "../core/redis/client.js";
import { reDeployment } from "../services/redeploy.service.js";

export const reDeployController = async (req, res) => {
    try {

        const redis = getRedis()

        const projectId = req.params.projectId;

        await reDeployment(projectId);

        await clearCacheProjectData(projectId, redis)

        return res.status(200).json({
            message: "Redeployment in queue"
        });

    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || "Internal Server Error"
        })
    }
}