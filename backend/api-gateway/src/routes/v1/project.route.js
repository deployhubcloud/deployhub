import express from 'express'
import { rateLimitMiddleware } from '../../middlewares/rateLimit.js'
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';
import proxy from '../../proxy/proxy.js';
import { services } from '../../configs/services.js';
import { verifyJwt } from '../../middlewares/verifyJwt.middleware.js';

const router = express.Router();

router.use(
    "/github-webhook",
    checkHealthMiddleware('Project'),
    rateLimitMiddleware('project', 'To Many Request! Plase try again Later'),
    proxy(services.Project.url, "Project-Service")
);

router.use(verifyJwt);

router.use(
    "/",
    checkHealthMiddleware('Project'),
    rateLimitMiddleware('project', 'To Many Request! Plase try again Later'),
    proxy(services.Project.url, "Project-Service")
);



export default router;
