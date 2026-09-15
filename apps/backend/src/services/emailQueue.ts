// INFRA-003 / EMAIL-003: BullMQ email queue worker. Provides a durable, async email queue backed by Redis. When Redis is unavailable, falls back to inline (synchronous) send. Job types: - password_reset - welcome - security_alert - account_locked - session_warning - custom (for sendTemplatedEmail)
import { Queue, Worker, Job, type ConnectionOptions } from 'bullmq';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export interface EmailJobData {
  type: 'password_reset' | 'welcome' | 'security_alert' | 'account_locked' | 'session_warning' | 'custom';
  to: string;
  subject?: string;
  templateKey?: string;
  variables?: Record<string, string>;
  userId?: string;
  // Inline HTML — used when templateKey not set
  htmlContent?: string;
  textContent?: string;
}

const QUEUE_NAME = 'email-queue';
let emailQueue: Queue<EmailJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;

function getRedisConnection(): ConnectionOptions {
  // Parse REDIS_URL → { host, port, password }
  try {
    const url = new URL(env.REDIS_URL);
    const conn: ConnectionOptions = {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 6379,
    };
    if (url.password) conn.password = url.password;
    return conn;
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

// Initialize the BullMQ email queue and worker. Must be called after Redis is ready (i.e. from server.ts after initRedis).
export async function initEmailQueue(): Promise<void> {
  try {
    const connection = getRedisConnection();

    emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    });

    emailWorker = new Worker<EmailJobData>(
      QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        logger.info({ jobId: job.id, type: job.data.type, to: job.data.to }, 'Processing email job');
        const { sendEmail, sendTemplatedEmail } = await import('./emailService.js');

        const data = job.data;

        if (data.templateKey) {
          await sendTemplatedEmail({
            templateKey: data.templateKey,
            to: data.to,
            variables: data.variables || {},
            userId: data.userId,
          });
        } else if (data.htmlContent) {
          await sendEmail({
            to: data.to,
            subject: data.subject || 'Notification',
            html: data.htmlContent,
            text: data.textContent,
            userId: data.userId,
          });
        } else {
          logger.warn({ jobId: job.id }, 'Email job has neither templateKey nor htmlContent — skipping');
        }
      },
      { connection, concurrency: 5 }
    );

    emailWorker.on('completed', (job) => {
      logger.debug({ jobId: job.id, type: job.data.type }, 'Email job completed');
    });
    emailWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, type: job?.data?.type, err: err?.message }, 'Email job failed');
    });

    logger.info('BullMQ email queue initialized');
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to initialize BullMQ email queue — emails will be sent inline');
    emailQueue = null;
    emailWorker = null;
  }
}

// Enqueue an email job. Falls back to inline send if queue is unavailable.
export async function enqueueEmail(data: EmailJobData): Promise<void> {
  if (emailQueue) {
    try {
      await emailQueue.add(data.type, data);
      return;
    } catch (err: any) {
      logger.warn({ err: err?.message, to: data.to }, 'Failed to enqueue email — sending inline');
    }
  }
  // Inline fallback
  try {
    const { sendEmail, sendTemplatedEmail } = await import('./emailService.js');
    if (data.templateKey) {
      await sendTemplatedEmail({
        templateKey: data.templateKey,
        to: data.to,
        variables: data.variables || {},
        userId: data.userId,
      });
    } else if (data.htmlContent) {
      await sendEmail({
        to: data.to,
        subject: data.subject || 'Notification',
        html: data.htmlContent,
        text: data.textContent,
        userId: data.userId,
      });
    }
  } catch (err: any) {
    logger.error({ err: err?.message, to: data.to }, 'Inline email fallback also failed');
  }
}

// Gracefully shut down the worker and queue.
export async function closeEmailQueue(): Promise<void> {
  try {
    if (emailWorker) await emailWorker.close();
    if (emailQueue) await emailQueue.close();
    logger.info('BullMQ email queue closed');
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Error closing BullMQ email queue');
  }
}
