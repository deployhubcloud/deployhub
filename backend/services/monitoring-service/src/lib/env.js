import dotenv from 'dotenv';
dotenv.config({
    quiet: true
});


const requiredEnvVars = [
    "MONITORING_MONGODB_URI",
    "INTERNAL_SECRET",
    "INTERNAL_SERVICE_TALKING_SECRET",
    "PROJECT_SERVICE_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "BOOTSTRAP_TOKEN",
    "SECRETS_MANAGER_URL",
    "SERVICE_NAME",
    "PORT",
    "RABBITMQ_URL"
]

for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(`Missing Env Var: ${key}`);
    }
}

export const env = {
    MONITORING_MONGODB_URI: process.env.MONITORING_MONGODB_URI,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    INTERNAL_SERVICE_TALKING_SECRET: process.env.INTERNAL_SERVICE_TALKING_SECRET,
    PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    SECRETS_MANAGER_URL: process.env.SECRETS_MANAGER_URL,
    SERVICE_NAME: process.env.SERVICE_NAME,
    PORT: process.env.PORT
};
