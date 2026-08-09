import { Router } from 'express';
import {
    deleteProjectController,
    getProjectController,
    listProjectsController,
    updateProjectController,
} from '../controllers/projects.controller.js';
import { requireAdminSession } from '../middleware/adminSession.js';

const router = Router();

router.use(requireAdminSession);
router.get('/', listProjectsController);
router.get('/:projectId', getProjectController);
router.patch('/:projectId', updateProjectController);
router.delete('/:projectId', deleteProjectController);

export default router;
