import axios from 'axios';
import { NOTIFICATION_ENV } from '../lib/env.js';
import { getUserNotificationSettings } from '../../../../shared/utils/getUserNotificationSettings.js';
import { getRedis } from '../core/redis/client.js';


export const getNotificationSettings = async (userId) => {

    const redis = getRedis();

    const cached = await redis.get(`user:notifications:${userId}`);
    if (cached) return JSON.parse(cached);


    const settings = await getUserNotificationSettings(
        axios, NOTIFICATION_ENV.PROJECT_SERVICE_URL, userId, NOTIFICATION_ENV.INTERNAL_SECRET
    );

    await redis.setex(
        `user:notifications:${userId}`,
        3600,
        JSON.stringify(settings)
    );

    return settings;
}