import { AppError } from "../../../../shared/errors/AppError.js";
import { User } from "../models/user.model.js";
import { deleteFromDevload, uploadOnDevload } from "../utils/devload.js";
import axios from "axios";
import { getRedis } from "../core/redis/client.js";
import { decryptGithubAccessToken } from "../utils/githubTokenCrypto.js";

const GITHUB_REQUEST_TIMEOUT_MS = 10000;

const clearUserCache = async (userId) => {
    const redis = getRedis();
    await redis.del(`deployhub:userData:${userId}`);
};

export const userFullnameService = async (userId, fullName) => {

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, provider: 'local' },
        { fullName: fullName },
        { returnDocument: 'after', runValidators: true });

    if (!updatedUser) {
        throw new AppError('You cannot update fullname, you logged in with GitHub', 409)
    }

    await clearUserCache(userId);

    return updatedUser

}

export const userProfilePicService = async (userId, file) => {

    // here first check if user have previous profile pic, if have then delete that from devload and then upload new one
    if (!file?.path) {
        throw new AppError('Profile picture is required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.provider !== 'local') {
        throw new AppError('You cannot update profile picture, you logged in with GitHub', 409)
    }


    const oldProfilePicFileId = user?.profileFileId;


    const uplaodResult = await uploadOnDevload(file.path);

    const updateUser = await User.findOneAndUpdate(
        { _id: userId },
        { profilePic: uplaodResult.publicurl, profileFileId: uplaodResult.fileid },
        { returnDocument: 'after', upsert: false }
    );

    if (oldProfilePicFileId) {
        await deleteFromDevload(oldProfilePicFileId);
    }


    await clearUserCache(userId);

    return updateUser
}


export const getUserRepositories = async (userId) => {
    const user = await User.findById(userId).select('+githubAccessToken');

    if (!user) {
        throw new AppError('User not found', 404);
    }


    if (user.provider !== 'github') {
        throw new AppError('User is not authenticated with GitHub', 400);
    };

    if (!user.githubAccessToken) {
        throw new AppError('GitHub access token not found! Please authenticate with GitHub', 404);
    }

    const githubAccessToken = decryptGithubAccessToken(user.githubAccessToken);
    const repositories = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const reposRes = await axios.get("https://api.github.com/user/repos", {
            headers: {
                Authorization: `Bearer ${githubAccessToken}`,
                Accept: "application/vnd.github+json",
            },
            params: {
                visibility: "all",
                affiliation: "owner,collaborator",
                per_page: 100,
                page,
            },
            timeout: GITHUB_REQUEST_TIMEOUT_MS,
        });

        repositories.push(...reposRes.data);
        hasMore = reposRes.data.length === 100;
        page += 1;
    }


    const repos = repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        html_url: repo.html_url,
        description: repo.description,
        default_branch: repo.default_branch,
    }));

    return repos;
}

export const getUSerNetworkName = async (userId) => {

    const user = await User.findById(userId).select('networkName');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user.networkName;
}

export const getUserGIthubToken = async (userId) => {

    const user = await User.findById(userId).select('+githubAccessToken');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.provider !== 'github') {
        throw new AppError('User is not authenticated with GitHub', 400);
    };

    if (!user.githubAccessToken) {
        throw new AppError('GitHub access token not found! Please authenticate with GitHub', 404);
    }

    return decryptGithubAccessToken(user.githubAccessToken);

}