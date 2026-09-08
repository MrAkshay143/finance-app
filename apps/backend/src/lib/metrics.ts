import promClient from 'prom-client';

// Prometheus registry singleton
export const register = promClient.register;

// Initialize default Node.js runtime metrics (event loop lag, memory, GC, active handles)
let defaultMetricsInitialized = false;
export function initDefaultMetrics(): void {
  if (!defaultMetricsInitialized) {
    promClient.collectDefaultMetrics({
      register,
      prefix: 'nodejs_',
    });
    defaultMetricsInitialized = true;
  }
}

// Automatically start default metrics collection
initDefaultMetrics();

// 1. HTTP Request Total Counter
export const httpRequestsTotal: promClient.Counter<'method' | 'route' | 'status_code'> =
  (register.getSingleMetric('http_requests_total') as promClient.Counter<'method' | 'route' | 'status_code'>) ||
  new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests processed',
    labelNames: ['method', 'route', 'status_code'] as const,
  });

// 2. HTTP Request Duration Histogram
export const httpRequestDurationSeconds: promClient.Histogram<'method' | 'route' | 'status_code'> =
  (register.getSingleMetric('http_request_duration_seconds') as promClient.Histogram<'method' | 'route' | 'status_code'>) ||
  new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

// 3. Active Socket Connections Gauge
export const activeSocketConnections: promClient.Gauge<'namespace'> =
  (register.getSingleMetric('active_socket_connections') as promClient.Gauge<'namespace'>) ||
  new promClient.Gauge({
    name: 'active_socket_connections',
    help: 'Number of active Socket.IO connections by namespace',
    labelNames: ['namespace'] as const,
  });

// 4. BullMQ Jobs Total Counter
export const bullmqJobsTotal: promClient.Counter<'queue' | 'status'> =
  (register.getSingleMetric('bullmq_jobs_total') as promClient.Counter<'queue' | 'status'>) ||
  new promClient.Counter({
    name: 'bullmq_jobs_total',
    help: 'Total number of BullMQ background jobs processed by queue and status',
    labelNames: ['queue', 'status'] as const,
  });

/**
 * Utility helper to increment BullMQ job metrics across background workers.
 */
export function recordBullmqJob(queue: string, status: 'completed' | 'failed' | 'active'): void {
  bullmqJobsTotal.inc({ queue, status });
}
