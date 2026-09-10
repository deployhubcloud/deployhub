import * as projectsService from '../services/projects.service.js';

export const listProjectHistoryController = (type) => async (req, res) => {
    try {
        return res.status(200).json(await projectsService.listProjectHistory(req.params.projectId, type, req.query));
    } catch (error) {
        return res.status(error.response?.status || error.status || 500).json({ message: error.response?.data?.message || error.message || 'Failed to load project history' });
    }
};

export const listProjectsController = async (req, res) => {
    try {
        const data = await projectsService.listProjects(req.query);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to list projects',
        });
    }
};

export const getProjectController = async (req, res) => {
    try {
        const data = await projectsService.getProjectDeep(req.params.projectId, { fresh: req.query.fresh === '1' });
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

export const purgeProjectCacheController = async (req, res) => {
    try {
        const data = await projectsService.purgeProjectCache(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to purge cache',
        });
    }
};

export const deleteProjectBuildsController = async (req, res) => {
    try {
        const data = await projectsService.deleteProjectBuilds(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to delete builds',
        });
    }
};

export const deleteProjectDeploymentsController = async (req, res) => {
    try {
        const data = await projectsService.deleteProjectDeployments(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to delete deployments',
        });
    }
};

export const deleteBuildController = async (req, res) => {
    try {
        const data = await projectsService.deleteBuild(req.params.buildId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to delete build',
        });
    }
};

export const deleteDeploymentController = async (req, res) => {
    try {
        const data = await projectsService.deleteDeployment(req.params.deploymentId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || error.message || 'Failed to delete deployment',
        });
    }
};
