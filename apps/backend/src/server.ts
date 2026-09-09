import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { initRedis, closeRedis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';
import { hashPassword } from './lib/jwt.js';
import { categoryService } from './services/categoryService.js';

// Initialize Sentry error tracking stub respecting SENTRY_DSN per Plan/backend.md Section 11
initSentry('backend-api');

// Auto-provision system categories on server startup
categoryService.ensureSystemCategories().catch((err) => {
  logger.warn({ err: err?.message }, 'Failed to auto-provision system categories on startup');
});

const port = env.PORT;
const app = createApp();
const server = http.createServer(app);

const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());

const io = new SocketIOServer(server, {
  cors: {
    // Only allow explicitly whitelisted origins - no wildcard fallback (SEC-08)
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  },
});

import { initSocketGateway } from './sockets/socketGateway.js';

// Realtime namespaces & authentication per Plan/architecture.md Section 6
initSocketGateway(io);

// Initialize Redis in background (non-blocking)
initRedis().catch((err) => {
  logger.warn({ err: err?.message }, 'Failed to initialize Redis on startup');
});

// Ensure database column types support large payloads (e.g., avatar base64 images) on MySQL
async function ensureDatabaseSchema() {
  try {
    const isMysql = env.DATABASE_URL.startsWith('mysql');
    if (isMysql) {
      await prisma.$executeRawUnsafe('ALTER TABLE users MODIFY avatarUrl LONGTEXT');
      logger.info('Database schema verified: users.avatarUrl is LONGTEXT');
    }
  } catch (err: any) {
    // Expected/non-fatal if table doesn't exist yet
    logger.debug({ err: err?.message }, 'Database schema verification completed');
  }
}
ensureDatabaseSchema();

// Ensure at least one admin user exists. Only creates if NO admins exist at all.
// Never overwrites an existing admin's password - credentials must be changed via the app UI.
// Reads initial credentials from ADMIN_EMAIL / ADMIN_PASSWORD env vars with safe defaults.
async function ensureAdminUser() {
  try {
    // Check if ANY admin user already exists - if so, do nothing
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      logger.debug('Admin user already exists, skipping auto-provisioning');
      return;
    }

    // First boot: create the initial admin from environment variables only
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.warn(
        'No admin users found and ADMIN_EMAIL / ADMIN_PASSWORD env vars are not set - skipping admin provisioning'
      );
      return;
    }

    if (adminPassword.length < 12) {
      logger.warn('ADMIN_PASSWORD is too short (min 12 chars) - skipping admin provisioning for security');
      return;
    }

    const passwordHash = await hashPassword(adminPassword);

    await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase().trim(),
        firstName: 'Admin',
        lastName: 'User',
        mobileNumber: process.env.ADMIN_MOBILE || '',
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
    logger.info(`Initial admin user provisioned: ${adminEmail} (role: ADMIN)`);
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to provision initial admin user on startup');
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
