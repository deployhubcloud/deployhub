import crypto from 'crypto';
import { AppError } from '../../../../shared/errors/AppError.js';
import { generateSixDigitCode } from '../../../../shared/utils/generateSixDigitCode.js';
import { adminEnv } from '../lib/env.js';
import { getRedis } from '../core/redis/client.js';
import { transporter } from '../utils/transporter.js';

const COOKIE_NAME = 'admin_session';
const LOGIN_TTL = 10 * 60;
const SESSION_SAFETY_TTL = 12 * 60 * 60;

const safeEqual = (a, b) => {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
};

const pendingKey = (loginId) => `deployhub:admin:login:${loginId}`;
const sessionKey = (sessionId) => `deployhub:admin:session:${sessionId}`;

export const getAdminSessionCookieName = () => COOKIE_NAME;

export const getSessionCookieOptions = () => ({
    httpOnly: true,
    secure: adminEnv.NODE_ENV === 'production',
    sameSite: adminEnv.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    // no maxAge/expires => browser session cookie (dies on browser close)
});

export const getClearSessionCookieOptions = () => ({
    ...getSessionCookieOptions(),
});

export async function initAdminLogin({ adminId, password, req }) {
    if (!safeEqual(adminId, adminEnv.ADMIN_ID) || !safeEqual(password, adminEnv.ADMIN_PASSWORD)) {
        throw new AppError('Invalid admin credentials', 401);
    }

    const loginId = crypto.randomUUID();
    const otp = generateSixDigitCode();
    const redis = getRedis();

    await redis.set(
        pendingKey(loginId),
        JSON.stringify({
            otp,
            ip: req?.ip || '',
            userAgent: req?.headers?.['user-agent'] || '',
            createdAt: Date.now(),
        }),
        'EX',
        LOGIN_TTL
    );

    await transporter.sendMail({
        from: `"DeployHub Admin" <${adminEnv.EMAIL_USER}>`,
        to: adminEnv.ADMIN_EMAIL,
        subject: 'Admin login OTP',
        html: `
          <h2>DeployHub Admin Login</h2>
          <p>Your OTP is <strong>${otp}</strong></p>
          <p>This code expires in 10 minutes.</p>
          <p>IP: ${req?.ip || 'unknown'}</p>
        `,
    });

    return {
        requiresOtp: true,
        loginId,
        message: 'OTP sent to admin email',
    };
}

export async function verifyAdminOtp({ loginId, otp, req }) {
    const redis = getRedis();
    const raw = await redis.get(pendingKey(loginId));
    if (!raw) throw new AppError('OTP expired or invalid login attempt', 400);

    const pending = JSON.parse(raw);
    if (!safeEqual(otp, pending.otp)) {
        throw new AppError('Invalid OTP', 400);
    }

    await redis.del(pendingKey(loginId));

    const sessionId = crypto.randomUUID();
    const sessionPayload = {
        role: 'admin',
        adminId: adminEnv.ADMIN_ID,
        email: adminEnv.ADMIN_EMAIL,
        ip: req?.ip || '',
        userAgent: req?.headers?.['user-agent'] || '',
        createdAt: Date.now(),
    };

    await redis.set(sessionKey(sessionId), JSON.stringify(sessionPayload), 'EX', SESSION_SAFETY_TTL);

    await transporter.sendMail({
        from: `"DeployHub Admin" <${adminEnv.EMAIL_USER}>`,
        to: adminEnv.ADMIN_EMAIL,
        subject: 'Admin panel login alert',
        html: `
          <h2>New Admin Login</h2>
          <p>Someone logged into the DeployHub admin panel.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>IP:</strong> ${req?.ip || 'unknown'}</p>
          <p><strong>User-Agent:</strong> ${req?.headers?.['user-agent'] || 'unknown'}</p>
        `,
    });

    return { sessionId, session: sessionPayload };
}

export async function getAdminSession(sessionId) {
    if (!sessionId) return null;
    const redis = getRedis();
    const raw = await redis.get(sessionKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw);
}

export async function destroyAdminSession(sessionId) {
    if (!sessionId) return;
    const redis = getRedis();
    await redis.del(sessionKey(sessionId));
}
