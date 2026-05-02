import axios from "axios";
import { services } from "../configs/services.js";
import { logger } from "../utils/logger.js";

const checkHealth = async () => {
    for (const [name, service] of Object.entries(services)) {
        const previousStatus = service.isHealthy;
        try {
            await axios.get(`${service.url}/health`, { timeout: 3000 });
            services[name].isHealthy = true;

            if (!previousStatus) {
                logger.info({ service: name }, 'Service is back UP');

                logger.info({
                    service: name,
                    status: 'up',
                    type: 'health_check'
                }, 'Health check');
            }



        } catch (error) {
            services[name].isHealthy = false;

            if (previousStatus) {
                logger.error({ service: name }, 'Service went DOWN');

                logger.warn({
                    service: name,
                    status: 'down',
                    type: 'health_check'
                }, 'Health check');
            }


        }

        services[name].lastChecked = new Date();
    }

    const total = Object.keys(services).length;
    const up = Object.values(services).filter(s => s.isHealthy === true).length;
    const down = Object.values(services).filter(s => s.isHealthy === false).length;

    logger.info({
        type: 'services_summary',
        total,
        up,
        down
    }, 'Services summary');
};

export const startHealthCheck = () => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return interval;
}

export const checkHealthMiddleware = async () => {
    return async (req, res, next) => {
        if (!services[serviceName].isHealthy) {
            return res.status(503).json({
                message: `${serviceName} is currently down`,
                retryAfter: '30s'
            })
        }
        next();
    }
}