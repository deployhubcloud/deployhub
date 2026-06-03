import express from 'express';
import { createProject } from '../controllers/createProject.js';
import { paymentInitController, paymentVerifyController } from '../controllers/payment.controller.js';
import { createProjectValidator, paymentInitValidator, paymentVerifyValidator } from '../validators/createProject.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { project_env } from '../lib/env.js';
import { getProjectByIdController } from '../controllers/forOtherService.js';

const projectRouter = express.Router();

projectRouter.post('/projects', createProjectValidator, createProject);
projectRouter.post('/payment/init', paymentInitValidator, paymentInitController);
projectRouter.post('/payment/verify', paymentVerifyValidator, paymentVerifyController);
projectRouter.get('/for-other-service/:projectId', internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET }), getProjectByIdController);


export default projectRouter;
