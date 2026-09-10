import { Queue } from 'bullmq';
import { startRecurringWorker, stopRecurringWorker } from './jobs/recurringWorker.js';
import { startReminderWorker, stopReminderWorker } from './jobs/reminderWorker.js';
import { logger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { initRedis, closeRedis } from './lib/redis.js';
import { env } from './config/env.js';

// Initialize Sentry error tracking stub respecting SENTRY_DSN per Plan/backend.md §11
initSentry('worker');

logger.info('Finance Tracker BullMQ worker starting...');

let recurringQueue: Queue | null = null;
let reminderQueue: Queue | null = null;

async function setupSchedulers(): Promise<void> {
  try {
    const connection = {
      url: env.REDIS_URL,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    };

    recurringQueue = new Queue('recurring-transactions', { connection });
    reminderQueue = new Queue('reminders', { connection });

    // Schedule hourly recurring transaction check
    await recurringQueue.add(
      'recurring-hourly',
      {},
      {
        repeat: { pattern: '0 * * * *' },
        jobId: 'recurring-hourly-job',
        removeOnComplete: true,
        removeOnFail: 100,
      }
    );

    // Schedule daily reminder checks (08:00 UTC)
    await reminderQueue.add(
      'reminders-daily',
      {},
      {
        repeat: { pattern: '0 8 * * *' },
        jobId: 'reminders-daily-job',
        removeOnComplete: true,
        removeOnFail: 100,
      }
    );

    logger.info('BullMQ repeatable schedulers registered successfully');
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to configure BullMQ repeatable job schedulers');
  }
}

// Initialize Redis and BullMQ workers
initRedis()
  .then(async () => {
    startRecurringWorker();
    startReminderWorker();
    await setupSchedulers();
    logger.info('BullMQ workers and schedulers initialized and active');
  })
  .catch((err) => {
    logger.warn({ err: err?.message }, 'BullMQ worker initialization fallback active');
  });

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  logger.info(`Worker received ${signal}, shutting down...`);
  try {
    if (recurringQueue) {
      await recurringQueue.close();
      recurringQueue = null;
    }
    if (reminderQueue) {
      await reminderQueue.close();
      reminderQueue = null;
    }
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Error closing BullMQ queues during shutdown');
  }
  await stopRecurringWorker();
  await stopReminderWorker();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

