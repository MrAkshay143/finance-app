import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { initRedis, closeRedis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';

// Initialize Sentry error tracking stub respecting SENTRY_DSN per Plan/backend.md §11
initSentry('backend-api');

const port = env.PORT;
const app = createApp();
const server = http.createServer(app);

const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    credentials: true,
  },
});

import { initSocketGateway } from './sockets/socketGateway.js';

// Realtime namespaces & authentication per Plan/architecture.md §6
initSocketGateway(io);

// Initialize Redis in background (non-blocking)
initRedis().catch((err) => {
  logger.warn({ err: err?.message }, 'Failed to initialize Redis on startup');
});

server.listen(port, '0.0.0.0', () => {
  logger.info(`Finance Tracker backend running on port ${port} (0.0.0.0) in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Force exit after 10 seconds if connections hang
  const forceTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s, forcing exit');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      io.close();
      await prisma.$disconnect();
      await closeRedis();
      logger.info('All database and cache connections closed gracefully');
      process.exit(0);
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server, io };
