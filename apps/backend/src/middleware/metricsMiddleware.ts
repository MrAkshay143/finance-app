import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDurationSeconds } from '../lib/metrics.js';

// Record Prometheus HTTP request counts and duration histograms
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Suppress metrics collection for the /metrics endpoint itself to avoid recursive inflation
  if (req.path === '/metrics') {
    return next();
  }

  const startTime = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationSeconds = diff[0] + diff[1] / 1e9;

    const method = req.method;
    // Normalize route label to prevent high-cardinality metric explosion on dynamic IDs
    const route = req.route?.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : req.baseUrl
        ? `${req.baseUrl}`
        : req.path || '/';
    const statusCode = String(res.statusCode);

    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDurationSeconds.observe({ method, route, status_code: statusCode }, durationSeconds);
  });

  next();
}

export default metricsMiddleware;
