import express from 'express'
import { rateLimitMiddleware } from '../../middlewares/rateLimit.js'
import proxy from '../../proxy/proxy.js';
import { services } from '../../configs/services.js';

const router = express.Router();

router.use("/", rateLimitMiddleware('project', 'To Many Request! Plase try again Later'), proxy(services.Project.url, "Project-Service"));


export default router;