import express from 'express'
import { rateLimitMiddleware } from '../../middlewares/rateLimit.js'
import proxy from '../../proxy/proxy.js';
import { services } from '../../configs/services.js';

const router = express.Router();

router.use("/", rateLimitMiddleware('auth', 'To Many Request! Plase try again Later'), proxy(services.Auth.url, "Auth-Service"));


export default router;
