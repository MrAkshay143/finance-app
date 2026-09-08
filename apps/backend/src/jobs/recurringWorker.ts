import { Worker, Job } from 'bullmq';
import { recurringService } from '../services/recurringService.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { bullmqJobsTotal } from '../lib/metrics.js';

export async function processRecurringJob(job?: Job): Promise<{ materializedCount: number }> {
  const asOfDate = job?.data?.asOfDate ? new Date(job.data.asOfDate) : new Date();
  logger.info({ asOfDate: asOfDate.toISOString() }, 'Running recurring transactions materialization job');
  const result = await recurringService.materializeDueTransactions(asOfDate);
  logger.info({ materializedCount: result.materializedCount }, 'Completed recurring transactions materialization');
  return { materializedCount: result.materializedCount };
}

let recurringWorkerInstance: Worker | null = null;

export function startRecurringWorker(): Worker | null {
  try {
    const connection = {
      url: env.REDIS_URL,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    };

    recurringWorkerInstance = new Worker(
      'recurring-transactions',
      async (job: Job) => {
        return processRecurringJob(job);
      },
      {
        connection,
        concurrency: 1,
      }
    );

    recurringWorkerInstance.on('completed', (job) => {
      bullmqJobsTotal.inc({ queue: 'recurring-transactions', status: 'completed' });
      logger.info({ jobId: job.id }, 'Recurring transaction job completed');
    });

    recurringWorkerInstance.on('failed', (job, err) => {
      bullmqJobsTotal.inc({ queue: 'recurring-transactions', status: 'failed' });
      logger.error({ jobId: job?.id, err: err?.message }, 'Recurring transaction job failed');
    });

    recurringWorkerInstance.on('error', (err) => {
      logger.warn({ err: err?.message }, 'Recurring worker connection error (fallback active)');
    });

    return recurringWorkerInstance;
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to initialize BullMQ recurring worker; running in standalone mode');
    return null;
  }
}

export async function stopRecurringWorker(): Promise<void> {
  if (recurringWorkerInstance) {
    await recurringWorkerInstance.close();
    recurringWorkerInstance = null;
  }
}
