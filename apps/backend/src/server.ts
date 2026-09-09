import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { initRedis, closeRedis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';
import { hashPassword } from './lib/jwt.js';

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

// Ensure database column types support large payloads (e.g., avatar base64 images)
async function ensureDatabaseSchema() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE users MODIFY avatarUrl LONGTEXT');
    logger.info('Database schema verified: users.avatarUrl is LONGTEXT');
  } catch (err: any) {
    // Expected/non-fatal if running on PostgreSQL where TEXT is used, or if table doesn't exist yet
    logger.debug({ err: err?.message }, 'Database schema verification completed');
  }
}
ensureDatabaseSchema();

// Ensure dedicated admin user exists with requested credentials
async function ensureAdminUser() {
  try {
    const adminEmail = 'contact@imakshay.in';
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    const passwordHash = await hashPassword('Pass@12345');

    if (!existing) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          firstName: 'Akshay',
          lastName: 'Admin',
          mobileNumber: '+919876543210',
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          onboardingCompleted: true,
          userSettings: {
            create: {
              currency: 'INR',
              timezone: 'Asia/Kolkata',
              financialMonthStartDay: 1,
              quickAddEnabled: true,
              dashboardDonutsConfig: { income: true, expense: true, investment: true },
              featuresConfig: { investments: true, recurring: true },
            },
          },
          financeProfile: {
            create: {
              monthlyIncome: BigInt(0),
              monthlyExpenseBudget: BigInt(0),
              monthlyInvestmentTarget: BigInt(0),
              riskAppetite: 'MEDIUM',
              investmentHorizon: 'MEDIUM',
            },
          },
        },
      });
      logger.info(`Admin user created successfully: ${adminEmail} (role: ADMIN)`);
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'ADMIN',
          passwordHash,
          status: 'ACTIVE',
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      logger.info(`Admin user verified & updated: ${adminEmail} (role: ADMIN)`);
    }
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to verify admin user on startup');
  }
}
ensureAdminUser();

const isSocket = typeof port === 'string' && (port.startsWith('/') || port.startsWith('\\\\.\\pipe\\') || isNaN(Number(port)));

if (isSocket) {
  server.listen(port, () => {
    logger.info(`Finance Tracker backend running on socket ${port} in ${env.NODE_ENV} mode`);
  });
} else {
  const numericPort = Number(port) || 4000;
  server.listen(numericPort, '0.0.0.0', () => {
    logger.info(`Finance Tracker backend running on port ${numericPort} (0.0.0.0) in ${env.NODE_ENV} mode`);
  });
}

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
