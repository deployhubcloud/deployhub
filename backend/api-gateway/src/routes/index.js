import express from 'express';
import authRoutes from './v1/auth.routes.js';
import projectRoutes from './v1/project.route.js';
import buildRoutes from './v1/Build.routes.js';
import analyticsRoutes from './v1/analytics.route.js'
import adminRoutes from './v1/admin.routes.js'
import agentRoutes from './v1/agent.routes.js'

const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/project', projectRoutes)
router.use('/v1/build', buildRoutes);
router.use('/v1/analytics', analyticsRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/agent', agentRoutes);

export default router;
