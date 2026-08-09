import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { project_env } from '../lib/env.js';
import {
    deleteProjectAdminController,
    getProjectAdminController,
    listProjectsAdminController,
    updateProjectAdminController,
} from '../controllers/adminProjects.controller.js';

const adminProjectsRouter = express.Router();
const adminInternal = internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET });

adminProjectsRouter.get('/projects', adminInternal, listProjectsAdminController);
adminProjectsRouter.get('/projects/:projectId', adminInternal, getProjectAdminController);
adminProjectsRouter.patch('/projects/:projectId', adminInternal, updateProjectAdminController);
adminProjectsRouter.delete('/projects/:projectId', adminInternal, deleteProjectAdminController);

export default adminProjectsRouter;
