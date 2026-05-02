import nodemailer from "nodemailer";
import { AUTH_ENV } from "../lib/env.js";

export const transporter = nodemailer.createTransport({
    host: `${AUTH_ENV.EMAIL_HOST}`,
    port: 465,
    secure: true,
    auth: {
        user: AUTH_ENV.EMAIL_USER,
        pass: AUTH_ENV.EMAIL_PASS,
    },
});