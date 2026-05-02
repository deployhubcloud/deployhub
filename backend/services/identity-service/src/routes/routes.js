import express from 'express';
import { registerInitValidate, registerVerifyValidator } from '../validators/register.js';
import { initRegisterController, verifyRegisterController } from '../controllers/register.js';
import { loginController } from '../controllers/login.js';
import { loginValidator } from '../validators/login.js';
import { refreshTokenController } from '../controllers/RefreshToken.Controller.js';
import { logoutController } from '../controllers/logout.js';
import { githubCallbackController, githubLoginController } from '../controllers/githubLogin.js';

const indetityServiceRouter = express();

indetityServiceRouter.post('/register/init', registerInitValidate, initRegisterController);
indetityServiceRouter.post('/register/verify', registerVerifyValidator, verifyRegisterController);
indetityServiceRouter.post('/login', loginValidator, loginController);
indetityServiceRouter.get('/refresh/token', refreshTokenController);
indetityServiceRouter.post('/logout', logoutController);
indetityServiceRouter.get('/github', githubLoginController);
indetityServiceRouter.get('/github/callback', githubCallbackController);

export default indetityServiceRouter;