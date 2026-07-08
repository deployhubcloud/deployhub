const limits = {
    createFreeProject: {
        time: 2592000, // ye 30 days in seconds me hai
        limit: 1,
        type: 'createFreeProject'
    }
}

const rateLimit = async (serviceName, req, res, windowSeconds, limit, inputMessage, redisMaster, rateLimitType) => {

    const redis = redisMaster();
    const redisKey = `deployhub:RateLimit:${req.user._id}:service:${serviceName}:${rateLimitType}`;

    const count = await redis.get(redisKey);

    if (count >= limit) {
        res.status(429).json({
            message: inputMessage
        });
        return true;
    }

    return false;
}

const rateLimitMiddleware = (service, apiType, inputMessage, redis) => {
    return async (req, res, next) => {
        try {
            const config = limits[apiType];
            if (!config) {
                return next();
            }

            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    message: "Unauthorized"
                });
            }



            const exceeded = await rateLimit(service, req, res, config.time, config.limit, inputMessage, redis, config.type);
            if (exceeded) {
                return;
            }
            next();
        } catch (error) {
            next(error);
        }
    }
}


export default rateLimitMiddleware;