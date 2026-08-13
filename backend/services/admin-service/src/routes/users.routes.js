import { Router } from 'express';
import {
    deleteUserController,
    deleteUserProjectsController,
    getUserController,
    listUsersController,
    revokeSessionsController,
    updateUserController,
} from '../controllers/users.controller.js';
import { requirePermission } from '../middleware/adminSession.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.get('/', requirePermission(PERMISSIONS.USERS_READ), listUsersController);
router.get('/:userId', requirePermission(PERMISSIONS.USERS_READ), getUserController);
router.patch('/:userId', requirePermission(PERMISSIONS.USERS_WRITE), updateUserController);
router.delete('/:userId', requirePermission(PERMISSIONS.USERS_WRITE), deleteUserController);
router.post(
    '/:userId/revoke-sessions',
    requirePermission(PERMISSIONS.USERS_WRITE),
    revokeSessionsController
);
router.delete(
    '/:userId/projects',
    requirePermission(PERMISSIONS.USERS_WRITE),
    deleteUserProjectsController
);

export default router;
