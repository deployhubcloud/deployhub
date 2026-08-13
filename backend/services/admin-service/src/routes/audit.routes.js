import { Router } from 'express';
import { listAuditLogsController } from '../controllers/admins.controller.js';
import { requirePermission } from '../middleware/adminSession.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.use(requirePermission(PERMISSIONS.AUDIT_READ));

router.get('/', listAuditLogsController);

export default router;
