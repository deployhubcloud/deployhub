import { Router } from 'express';
import {
    loginInitController,
    loginVerifyController,
    logoutController,
    meController,
} from '../controllers/auth.controller.js';
import { requireAdminSession } from '../middleware/adminSession.js';

const router = Router();

router.post('/login', loginInitController);
router.post('/verify-otp', loginVerifyController);
router.post('/logout', requireAdminSession, logoutController);
router.get('/me', requireAdminSession, meController);

export default router;
