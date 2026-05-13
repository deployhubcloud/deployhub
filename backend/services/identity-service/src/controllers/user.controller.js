import { validationResult } from "express-validator";
import { getUserRepositories, userFullnameService, userProfilePicService } from "../services/user.service.js";
import fs from 'fs/promises';



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

        const user = await userFullnameService(userId, fullname);


        return res.status(200).json({
            message: "FullName Updated",
            success: true,
            userData: {
                fullName: user.fullName,
                email: user.email,
                provider: user.provider,
                profilePic: user.profilePic,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
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
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        const userid = req.user._id;
        const profilePic = req.file;

        const user = await userProfilePicService(userid, profilePic);

        if (req?.file) {
            await fs.unlink(req.file.path);
        }

        return res.status(200).json({
            message: "Profile Picture Updated",
            success: true,
            userData: {
                fullName: user.fullName,
                email: user.email,
                provider: user.provider,
                profilePic: user.profilePic,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        })

    } catch (error) {
        if (req?.file) {
            await fs.unlink(req.file.path);
        }
        res.status(error.status || 500).json({
            error: error.message || 'internal server Error'
        })
    }
}


export const getUserReposController = async (req, res) => {
    try {

        const userId = req.user._id;

        const repositories = await getUserRepositories(userId);

        return res.status(200).json({
            repositories
        })

    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'internal server Error'
        })
    }
}
