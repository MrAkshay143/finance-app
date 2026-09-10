import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { requestId } from './middleware/requestId.js';
import { requestContextMiddleware } from './middleware/requestContext.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { optionalAuthenticate } from './middleware/authenticate.js';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware.js';
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

  // Request context storage for user-agent and client IP
  app.use(requestContextMiddleware);

  // 2. Prometheus HTTP metrics collection middleware
  app.use(metricsMiddleware);

  // 3. Helmet security headers (CSP disabled to allow Vite bundled assets)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 4. CORS with allowed origins
  app.use(corsMiddleware);

  // 5. JSON body parser with 10mb limit
  app.use(express.json({ limit: '10mb' }));

  // 6. Pino structured request logging
  app.use(requestLogger);

  // 7. Rate limiter (Redis-backed with in-memory fallback)
  app.use(rateLimiter);

  // Prometheus metrics endpoint per Plan/architecture.md Section 10
  app.get('/metrics', async (_req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err: any) {
      res.status(500).end(err?.message || 'Failed to collect Prometheus metrics');
    }
  });

  // Serve static SPA files if public/ directory exists
  const publicDir = process.env.PUBLIC_DIR || path.join(process.cwd(), 'public');
  const hasSpa = fs.existsSync(path.join(publicDir, 'index.html'));

  // Root endpoint: Serves SPA index.html for browsers/web clients, or JSON API info for API monitors
  app.get('/', (req: Request, res: Response) => {
    const isExplicitJson = req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html');
    if (hasSpa && !isExplicitJson) {
      return res.sendFile(path.resolve(publicDir, 'index.html'));
    }
    res.status(200).json({
      status: 'ok',
      service: 'Finance Tracker API',
      version: '1.0.0',
      health: '/healthz',
      ready: '/readyz',
      api: '/api/v1',
    });
  });

  // Health and readiness endpoints per Plan/architecture.md Section 10
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/readyz', async (_req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV !== 'test') {
        await prisma.$queryRaw`SELECT 1`;
      }
      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'unready', error: 'Database unreachable' });
    }
  });

  // Versioned API routes (/api/v1/...) with optional auth and maintenance mode
  app.use('/api/v1', optionalAuthenticate, maintenanceMiddleware, apiV1Router);

  // Serve uploaded files (e.g. compressed WebP avatars) statically
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const avatarsDir = path.resolve(uploadsDir, 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  // Serve static SPA files if public/ directory exists
  if (hasSpa) {
    app.use(express.static(publicDir, { maxAge: '1h', index: false }));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/metrics') ||
        req.path.startsWith('/healthz') ||
        req.path.startsWith('/readyz')
      ) {
        return next();
      }
      // Never serve index.html for missing static assets or scripts
      if (
        req.path.startsWith('/assets/') ||
        /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|webmanifest)$/i.test(req.path)
      ) {
        return res.status(404).type('text/plain').send('Asset not found');
      }
      res.sendFile(path.resolve(publicDir, 'index.html'));
    });
  }

  // Catch-all 404 handler for unknown routes
  app.use(notFoundHandler);

  // 8. Standard Error Handler (converts to envelope, never leaks stack traces)
  app.use(errorHandler);

  return app;
}

export default createApp;
