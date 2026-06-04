import { NOTIFICATION_ENV } from "../lib/env.js";
import { transporter } from "../utils/transporter.js";

const normalizeEmailArgs = (toOrOptions, subject, html) => {
    if (toOrOptions && typeof toOrOptions === 'object') {
        return toOrOptions;
    }

    return { to: toOrOptions, subject, html };
};

export const sendEmail = async (toOrOptions, subject, html) => {
    const mail = normalizeEmailArgs(toOrOptions, subject, html);

    try {
        const info = await transporter.sendMail({
            from: `DeployHub ${NOTIFICATION_ENV.EMAIL_USER}`,
            to: mail.to,
            subject: mail.subject,
            html: mail.html,
        });
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
};
