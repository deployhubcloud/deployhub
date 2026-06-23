import { validationResult } from "express-validator";
import { projectSettings } from "../services/projectSettings.js";

export const projectSettingsController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

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