import { AppError } from '../../../../shared/errors/AppError.js';
import { getRedis } from '../core/redis/client.js';
import { User } from '../models/user.model.js';

export const meServices = async (data) => {

    // redis
    const redis = getRedis();

    const userId = data?._id;
    if (!userId) {
        throw new AppError('Invalid User', 401);
    }


    const redisKey = `deployhub:userData:${userId}`;

    const cacheUserData = await redis.get(redisKey);
    if (cacheUserData) {
        return JSON.parse(cacheUserData)
    }

    if (!cacheUserData) {
        const userdata = await User.findById(userId).select('fullName provider email profilePic').lean();

        if (!userdata) {
            throw new AppError('Invalid User', 401);
        }

        await redis.set(redisKey, JSON.stringify(userdata));
        await redis.expire(redisKey, 3600);

        return userdata;
    }

}
