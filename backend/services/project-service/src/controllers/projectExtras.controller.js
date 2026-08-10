import { validationResult } from 'express-validator';
import {
    getEnvKeysOnly,
    getProjectLiveStatus,
    mergeEnvSettings,
} from '../services/projectExtras.service.js';

export const getProjectLiveStatusController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const data = await getProjectLiveStatus(req.user._id, req.params.projectId);
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || 'Internal Server Error',
        });
    }
};

export const getEnvKeysController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const data = await getEnvKeysOnly(req.user._id, req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || 'Internal Server Error',
        });
    }
};

export const mergeEnvSettingsController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const result = await mergeEnvSettings(req.user._id, req.params.projectId, {
            patch: req.body.patch,
            removeKeys: req.body.removeKeys || [],
        });
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || 'Internal Server Error',
        });
    }
};
