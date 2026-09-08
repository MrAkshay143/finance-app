import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { requestId } from './middleware/requestId.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiV1Router } from './routes/index.js';
import { register } from './lib/metrics.js';
import { prisma } from './lib/prisma.js';

// Ensure BigInt values can be serialized to JSON without TypeError
if (!('toJSON' in BigInt.prototype)) {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value() {
      return this.toString();
    },
    writable: true,
    configurable: true,
  });
}

export function createApp(): Express {
  const app = express();

  // Trust first proxy (e.g. Nginx, Cloudflare, AWS ALB) for correct client IP detection
  app.set('trust proxy', 1);

  // 1. Request ID correlation middleware
  app.use(requestId);

  // 2. Prometheus HTTP metrics collection middleware
  app.use(metricsMiddleware);

  // 3. Helmet security headers
  app.use(helmet());

  // 4. CORS with allowed origins
  app.use(corsMiddleware);

  // 5. JSON body parser with 10mb limit
  app.use(express.json({ limit: '10mb' }));

  // 6. Pino structured request logging
  app.use(requestLogger);

  // 7. Rate limiter (Redis-backed with in-memory fallback)
  app.use(rateLimiter);

  // Prometheus metrics endpoint per Plan/architecture.md §10
  app.get('/metrics', async (_req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err: any) {
      res.status(500).end(err?.message || 'Failed to collect Prometheus metrics');
    }
  });

  // Health and readiness endpoints per Plan/architecture.md §10
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/readyz', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'unready', error: 'Database unreachable' });
    }
  });

  // Versioned API routes (/api/v1/...)
  app.use('/api/v1', apiV1Router);

  // Catch-all 404 handler for unknown routes
  app.use(notFoundHandler);

  // 8. Standard Error Handler (converts to envelope, never leaks stack traces)
  app.use(errorHandler);

  return app;
}

export default createApp;
