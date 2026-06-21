import dotenv from 'dotenv';
dotenv.config({
    quiet: true
});


const requiredEnvVars = [
    "INTERNAL_SECRET",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "BOOTSTRAP_TOKEN",
    "SECRETS_MANAGER_URL",
    "PORT",
    "NODE_ENV",
    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",
    "FRONTEND_URI",
    'STREAM_SERVICE_NAME'
]

for (const env of requiredEnvVars) {
    if (!process.env[env]) {
        throw new Error(`Missing Env Var: ${env}`);
    }
}

export const env = {
    NODE_ENV: process.env.NODE_ENV,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    SECRETS_MANAGER_URL: process.env.SECRETS_MANAGER_URL,
    STREAM_SERVICE_NAME: process.env.STREAM_SERVICE_NAME,
    PORT: process.env.PORT,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
    FRONTEND_URL: process.env.FRONTEND_URL,
};
