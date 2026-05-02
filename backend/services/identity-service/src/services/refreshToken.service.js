import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { AUTH_ENV } from '../lib/env.js';
import { getRedis } from '../core/redis/client.js';
import { GenerateAccessToken } from '../utils/token.js';


const deleteAllSessions = async (userId) => {
    const pattern = `session:${userId}:*`;
    let cursor = '0';

    do {
        const [nextCursor, keys] = await redisClient.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100
        );

        cursor = nextCursor;

        if (keys.length > 0) {
            await redisClient.del(...keys);
        }

    } while (cursor !== '0');
};

export const refreshTokenService = async ({ refreshToken, ip, userAgent }) => {

    const redis = getRedis();

    // here if refreshtoken not found
    if (!refreshToken) {
        throw new Error({
            status: 401,
            message: "no refreshToken Found"
        })
    };


    // here i decode token
    let payload;
    try {
        payload = await jwt.verify(refreshToken, AUTH_ENV.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new Error({
            status: 401,
            message: "invalid refreshToken"
        })
    };


    const userid = payload._id;
    const tokenId = payload.jti;

    if (!tokenId) {
        throw new Error({
            status: 401,
            message: 'invalid token payload'
        })
    }

    const sessionData = await redis.get(`deployhub:session:${userid}:${tokenId}`);
    if (!sessionData) {
        throw new Error({
            status: 401,
            message: 'Invalid Sessions'
        })
    }

    const session = JSON.parse(sessionData);

    const incommingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    if (incommingHash !== session.hashedToken) {
        await deleteAllSessions(userid);
        throw new Error({
            status: 403,
            message: 'Token reuse detected. All sessions revoked.'
        })
    };


    await redisClient.expire(sessionKey, 60 * 60 * 24 * 7);

    return {
        AccessToken: GenerateAccessToken(userId, tokenId),
        RefreshToken: refreshToken,
        tokenId
    };
};