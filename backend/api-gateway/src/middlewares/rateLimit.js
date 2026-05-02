import { getRedis } from '../configs/redis.js';

const limits = {
    auth: {
        time: 60,
        limit: 5
    }
}

const rateLimit = async (serviceName, req, res, windowSeconds, limit, inputMessage) => {
    const redis = getRedis();
    const requester = req.user?._id || req.ip;
    const redisKey = `Deployhub:RateLimit:${requester}:service:${serviceName}`;

    const count = await redis.incr(redisKey);

    if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
    }

    if (count > limit) {
        res.status(429).json({
            message: inputMessage
        });
        return true;
    }

    return false;
}

export const rateLimitMiddleware = (apiType, inputMessage) => {
    return async (req, res, next) => {
        try {
            const config = limits[apiType];
            if (!config) {
                return next();
            }

            const exceeded = await rateLimit(apiType, req, res, config.time, config.limit, inputMessage);
            if (exceeded) {
                return;
            }
            next();
        } catch (error) {
            next(error);
        }
    }
}
