import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

// Captures request-level user-agent and client IP for downstream audit logging
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const userAgent = (req.headers['user-agent'] as string) || undefined;
  const rawIp = req.ip || req.socket.remoteAddress;
  const ipAddress = typeof rawIp === 'string' ? rawIp.replace(/^::ffff:/, '').trim() : undefined;

  const store: RequestContextStore = {
    requestId: req.id ? String(req.id) : undefined,
    userAgent,
    ipAddress,
  };

  requestContext.run(store, () => next());
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore();
}

export default requestContextMiddleware;
