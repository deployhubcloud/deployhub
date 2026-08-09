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
import { requireAdminSession } from '../middleware/adminSession.js';

const router = Router();

router.use(requireAdminSession);
router.get('/', listProjectsController);
router.delete('/builds/:buildId', deleteBuildController);
router.delete('/deployments/:deploymentId', deleteDeploymentController);
router.get('/:projectId', getProjectController);
router.patch('/:projectId', updateProjectController);
router.delete('/:projectId', deleteProjectController);
router.post('/:projectId/purge-cache', purgeProjectCacheController);
router.delete('/:projectId/builds', deleteProjectBuildsController);
router.delete('/:projectId/deployments', deleteProjectDeploymentsController);

export default router;
