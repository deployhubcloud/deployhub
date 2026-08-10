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
    checkHealthMiddleware('Deploy'),
    rateLimitMiddleware('deploy', 'Too many deploy requests. Please try again later'),
    proxy(services.Deploy.url, "Deploy-Service")
);

export default router;
