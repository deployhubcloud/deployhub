// routes/secrets.routes.js

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { secretsFetchLimiter } from '../middlewares/rateLimiter.js';
import { fetchSecrets, invalidateServiceCache, invalidateAllCaches } from '../controllers/secrets.controller.js';
import { healthCheck } from '../controllers/healthCheck.js';

const router = Router();

router.use(authenticate);
router.use(secretsFetchLimiter);

router.get('/meta/health', healthCheck);
router.get('/:serviceName', fetchSecrets);
router.post('/invalidate/:serviceName', invalidateServiceCache);
router.post('/invalidate-all', invalidateAllCaches);

export default router;