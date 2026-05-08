import dotenv from 'dotenv';
dotenv.config();

const redquired = ['PORT', 'NODE_ENV', 'SERVICE_NAME', 'SECRETS_MANAGER_URL', 'BOOTSTRAP_TOKEN', 'MONGODB_URI', 'REDIS_HOST',
    'REDIS_PORT', 'REDIS_PASSWORD', 'INTERNAL_SERVICE_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RABBITMQ_URL'
]

for (const key of redquired) {
    if (!process.env[key]) {
        throw new Error(`key missing ${key}`)
    }
}

export const project_env = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    SERVICE_NAME: process.env.SERVICE_NAME,
    SECRETS_MANAGER_URL: process.env.SECRETS_MANAGER_URL,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RABBITMQ_URL: process.env.RABBITMQ_URL
};