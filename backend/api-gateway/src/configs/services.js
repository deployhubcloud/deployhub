import { ENV } from "../lib/env.js";

export const services = {
    Auth: {
        url: ENV.SERVICES_URL.AUTH,
        isHealthy: false,
        lastChecked: null,
        lastError: null
    },
    Project: {
        url: ENV.SERVICES_URL.PROJECT,
        isHealthy: false,
        lastChecked: null,
        lastError: null
    }
}
