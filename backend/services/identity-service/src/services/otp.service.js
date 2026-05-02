import { AppError } from '../../../../shared/errors/AppError.js';
import { generateSixDigitCode } from '../../../../shared/utils/generateSixDigitCode.js';
import { OtpValidate } from '../models/otpValidator.js';
import { AUTH_ENV } from '../lib/env.js';
import { transporter } from '../utils/transporter.js';

export const saveRegistrationOtp = async (email) => {
    const code = generateSixDigitCode();

    await OtpValidate.findOneAndUpdate(
        { email },
        { code, createdAt: new Date() },
        { upsert: true, returnDocument: "after" }
    );

    return code;
};

export const sendRegistrationOtp = async (email) => {
    const code = await saveRegistrationOtp(email);

    await transporter.sendMail({
        from: `"TailorGo" <${AUTH_ENV.EMAIL_USER}>`,
        to: email,
        subject: "Your Registration Code",
        html: `<h2>Your OTP is: ${code}</h2>`
    });
};

export const verifyRegistrationOtp = async (email, otp) => {
    const validateOtp = await OtpValidate.findOne({ email, code: otp });
    if (!validateOtp) {
        throw new AppError("Invalid or Expired Otp", 400);
    }

    await OtpValidate.deleteOne({ email });
};
