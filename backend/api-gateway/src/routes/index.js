import express from 'express';
import authRoutes from './v1/auth.routes.js';
import projectRoutes from './v1/project.route.js';
import monitoringRoutes from './v1/monitoring.routes.js';

const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/project', projectRoutes)
router.use('/v1/monitoring', monitoringRoutes);

export default router;