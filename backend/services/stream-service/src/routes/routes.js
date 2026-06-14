import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { streamProjectStatusController } from '../controllers/streamProjectStatusController.js';


const router = express.Router();


router.get('/projects/:projectId/status', verifyJWT, streamProjectStatusController)

export default router;