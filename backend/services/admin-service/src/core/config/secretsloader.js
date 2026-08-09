import dotenv from 'dotenv';
import { loadSecretsFromManager } from '../../../../../shared/secrets/loadSecrets.js';

dotenv.config();

const SECRETS_MANAGER_URL = process.env.SECRETS_MANAGER_URL;
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_TOKEN;
const SERVICE_NAME = process.env.ADMIN_SERVICE_NAME || process.env.SERVICE_NAME || 'admin-service';

export async function loadSecrets() {
    return loadSecretsFromManager({
        secretsManagerUrl: SECRETS_MANAGER_URL,
        bootstrapToken: BOOTSTRAP_TOKEN,
        serviceName: SERVICE_NAME,
        logger: console,
    });
}
