import { validationResult } from "express-validator";
import { summaryService } from "../services/summaryService.js";
import { assertUserOwnsProject } from "../../../../shared/utils/assertUserOwnsProject.js";
import { env } from "../lib/env.js";
import axios from 'axios';

async function requireOwnership(req) {
    await assertUserOwnsProject({
        projectServiceUrl: env.PROJECT_SERVICE_URL,
        internalSecret: env.INTERNAL_SECRET,
        talkingSecret: env.INTERNAL_SERVICE_TALKING_SECRET,
        projectId: req.params.projectId,
        userId: req.user._id,
        axiosInstance: axios
    });
}

export const summaryController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        };

        await requireOwnership(req);

        const projectId = req.params.projectId;
        const { requests, error, uniqueVisitors, topCountries, topEndpoints } = await summaryService(projectId)

        return res.status(200).json({
            data: {
                requests,
                error,
                uniqueVisitors,
                topCountries,
                topEndpoints
            }
        })
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal server Error"
        })
    }
}

export const healthScoreController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        await requireOwnership(req);

        const summary = await summaryService(req.params.projectId);
        const req24 = summary.requests.last24h || 0;
        const err5 = summary.error?.['5xx'] || 0;
        const err4 = summary.error?.['4xx'] || 0;

        let score = 100;
        if (req24 > 0) {
            const errRate = (err5 + err4) / req24;
            score = Math.max(0, Math.round(100 - errRate * 100 - err5 * 2));
        } else if (err5 > 0) {
            score = 40;
        }

        let grade = 'A';
        if (score < 90) grade = 'B';
        if (score < 75) grade = 'C';
        if (score < 60) grade = 'D';
        if (score < 40) grade = 'F';

        return res.status(200).json({
            data: {
                projectId: req.params.projectId,
                score,
                grade,
                requests24h: req24,
                errors: summary.error,
                uniqueVisitors: summary.uniqueVisitors,
            },
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || 'Internal Server Error',
        });
    }
};
