import { getRedis } from "../core/redis/client.js";
import { clientIp } from "../../../../shared/utils/clientIp.js";

const limit = {
    fullName: {
        max: 2,
        time: 60 * 60 * 1000, // 1 hours
        message: 'you update on 2 times per hours.'
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

const rateLimit = async (req, res, apiType) => {

    const redis = await getRedis();
    const requester = req.user._id || clientIp(req);

    const limitConfig = limit[apiType];
    if (!limitConfig) {
        throw new Error('Invalid API type for rate limiting');
    }



    const redisKey = `deployhub:identity-service:rate-limit:${apiType}:user:${requester}`;


    const count = Number(await redis.incr(redisKey));

    if (count === 1) {
        await redis.expire(redisKey, Math.ceil(limitConfig.time / 1000));
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