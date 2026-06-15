import express from 'express';
import { fetchBuildDataByIdForOtherServiceControllers } from '../controllers/forOtherServices.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { buildEnv } from '../lib/env.js';
import { getLatestBuildIdController } from '../controllers/getBuilds.controller.js';


const forOtherServices = express.Router();

forOtherServices.get("/build/:buildId", internalApiCallMiddleware({ secret: buildEnv.INTERNAL_SERVICE_TALKING_SECRET }), fetchBuildDataByIdForOtherServiceControllers);
forOtherServices.get("/latestBuildId/:projectId", internalApiCallMiddleware({ secret: buildEnv.INTERNAL_SERVICE_TALKING_SECRET }), getLatestBuildIdController);



export default forOtherServices;
