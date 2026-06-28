import { getBuildByProjectId, getBuilds, getLatestBuildIdService } from "../services/getBuilds.service.js";

export const getBuildsController = async (req, res) => {
    try {

        const userId = req.user._id;

        const builds = await getBuilds(userId);

        return res.status(200).json({
            builds
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}


export const getBuildByProjectIdController = async (req, res) => {
    try {

        const projectId = req.params.projectId;

        const buildData = await getBuildByProjectId(projectId);

        return res.status(200).json({
            data: buildData
        });

    } catch (error) {
        res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}


export const getLatestBuildIdController = async (req, res) => {
    try {

        const projectId = req.params.projectId;

        const buildId = await getLatestBuildIdService(projectId);

        return res.status(200).json({
            buildId
        })

    } catch (error) {
        res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}
