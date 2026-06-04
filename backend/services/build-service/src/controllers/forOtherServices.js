import { fetchBuildForOtherService } from "../services/forOtherServices.js";

export const fetchBuildDataByIdForOtherServiceControllers = async (req, res) => {
    try {

        const buildId = req.params.buildId;

        const buildData = await fetchBuildForOtherService(buildId);
        if (!buildData) {
            return res.status(404).json({
                message: "Invalid buildId"
            })
        }

        return buildData;

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}   