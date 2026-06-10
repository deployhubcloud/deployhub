import { getBuilds } from "../services/getBuilds.service.js";

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
