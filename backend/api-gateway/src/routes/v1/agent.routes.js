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
    checkHealthMiddleware('Agent'),
    rateLimitMiddleware('agent', 'Too many agent requests. Please try again later'),
    proxy(services.Agent.url, "Agent-Service")
);

export default router;
