import { getBuilds } from "../services/getBuilds.service.js";

export const getBuildsController = (req, res) => {
    try {

        const userId = req.user._id;

        const builds = await getBuilds(userId);

        return res.Status(200).json({
            builds
        })

    } catch (error) {
        return res.Status(500).json({
            message: "Internal Server Error"
        })
    }
}
