import { Worker } from "bullmq";
import fs from 'fs';
import Handlebars from "handlebars";
import { mailTempletHtmlPath } from "../email/mailTempletPath.js";
import { sendEmail } from "../senders/email.sender.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { NOTIFICATION_ENV } from "../lib/env.js";


const filePath = mailTempletHtmlPath('welcome.html')
const emailTemplet = fs.readFileSync(filePath, 'utf-8')
const compiledEmailTemplet = Handlebars.compile(emailTemplet)

const connection = {
    host: NOTIFICATION_ENV.REDIS_HOST,
    port: Number(NOTIFICATION_ENV.REDIS_PORT),
    password: NOTIFICATION_ENV.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

export const worker = new Worker(QUEUE_NAMES.WELCOME, async (job) => {
    try {
        const { fullname, email, userId } = job.data || {};

        if (!fullname || !email || !userId) {
            throw new Error(`Invalid welcome job payload: ${JSON.stringify(job.data)}`);
        }

        const emailHtml = compiledEmailTemplet({ fullname, email });

        // Email
        await sendEmail({
            to: email,
            subject: 'Welcome To DeployHub',
            html: emailHtml
        });

    } catch (error) {
        console.error("Error while sending welcome message", {
            fullname: job.data?.fullname,
            email: job.data?.email,
            error: error?.message || error,
        });
        throw error;
    }
}, {
    connection,
    concurrency: 5,
    limiter: {
        max: 100,
        duration: 60 * 1000
    }
});

worker.on('completed', (job) => {
    console.log('Welcome email sent to user', job.data?.fullname)
});

worker.on('failed', (job, error) => {
    console.error('Error while sending welcome email', {
        fullname: job?.data?.fullname,
        email: job?.data?.email,
        error: error?.message || error,
    })
});
