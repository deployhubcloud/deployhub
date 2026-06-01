import { NOTIFICATION_ENV } from "../lib/env.js";
import { transporter } from "../utils/transporter.js";


export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `DeployHub ${NOTIFICATION_ENV.EMAIL_USER}`,
            to,
            subject,
            html,
        });
        console.log("Email sent: ", info.messageId);
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
};
