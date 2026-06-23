import { projectSettings } from "../services/projectSettings.js";

export const projectSettingsController = async (req, res) => {
    try {

        const projectId = req.params.projectId;


        const settings = await projectSettings(projectId);

        return res.status(200).json({
            settings
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Internal Server Error"
        })
    }
}