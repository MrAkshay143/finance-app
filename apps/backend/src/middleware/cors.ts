import cors from 'cors';
import { env } from '../config/env.js';

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
    // Allow wildcard or explicit origin match
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
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
