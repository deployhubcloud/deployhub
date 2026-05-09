import express from 'express';
import { registerInitValidate, registerVerifyValidator } from '../validators/register.js';
import { initRegisterController, verifyRegisterController } from '../controllers/register.js';
import { loginController } from '../controllers/login.js';
import { loginValidator } from '../validators/login.js';
import { refreshTokenController } from '../controllers/RefreshToken.Controller.js';
import { logoutController } from '../controllers/logout.js';
import { githubCallbackController, githubLoginController } from '../controllers/githubLogin.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { meController } from '../controllers/me.controller.js';
import {
    listSessionsController,
    revokeAllSessionsController,
    revokeSessionController,
} from '../controllers/session.controller.js';
import { userFullNameValidator } from '../validators/user.js';
import { userFullNameCOntroller } from '../controllers/user.controller.js';

const indetityServiceRouter = express.Router();

indetityServiceRouter.post('/register/init', registerInitValidate, initRegisterController);
indetityServiceRouter.post('/register/verify', registerVerifyValidator, verifyRegisterController);
indetityServiceRouter.post('/login', loginValidator, loginController);
indetityServiceRouter.get('/refresh/token', refreshTokenController);
indetityServiceRouter.post('/logout', logoutController);
indetityServiceRouter.get('/github', githubLoginController);
indetityServiceRouter.get('/github/callback', githubCallbackController);
indetityServiceRouter.get('/sessions', verifyJWT, listSessionsController);
indetityServiceRouter.delete('/sessions/:tokenId', verifyJWT, revokeSessionController);
indetityServiceRouter.delete('/sessions', verifyJWT, revokeAllSessionsController);
indetityServiceRouter.get('/user/profile', verifyJWT, meController);
indetityServiceRouter.put('/user/fullname' , userFullNameValidator , userFullNameCOntroller)

export default indetityServiceRouter;
