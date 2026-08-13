import { Router } from 'express';
import {
    createAdminController,
    deleteAdminController,
    listAdminsController,
    updateAdminController,
} from '../controllers/admins.controller.js';
import { requirePermission } from '../middleware/adminSession.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.use(requirePermission(PERMISSIONS.ADMINS_MANAGE));

router.get('/', listAdminsController);
router.post('/', createAdminController);
router.patch('/:adminId', updateAdminController);
router.delete('/:adminId', deleteAdminController);

export default router;
