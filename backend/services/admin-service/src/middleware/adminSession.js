import {
    destroyAdminSession,
    getAdminSession,
    getAdminSessionCookieName,
} from '../services/auth.service.js';

export const requireAdminSession = async (req, res, next) => {
    try {
        const cookieName = getAdminSessionCookieName();
        const sessionId = req.cookies?.[cookieName];
        const session = await getAdminSession(sessionId);

        if (!session) {
            if (sessionId) await destroyAdminSession(sessionId);
            return res.status(401).json({ message: 'Admin session expired. Please login again.' });
        }

        req.adminSession = session;
        req.adminSessionId = sessionId;
        next();
    } catch (error) {
        next(error);
    }
};
