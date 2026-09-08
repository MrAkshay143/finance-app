import { startRecurringWorker, stopRecurringWorker } from './jobs/recurringWorker.js';
import { startReminderWorker, stopReminderWorker } from './jobs/reminderWorker.js';
import { logger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { initRedis, closeRedis } from './lib/redis.js';

// Initialize Sentry error tracking stub respecting SENTRY_DSN per Plan/backend.md §11
initSentry('worker');

logger.info('Finance Tracker BullMQ worker starting...');

// Initialize Redis and BullMQ workers
initRedis()
  .then(() => {
    startRecurringWorker();
    startReminderWorker();
    logger.info('BullMQ workers initialized and active');
  })
  .catch((err) => {
    logger.warn({ err: err?.message }, 'BullMQ worker initialization fallback active');
  });

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  logger.info(`Worker received ${signal}, shutting down...`);
  await stopRecurringWorker();
  await stopReminderWorker();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
