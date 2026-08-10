import axios from 'axios';
import { agentEnv } from '../lib/env.js';

export function createUserClient(user, auth = {}) {
    const headers = {
        'x-internal-secret': agentEnv.INTERNAL_SECRET,
        'x-user-context': JSON.stringify(user),
        'Content-Type': 'application/json',
    };

    const talkingHeaders = {
        'x-internal-secret': agentEnv.INTERNAL_SECRET,
        'x-microservice-secret': agentEnv.INTERNAL_SERVICE_TALKING_SECRET,
        'Content-Type': 'application/json',
    };

    const clients = {
        project: axios.create({
            baseURL: agentEnv.PROJECT_SERVICE_URL,
            headers,
            timeout: 30000,
        }),
        build: axios.create({
            baseURL: agentEnv.BUILD_SERVICE_URL,
            headers,
            timeout: 30000,
        }),
        projectInternal: axios.create({
            baseURL: agentEnv.PROJECT_SERVICE_URL,
            headers: talkingHeaders,
            timeout: 30000,
        }),
        buildInternal: axios.create({
            baseURL: agentEnv.BUILD_SERVICE_URL,
            headers: talkingHeaders,
            timeout: 30000,
        }),
    };

    if (agentEnv.ANALYTICS_SERVICE_URL) {
        clients.analytics = axios.create({
            baseURL: agentEnv.ANALYTICS_SERVICE_URL,
            headers,
            timeout: 15000,
        });
    }

    if (agentEnv.MONITORING_SERVICE_URL) {
        clients.monitoring = axios.create({
            baseURL: agentEnv.MONITORING_SERVICE_URL,
            headers,
            timeout: 15000,
        });
    }

    if (agentEnv.DEPLOY_SERVICE_URL) {
        clients.deploy = axios.create({
            baseURL: agentEnv.DEPLOY_SERVICE_URL,
            headers,
            timeout: 15000,
        });
    }

    if (agentEnv.IDENTITY_SERVICE_URL && auth.accessToken) {
        clients.identity = axios.create({
            baseURL: agentEnv.IDENTITY_SERVICE_URL,
            headers: {
                'x-internal-secret': agentEnv.INTERNAL_SECRET,
                Authorization: `Bearer ${auth.accessToken}`,
                'Content-Type': 'application/json',
                ...(auth.cookie ? { Cookie: auth.cookie } : {}),
            },
            timeout: 30000,
        });
    }

    return clients;
}

export function summarizeAxiosError(error) {
    if (error.response) {
        return {
            ok: false,
            status: error.response.status,
            message: error.response.data?.message || error.response.data?.msg || error.message,
            data: error.response.data,
        };
    }
    return {
        ok: false,
        message: error.message || 'Request failed',
    };
}
