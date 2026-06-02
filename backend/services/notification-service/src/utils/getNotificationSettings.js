import axios from 'axios';
import { NOTIFICATION_ENV } from '../lib/env.js';
import { getUserNotificationSettings } from '../../../../shared/utils/getUserNotificationSettings.js';
import { getRedis } from '../core/redis/client.js';


export const getNotificationSettings = async (projectId) => {

    const redis = getRedis();

    const cached = await redis.get(`deployhub:project:${projectId}:notifications-settings`);
    if (cached) return JSON.parse(cached);


    const settings = await getUserNotificationSettings(
        axios,
        NOTIFICATION_ENV.PROJECT_SERVICE_URL,
        projectId,
        NOTIFICATION_ENV.INTERNAL_SERVICE_TALKING_SECRET,
        NOTIFICATION_ENV.INTERNAL_SECRET
    );

    await redis.setex(
        `deployhub:project:${projectId}:notifications-settings`,
        3600,
        JSON.stringify(settings)
    );

    return settings;
}
