import nodemailer from 'nodemailer';
import { adminEnv } from '../lib/env.js';

export const transporter = nodemailer.createTransport({
    host: adminEnv.EMAIL_HOST,
    port: Number(adminEnv.EMAIL_PORT) || 465,
    secure: true,
    auth: {
        user: adminEnv.EMAIL_USER,
        pass: adminEnv.EMAIL_PASS,
    },
});
