import express from 'express';
import {
    latestDeploymentController,
    listDeploymentsController,
} from '../controllers/userDeployments.controller.js';
import {
    projectDeploymentsValidators,
    projectIdParam,
} from '../validators/userDeployments.validators.js';

const router = express.Router();

router.get(
    '/deployments/project/:projectId',
    projectDeploymentsValidators,
    listDeploymentsController
);
router.get(
    '/deployments/project/:projectId/latest',
    projectIdParam,
    latestDeploymentController
);

export default router;
