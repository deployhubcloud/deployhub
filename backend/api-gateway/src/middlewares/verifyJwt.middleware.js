import jwt from 'jsonwebtoken';
import { ENV } from '../lib/env';

export const verifyJwt = async (req, res, next) => {

    const accessToken = req.cookies.AccessTOken || req.headers('Authorization')?.replace('Bearer ', "");

    if (!accessToken) {
        return res.status(401).json({
            message: "UnAuthorize Request",
            Success: "false"
        })
    }

    const decode = jwt.verify(accessToken, ENV.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).json({
                message: " Invalid Token",
                Succes: false
            })
        };

        req.user = decoded;
        next();
    })

};