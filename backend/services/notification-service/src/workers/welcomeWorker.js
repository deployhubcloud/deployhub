import { Worker } from "bullmq";
import fs from 'fs';
import Handlebars from "handlebars";
import { mailTempletHtmlPath } from "../email/mailTempletPath.js";
import { sendEmail } from "../senders/email.sender.js";
import { connection } from "../utils/connection.js";


const filePath = mailTempletHtmlPath('welcome.html')
const emailTemplet = fs.readFileSync(filePath, 'utf-8')
const compiledEmailTemplet = Handlebars.compile(emailTemplet)

export const worker = new Worker("deployhub-WelcomeMessage", async (job) => {
    try {
        const { fullname, email, userId } = job.data.data;

        const emailHtml = compiledEmailTemplet({ fullname, email });

        // Email
        await sendEmail({
            to: email,
            subject: 'Welcome To DeployHub',
            html: emailHtml
        });

    } catch (error) {
        console.log("Error while sending welcome message", job.data.data?.fullname);
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
    console.log('Welcome email sent to user', job.data.data?.fullname)
});

worker.on('failed', (job) => {
    console.log('Error while sending welcome email', job.data.data?.fullname)
});