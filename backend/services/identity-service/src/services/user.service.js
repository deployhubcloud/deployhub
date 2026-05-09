import { AppError } from "../../../../shared/errors/AppError.js";
import { User } from "../models/user.model.js";

export const userFullnameService = async (userId, fullName) => {

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, provider: 'local' },
        { fullName: fullName },
        { new: true, runValidators: true });

    if (!updatedUser) {
        throw new AppError('You cannot update fullname, you logged in with GitHub', 409)
    }

    return true

}