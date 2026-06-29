import { validationResult } from "express-validator";
import { getProjectBilling } from "../services/billing.service.js";


export const getProjectBillingController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        };

        const projectId = req.params.projectId;

        const billingdata = await getProjectBilling(projectId);

        return res.status(200).json({
            data: billingdata
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg
        })
    }
}