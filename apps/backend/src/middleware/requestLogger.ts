import pinoHttp from 'pino-http';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as any).id || (req.headers['x-request-id'] as string),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => {
      // In test mode or health endpoints, suppress routine access log noise
      if (env.NODE_ENV === 'test') return true;
      if (req.url === '/healthz' || req.url === '/readyz') return true;
      return false;
    },
  },
});

export default requestLogger;
