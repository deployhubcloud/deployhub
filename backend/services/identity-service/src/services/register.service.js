import { User } from "../models/user.model.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { sendRegistrationOtp, verifyRegistrationOtp } from "./otp.service.js";

export const initRegister = async (data) => {

    if (!data) {
        throw new AppError('Data Required', 400);
    }

    const { fullName, email, password } = data;

    const checkMail = await User.findOne({ email });
    if (checkMail) {
        throw new AppError('user with this email already exist', 409);
    }

    const user = new User({
        fullName,
        email,
        password
    })

    await sendRegistrationOtp(email);

    await user.save({ validateBeforeSave: false });

    return user;
}

export const verifyRegister = async (data) => {

    if (!data) {
        throw new AppError('Data Required', 400);
    }

    const { otp, email } = data;
    await verifyRegistrationOtp(email, otp);

    await User.findOneAndUpdate(
        { email },
        { status: "active" }
    )
    return true

}
