import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { buildEnv } from '../lib/env.js';
import {
    buildStatsAdminController,
    deleteBuildAdminController,
    deleteProjectBuildsAdminController,
    listBuildsAdminController,
} from '../controllers/adminBuilds.controller.js';

const router = express.Router();
const adminInternal = internalApiCallMiddleware({ secret: buildEnv.INTERNAL_SERVICE_TALKING_SECRET });

router.get('/stats', adminInternal, buildStatsAdminController);
router.get('/builds', adminInternal, listBuildsAdminController);
router.delete('/builds/:buildId', adminInternal, deleteBuildAdminController);
router.delete('/projects/:projectId/builds', adminInternal, deleteProjectBuildsAdminController);

export default router;
