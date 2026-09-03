import * as systemService from '../services/system.service.js';

export const getFleetController = async (req, res) => {
    try {
        const data = await systemService.getFleet();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Failed to load system fleet',
        });
    }
};

export const controlUnitController = async (req, res) => {
    try {
        const session = req.adminSession || {};
        const data = await systemService.controlUnit(req.params.id, req.params.action, {
            username: session.username || session.adminId,
            role: session.role,
            accountId: session.accountId,
            ip: req.ip,
            userAgent: req.headers?.['user-agent'],
        });
        return res.status(200).json({ unit: data });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Control action failed',
        });
    }
};

export const getLogsController = async (req, res) => {
    try {
        const data = await systemService.getUnitLogs(req.params.id, req.query.tail);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Failed to read logs',
        });
    }
};
