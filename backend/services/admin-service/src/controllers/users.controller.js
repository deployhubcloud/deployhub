import * as usersService from '../services/users.service.js';

export const listUsersController = async (req, res) => {
    try {
        const { page, limit, q } = req.query;
        const data = await usersService.listUsers({ page, limit, q });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to list users',
        });
    }
};

export const getUserController = async (req, res) => {
    try {
        const data = await usersService.getUser(req.params.userId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to get user',
        });
    }
};

export const updateUserController = async (req, res) => {
    try {
        const data = await usersService.updateUser(req.params.userId, req.body);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to update user',
        });
    }
};

export const deleteUserController = async (req, res) => {
    try {
        const data = await usersService.deleteUser(req.params.userId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to delete user',
        });
    }
};
