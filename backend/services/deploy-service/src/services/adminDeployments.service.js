import { Deployment } from '../model/deployment.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';

export const listDeploymentsForAdmin = async ({ projectId, page = 1, limit = 50 } = {}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (projectId) filter.project = projectId;

    const [deployments, total] = await Promise.all([
        Deployment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Deployment.countDocuments(filter),
    ]);

    return {
        deployments,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum) || 1,
        },
    };
};

export const deleteDeploymentsForProjectAdmin = async (projectId) => {
    const result = await Deployment.deleteMany({ project: projectId });
    return { deletedCount: result.deletedCount, projectId };
};

export const deleteDeploymentByIdAdmin = async (deploymentId) => {
    const deployment = await Deployment.findByIdAndDelete(deploymentId);
    if (!deployment) throw new AppError('Deployment not found', 404);
    return { message: 'Deployment deleted', deploymentId };
};

export const deploymentStatsForAdmin = async () => {
    const [total, byStatus] = await Promise.all([
        Deployment.countDocuments(),
        Deployment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    return {
        total,
        byStatus: Object.fromEntries(byStatus.map((x) => [x._id || 'unknown', x.count])),
    };
};
