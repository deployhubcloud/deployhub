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
import { listSessionsController, revokeAllSessionsController, revokeSessionController, } from '../controllers/session.controller.js';
import { userFullNameValidator } from '../validators/user.js';
import { getUserNetworkNameController, getUserNotificationSettingsController, getUserReposController, githubAccessTokenController, userFullNameCOntroller, userProfilePicController } from '../controllers/user.controller.js';
import { profilePicValidator } from '../validators/profilePic.js';
import upload, { handleUploadError } from '../middleware/multer.middleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { AUTH_ENV } from '../lib/env.js'

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
indetityServiceRouter.put('/user/fullname', verifyJWT, rateLimitMiddleware('fullName'), userFullNameValidator, userFullNameCOntroller)
indetityServiceRouter.put('/user/profile-pic', verifyJWT, rateLimitMiddleware('uploadProfilePic'), upload.single('profilePic'), handleUploadError, profilePicValidator, userProfilePicController)
indetityServiceRouter.get('/user/repos', verifyJWT, getUserReposController);
indetityServiceRouter.get('/user/:userId/network-name', internalApiCallMiddleware({ secret: AUTH_ENV.INTERNAL_SERVICE_TALKING_SECRET }), getUserNetworkNameController);
indetityServiceRouter.get('/users/:userId/github-access-token', internalApiCallMiddleware({ secret: AUTH_ENV.INTERNAL_SERVICE_TALKING_SECRET }), githubAccessTokenController)
identityServiceRouter.get('/user/:userId/notification-settings', internalApiCallMiddleware({ secret: AUTH_ENV.INTERNAL_SERVICE_TALKING_SECRET }), getUserNotificationSettingsController)


export default indetityServiceRouter;
