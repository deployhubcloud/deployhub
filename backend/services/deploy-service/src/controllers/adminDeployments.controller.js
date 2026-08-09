import {
    deleteDeploymentByIdAdmin,
    deleteDeploymentsForProjectAdmin,
    deploymentStatsForAdmin,
    listDeploymentsForAdmin,
} from '../services/adminDeployments.service.js';

export const listDeploymentsAdminController = async (req, res) => {
    try {
        const data = await listDeploymentsForAdmin(req.query);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const deleteProjectDeploymentsAdminController = async (req, res) => {
    try {
        const data = await deleteDeploymentsForProjectAdmin(req.params.projectId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const deleteDeploymentAdminController = async (req, res) => {
    try {
        const data = await deleteDeploymentByIdAdmin(req.params.deploymentId);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};

export const deploymentStatsAdminController = async (req, res) => {
    try {
        const data = await deploymentStatsForAdmin();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.msg || error.message });
    }
};
