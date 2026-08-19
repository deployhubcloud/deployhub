import { Router } from 'express';
import {
    changePasswordController,
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
router.patch('/password', requireAdminSession, changePasswordController);

export default router;
