import express from 'express';
import { summaryValidators } from '../validators/summary.validator.js';
import { healthScoreController, summaryController } from '../controllers/analytics.controller.js';

const analyticsRouter = express.Router()

analyticsRouter.get('/summary/:projectId', summaryValidators, summaryController)
analyticsRouter.get('/health-score/:projectId', summaryValidators, healthScoreController)

export default analyticsRouter
