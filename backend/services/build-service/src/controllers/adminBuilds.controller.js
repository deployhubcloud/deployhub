import {
    buildStatsForAdmin,
    deleteBuildByIdAdmin,
    deleteBuildsForProjectAdmin,
    listBuildsForAdmin,
} from '../services/adminBuilds.service.js';

export const listBuildsAdminController = async (req, res) => {
    try {
        const data = await listBuildsForAdmin(req.query);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const deleteProjectBuildsAdminController = async (req, res) => {
    try {
        const data = await deleteBuildsForProjectAdmin(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const deleteBuildAdminController = async (req, res) => {
    try {
        const data = await deleteBuildByIdAdmin(req.params.buildId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const buildStatsAdminController = async (req, res) => {
    try {
        const data = await buildStatsForAdmin();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};
