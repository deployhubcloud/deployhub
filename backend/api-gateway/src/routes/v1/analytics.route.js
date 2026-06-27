import express from 'express'
import { rateLimitMiddleware } from '../../middlewares/rateLimit.js'
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';
import proxy from '../../proxy/proxy.js';
import { services } from '../../configs/services.js';
import { verifyJwt } from '../../middlewares/verifyJwt.middleware.js';

const router = express.Router();

router.use(verifyJwt);

router.use(
    "/",
    checkHealthMiddleware('Analytics'),
    rateLimitMiddleware('analytics', 'To Many Request! Plase try again Later'),
    proxy(services.Analytics.url, "Analytics-Service")
);


export default router;
