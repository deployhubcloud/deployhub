import { time } from 'console';
import { redisClient } from '../configs/redis.js'

const limits = {
    auth: {
        time: 60,
        limit: 5
    }
}

const rateLimit = async (seriveName, req, res, time, limit, inputmessage) => {

    const redisKey = `Deployhub:RateLimit:${req.user._id || req.ip}:service:${seriveName}`;

    const count = await redisClient.incr(redisKey);

    if (count === 1) {
        await redisClient.expire(redisKey, time);
    }

    if (count > limit) {
        return res.status(429).json({
            message: inputmessage
        });
    }
}

export const rateLimitMiddleware = (apiType, inputMessage) => {
    return (req, res, next) => {
        const { time, limit } = limits[apiType];

        const excessed = rateLimit(apiType, req, res, time, limit, inputMessage);
        if (excessed) {
            return;
        }
        next();
    }
}
