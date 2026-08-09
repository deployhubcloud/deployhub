import express from 'express'
import { rateLimitMiddleware } from '../../middlewares/rateLimit.js'
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';
import proxy from '../../proxy/proxy.js';
import { services } from '../../configs/services.js';

const router = express.Router();

router.use(
    "/",
    checkHealthMiddleware('Admin'),
    rateLimitMiddleware('admin', 'Too many admin requests. Please try again later'),
    proxy(services.Admin.url, "Admin-Service")
);

export default router;
