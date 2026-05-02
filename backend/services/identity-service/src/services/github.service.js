
import axios from "axios";
import { AUTH_ENV } from "../lib/env.js";
import { User } from "../models/user.model.js";



export const githubCallback = async (data) => {

    const { code } = data;

    if (!code) {
        throw new Error({
            status: 400,
            message: 'github code missing'
        })
    };

    // exange code to access token
    const tokenRes = await axios.post("https://github.com/login/oauth/access_token",
        {
            client_id: AUTH_ENV.GITHUB_CLIENT_ID,
            client_secret: AUTH_ENV.GITHUB_CLIENT_SECRET,
            code
        },
        {
            headers: {
                accept: "application/json"
            }
        }
    );


    const githubAccessToken = tokenRes.data.access_token;

    if (!githubAccessToken) {
        throw new Error('GitHub token failed');
    }

    // Get GitHub Profile
    const userRes = await axios.get("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${githubAccessToken}`,
        },
    });

    const githubUser = userRes.data;

    // Get Email
    const emailRes = await axios.get("https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${githubAccessToken}`,
        },
    });

    const primaryEmail = emailRes.data.find(e => e.primary)?.email;

    if (!primaryEmail) {
        throw new Error('Email not found in GitHub');
    }

    let user = await User.findOne({ email: primaryEmail });

    if (!user) {
        user = await User.create({
            email: primaryEmail,
            fullName: githubUser.name || githubUser.login,
            githubId: githubUser.id,
            githubUsername: githubUser.login,
            githubAccessToken,
            provider: "github",
            password: null,
        })

        await user.save({ validateBeforeSave: false })
    } else {
        user.githubAccessToken = githubAccessToken;
        user.githubId = githubUser.id;
        user.githubUsername = githubUser.login;
        user.provider = "github";
        await user.save({ validateBeforeSave: false });
    }

    return user;
}