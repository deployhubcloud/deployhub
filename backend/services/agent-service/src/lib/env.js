const required = [
    'NODE_ENV', 'PORT',
    'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD',
    'INTERNAL_SECRET',
    'PROJECT_SERVICE_URL', 'BUILD_SERVICE_URL',
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    }
}

const hasGeminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEY_2;

if (!hasGeminiKey) {
    throw new Error('Missing Env: GEMINI_API_KEY (or GEMINI_API_KEYS / GEMINI_API_KEY_2…)');
}

export const agentEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SERVICE_NAME: process.env.AGENT_SERVICE_NAME || 'agent-service',
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    INTERNAL_SERVICE_TALKING_SECRET: process.env.INTERNAL_SERVICE_TALKING_SECRET,
    IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL,
    PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL,
    BUILD_SERVICE_URL: process.env.BUILD_SERVICE_URL,
    DEPLOY_SERVICE_URL: process.env.DEPLOY_SERVICE_URL,
    ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
};
