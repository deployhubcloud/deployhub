import express from 'express';
import {
    getBuildByIdController,
    getBuildByProjectIdController,
    getBuildsController,
    getBuildStatsController,
    getLatestBuildController,
} from '../controllers/getBuilds.controller.js';
import { buildIdParam, projectIdParam } from '../validators/builds.validators.js';

const buildRouter = express.Router();

buildRouter.get('/builds', getBuildsController);
buildRouter.get('/builds/detail/:buildId', buildIdParam, getBuildByIdController);
buildRouter.get('/builds/:projectId/latest', projectIdParam, getLatestBuildController);
buildRouter.get('/builds/:projectId/stats', projectIdParam, getBuildStatsController);
buildRouter.get('/builds/:projectId', projectIdParam, getBuildByProjectIdController);

export default buildRouter;
