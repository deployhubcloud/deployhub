import { validationResult } from 'express-validator';
import {
    getLatestDeploymentForUser,
    listDeploymentsForUser,
} from '../services/userDeployments.service.js';

export const listDeploymentsController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const data = await listDeploymentsForUser(req.user._id, req.params.projectId, {
            limit: req.query.limit,
        });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal Server Error',
        });
    }
};

export const latestDeploymentController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const deployment = await getLatestDeploymentForUser(req.user._id, req.params.projectId);
        return res.status(200).json({ deployment });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal Server Error',
        });
    }
};
