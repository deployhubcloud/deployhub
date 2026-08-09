import * as projectsService from '../services/projects.service.js';

export const listProjectsController = async (req, res) => {
    try {
        const { userId, page, limit, q } = req.query;
        const data = await projectsService.listProjects({ userId, page, limit, q });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to list projects',
        });
    }
};

export const getProjectController = async (req, res) => {
    try {
        const data = await projectsService.getProject(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to get project',
        });
    }
};

export const updateProjectController = async (req, res) => {
    try {
        const data = await projectsService.updateProject(req.params.projectId, req.body);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to update project',
        });
    }
};

export const deleteProjectController = async (req, res) => {
    try {
        const data = await projectsService.deleteProject(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to delete project',
        });
    }
};
