import { Worker } from 'bullmq';
import { NOTIFICATION_ENV } from '../lib/env.js';
import { getNotificationSettings } from '../utils/getNotificationSettings.js';
import { buildEmailSpikeAlertTemplate } from '../utils/email/buildEmailSpikeAlertTemplate.js';
import { buildTelegramSpikeAlertMessage } from '../utils/telegram/buildTelegramSpikeAlertMessage.js';
import { buildDiscordSpikeAlertMessage } from '../utils/discord/buildDiscordSpikeAlertMessage.js';
import { sendDiscord } from '../senders/discord.sender.js';
import { sendEmail } from '../senders/email.sender.js';
import { sendTelegram } from '../senders/telegram.sender.js';


const connection = {
    host: NOTIFICATION_ENV.REDIS_HOST,
    port: Number(NOTIFICATION_ENV.REDIS_PORT),
    maxRetriesPerRequest: null,
};

const projectReqSpikeAlertWorker = new Worker("spike-alert", async (job) => {

    const { projectId, current, previous, detectedAt } = job.data

    try {

        const userNotificationSettings = await getNotificationSettings(projectId);


        const emailHtml = buildEmailSpikeAlertTemplate({ projectId, current, previous, detectedAt });
        const telegramMessage = buildTelegramSpikeAlertMessage({ projectId, current, previous, detectedAt });
        const discordMessage = buildDiscordSpikeAlertMessage({ projectId, current, previous, detectedAt });


        if (userNotificationSettings?.discord?.enabled) {
            await sendDiscord({
                webhookUrl: userNotificationSettings.discord.webhookUrl,
                message: discordMessage
            });
        }


        if (userNotificationSettings?.email?.enabled) {
            await sendEmail({
                to: userNotificationSettings.email.emailAddress,
                subject: `Project Traffic Spike Alert`,
                html: emailHtml
            });
        }


        if (userNotificationSettings?.telegram?.enabled) {
            await sendTelegram({
                botToken: userNotificationSettings.telegram.botToken,
                chatId: userNotificationSettings.telegram.chatId,
                message: telegramMessage
            });
        }

    } catch (error) {
        console.log(error)
        throw error
    }
}, {
    connection,
    concurrency: 20
})


projectReqSpikeAlertWorker.on('completed', (job) => {
    console.log('Spike Alert sent')
});

projectReqSpikeAlertWorker.on('failed', (job, error) => {
    console.error('Error while sending SpikeAlert Alert')
});

