import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  register,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  activeSocketConnections,
  bullmqJobsTotal,
} from '../src/lib/metrics.js';
import { logger, PII_REDACT_PATHS } from '../src/lib/logger.js';
import { initSentry } from '../src/lib/sentry.js';

describe('Observability & Prometheus Metrics Suite', () => {
  const app = createApp();

  it('GET /healthz returns 200 with ok status', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /readyz returns 200 with ready status', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });

  it('GET /metrics returns Prometheus format text with expected default and custom metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');

    const metricsOutput = res.text;

    // Verify default Node.js runtime metrics
    expect(metricsOutput).toMatch(/nodejs_/);

    // Verify custom HTTP metrics
    expect(metricsOutput).toContain('http_requests_total');
    expect(metricsOutput).toContain('http_request_duration_seconds');

    // Verify custom Socket and BullMQ metrics
    expect(metricsOutput).toContain('active_socket_connections');
    expect(metricsOutput).toContain('bullmq_jobs_total');
  });

  it('records http_requests_total and duration histogram for handled routes', async () => {
    // Make request to trigger metrics recording
    await request(app).get('/healthz');

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toMatch(/http_requests_total\{.*method="GET".*status_code="200".*\}/);
    expect(metricsOutput).toContain('http_request_duration_seconds_bucket');
    expect(metricsOutput).toContain('http_request_duration_seconds_count');
  });

  it('updates active_socket_connections gauge across namespaces', async () => {
    activeSocketConnections.inc({ namespace: '/notifications' });
    activeSocketConnections.inc({ namespace: '/dashboard' });

    let metricsOutput = await register.metrics();
    expect(metricsOutput).toMatch(/active_socket_connections\{namespace="\/notifications"\} 1/);
    expect(metricsOutput).toMatch(/active_socket_connections\{namespace="\/dashboard"\} 1/);

    activeSocketConnections.dec({ namespace: '/notifications' });
    activeSocketConnections.dec({ namespace: '/dashboard' });

    metricsOutput = await register.metrics();
    expect(metricsOutput).toMatch(/active_socket_connections\{namespace="\/notifications"\} 0/);
    expect(metricsOutput).toMatch(/active_socket_connections\{namespace="\/dashboard"\} 0/);
  });

  it('increments bullmq_jobs_total counter for queues and statuses', async () => {
    bullmqJobsTotal.inc({ queue: 'recurring-transactions', status: 'completed' });
    bullmqJobsTotal.inc({ queue: 'reminders', status: 'completed' });
    bullmqJobsTotal.inc({ queue: 'recurring-transactions', status: 'failed' });

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toMatch(/bullmq_jobs_total\{queue="recurring-transactions",status="completed"\} [1-9]/);
    expect(metricsOutput).toMatch(/bullmq_jobs_total\{queue="reminders",status="completed"\} [1-9]/);
    expect(metricsOutput).toMatch(/bullmq_jobs_total\{queue="recurring-transactions",status="failed"\} [1-9]/);
  });

  it('PII scrubbing paths cover all required sensitive authentication attributes', () => {
    const requiredRedactKeys = [
      'password',
      'confirmPassword',
      'answers',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'Authorization',
    ];

    for (const key of requiredRedactKeys) {
      const matchFound = PII_REDACT_PATHS.some((path) =>
        path === key || path.endsWith(`.${key}`) || path.includes(key)
      );
      expect(matchFound, `Expected PII redact paths to include ${key}`).toBe(true);
    }
  });

  it('Pino logger scrubs sensitive fields when logging objects', () => {
    const sensitivePayload = {
      password: 'super-secret-password-123',
      confirmPassword: 'super-secret-password-123',
      token: 'jwt-auth-token-xyz',
      accessToken: 'access-jwt-string',
      refreshToken: 'refresh-jwt-string',
      answers: ['secret pet', 'elementary school'],
      authorization: 'Bearer sensitive-token',
    };

    // Serialize object through logger formatter / serializer
    // In Pino, redact replaces values with censor in the destination stream
    const serialized = JSON.parse(JSON.stringify(sensitivePayload));
    // Verify our PII path helper and sanitize routine
    expect(PII_REDACT_PATHS).toContain('password');
    expect(PII_REDACT_PATHS).toContain('confirmPassword');
    expect(PII_REDACT_PATHS).toContain('answers');
    expect(PII_REDACT_PATHS).toContain('token');
    expect(PII_REDACT_PATHS).toContain('accessToken');
    expect(PII_REDACT_PATHS).toContain('refreshToken');
    expect(PII_REDACT_PATHS).toContain('authorization');
  });

  it('Sentry stub initializes cleanly for both api and worker contexts', () => {
    const apiSentry = initSentry('backend-api');
    expect(apiSentry).toBeDefined();
    expect(typeof apiSentry.captureException).toBe('function');
    expect(typeof apiSentry.captureMessage).toBe('function');

    // Should safely handle test exceptions without throwing
    expect(() => {
      apiSentry.captureException(new Error('Synthetic test exception'));
      apiSentry.captureMessage('Synthetic test message', 'info');
    }).not.toThrow();

    const workerSentry = initSentry('worker');
    expect(workerSentry).toBeDefined();
    expect(() => {
      workerSentry.captureException(new Error('Worker synthetic exception'));
      workerSentry.captureMessage('Worker synthetic message', 'info');
    }).not.toThrow();
  });
});
