import {
    deleteProjectForAdmin,
    getProjectForAdmin,
    listProjectsForAdmin,
    updateProjectForAdmin,
} from '../services/adminProjects.service.js';

export const listProjectsAdminController = async (req, res) => {
    try {
        const data = await listProjectsForAdmin(req.query);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const getProjectAdminController = async (req, res) => {
    try {
        const data = await getProjectForAdmin(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const updateProjectAdminController = async (req, res) => {
    try {
        const data = await updateProjectForAdmin(req.params.projectId, req.body);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const deleteProjectAdminController = async (req, res) => {
    try {
        const data = await deleteProjectForAdmin(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};
