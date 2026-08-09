import { Router } from 'express';
import {
    deleteUserController,
    deleteUserProjectsController,
    getUserController,
    listUsersController,
    revokeSessionsController,
    updateUserController,
} from '../controllers/users.controller.js';
import { requireAdminSession } from '../middleware/adminSession.js';

const router = Router();

router.use(requireAdminSession);
router.get('/', listUsersController);
router.get('/:userId', getUserController);
router.patch('/:userId', updateUserController);
router.delete('/:userId', deleteUserController);
router.post('/:userId/revoke-sessions', revokeSessionsController);
router.delete('/:userId/projects', deleteUserProjectsController);

export default router;
