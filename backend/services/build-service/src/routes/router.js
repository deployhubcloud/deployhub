import express from 'express';
import { buildLogsStream } from '../controllers/buildLogsStream.js';
import { getBuildsController } from '../controllers/getBuilds.controller.js';


const buildRouter = express.Router();

buildRouter.get('/builds', getBuildsController)
buildRouter.get('/builds/logs/:projectId', buildLogsStream)


export default buildRouter;
