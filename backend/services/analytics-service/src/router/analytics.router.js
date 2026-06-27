import express from 'express';
import { summaryValidators } from '../validators/summary.validator.js';
import { summaryController } from '../controllers/analytics.controller.js';

const analyticsRouter = express.Router()

analyticsRouter.get('/summary/:projectId', summaryValidators, summaryController)

export default analyticsRouter