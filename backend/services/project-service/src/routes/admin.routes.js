import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { project_env } from '../lib/env.js';
import {
    deleteProjectAdminController,
    deleteUserProjectsAdminController,
    getProjectAdminController,
    listProjectsAdminController,
    projectStatsAdminController,
    purgeProjectCacheAdminController,
    updateProjectAdminController,
} from '../controllers/adminProjects.controller.js';

const adminProjectsRouter = express.Router();
const adminInternal = internalApiCallMiddleware({ secret: project_env.INTERNAL_SERVICE_TALKING_SECRET });

adminProjectsRouter.get('/stats', adminInternal, projectStatsAdminController);
adminProjectsRouter.get('/projects', adminInternal, listProjectsAdminController);
adminProjectsRouter.get('/projects/:projectId', adminInternal, getProjectAdminController);
adminProjectsRouter.patch('/projects/:projectId', adminInternal, updateProjectAdminController);
adminProjectsRouter.delete('/projects/:projectId', adminInternal, deleteProjectAdminController);
adminProjectsRouter.post('/projects/:projectId/purge-cache', adminInternal, purgeProjectCacheAdminController);
adminProjectsRouter.delete('/users/:userId/projects', adminInternal, deleteUserProjectsAdminController);

export default adminProjectsRouter;
