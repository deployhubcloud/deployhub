import express from 'express';
import { createProject } from '../controllers/createProject.js';
import { paymentInitController, paymentVerifyController } from '../controllers/payment.controller.js';
import { createProjectValidator, paymentInitValidator, paymentVerifyValidator } from '../validators/createProject.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { project_env } from '../lib/env.js';
import { getProjectByIdController } from '../controllers/forOtherService.js';
import { reDeployController } from '../controllers/reDeploy.js';
import { getProjectDataByIdConroller, getProjectMetaController, getProjectsController } from '../controllers/getProjects.js';
import { validateChangeSubDomain } from '../validators/domain.js';
import { changeSubdomainController } from '../controllers/domain.controller.js';

const projectRouter = express.Router();

projectRouter.post('/projects', createProjectValidator, createProject);
projectRouter.get('/projects', getProjectsController);
projectRouter.post('/payment/init', paymentInitValidator, paymentInitController);
projectRouter.post('/payment/verify', paymentVerifyValidator, paymentVerifyController);
projectRouter.get('/for-other-service/:projectId', internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET }), getProjectByIdController);
projectRouter.post('/redeploy/:projectId', reDeployController);
projectRouter.get('/:projectId/meta', getProjectMetaController)
projectRouter.get('/overview/:projectId', getProjectDataByIdConroller);
projectRouter.put('/subdomain/:projectId', validateChangeSubDomain, changeSubdomainController)

export default projectRouter;
