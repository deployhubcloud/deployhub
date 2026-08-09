import {
    deleteUserForAdmin,
    getUserForAdmin,
    listUsersForAdmin,
    revokeUserSessionsForAdmin,
    updateUserForAdmin,
    userStatsForAdmin,
} from '../services/adminUsers.service.js';

export const listUsersAdminController = async (req, res) => {
    try {
        const data = await listUsersForAdmin(req.query);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const getUserAdminController = async (req, res) => {
    try {
        const data = await getUserForAdmin(req.params.userId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const updateUserAdminController = async (req, res) => {
    try {
        const data = await updateUserForAdmin(req.params.userId, req.body);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const deleteUserAdminController = async (req, res) => {
    try {
        const data = await deleteUserForAdmin(req.params.userId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const revokeSessionsAdminController = async (req, res) => {
    try {
        const data = await revokeUserSessionsForAdmin(req.params.userId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const userStatsAdminController = async (req, res) => {
    try {
        const data = await userStatsForAdmin();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};
