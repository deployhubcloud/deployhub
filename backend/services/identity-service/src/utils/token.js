import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { getRedis } from '../core/redis/client.js';
import { AUTH_ENV } from '../lib/env.js';


const extractDevice = (ua = '') => {
    ua = ua.toLowerCase();

    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows')) return 'Windows PC';
    if (ua.includes('mac')) return 'Mac';
    if (ua.includes('linux')) return 'Linux';

    return 'Unknown Device';
};

export const generateToken = async (userId, req) => {

    const tokenId = crypto.randomUUID()
    const redis = getRedis();

    const refreshToken = jwt.sign(
        {
            _id: userId
        },
        AUTH_ENV.REFRESH_TOKEN_SECRET,
        {
            expiresIn: AUTH_ENV.REFRESH_TOKEN_EXPIRY,
            jwtid: tokenId
        }
    );

    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const sessionKey = `deployhub:session${userId}:${tokenId}`;

    await redis.set(
        sessionKey,
        JSON.stringify({
            hashedToken,
            ip: req?.ip || '',
            userAgent: req?.headers?.['user-agent'] || '',
            device: extractDevice(req?.headers?.['user-agent']),
            createdAt: Date.now(),
        }),
        'EX',
        60 * 60 * 24 * 7
    );

    const accessToken = jwt.sign(
        {
            _id: userId,
            tokenId
        },
        AUTH_ENV.ACCESS_TOKEN_SECRET,
        {
            expiresIn: AUTH_ENV.ACCESS_TOKEN_EXPIRY
        }
    )

    return {
        RefreshToken: refreshToken,
        AccessToken: accessToken,
        tokenId
    }


}



export const GenerateAccessToken = (userId, tokenId) => {
    return jwt.sign(
        {
            _id: userId, role, tokenId
        },
        AUTH_ENV.ACCESS_TOKEN_SECRET,
        {
            expiresIn: ENV.ACCESS_TOKEN_EXPIRY
        }
    );
};
