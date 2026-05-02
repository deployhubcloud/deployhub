import dotenv from 'dotenv';
import { logger } from './logger.bootstrap.js';


dotenv.config();


const SECRETS_MANAGER_URL = process.env.SECRETS_MANAGER_URL;
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_TOKEN;
const SERVICE_NAME = process.env.SERVICE_NAME;

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;


export async function loadSecrets() {
    if (!BOOTSTRAP_TOKEN) {
        throw new Error('BOOTSTRAP_TOKEN missing in .env — cannot fetch secrets');
    }

    logger.info(`Fetching secrets for '${SERVICE_NAME}' from secrets-manager...`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(
                `${SECRETS_MANAGER_URL}/api/v1/secrets/${SERVICE_NAME}`,
                {
                    method: 'GET',
                    headers: {
                        'X-Bootstrap-Token': BOOTSTRAP_TOKEN,
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(8000),
                }
            );

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(`Secrets manager responded ${response.status}: ${body.message || 'unknown'}`);
            }

            const { secrets } = await response.json();

            if (!secrets || typeof secrets !== 'object') {
                throw new Error('Invalid secrets payload received');
            }


            let injectedCount = 0;
            for (const [key, value] of Object.entries(secrets)) {
                if (!process.env[key]) {
                    process.env[key] = value;
                    injectedCount++;
                }
            }

            logger.info(`Secrets loaded — ${injectedCount} vars injected`, {
                service: SERVICE_NAME,
                attempt,
            });
            return;

        } catch (err) {
            logger.warn(`Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);

            if (attempt === MAX_RETRIES) {
                throw new Error(
                    `Failed to load secrets after ${MAX_RETRIES} attempts. Is secrets-manager running?`
                );
            }

            await new Promise((r) => setTimeout(r, RETRY_DELAY));
        }
    }
}