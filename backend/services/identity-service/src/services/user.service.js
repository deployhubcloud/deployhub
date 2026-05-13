import { AppError } from "../../../../shared/errors/AppError.js";
import { User } from "../models/user.model.js";
import { deleteFromDevload, uploadOnDevload } from "../utils/devload.js";

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

export const userProfilePicService = async (userId, file) => {

    // here first check if user have previous profile pic, if have then delete that from devload and then upload new one

    const user = await User.findById(userId);

    if (user?.profileFileId) {
        await deleteFromDevload(user.profileFileId);
    }


    const uplaodResult = await uploadOnDevload(file.path);

    const updateUser = await User.findOneAndUpdate(
        { _id: userId, provider: 'local' },
        { profilePic: uplaodResult.publicurl, profileFileId: uplaodResult.fileid },
        { new: true, upsert: false }
    );

    if (!updateUser) {
        throw new AppError('You cannot update profile picture, you logged in with GitHub', 409)
    }

    return true
}