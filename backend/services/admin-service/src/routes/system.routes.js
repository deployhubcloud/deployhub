import { Router } from 'express';
import { controlUnitController, getFleetController } from '../controllers/system.controller.js';
import { requirePermission } from '../middleware/adminSession.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.get('/', requirePermission(PERMISSIONS.SYSTEM_MANAGE), getFleetController);
router.post(
    '/:id/:action',
    requirePermission(PERMISSIONS.SYSTEM_MANAGE),
    controlUnitController
);

export default router;
