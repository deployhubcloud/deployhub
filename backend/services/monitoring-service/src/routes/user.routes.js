import express from 'express';
import { getUptimeController } from '../controllers/uptime.controller.js';
import { uptimeValidators } from '../validators/uptime.validators.js';

const router = express.Router();

router.get('/uptime/:projectId', uptimeValidators, getUptimeController);

export default router;
