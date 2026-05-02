import jwt from 'jsonwebtoken';
import { AUTH_ENV } from '../lib/env.js';
import { getRedis } from '../core/redis/client.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { SESSION_TTL_SECONDS, createSessionKey, deleteAllSessions, generateAccessToken, hashRefreshToken, } from './session.service.js';

export const refreshTokenService = async ({ refreshToken, ip, userAgent }) => {

    const redis = getRedis();

    // here if refreshtoken not found
    if (!refreshToken) {
        throw new AppError("no refreshToken Found", 401);
    };


    // here i decode token
    let payload;
    try {
        payload = await jwt.verify(refreshToken, AUTH_ENV.REFRESH_TOKEN_SECRET);
    } catch (_error) {
        throw new AppError("invalid refreshToken", 401);
    };


    const userId = payload._id;
    const tokenId = payload.jti;

    if (!userId || !tokenId) {
        throw new AppError('invalid token payload', 401);
    }

    const sessionKey = createSessionKey(userId, tokenId);
    const sessionData = await redis.get(sessionKey);
    if (!sessionData) {
        throw new AppError('Invalid Sessions', 401);
    }

    const session = JSON.parse(sessionData);

    const incommingHash = hashRefreshToken(refreshToken);

    if (incommingHash !== session.hashedToken) {
        await deleteAllSessions(redis, userId);
        throw new AppError('Token reuse detected. All sessions revoked.', 403);
    };


    await redis.expire(sessionKey, SESSION_TTL_SECONDS);

    return {
        AccessToken: generateAccessToken(userId, tokenId),
        RefreshToken: refreshToken,
        tokenId
    };
};
