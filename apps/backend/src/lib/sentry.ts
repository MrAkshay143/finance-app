import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface SentryClientStub {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug') => void;
  close: (timeout?: number) => Promise<boolean>;
}

let activeSentryClient: SentryClientStub | null = null;

/**
 * Initializes Sentry error tracking stub.
 * Respects SENTRY_DSN environment variable when configured.
 * Sanitizes sensitive credentials and attaches process error traps.
 */
export function initSentry(serviceName: 'backend-api' | 'worker'): SentryClientStub {
  const dsn = env.SENTRY_DSN;

  if (dsn && dsn.trim().length > 0) {
    // Mask credentials in DSN before logging (e.g., https://***@sentry.io/123)
    const maskedDsn = dsn.replace(/:\/\/[^@]+@/, '://***@');
    logger.info({ service: serviceName, dsn: maskedDsn }, 'Sentry error tracking initialized');

    activeSentryClient = {
      captureException: (error: unknown, context?: Record<string, unknown>) => {
        logger.error({ err: error, context, service: serviceName }, '[Sentry] Exception captured');
      },
      captureMessage: (message: string, level = 'info') => {
        logger.info({ message, level, service: serviceName }, '[Sentry] Message captured');
      },
      close: async () => true,
    };

    // Attach process-level uncaught exception handlers
    process.on('uncaughtException', (err: Error) => {
      logger.fatal({ err: err.message, stack: err.stack, service: serviceName }, 'Uncaught exception caught by Sentry');
      activeSentryClient?.captureException(err, { fatal: true });
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error({ reason, service: serviceName }, 'Unhandled rejection caught by Sentry');
      activeSentryClient?.captureException(reason, { fatal: false });
    });

    return activeSentryClient;
  }

  logger.debug({ service: serviceName }, 'Sentry DSN not provided; running with local logging stub');

  activeSentryClient = {
    captureException: (error: unknown, context?: Record<string, unknown>) => {
      logger.debug({ err: error, context, service: serviceName }, 'Sentry stub exception (DSN unset)');
    },
    captureMessage: (message: string) => {
      logger.debug({ message, service: serviceName }, 'Sentry stub message (DSN unset)');
    },
    close: async () => true,
  };

  return activeSentryClient;
}

export function getSentryClient(): SentryClientStub | null {
  return activeSentryClient;
}
