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
    },
    Analytics: {
        url: ENV.SERVICES_URL.ANALYTICS,
        isHealthy: false,
        lastChecked: null,
        lastError: null
    },
    Build: {
        url: ENV.SERVICES_URL.BUILD,
        isHealthy: false,
        lastChecked: null,
        lastError: null
    },
    Admin: {
        url: ENV.SERVICES_URL.ADMIN,
        isHealthy: false,
        lastChecked: null,
        lastError: null
    },
    Agent: {
        url: ENV.SERVICES_URL.AGENT,
        isHealthy: false,
        lastChecked: null,
        lastError: null
    }
}
