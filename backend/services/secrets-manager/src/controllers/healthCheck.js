import { getRegisteredServices } from "../services/secrets.registry.js";

export const healthCheck = (_req, res) => {
    return res.status(200).json({
        success: true,
        service: 'secrets-manager',
        registeredServices: getRegisteredServices(),
        uptime: process.uptime(),
    });
};