import axios from 'axios';
import { adminEnv } from '../lib/env.js';

export function serviceClient(baseURL) {
    return axios.create({
        baseURL,
        timeout: 15000,
        headers: {
            'x-internal-secret': adminEnv.INTERNAL_SECRET,
            'x-microservice-secret': adminEnv.INTERNAL_SERVICE_TALKING_SECRET,
            'Content-Type': 'application/json',
        },
    });
}

export const identityClient = () => serviceClient(adminEnv.IDENTITY_SERVICE_URL);
export const projectClient = () => serviceClient(adminEnv.PROJECT_SERVICE_URL);
