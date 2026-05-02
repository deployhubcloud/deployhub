import jwt from 'jsonwebtoken';
import { getClearAccessTokenOptions, getClearRefreshTokenOptions } from '../utils/cookieOption.js';
import { getRedis } from '../core/redis/client.js';
import { AUTH_ENV } from '../lib/env.js';

export const logoutController = async (req, res) => {
    try {
        const redis = getRedis();

        const accessToken = req.headers['authorization']?.split(' ')[1] || req.cookies.AccessToken;

        if (!accessToken) {
            return res
                .clearCookie('AccessToken', getClearAccessTokenOptions())
                .clearCookie('RefreshToken', getClearRefreshTokenOptions())
                .status(200)
                .json({ message: 'No token found, but logout success' });
        }

        try {
            const decoded = jwt.verify(accessToken, AUTH_ENV.ACCESS_TOKEN_SECRET);

            if (decoded._Id && decoded.tokenId) {
                await redis.del(`deployhub:session:${decoded._Id}:${decoded.tokenId}`);
            }
        } catch (error) {
            return res
                .clearCookie('AccessToken', getClearAccessTokenOptions())
                .clearCookie('RefreshToken', getClearRefreshTokenOptions())
                .status(400)
                .json({ message: 'Invalid or expired token, logout failed' });
        }

        return res
            .clearCookie('AccessToken', getClearAccessTokenOptions())
            .clearCookie('RefreshToken', getClearRefreshTokenOptions())
            .status(200)
            .json({ message: 'Logout success' });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};