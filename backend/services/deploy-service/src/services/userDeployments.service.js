import { Deployment } from '../model/deployment.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { assertUserOwnsProject } from '../../../../shared/utils/assertUserOwnsProject.js';
import { DEPLOY_SERVICE_ENV } from '../lib/env.js';

export const listDeploymentsForUser = async (userId, projectId, { limit = 20 } = {}) => {
    await assertUserOwnsProject({
        projectServiceUrl: DEPLOY_SERVICE_ENV.PROJECT_SERVICE_URL,
        internalSecret: DEPLOY_SERVICE_ENV.INTERNAL_SECRET,
        talkingSecret: DEPLOY_SERVICE_ENV.INTERNAL_SERVICE_TALKING_SECRET,
        projectId,
        userId,
    });

    const lim = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const deployments = await Deployment.find({ project: projectId })
        .select('_id project build status deployedAt containerId createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(lim)
        .lean();

    return {
        projectId,
        count: deployments.length,
        deployments: deployments.map((d) => ({
            id: d._id,
            buildId: d.build,
            status: d.status,
            deployedAt: d.deployedAt,
            containerId: d.containerId ? String(d.containerId).slice(0, 12) : null,
            createdAt: d.createdAt,
        })),
    };
};

export const getLatestDeploymentForUser = async (userId, projectId) => {
    await assertUserOwnsProject({
        projectServiceUrl: DEPLOY_SERVICE_ENV.PROJECT_SERVICE_URL,
        internalSecret: DEPLOY_SERVICE_ENV.INTERNAL_SECRET,
        talkingSecret: DEPLOY_SERVICE_ENV.INTERNAL_SERVICE_TALKING_SECRET,
        projectId,
        userId,
    });

    const d = await Deployment.findOne({ project: projectId })
        .select('_id project build status deployedAt containerId createdAt')
        .sort({ createdAt: -1 })
        .lean();

    if (!d) throw new AppError('No deployments found for this project', 404);

    return {
        id: d._id,
        projectId: d.project,
        buildId: d.build,
        status: d.status,
        deployedAt: d.deployedAt,
        containerId: d.containerId ? String(d.containerId).slice(0, 12) : null,
        createdAt: d.createdAt,
    };
};
