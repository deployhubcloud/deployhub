import express from 'express';
import { createProject } from '../controllers/createProject.js';
import { paymentInitController, paymentVerifyController } from '../controllers/payment.controller.js';
import { createProjectValidator, paymentInitValidator, paymentVerifyValidator } from '../validators/createProject.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { project_env } from '../lib/env.js';
import { getProjectByIdController } from '../controllers/forOtherService.js';
import { reDeployController } from '../controllers/reDeploy.js';
import { getProjectDataByIdConroller, getProjectMetaController, getProjectsController } from '../controllers/getProjects.js';
import { addCustomDomainValidator, getDomainSettingsValidators, validateChangeSubDomain, deleteCustomDomainValidator } from '../validators/domain.js';
import { changeSubdomainController, getDomainSettingsController, addCustomDomainCOntroller, deleteCustomDomainController } from '../controllers/domain.controller.js';
import { projectSettingValidators, updateBuildandStartSettingsValidators, updateHealthMonitoringAndNotificationValidator, updateEnvSettingsValidators } from '../validators/projectSettings.js';
import { projectSettingsController, updateBuildandStartSettingsController, updateEnvSettingsController, updateHealthMonitoringAndNotificationController } from '../controllers/projectSettings.controller.js';
import { getProjectBillingValidators } from '../validators/billing.validators.js';
import { getProjectBillingController } from '../controllers/billing.controller.js';
import { getLatestPlans } from '../controllers/getPlans.controller.js';
import rateLimitMiddleware from '../../../../shared/middlewares/rateLimit.js';
import { getRedis } from '../core/redis/client.js';
import { deleteProjectController } from '../controllers/deleteProject.js';

const projectRouter = express.Router();

projectRouter.post('/projects', rateLimitMiddleware('project', 'createFreeProject', 'You have exceeded the rate limit for creating free projects.', getRedis), createProjectValidator, createProject);
projectRouter.get('/projects', getProjectsController);
projectRouter.post('/payment/init', paymentInitValidator, paymentInitController);
projectRouter.post('/payment/verify', paymentVerifyValidator, paymentVerifyController);
projectRouter.get('/for-other-service/:projectId', internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET }), getProjectByIdController);
projectRouter.post('/redeploy/:projectId', reDeployController);
projectRouter.get('/:projectId/meta', getProjectMetaController);
projectRouter.get('/overview/:projectId', getProjectDataByIdConroller);


// setttings
projectRouter.get('/settings/:projectId', projectSettingValidators, projectSettingsController);
projectRouter.get('/settings/domain/:projectId', getDomainSettingsValidators, getDomainSettingsController);
projectRouter.patch('/settings/build-and-start/:projectId', updateBuildandStartSettingsValidators, updateBuildandStartSettingsController);
projectRouter.patch('/settings/notification/:projectId', updateHealthMonitoringAndNotificationValidator, updateHealthMonitoringAndNotificationController);
projectRouter.patch('/settings/env/:projectId', updateEnvSettingsValidators, updateEnvSettingsController);


// domain
projectRouter.put('/subdomain/:projectId', validateChangeSubDomain, changeSubdomainController);
projectRouter.post('/custom-domain/:projectId', addCustomDomainValidator, addCustomDomainCOntroller)
projectRouter.delete('/custom-domain/:projectId', deleteCustomDomainValidator, deleteCustomDomainController)


// project billing
projectRouter.get("/billing/:projectId", getProjectBillingValidators, getProjectBillingController)


// plans
projectRouter.get('/plans', getLatestPlans)
export default projectRouter;

// delete project
projectRouter.delete('/project/:projectId', deleteProjectController)
