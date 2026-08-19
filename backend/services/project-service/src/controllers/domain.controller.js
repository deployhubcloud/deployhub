import { validationResult } from 'express-validator';
import {
    addCustomDomainService,
    changeSubdomain,
    getDomainSettings,
    removeCustomDomainService,
    renewCustomDomainService,
} from '../services/domain.service.js';

export const changeSubdomainController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg,
            });
        }

        const projectId = req.params.projectId;
        const { oldSubdomain, newSubdomain } = req.body;
        const userId = req.user._id;

        await changeSubdomain(projectId, oldSubdomain, userId, newSubdomain);

        return res.status(200).json({
            message: 'Success',
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal server Error',
        });
    }
};

export const getDomainSettingsController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg,
            });
        }

        const projectId = req.params.projectId;
        const domainSettings = await getDomainSettings(projectId, req.user._id);

        return res.status(200).json({
            domainSettings,
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal server Error',
        });
    }
};

export const addCustomDomainCOntroller = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg,
            });
        }

        const { domain } = req.body;
        const projectId = req.params.projectId;
        const userId = req.user._id;

        const result = await addCustomDomainService(domain, projectId, userId);

        return res.status(200).json({
            success: true,
            message: 'Domain added successfully',
            data: result,
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal server Error',
        });
    }
};

export const deleteCustomDomainController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg,
            });
        }

        const { domain } = req.body;
        const projectId = req.params.projectId;
        const userId = req.user._id;

        const result = await removeCustomDomainService(domain, projectId, userId);

        return res.status(200).json({
            success: true,
            message: 'Domain removed successfully',
            data: result,
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal server Error',
        });
    }
};

export const renewCustomDomainController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg,
            });
        }

        const { domain } = req.body;
        const projectId = req.params.projectId;
        const userId = req.user._id;

        const result = await renewCustomDomainService(domain, projectId, userId);

        return res.status(200).json({
            success: true,
            message: 'Certificate renewed successfully',
            data: result,
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal server Error',
        });
    }
};
