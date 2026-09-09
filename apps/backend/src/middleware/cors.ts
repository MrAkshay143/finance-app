import cors from 'cors';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // Allow explicit wildcard for development environments only
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow only explicitly whitelisted origins (SEC-08)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn({ origin }, 'CORS blocked request from disallowed origin');
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Correlation-Id',
    'X-API-Version',
  ],
  exposedHeaders: ['X-Request-Id', 'X-API-Version', 'Retry-After'],
});

export default corsMiddleware;
