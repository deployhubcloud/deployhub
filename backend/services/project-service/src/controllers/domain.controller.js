import { validationResult } from "express-validator";
import { changeSubdomain, getDomainSettings } from "../services/domain.service.js";

export const changeSubdomainController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        const projectId = req.params.projectId;
        const { oldSubdomain, newSubdomain } = req.body
        const userId = req.user._id

        await changeSubdomain(projectId, oldSubdomain, userId, newSubdomain);

        return res.status(200).json({
            message: "Success"
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Internal server Error"
        })
    }
}

export const getDomainSettingsController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        const projectId = req.params.projectId;

        const domainSettings = await getDomainSettings(projectId);

        return res.status(200).json({
            domainSettings
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Internal server Error"
        })
    }
}