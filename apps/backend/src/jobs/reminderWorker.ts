import { Worker, Job } from 'bullmq';
import { reminderService } from '../services/reminderService.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { bullmqJobsTotal } from '../lib/metrics.js';

export async function processReminderJob(job?: Job): Promise<{ checkedCount: number }> {
  const asOfDate = job?.data?.asOfDate ? new Date(job.data.asOfDate) : new Date();
  logger.info({ asOfDate: asOfDate.toISOString() }, 'Running reminder check job');
  const notifications = await reminderService.checkDueReminders(asOfDate);
  logger.info({ generatedCount: notifications.length }, 'Completed reminder check job');
  return { checkedCount: notifications.length };
}

let reminderWorkerInstance: Worker | null = null;

export function startReminderWorker(): Worker | null {
  try {
    const connection = {
      url: env.REDIS_URL,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    };

    reminderWorkerInstance = new Worker(
      'reminders',
      async (job: Job) => {
        return processReminderJob(job);
      },
      {
        connection,
        concurrency: 1,
      }
    );

    reminderWorkerInstance.on('completed', (job) => {
      bullmqJobsTotal.inc({ queue: 'reminders', status: 'completed' });
      logger.info({ jobId: job.id }, 'Reminder job completed');
    });

    reminderWorkerInstance.on('failed', (job, err) => {
      bullmqJobsTotal.inc({ queue: 'reminders', status: 'failed' });
      logger.error({ jobId: job?.id, err: err?.message }, 'Reminder job failed');
    });

    reminderWorkerInstance.on('error', (err) => {
      logger.warn({ err: err?.message }, 'Reminder worker connection error (fallback active)');
    });

    return reminderWorkerInstance;
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to initialize BullMQ reminder worker; running in standalone mode');
    return null;
  }
}

export async function stopReminderWorker(): Promise<void> {
  if (reminderWorkerInstance) {
    await reminderWorkerInstance.close();
    reminderWorkerInstance = null;
  }
}
