import { validationResult } from "express-validator"
import { initRegister, verifyRegister } from "../services/register.service.js"

export const initRegisterController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        const user = await initRegister(req.body);

        res.status(200).json({
            message: "otp send Success",
            email: user.email
        })

    } catch (error) {
        res.status(error?.status || 500).json({
            message: error?.message || "Internal server Error"
        })
    }
}

export const verifyRegisterController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }

        await verifyRegister(req.body);

        res.status(201).json({
            message: "Registration Success",
        })

    } catch (error) {
        res.status(error?.status || 500).json({
            message: error?.message || "Internal Server Error"
        })
    }
};