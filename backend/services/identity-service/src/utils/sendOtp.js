import { transporter } from "./transporter.js";
import { AUTH_ENV } from "../lib/env.js";
import { OtpValidate } from "../models/otpValidator.js";
import { generateSixDigitCode } from "../../../../shared/utils/generateSixDigitCode.js";

const saveCodeToDB = async (email, userType) => {
    try {
        const code = generateSixDigitCode();

        await OtpValidate.findOneAndUpdate(
            { email },
            { code, createdAt: new Date() },
            { upsert: true, returnDocument: "after" }
        );

        return code;
    } catch (error) {
        return error;
    }
};

const sendRegistrationCode = async (email) => {
    const code = await saveCodeToDB(email);

    const mailOptions = {
        from: `"TailorGo" <${AUTH_ENV.EMAIL_USER}>`,
        to: email,
        subject: "Your Registration Code",
        html: `<h2>Your OTP is: ${code}</h2>`
    };

    await transporter.sendMail(mailOptions);
};

export const sendOtp = async (email) => {
    await sendRegistrationCode(email);
}