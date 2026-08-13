import {
    destroyAdminSession,
    getAdminSession,
    getAdminSessionCookieName,
} from '../services/auth.service.js';
import { roleHasPermission } from '../constants/roles.js';

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

export const requirePermission = (permission) => (req, res, next) => {
    const role = req.adminSession?.role;
    if (!roleHasPermission(role, permission)) {
        return res.status(403).json({ message: 'Forbidden: insufficient admin permissions' });
    }
    next();
};
