import express from 'express';
import authRoutes from './v1/auth.routes.js';
import projectRoutes from './v1/project.route.js';
import buildRoutes from './v1/Build.routes.js';
import analyticsRoutes from './v1/analytics.route.js'

const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/project', projectRoutes)
router.use('/v1/build', buildRoutes);
router.use('/v1/analytics', analyticsRoutes);

export default router;