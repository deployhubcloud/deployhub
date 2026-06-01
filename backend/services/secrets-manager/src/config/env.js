import { z } from 'zod';
import dotenv from 'dotenv'


// env
dotenv.config({
  quiet: true
})

const schema = z.object({

  //port of all services
  API_GATEWAY_PORT: z.coerce.number().default(4999),
  IDENTITY_SERVICE_PORT: z.coerce.number().default(4001),
  PROJECT_SERVICE_PORT: z.coerce.number().default(4002),
  BUILD_SERVICE_PORT: z.coerce.number().default(4003),
  DEPLOY_SERVICE_PORT: z.coerce.number().default(4004),
  DOMAIN_SERVICE_PORT: z.coerce.number().default(4005),
  NOTIFICATION_SERVICE_PORT: z.coerce.number().default(4006),
  MONITORING_SERVICE_PORT: z.coerce.number().default(4007),


  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  SERVICE_NAME: z.string().default('secrets-manager'),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default('6379'),
  REDIS_PASSWORD: z.string(),
  REDIS_URL: z.string().optional(),


  BOOTSTRAP_TOKEN: z.string().min(32, 'BOOTSTRAP_TOKEN too short — min 32 chars'),


  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  GITHUB_TOKEN_ENCRYPTION_KEY: z.string().length(64, 'Must be 32 bytes = 64 hex chars'),

  INTERNAL_SERVICE_SECRET: z.string().min(32),

  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(465),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().min(1),

  IDENTITY_SERVICE_MONGODB_URI: z.string().min(1),
  BUILD_SERVICE_MONGODB_URI: z.string().min(1),
  DEPLOY_SERVICE_MONGODB_URI: z.string().min(1),
  PROJECT_SERVICE_MONGODB_URI: z.string().min(1),
  MONITORING_MONGODB_URI: z.string().min(1),
  NOTIFICATION_MONGODB_URI: z.string().min(1),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  DEVLOAD_API_KEY: z.string().optional(),
  DEVLOAD_PROJECT_ID: z.string().optional(),

  FRONTEND_URL: z.string(),

  RABBITMQ_URL: z.string(),

  // url of services
  IDENTITY_SERVICE_URL: z.string(),
  PROJECT_SERVICE_URL: z.string().optional(),
  MONITORING_SERVICE_URL: z.string().optional(),
  BUILD_SERVICE_URL: z.string().optional(),
  DEPLOY_SERVICE_URL: z.string().optional(),
  DOMAIN_SERVICE_URL: z.string().optional(),

  INTERNAL_SERVICE_TALKING_SECRET: z.string().min(32),

  BCRYPT_ROUNDS: z.coerce.number().default(10)
})

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌  Secrets Manager — Missing/invalid env vars:\n');
  parsed.error.issues.forEach((i) => {
    console.error(`   • ${i.path.join('.')}: ${i.message}`);
  });
  console.error('\nFix .env and restart.\n');
  throw new Error('Secrets Manager missing/invalid env vars');
}

export const env = parsed.data;
