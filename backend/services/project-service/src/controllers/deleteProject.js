import { getRedis } from "../core/redis/client.js";
import { deleteProject } from "../services/projectSettings.js";


export const deleteProjectController = async (req, res) => {
    try {
        const redis = getRedis();

        const { projectId } = req.params;
        const userId = req.user._id;

        const result = await deleteProject(userId, projectId);

        const redisKey = `deployhub:RateLimit:${req.user._id}:service:project:createFreeProject`;
        await redis.decr(redisKey);

        return res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error?.msg || "Internal Server Error"
        })
    }
}