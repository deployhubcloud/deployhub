import {
    destroyAdminSession,
    getAdminSessionCookieName,
    getClearSessionCookieOptions,
    getSessionCookieOptions,
    initAdminLogin,
    publicAdminFromSession,
    verifyAdminOtp,
} from '../services/auth.service.js';

export const loginInitController = async (req, res) => {
    try {
        const username = req.body?.username || req.body?.adminId;
        const password = req.body?.password;
        if (!username || !password) {
            return res.status(400).json({ message: 'username and password are required' });
        }

        const result = await initAdminLogin({ username, password, req });
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
            admin: publicAdminFromSession(session),
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
        admin: publicAdminFromSession(req.adminSession),
    });
};
