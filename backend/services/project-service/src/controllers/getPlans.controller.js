import { plans } from "../../../../shared/constants/plan.js";

export const getLatestPlans = (req, res) => {
    try {

        return res.status(200).json({
            plans
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}