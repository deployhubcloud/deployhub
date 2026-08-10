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

const hasGroqKey =
    process.env.GROQ_API_KEY ||
    process.env.GROQ_API_KEYS ||
    process.env.GROQ_API_KEY_2;

if (!hasGroqKey) {
    throw new Error('Missing Env: GROQ_API_KEY (or GROQ_API_KEYS / GROQ_API_KEY_2…)');
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
    MONITORING_SERVICE_URL: process.env.MONITORING_SERVICE_URL,
    ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
};
