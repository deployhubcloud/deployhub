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
        const data = await systemService.controlUnit(req.params.id, req.params.action);
        return res.status(200).json({ unit: data });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || error.message || 'Control action failed',
        });
    }
};
