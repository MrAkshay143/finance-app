import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Admin access required.'));
  }
  next();
}

export default requireAdmin;
