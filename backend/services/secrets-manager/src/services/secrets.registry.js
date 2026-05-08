

import { env } from '../config/env.js';

export function getSecretsForService(serviceName) {
  const registry = {


    'identity-service': {
      MONGODB_URI: env.IDENTITY_SERVICE_MONGODB_URI,

      REDIS_HOST: env.REDIS_HOST,
      REDIS_PORT: env.REDIS_PORT,
      REDIS_PASSWORD: env.REDIS_PASSWORD,

      ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_EXPIRY: env.ACCESS_TOKEN_EXPIRY,
      REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET,
      REFRESH_TOKEN_EXPIRY: env.REFRESH_TOKEN_EXPIRY,

      GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
      GITHUB_TOKEN_ENCRYPTION_KEY: env.GITHUB_TOKEN_ENCRYPTION_KEY,

      EMAIL_HOST: env.EMAIL_HOST,
      EMAIL_PORT: String(env.EMAIL_PORT),
      EMAIL_USER: env.EMAIL_USER,
      EMAIL_PASS: env.EMAIL_PASS,

      INTERNAL_SECRET: env.INTERNAL_SERVICE_SECRET,

      DEVLOAD_API_KEY: env.DEVLOAD_API_KEY || '',
      DEVLOAD_PROJECT_ID: env.DEVLOAD_PROJECT_ID || '',

      RABBITMQ_URL: env.RABBITMQ_URL,

      FRONTEND_URL: env.FRONTEND_URL,
    },


    'build-service': {
      MONGODB_URI: env.BUILD_SERVICE_MONGODB_URI,
      REDIS_URL: env.REDIS_URL,
      INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET,
    },


    'project-service': {
      MONGODB_URI: env.PROJECT_SERVICE_MONGODB_URI,
      REDIS_HOST: env.REDIS_HOST,
      REDIS_PORT: env.REDIS_PORT,
      REDIS_PASSWORD: env.REDIS_PASSWORD,
      INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET,
      RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID || '',
      RAZORPAY_KEY_SECRET: env.RAZORPAY_KEY_SECRET || '',
      RABBITMQ_URL: env.RABBITMQ_URL,
    },


    'deploy-service': {
      MONGODB_URI: env.BUILD_SERVICE_MONGODB_URI,
      REDIS_URL: env.REDIS_URL,
      INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET,
    },


    'domain-service': {
      MONGODB_URI: env.PROJECT_SERVICE_MONGODB_URI,
      REDIS_URL: env.REDIS_URL,
      INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET,
    },

    'api-gateway': {
      REDIS_HOST: env.REDIS_HOST,
      REDIS_PORT: env.REDIS_PORT,
      REDIS_PASSWORD: env.REDIS_PASSWORD,
      AUTH_SERVICE: env.AUTH_SERVICE || '',
      INTERNAL_SECRET: env.INTERNAL_SERVICE_SECRET,
      FRONTEND_URL: env.FRONTEND_URL,
      ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_EXPIRY: env.ACCESS_TOKEN_EXPIRY
    }

  };

  return registry[serviceName] ?? null;
}


export function getRegisteredServices() {
  return [
    'identity-service',
    'build-service',
    'project-service',
    'deploy-service',
    'domain-service',
    'api-gateway',
  ];
}
