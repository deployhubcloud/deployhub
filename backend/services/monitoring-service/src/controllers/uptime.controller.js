import { validationResult } from 'express-validator';
import { getUptimeForUser } from '../services/uptime.service.js';

export const getUptimeController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const data = await getUptimeForUser(req.user._id, req.params.projectId);
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Internal Server Error',
        });
    }
};
