import { validationResult } from "express-validator";
import { userFullnameService, userProfilePicService } from "../services/user.service.js";

export const userFullNameCOntroller = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        };

        const { fullname } = req.body;
        const userId = req.user._id;

        await userFullnameService(userId, fullname);

        return res.status(200).json({
            message: "FullName Updated",
            success: true
        })

    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'internal server Error'
        })
    }
};


export const userProfilePicController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        const userid = req.user._id;
        const profilePic = req.file;

        await userProfilePicService(userid, profilePic);

        return res.status(200).json({
            message: "Profile Picture Updated",
            success: true
        })

    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'internal server Error'
        })
    }
}