const requiredEnv = [
    'NODE_ENV',
    'PORT',
    'FRONTEND_URL',
    'REDIS_PORT', 'REDIS_HOST', 'REDIS_PASSWORD',
    'ACCESS_TOKEN_SECRET', 'ACCESS_TOKEN_EXPIRY',
    'INTERNAL_SECRET',
    'SERVICE_NAME',
    'AUTH_SERVICE', 'PROJECT_SERVICE', 'MONITORING_SERVICE',
    'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS']

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`missing env${key}`)
    }
};

export const ENV = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    FRONTEND_URI: process.env.FRONTEND_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    SERVICES_URL: {
        AUTH: process.env.AUTH_SERVICE,
        PROJECT: process.env.PROJECT_SERVICE,
        MONITORING: process.env.MONITORING_SERVICE
    },
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    SERVICE_NAME: process.env.SERVICE_NAME,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
}
