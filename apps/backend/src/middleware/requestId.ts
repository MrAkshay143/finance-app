import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export default requestId;
