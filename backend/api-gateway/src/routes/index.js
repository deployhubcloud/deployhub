import express from 'express';
import authRoutes from './v1/auth.routes.js';
import projectRoutes from './v1/project.route.js';

const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/project', projectRoutes)

export default router;