import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { project_env } from '../lib/env.js';
import { getProjectByIdController, getProjectNotificationSettingsByProjectId } from '../controllers/forOtherService.js';

const forOtherServices = express.Router();


forOtherServices.get('/:projectId', internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET }), getProjectByIdController);
forOtherServices.get('/:projectId/notification-settings', internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET }), getProjectNotificationSettingsByProjectId)

export default forOtherServices;
