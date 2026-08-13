const required = [
    'NODE_ENV', 'PORT',
    'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD',
    'INTERNAL_SECRET', 'INTERNAL_SERVICE_TALKING_SECRET',
    'IDENTITY_SERVICE_URL', 'PROJECT_SERVICE_URL',
    'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS',
    'ADMIN_ID', 'ADMIN_PASSWORD', 'ADMIN_EMAIL', 'ADMIN_SESSION_SECRET',
    'MONGODB_URI',
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    }
}

export const adminEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SERVICE_NAME: process.env.ADMIN_SERVICE_NAME || 'admin-service',
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    INTERNAL_SERVICE_TALKING_SECRET: process.env.INTERNAL_SERVICE_TALKING_SECRET,
    IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL,
    PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL,
    BUILD_SERVICE_URL: process.env.BUILD_SERVICE_URL,
    DEPLOY_SERVICE_URL: process.env.DEPLOY_SERVICE_URL,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    ADMIN_ID: process.env.ADMIN_ID,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174',
    MONGODB_URI: process.env.MONGODB_URI,
    BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 10),
};
