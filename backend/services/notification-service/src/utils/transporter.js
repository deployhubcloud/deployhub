import nodemailer from "nodemailer";
import { NOTIFICATION_ENV } from "../lib/env.js";

export const transporter = nodemailer.createTransport({
    host: `${NOTIFICATION_ENV.EMAIL_HOST}`,
    port: 465,
    secure: true,
    auth: {
        user: NOTIFICATION_ENV.EMAIL_USER,
        pass: NOTIFICATION_ENV.EMAIL_PASS,
    },
});