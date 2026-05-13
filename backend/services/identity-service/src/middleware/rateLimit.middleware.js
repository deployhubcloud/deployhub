import { getRedis } from "../core/redis/client";

const limit = {
    fullName: {
        max: 2,
        time: 60 * 60 * 1000, // 1 hours
        message: 'you update on 5 times per hours.'
    },
    email: {
        max: 5,
        time: 60 * 60 * 1000, // 1 hours
        message: 'you update on 5 times per hours.'
    },
    uploadProfilePic: {
        max: 5,
        time: 60 * 60 * 1000, // 1 hours
        message: 'you update on 5 times per hours.'
    }
}

const rateLimit = (req, res, apiType,) => {

    const redis = await getRedis();
    const apiType = apiType;
    const requester = req.userId || req.ip;
    const redisKey = `depolyhub:identity-service:rate-limit:user:${requester}`;

    const limitConfig = limit[apiType];
    if (!limitConfig) {
        throw new Error('Invalid API type for rate limiting');
    }

    await redis.incr(redisKey);

    const count = await redis.get(redisKey);

    if (count === 1) {
        await redis.expire(redisKey, limitConfig.time / 1000);
    }

    if (count > limitConfig.max) {
        res.status(429).json({
            message: limitConfig.message
        });
        return true;
    }

    return false;
}


export const rateLimitMiddleware = (apiType) => {
    return async (req, res, next) => {
        try {

            const exceeded = await rateLimit(req, res, apiType);
            if (exceeded) {
                return;
            }
            next();

        } catch (error) {
            next(error);
        }
    }
}