import { getDashboardStats } from '../services/dashboard.service.js';

export const dashboardController = async (req, res) => {
    try {
        const data = await getDashboardStats({ fresh: req.query.fresh === '1' });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to load dashboard' });
    }
};
