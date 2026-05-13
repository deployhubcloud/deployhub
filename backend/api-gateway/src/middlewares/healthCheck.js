import axios from "axios";
import { services } from "../configs/services.js";
import { logger } from "../utils/logger.js";

const HEALTH_CHECK_INTERVAL_MS = 30000;

export const checkHealth = async () => {
    await Promise.all(
        Object.entries(services).map(async ([name, service]) => {
            const previousStatus = service.isHealthy;

            try {
                await axios.get(`${service.url}/health`, { timeout: 3000 });

                services[name].isHealthy = true;
                services[name].lastError = null;

                if (!previousStatus) {
                    logger.info({
                        service: name,
                        status: 'up',
                        type: 'health_check'
                    }, 'Service is back UP');
                }
            } catch (error) {
                services[name].isHealthy = false;
                services[name].lastError = error.message;

                if (previousStatus) {
                    logger.warn({
                        service: name,
                        status: 'down',
                        error: error.message,
                        type: 'health_check'
                    }, 'Service went DOWN');
                }
            }

            services[name].lastChecked = new Date();
        })
    );
};

export const startHealthCheck = async () => {
    await checkHealth();
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
    return interval;
}

export const checkHealthMiddleware = (serviceName) => {
    return async (req, res, next) => {
        const service = services[serviceName];

        if (!service) {
            logger.error({ service: serviceName }, 'Unknown service configured in route');
            return res.status(500).json({
                success: false,
                message: 'Service is not configured'
            });
        }

        if (!service.isHealthy) {
            return res.status(503).json({
                success: false,
                message: `${serviceName} service is currently unavailable`,
                retryAfter: `${HEALTH_CHECK_INTERVAL_MS / 1000}s`,
                lastChecked: service.lastChecked,
                traceId: req.traceId
            })
        }

        next();
    }
}
