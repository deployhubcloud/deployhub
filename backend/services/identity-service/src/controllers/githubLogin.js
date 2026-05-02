import { AUTH_ENV } from "../lib/env.js";
import axios from 'axios';
import { generateToken } from "../utils/token.js";
import { getAccessTokenOptions, getRefreshTokenOptions } from "../utils/cookieOption.js";

export const githubLoginController = async (req, res) => {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${AUTH_ENV.GITHUB_CLIENT_ID}&scope=repo user:email admin:repo_hook`;

    return res.redirect(redirectUrl);
};



export const githubCallbackController = async (req, res) => {
    try {

        const user = await githubCallback(req.query);

        const { AccessToken, RefreshToken } = await generateToken(user._id, req);

        return res
            .cookie('AccessToken', AccessToken, getAccessTokenOptions())
            .cookie('RefreshToken', RefreshToken, getRefreshTokenOptions())
            .redirect(`${process.env.FRONTEND_URL}/`);

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'OAuth Login Failed'
        })
    }
};