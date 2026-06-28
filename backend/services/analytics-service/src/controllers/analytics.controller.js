import { validationResult } from "express-validator";
import { summaryService } from "../services/summaryService.js";

export const summaryController = async (req, res) => {
    try {


        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        };

        const projectId = req.params.projectId;

        const { requests, error, uniqueVisitors, topCountries, topEndpoints } = await summaryService(projectId)

        return res.status(200).json({
            data: {
                requests,
                error,
                uniqueVisitors,
                topCountries,
                topEndpoints
            }
        })


    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || "Internal server Error"
        })
    }
}