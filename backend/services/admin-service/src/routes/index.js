import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import projectsRoutes from './projects.routes.js';
import adminsRoutes from './admins.routes.js';
import auditRoutes from './audit.routes.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { requireAdminSession, requirePermission } from '../middleware/adminSession.js';
import { auditNormalAdminMiddleware } from '../middleware/auditLog.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.use('/auth', authRoutes);

router.use(requireAdminSession);
router.use(auditNormalAdminMiddleware);

router.get('/dashboard', requirePermission(PERMISSIONS.DASHBOARD_READ), dashboardController);
router.use('/users', usersRoutes);
router.use('/projects', projectsRoutes);
router.use('/admins', adminsRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
