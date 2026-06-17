import express from 'express';
import { getBuildByProjectIdController, getBuildsController } from '../controllers/getBuilds.controller.js';


const buildRouter = express.Router();

buildRouter.get('/builds', getBuildsController);
buildRouter.get('/builds/:projectId', getBuildByProjectIdController);


export default buildRouter;
