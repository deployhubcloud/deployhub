import {
    createAdmin,
    deleteAdmin,
    listAdmins,
    updateAdmin,
} from '../services/admins.service.js';
import { listAuditLogs } from '../middleware/auditLog.js';

export const listAdminsController = async (req, res) => {
    try {
        const data = await listAdmins();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Failed to list admins',
        });
    }
};

export const createAdminController = async (req, res) => {
    try {
        const { username, password, email } = req.body || {};
        const data = await createAdmin({
            username,
            password,
            email,
            createdBy: req.adminSession?.username || req.adminSession?.adminId,
        });
        return res.status(201).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Failed to create admin',
        });
    }
};

export const updateAdminController = async (req, res) => {
    try {
        const data = await updateAdmin(req.params.adminId, req.body || {});
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Failed to update admin',
        });
    }
};

export const deleteAdminController = async (req, res) => {
    try {
        const data = await deleteAdmin(req.params.adminId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Failed to delete admin',
        });
    }
};

export const listAuditLogsController = async (req, res) => {
    try {
        const data = await listAuditLogs(req.query || {});
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Failed to load audit logs',
        });
    }
};
