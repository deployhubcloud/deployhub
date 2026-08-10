const required = [
    'NODE_ENV', 'PORT', 'ANALYTICS_SERVICE_NAME',
    'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD',
    'INTERNAL_SECRET',
    'INTERNAL_SERVICE_TALKING_SECRET',
    'PROJECT_SERVICE_URL',
    'DOCKER_USERNAME', 'DOCKER_PASSWORD',
]

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    }
};

export const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    INTERNAL_SERVICE_TALKING_SECRET: process.env.INTERNAL_SERVICE_TALKING_SECRET,
    PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL,
    SERVICE_NAME: process.env.ANALYTICS_SERVICE_NAME,
    DOCKER_USERNAME: process.env.DOCKER_USERNAME,
    DOCKER_PASSWORD: process.env.DOCKER_PASSWORD,
}
