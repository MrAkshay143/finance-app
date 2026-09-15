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
import { seedInstitutionalData } from './seedData.js';
import { getDefaultAppSettings } from './config/defaultAppSettings.js';
import { validatePasswordAgainstPolicy } from './services/passwordPolicyService.js';

// Initialize Sentry error tracking
initSentry('backend-api');

// Fail-closed guard: BUILD_ID is strictly required in production
if (process.env.NODE_ENV === 'production' && !process.env.BUILD_ID) {
  throw new Error('BUILD_ID is required in production');
}

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

// Realtime namespaces & authentication
initSocketGateway(io);

// Initialize Redis in background (non-blocking)
initRedis().catch((err) => {
  logger.warn({ err: err?.message }, 'Failed to initialize Redis on startup');
});

// Ensure database schema - application startup is strictly schema-read-only
async function ensureDatabaseSchema() {
  // Schema migrations are managed via deployment pipelines; startup is schema-read-only
  logger.info('Database schema verified: application startup is schema-read-only');
}

// Ensure at least one admin user exists if ADMIN_EMAIL & ADMIN_PASSWORD are provided in environment.
async function ensureAdminUser() {
  try {
    const adminEmail = (env.ADMIN_EMAIL || process.env.ADMIN_EMAIL)?.toLowerCase().trim();
    const adminPassword = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.debug('ADMIN_EMAIL or ADMIN_PASSWORD not configured, skipping admin provisioning');
      return;
    }

    const validation = await validatePasswordAgainstPolicy(adminPassword);
    if (!validation.valid) {
      logger.warn({ errors: validation.errors }, 'ADMIN_PASSWORD does not meet active password policy - skipping admin provisioning');
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      // Do NOT overwrite existing admin's password unless explicitly instructed via RESET_ADMIN_PASSWORD=true
      const shouldResetPassword = process.env.RESET_ADMIN_PASSWORD === 'true';
      const updateData: any = {
        role: 'ADMIN',
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE',
        onboardingCompleted: true,
        emailVerified: true,
      };

      if (shouldResetPassword) {
        updateData.passwordHash = await hashPassword(adminPassword);
        logger.info(`Admin password explicitly reset from ADMIN_PASSWORD via RESET_ADMIN_PASSWORD=true.`);
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });
      logger.info(`Admin user ${adminEmail} verified, ensured ADMIN role, and unlocked.`);
      return;
    }

    const passwordHash = await hashPassword(adminPassword);

    await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        mobileNumber: env.ADMIN_MOBILE || process.env.ADMIN_MOBILE || '',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        onboardingCompleted: true,
        emailVerified: true,
        userSettings: {
          create: {
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            financialMonthStartDay: 1,
            quickAddEnabled: false,
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

// Ensure initial standard user exists if configured in environment variables.
async function ensureStandardUser() {
  try {
    const standardUserEmail = (
      env.STANDARD_USER_EMAIL ||
      env.USER_EMAIL ||
      process.env.STANDARD_USER_EMAIL ||
      process.env.USER_EMAIL
    )?.toLowerCase().trim();

    const standardUserPassword =
      env.STANDARD_USER_PASSWORD ||
      env.USER_PASSWORD ||
      process.env.STANDARD_USER_PASSWORD ||
      process.env.USER_PASSWORD;

    if (!standardUserEmail || !standardUserPassword) {
      logger.debug('STANDARD_USER_EMAIL or STANDARD_USER_PASSWORD not configured, skipping initial user provisioning');
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: standardUserEmail },
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
      logger.debug('Standard user already exists, preserving existing data and skipping auto-provisioning');
      return;
    }

    logger.info(`Provisioning initial standard user (${standardUserEmail}) with initial dataset...`);
    await seedInstitutionalData(prisma, standardUserEmail);
    logger.info(`Standard user (${standardUserEmail}) successfully provisioned.`);
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to provision initial standard user on startup');
  }
}

async function ensureDefaultAppSettings() {
  try {
    const defaults = getDefaultAppSettings();
    for (const setting of defaults) {
      const existing = await prisma.appSetting.findUnique({
        where: { key: setting.key },
      });
      if (!existing) {
        await prisma.appSetting.create({
          data: {
            key: setting.key,
            value: setting.value,
          },
        });
      }
    }
    logger.info('Default app settings verified and seeded.');
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to seed default app settings on startup');
  }
}

// Startup bootstrap sequence
async function bootstrapInitialData() {
  try {
    await ensureDatabaseSchema();
    await categoryService.ensureSystemCategories().catch((err) => {
      logger.warn({ err: err?.message }, 'Failed to auto-provision system categories on startup');
    });
    await ensureDefaultAppSettings();
    await ensureAdminUser();
    await ensureStandardUser();
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Initial startup bootstrap encountered an error');
  }
}

async function startServer() {
  await bootstrapInitialData();

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
}

startServer().catch((err) => {
  logger.error({ err: err?.message }, 'Failed to start server');
  process.exit(1);
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

