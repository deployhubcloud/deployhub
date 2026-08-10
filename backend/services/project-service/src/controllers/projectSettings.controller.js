import { validationResult } from "express-validator";
import { projectSettings, updateEnvSettingsServices, updateBuildandStartSettings, updateHealthMonitoringAndNotification } from "../services/projectSettings.js";

export const projectSettingsController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        const projectId = req.params.projectId;


        const settings = await projectSettings(projectId, req.user._id);

        return res.status(200).json({
            settings
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}


export const updateEnvSettingsController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        await updateEnvSettingsServices(req.user._id, req.params.projectId, req.body)

        return res.status(200).json({
            success: true
        })
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}


export const updateBuildandStartSettingsController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        await updateBuildandStartSettings(req.user._id, req.params.projectId, req.body)

        return res.status(200).json({
            success: true
        })
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}


export const updateHealthMonitoringAndNotificationController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        await updateHealthMonitoringAndNotification(req.user._id, req.params.projectId, req.body)

        return res.status(200).json({
            success: true
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}