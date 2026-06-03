import RedisPubSub from '../../../../shared/redis/pubSubRedis.js';
import Redis from 'ioredis';
import { sendDiscord } from '../senders/discord.sender.js';
import { sendEmail } from '../senders/email.sender.js';
import { sendTelegram } from '../senders/telegram.sender.js';
import { NOTIFICATION_ENV } from '../lib/env.js';
import { getNotificationSettings } from '../utils/getNotificationSettings.js';
import { buildDiscordMessage } from '../utils/discord/buildDiscordMessage.js';
import { buildEmailTemplate } from '../utils/email/buildEmailTemplate.js';
import { buildTelegramMessage } from '../utils/telegram/buildTelegramMessage.js';

const redisPubSub = new RedisPubSub(
    Redis, {
    host: NOTIFICATION_ENV.REDIS_HOST,
    port: Number(NOTIFICATION_ENV.REDIS_PORT),
    password: NOTIFICATION_ENV.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
}
)

redisPubSub.consume('deployhub:users:build:status', async (message) => {
    try {

        const data = JSON.parse(message);
        console.log('Project status received', data);

        const { projectId, projectstatus, userId, userName, projectName, buildId } = data;

        const userNotificationSettings = await getNotificationSettings(projectId);

        const discordMessage = buildDiscordMessage({
            projectName,
            buildId,
            status: projectstatus
        });
        console.log(discordMessage)

        const telegramMessage = buildTelegramMessage({
            projectName,
            buildId,
            status: projectstatus
        });

        const emailHtml = buildEmailTemplate({
            userName,
            projectName,
            buildId,
            status: projectstatus
        });

        if (userNotificationSettings?.discord?.enabled) {
            await sendDiscord({
                webhookUrl: userNotificationSettings.discord.webhookUrl,
                message: discordMessage
            });
        }


        if (userNotificationSettings?.email?.enabled) {
            await sendEmail({
                to: userNotificationSettings.email.emailAddress,
                subject: `Project ${projectstatus}`,
                html: emailHtml
            });
        }


        if (userNotificationSettings?.telegram?.enabled) {
            await sendTelegram(
                userNotificationSettings.telegram.botToken,
                userNotificationSettings.telegram.chatId,
                telegramMessage
            );
        }

    } catch (error) {
        console.error('Error while handling project status notification', error?.message || error);
    }
})
