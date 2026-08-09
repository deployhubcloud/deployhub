import { destroyAdminSession, getAdminSessionCookieName, getClearSessionCookieOptions, getSessionCookieOptions, initAdminLogin, verifyAdminOtp, } from '../services/auth.service.js';

export const loginInitController = async (req, res) => {
    try {
        const { adminId, password } = req.body || {};
        if (!adminId || !password) {
            return res.status(400).json({ message: 'adminId and password are required' });
        }

        const result = await initAdminLogin({ adminId, password, req });
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Login failed',
        });
    }
};

export const loginVerifyController = async (req, res) => {
    try {
        const { loginId, otp } = req.body || {};
        if (!loginId || !otp) {
            return res.status(400).json({ message: 'loginId and otp are required' });
        }

        const { sessionId, session } = await verifyAdminOtp({ loginId, otp, req });
        res.cookie(getAdminSessionCookieName(), sessionId, getSessionCookieOptions());

        return res.status(200).json({
            message: 'Admin logged in',
            admin: {
                adminId: session.adminId,
                email: session.email,
                role: session.role,
            },
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'OTP verification failed',
        });
    }
};

export const logoutController = async (req, res) => {
    try {
        await destroyAdminSession(req.adminSessionId);
        res.clearCookie(getAdminSessionCookieName(), getClearSessionCookieOptions());
        return res.status(200).json({ message: 'Logged out' });
    } catch (error) {
        return res.status(500).json({ message: 'Logout failed' });
    }
};

export const meController = async (req, res) => {
    return res.status(200).json({
        admin: {
            adminId: req.adminSession.adminId,
            email: req.adminSession.email,
            role: req.adminSession.role,
        },
    });
};
