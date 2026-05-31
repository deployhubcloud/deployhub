import dotenv from 'dotenv';
dotenv.config({
    quiet: true
});


const requiredEnvVars = [
    "MONITORING_MONGODB_URI",
    "INTERNAL_SERVICE_SECRET",
    "INTERNAL_SERVICE_TALKING_SECRET",
    "EMAIL_PASS",
    "EMAIL_USER",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "BOOTSTRAP_TOKEN",
    "SECRETS_MANAGER_URL",
    "SERVICE_NAME",
    "PORT",
    "RABBITMQ_URL"
]

for (const env of requiredEnvVars){
    if(!process.env[env]){
        throw new Error(`Missing Env Var: ${env}`);
    }
}

export const env = {
    MONITORING_MONGODB_URI: process.env.MONITORING_MONGODB_URI,
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
    INTERNAL_SERVICE_TALKING_SECRET: process.env.INTERNAL_SERVICE_TALKING_SECRET,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    SECRETS_MANAGER_URL: process.env.SECRETS_MANAGER_URL,
    SERVICE_NAME: process.env.SERVICE_NAME,
    PORT: process.env.PORT,
    RABBITMQ_URL: process.env.RABBITMQ_URL
};