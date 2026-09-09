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
import { seedRealWorldData } from './seed-realworld.js';

// Initialize Sentry error tracking stub respecting SENTRY_DSN per Plan/backend.md Section 11
initSentry('backend-api');

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

// Ensure at least one admin user exists. Creates initial admin or unlocks/syncs if required.
// Reads initial credentials from ADMIN_EMAIL / ADMIN_PASSWORD env vars with safe defaults.
async function ensureAdminUser() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'contact@imakshay.in').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Password123';

    if (adminPassword.length < 12) {
      logger.warn('ADMIN_PASSWORD is too short (min 12 chars) - skipping admin provisioning for security');
      return;
    }

    const passwordHash = await hashPassword(adminPassword);

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      // If user exists, ensure they have ADMIN role and clear any test lockout
      if (existingUser.role !== 'ADMIN' || existingUser.lockedUntil || existingUser.failedLoginAttempts > 0) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'ADMIN',
            passwordHash,
            failedLoginAttempts: 0,
            lockedUntil: null,
            status: 'ACTIVE',
            onboardingCompleted: true,
          },
        });
        logger.info(`Admin user ${adminEmail} verified, promoted to ADMIN, and unlocked.`);
      }
      return;
    }

    await prisma.user.create({
      data: {
        email: adminEmail,
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

// Ensure initial standard user exists with populated institutional financial dataset.
// Only creates if user akshay@gmail.com does not already exist in the database.
async function ensureDemoUser() {
  try {
    const demoEmail = (process.env.DEMO_USER_EMAIL || 'akshay@gmail.com').toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: demoEmail },
    });
    if (existing) {
      if (existing.lockedUntil || existing.failedLoginAttempts > 0) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      }
      logger.debug('Standard user already exists, skipping auto-provisioning');
      return;
    }

    logger.info(`Provisioning initial standard user (${demoEmail}) with institutional dataset...`);
    await seedRealWorldData(prisma);
    logger.info(`Standard user (${demoEmail}) successfully provisioned.`);
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to provision initial standard user on startup');
  }
}

// Startup bootstrap sequence
async function bootstrapInitialData() {
  try {
    await ensureDatabaseSchema();
    await categoryService.ensureSystemCategories().catch((err) => {
      logger.warn({ err: err?.message }, 'Failed to auto-provision system categories on startup');
    });
    await ensureAdminUser();
    await ensureDemoUser();
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Initial startup bootstrap encountered an error');
  }
}
bootstrapInitialData();

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
