import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import projectsRoutes from './projects.routes.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { requireAdminSession } from '../middleware/adminSession.js';

const router = Router();

router.use('/auth', authRoutes);
router.get('/dashboard', requireAdminSession, dashboardController);
router.use('/users', usersRoutes);
router.use('/projects', projectsRoutes);

export default router;
