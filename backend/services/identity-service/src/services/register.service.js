import { User } from "../models/user.model.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { sendRegistrationOtp, verifyRegistrationOtp } from "./otp.service.js";
import { generateNetworkName } from "../utils/netwrokName.js";

const REGISTRATION_EXPIRY_MS = 10 * 60 * 1000;

const getRegistrationExpiry = () => new Date(Date.now() + REGISTRATION_EXPIRY_MS);

export const initRegister = async (data) => {

    if (!data) {
        throw new AppError('Data Required', 400);
    }

    const { fullName, email, password } = data;

    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser) {
        if (existingUser.status === 'active') {
            throw new AppError('user with this email already exist', 409);
        }

        if (existingUser.status === 'suspend') {
            throw new AppError('This account is suspended', 403);
        }

        existingUser.fullName = fullName;
        existingUser.password = password;
        existingUser.status = "pending";
        existingUser.registrationExpiresAt = getRegistrationExpiry();

        await existingUser.save();
        await sendRegistrationOtp(email);

        return existingUser;
    }

    const user = new User({
        fullName,
        email,
        password,
        status: "pending",
        registrationExpiresAt: getRegistrationExpiry()
    })

    await user.save();
    await sendRegistrationOtp(email);

    return user;
}

export const verifyRegister = async (data) => {

    if (!data) {
        throw new AppError('Data Required', 400);
    }

    const { otp, email } = data;
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError('Registration expired. Please register again', 400);
    }

    if (user.status === 'active') {
        throw new AppError('Account already verified', 409);
    }

    if (user.status !== 'pending') {
        throw new AppError('Registration cannot be verified for this account', 403);
    }

    if (user.registrationExpiresAt && user.registrationExpiresAt <= new Date()) {
        await User.deleteOne({ _id: user._id, status: "pending" });
        throw new AppError('Registration expired. Please register again', 400);
    }

    await verifyRegistrationOtp(email, otp);

    const networkName = generateNetworkName(user._id);

    await User.findOneAndUpdate(
        { _id: user._id, status: "pending" },
        {
            $set: { status: "active", networkName: networkName },
            $unset: { registrationExpiresAt: "" }
        }
    );

    return true

}
