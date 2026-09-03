import { Router } from 'express';
import {
    controlUnitController,
    getFleetController,
    getLogsController,
} from '../controllers/system.controller.js';
import { requirePermission } from '../middleware/adminSession.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();
const guard = requirePermission(PERMISSIONS.SYSTEM_MANAGE);

router.get('/', guard, getFleetController);
router.get('/:id/logs', guard, getLogsController);
router.post('/:id/:action', guard, controlUnitController);

export default router;
