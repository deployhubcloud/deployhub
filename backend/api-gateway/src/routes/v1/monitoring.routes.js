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
    checkHealthMiddleware('Monitoring'),
    rateLimitMiddleware('monitoring', 'Too many monitoring requests. Please try again later'),
    proxy(services.Monitoring.url, "Monitoring-Service")
);

export default router;
