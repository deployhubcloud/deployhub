import { Router } from 'express';
import {
    deleteBuildController,
    deleteDeploymentController,
    deleteProjectBuildsController,
    deleteProjectController,
    deleteProjectDeploymentsController,
    getProjectController,
    listProjectsController,
    purgeProjectCacheController,
    updateProjectController,
} from '../controllers/projects.controller.js';
import { requirePermission } from '../middleware/adminSession.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.use(requirePermission(PERMISSIONS.PROJECTS_READ));

router.get('/', listProjectsController);
router.delete(
    '/builds/:buildId',
    requirePermission(PERMISSIONS.PROJECTS_WRITE),
    deleteBuildController
);
router.delete(
    '/deployments/:deploymentId',
    requirePermission(PERMISSIONS.PROJECTS_WRITE),
    deleteDeploymentController
);
router.get('/:projectId', getProjectController);
router.patch(
    '/:projectId',
    requirePermission(PERMISSIONS.PROJECTS_WRITE),
    updateProjectController
);
router.delete(
    '/:projectId',
    requirePermission(PERMISSIONS.PROJECTS_WRITE),
    deleteProjectController
);
router.post(
    '/:projectId/purge-cache',
    requirePermission(PERMISSIONS.PROJECTS_WRITE),
    purgeProjectCacheController
);
router.delete(
    '/:projectId/builds',
    requirePermission(PERMISSIONS.PROJECTS_WRITE),
    deleteProjectBuildsController
);
router.delete(
    '/:projectId/deployments',
    requirePermission(PERMISSIONS.PROJECTS_WRITE),
    deleteProjectDeploymentsController
);

export default router;
