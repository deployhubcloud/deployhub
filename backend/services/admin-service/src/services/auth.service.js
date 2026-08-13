import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../../shared/errors/AppError.js';
import { generateSixDigitCode } from '../../../../shared/utils/generateSixDigitCode.js';
import { adminEnv } from '../lib/env.js';
import { getRedis } from '../core/redis/client.js';
import { transporter } from '../utils/transporter.js';
import { AdminAccount } from '../models/adminAccount.model.js';
import { ROLES, permissionsForRole, normalizeRole } from '../constants/roles.js';

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
});

export const getClearSessionCookieOptions = () => ({
    ...getSessionCookieOptions(),
});

async function resolveAdminCredentials(username, password) {
    const user = String(username || '').trim().toLowerCase();
    const pass = String(password || '');

    if (!user || !pass) {
        throw new AppError('Invalid admin credentials', 401);
    }

    if (safeEqual(user, String(adminEnv.ADMIN_ID).trim().toLowerCase())) {
        if (!safeEqual(pass, adminEnv.ADMIN_PASSWORD)) {
            throw new AppError('Invalid admin credentials', 401);
        }
        return {
            role: ROLES.SUPER_ADMIN,
            username: adminEnv.ADMIN_ID,
            email: adminEnv.ADMIN_EMAIL,
            accountId: null,
        };
    }

    const account = await AdminAccount.findOne({ username: user }).select('+passwordHash');
    if (!account || account.status !== 'active') {
        throw new AppError('Invalid admin credentials', 401);
    }

    const ok = await bcrypt.compare(pass, account.passwordHash);
    if (!ok) {
        throw new AppError('Invalid admin credentials', 401);
    }

    return {
        role: ROLES.NORMAL_ADMIN,
        username: account.username,
        email: account.email,
        accountId: String(account._id),
    };
}

export async function initAdminLogin({ username, password, req }) {
    const identity = await resolveAdminCredentials(username, password);

    const loginId = crypto.randomUUID();
    const otp = generateSixDigitCode();
    const redis = getRedis();

    await redis.set(
        pendingKey(loginId),
        JSON.stringify({
            otp,
            role: identity.role,
            username: identity.username,
            email: identity.email,
            accountId: identity.accountId,
            ip: req?.ip || '',
            userAgent: req?.headers?.['user-agent'] || '',
            createdAt: Date.now(),
        }),
        'EX',
        LOGIN_TTL
    );

    await transporter.sendMail({
        from: `"DeployHub Admin" <${adminEnv.EMAIL_USER}>`,
        to: identity.email,
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
        role: pending.role,
        username: pending.username,
        adminId: pending.username,
        email: pending.email,
        accountId: pending.accountId || null,
        ip: req?.ip || '',
        userAgent: req?.headers?.['user-agent'] || '',
        createdAt: Date.now(),
    };

    await redis.set(sessionKey(sessionId), JSON.stringify(sessionPayload), 'EX', SESSION_SAFETY_TTL);

    await transporter.sendMail({
        from: `"DeployHub Admin" <${adminEnv.EMAIL_USER}>`,
        to: pending.email,
        subject: 'Admin panel login alert',
        html: `
          <h2>New Admin Login</h2>
          <p>Someone logged into the DeployHub admin panel as <strong>${pending.username}</strong> (${pending.role}).</p>
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

    const session = JSON.parse(raw);
    session.role = normalizeRole(session.role);

    if (session.role === ROLES.NORMAL_ADMIN) {
        if (!session.accountId) return null;
        const account = await AdminAccount.findById(session.accountId).lean();
        if (!account || account.status !== 'active') return null;
        session.username = account.username;
        session.adminId = account.username;
        session.email = account.email;
    }

    return session;
}

export async function destroyAdminSession(sessionId) {
    if (!sessionId) return;
    const redis = getRedis();
    await redis.del(sessionKey(sessionId));
}

export function publicAdminFromSession(session) {
    if (!session) return null;
    const role = normalizeRole(session.role);
    return {
        username: session.username || session.adminId,
        adminId: session.username || session.adminId,
        email: session.email,
        role,
        permissions: permissionsForRole(role),
    };
}
