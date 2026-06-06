import express from 'express';
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';
import { rateLimitMiddleware } from '../../middlewares/rateLimit.js';
import proxy from '../../proxy/proxy.js';

const buildRouter = express.Router();

buildRouter.use(verifyJwt);

buildRouter.use(
    "/",
    checkHealthMiddleware('Build'),
    rateLimitMiddleware('build', 'To Many Request! Plase try again Later'),
    proxy(services.Project.url, "Build-service")
);


export default buildRouter;