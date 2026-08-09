import { Router } from 'express';
import {
    deleteUserController,
    getUserController,
    listUsersController,
    updateUserController,
} from '../controllers/users.controller.js';
import { requireAdminSession } from '../middleware/adminSession.js';

const router = Router();

router.use(requireAdminSession);
router.get('/', listUsersController);
router.get('/:userId', getUserController);
router.patch('/:userId', updateUserController);
router.delete('/:userId', deleteUserController);

export default router;
