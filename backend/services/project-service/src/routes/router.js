import express from 'express';
import { createProject } from '../controllers/createProject.js';
import { paymentInitController, paymentVerifyController } from '../controllers/payment.controller.js';
import { createProjectValidator, paymentInitValidator, paymentVerifyValidator } from '../validators/createProject.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { project_env } from '../lib/env.js';
import { getProjectByIdController } from '../controllers/forOtherService.js';
import { reDeployController } from '../controllers/reDeploy.js';
import { getProjectDataByIdConroller, getProjectMetaController, getProjectsController } from '../controllers/getProjects.js';
import { addCustomDomainValidator, getDomainSettingsValidators, validateChangeSubDomain, deleteCustomDomainValidator, renewCustomDomainValidator } from '../validators/domain.js';
import { changeSubdomainController, getDomainSettingsController, addCustomDomainCOntroller, deleteCustomDomainController, renewCustomDomainController } from '../controllers/domain.controller.js';
import { projectSettingValidators, updateBuildandStartSettingsValidators, updateHealthMonitoringAndNotificationValidator, updateEnvSettingsValidators } from '../validators/projectSettings.js';
import { projectSettingsController, updateBuildandStartSettingsController, updateEnvSettingsController, updateHealthMonitoringAndNotificationController } from '../controllers/projectSettings.controller.js';
import { getProjectBillingValidators } from '../validators/billing.validators.js';
import { getProjectBillingController } from '../controllers/billing.controller.js';
import { getLatestPlans } from '../controllers/getPlans.controller.js';
import rateLimitMiddleware from '../../../../shared/middlewares/rateLimit.js';
import { getRedis } from '../core/redis/client.js';
import { deleteProjectController } from '../controllers/deleteProject.js';
import {
    getEnvKeysController,
    getProjectLiveStatusController,
    mergeEnvSettingsController,
} from '../controllers/projectExtras.controller.js';
import {
    mergeEnvValidators,
    projectIdParamValidator,
} from '../validators/projectExtras.validators.js';

const projectRouter = express.Router();

projectRouter.post('/projects', rateLimitMiddleware('project', 'createFreeProject', 'You have exceeded the rate limit for creating free projects.', getRedis), createProjectValidator, createProject);
projectRouter.get('/projects', getProjectsController);
projectRouter.post('/payment/init', paymentInitValidator, paymentInitController);
projectRouter.post('/payment/verify', paymentVerifyValidator, paymentVerifyController);
projectRouter.get('/for-other-service/:projectId', internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET }), getProjectByIdController);
projectRouter.post('/redeploy/:projectId', reDeployController);
projectRouter.get('/:projectId/meta', getProjectMetaController);
projectRouter.get('/overview/:projectId', getProjectDataByIdConroller);
projectRouter.get('/status/:projectId', projectIdParamValidator, getProjectLiveStatusController);


// setttings
projectRouter.get('/settings/:projectId', projectSettingValidators, projectSettingsController);
projectRouter.get('/settings/:projectId/env-keys', projectIdParamValidator, getEnvKeysController);
projectRouter.get('/settings/domain/:projectId', getDomainSettingsValidators, getDomainSettingsController);
projectRouter.patch('/settings/build-and-start/:projectId', updateBuildandStartSettingsValidators, updateBuildandStartSettingsController);
projectRouter.patch('/settings/notification/:projectId', updateHealthMonitoringAndNotificationValidator, updateHealthMonitoringAndNotificationController);
projectRouter.patch('/settings/env/:projectId', updateEnvSettingsValidators, updateEnvSettingsController);
projectRouter.patch('/settings/env/:projectId/merge', mergeEnvValidators, mergeEnvSettingsController);


// domain
projectRouter.put('/subdomain/:projectId', validateChangeSubDomain, changeSubdomainController);
projectRouter.post('/custom-domain/:projectId', addCustomDomainValidator, addCustomDomainCOntroller);
projectRouter.delete('/custom-domain/:projectId', deleteCustomDomainValidator, deleteCustomDomainController);
projectRouter.post('/custom-domain/:projectId/renew', renewCustomDomainValidator, renewCustomDomainController);


// project billing
projectRouter.get("/billing/:projectId", getProjectBillingValidators, getProjectBillingController)


// plans
projectRouter.get('/plans', getLatestPlans)

// delete project
projectRouter.delete('/project/:projectId', deleteProjectController)

export default projectRouter;
