import dotenv from 'dotenv';
import { z } from 'zod';
import crypto from 'crypto';

// Load environment variables from .env file
dotenv.config();

export function createEnvSchema(sourceEnv: Record<string, string | undefined> = process.env) {
  return z
    .object({
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      PORT: z.union([z.coerce.number().int().positive(), z.string()]).default(4000),
      DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
      REDIS_URL: z.string().default('redis://localhost:6379'),
      JWT_ACCESS_SECRET: z
        .string()
        .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long')
        .default(() => {
          if (sourceEnv.NODE_ENV === 'production') {
            return crypto.randomBytes(32).toString('hex');
          }
          return 'default_access_secret_for_dev_min_32_chars_12345';
        }),
      JWT_REFRESH_SECRET: z
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long')
        .default(() => {
          if (sourceEnv.NODE_ENV === 'production') {
            return crypto.randomBytes(32).toString('hex');
          }
          return 'default_refresh_secret_for_dev_min_32_chars_12345';
        }),
      JWT_RESET_SECRET: z
        .string()
        .min(32, 'JWT_RESET_SECRET must be at least 32 characters long')
        .default(() => {
          if (sourceEnv.JWT_REFRESH_SECRET && !sourceEnv.JWT_REFRESH_SECRET.includes('default_refresh_secret')) {
            return crypto.createHmac('sha256', sourceEnv.JWT_REFRESH_SECRET).update('reset_secret_key_salt').digest('hex');
          }
          if (sourceEnv.NODE_ENV === 'production') {
            return crypto.randomBytes(32).toString('hex');
          }
          return 'default_reset_secret_for_dev_min_32_chars_123456';
        }),
      JWT_ACCESS_TTL: z.string().default('15m'),
      REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
      CORS_ALLOWED_ORIGINS: z
        .string()
        .default(sourceEnv.CORS_ORIGIN || sourceEnv.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173'),
      S3_ENDPOINT: z.string().optional(),
      S3_BUCKET: z.string().optional(),
      S3_ACCESS_KEY: z.string().optional(),
      S3_SECRET_KEY: z.string().optional(),
      SENTRY_DSN: z.string().optional(),
      LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info'),
      ADMIN_EMAIL: z.string().email().optional(),
      ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters').optional(),
      ADMIN_MOBILE: z.string().optional(),
      STANDARD_USER_EMAIL: z.string().email().optional(),
      STANDARD_USER_PASSWORD: z.string().min(8, 'STANDARD_USER_PASSWORD must be at least 8 characters').optional(),
      USER_EMAIL: z.string().email().optional(),
      USER_PASSWORD: z.string().min(8, 'USER_PASSWORD must be at least 8 characters').optional(),
    })
    .refine(
      (data) => {
        // In production, enforce non-default security-relevant credentials
        if (data.NODE_ENV === 'production') {
          if (data.JWT_ACCESS_SECRET.includes('default_access_secret')) return false;
          if (data.JWT_REFRESH_SECRET.includes('default_refresh_secret')) return false;
          if (data.JWT_RESET_SECRET.includes('default_reset_secret')) return false;
        }
        return true;
      },
      {
        message:
          'Production deployments must provide unique, non-default JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and JWT_RESET_SECRET',
        path: ['JWT_ACCESS_SECRET'],
      }
    );
}

export const envSchema = createEnvSchema(process.env);

export type Env = z.infer<typeof envSchema>;

export function validateEnv(customEnv?: Record<string, string | undefined>): Env {
  const source = customEnv || process.env;
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`\n[ERROR] Environment variable validation failed:\n${formattedErrors}\n`);
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }

  return result.data;
}

export const env: Env = validateEnv();
