import { z } from 'zod';
import dotenv from 'dotenv'


// env
dotenv.config({
  quiet: true
})

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  SERVICE_NAME: z.string().default('secrets-manager'),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default('6379'),
  REDIS_PASSWORD: z.string(),


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
  PROJECT_SERVICE_MONGODB_URI: z.string().min(1),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  DEVLOAD_API_KEY: z.string().optional(),
  DEVLOAD_PROJECT_ID: z.string().optional(),

  FRONTEND_URL: z.string(),

  RABBITMQ_URL: z.string()
})

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌  Secrets Manager — Missing/invalid env vars:\n');
  parsed.error.issues.forEach((i) => {
    console.error(`   • ${i.path.join('.')}: ${i.message}`);
  });
  console.error('\nFix .env and restart.\n');
  process.exit(1);
}

export const env = parsed.data;
