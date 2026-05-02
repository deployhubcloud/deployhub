import { OtpValidate } from "../models/otpValidator.js";
import { User } from "../models/user.model.js";
import { sendOtp } from "../utils/sendOtp.js";

export const initRegister = async (data) => {

    if (!data) {
        throw new Error('Data Required')
    }

    const { fullName, email, password } = data;

    const checkMail = await User.findOne({ email });
    if (checkMail) {
        throw new Error({ status: 409, message: 'user with this email already exist' })
    }

    const user = new User({
        fullName,
        email,
        password
    })

    await sendOtp(email);

    await user.save({ validateBeforeSave: false });

    return user;
}

export const verifyRegister = async (data) => {

    if (!data) {
        throw new Error('Data Required')
    }

    const { otp, email } = data;

    const validateOtp = await OtpValidate.findOne({ email, code: otp });
    if (!validateOtp) {
        throw new Error({ status: 400, message: "Invalid or Expired Otp" })
    }

    if (validateOtp.code !== otp) {
        throw new Error({ status: 400, message: "Expired Otp" })
    }

    await User.findOneAndUpdate(
        { email },
        { status: "active" }
    )

    await OtpValidate.deleteOne({ email })

    return true

}