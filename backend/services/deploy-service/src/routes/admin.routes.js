import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { DEPLOY_SERVICE_ENV } from '../lib/env.js';
import {
    deleteDeploymentAdminController,
    deleteProjectDeploymentsAdminController,
    deploymentStatsAdminController,
    listDeploymentsAdminController,
} from '../controllers/adminDeployments.controller.js';

const router = express.Router();
const adminInternal = internalApiCallMiddleware({ secret: DEPLOY_SERVICE_ENV.INTERNAL_SERVICE_TALKING_SECRET });

router.get('/stats', adminInternal, deploymentStatsAdminController);
router.get('/deployments', adminInternal, listDeploymentsAdminController);
router.delete('/deployments/:deploymentId', adminInternal, deleteDeploymentAdminController);
router.delete('/projects/:projectId/deployments', adminInternal, deleteProjectDeploymentsAdminController);

export default router;
