import { meServices } from "../services/me.services.js";

export const meController = async (req, res) => {
    try {

        const userData = await meServices(req.user);

        return res.status(200).json({
            status: "success",
            userData
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Internal Server Error'
        });
    }
}
