import { validationResult } from "express-validator";
import {
    getBuildByIdForUser,
    getBuildByProjectId,
    getBuilds,
    getBuildStatsForUser,
    getLatestBuildForUser,
    getLatestBuildIdService,
} from "../services/getBuilds.service.js";

export const getBuildsController = async (req, res) => {
    try {
        const userId = req.user._id;
        const builds = await getBuilds(userId);
        return res.status(200).json({ builds })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

export const getBuildByProjectIdController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const projectId = req.params.projectId;
        const userId = req.user._id;
        const buildData = await getBuildByProjectId(projectId, userId);

        return res.status(200).json({
            data: buildData
        });
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        })
    }
}

export const getBuildByIdController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const build = await getBuildByIdForUser(req.params.buildId, req.user._id);
        return res.status(200).json({ build });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        });
    }
}

export const getLatestBuildController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const build = await getLatestBuildForUser(req.params.projectId, req.user._id);
        return res.status(200).json({ build });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        });
    }
}

export const getBuildStatsController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const stats = await getBuildStatsForUser(req.params.projectId, req.user._id);
        return res.status(200).json({ stats });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal Server Error"
        });
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
