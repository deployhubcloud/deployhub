import express from 'express';
import { buildLogsStream } from '../controllers/buildLogsStream.js';
import { getBuildByProjectIdController, getBuildsController } from '../controllers/getBuilds.controller.js';


const buildRouter = express.Router();

buildRouter.get('/builds', getBuildsController);
buildRouter.get('/builds/logs/:projectId', buildLogsStream);
buildRouter.get('/builds/:projectId', getBuildByProjectIdController);


export default buildRouter;
