/**
 * AUTHZ-002: Generic ownership guard middleware.
 *
 * Ensures the requesting user owns the resource being accessed.
 * Usage example:
 *   router.get('/accounts/:id', authenticate, ownershipGuard(prisma.account, 'id'), handler)
 *
 * Admins bypass ownership checks by default (admin can access any resource).
 *
 * Supports:
 *   - ownershipGuard(model, paramName) — checks model.userId === req.user.id
 *   - requireSelf(paramName)           — checks req.params[paramName] === req.user.id (for user-scoped routes)
 */
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import logger from '../lib/logger.js';

/**
 * Checks that the currently authenticated user owns a Prisma model record.
 * The record is found by `req.params[paramName]` and must have a `userId` field.
 * ADMINS bypass this check.
 */
export function ownershipGuard(
  // Prisma delegate object (e.g. prisma.account)
  model: { findUnique: (args: any) => Promise<any> },
  paramName: string = 'id',
  options: { ownerField?: string; allowAdmin?: boolean } = {}
) {
  const ownerField = options.ownerField ?? 'userId';
  const allowAdmin = options.allowAdmin !== false; // default: true

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        next(new ForbiddenError('Authentication required'));
        return;
      }

      // AUTHZ-005: Admins bypass ownership check
      if (allowAdmin && user.role === 'ADMIN') {
        next();
        return;
      }

      const resourceId = req.params[paramName];
      if (!resourceId) {
        next(new NotFoundError(`Resource id '${paramName}' not found in request`));
        return;
      }

      const record = await model.findUnique({ where: { id: resourceId } });
      if (!record) {
        // Return NotFound rather than Forbidden to avoid resource enumeration
        next(new NotFoundError('Resource not found'));
        return;
      }

      if (record[ownerField] !== user.id) {
        logger.warn({ userId: user.id, resourceId, ownerField }, 'Ownership check failed — IDOR attempt blocked');
        next(new ForbiddenError('Access denied'));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Validates that the URL param matches the authenticated user id.
 * Useful for routes like GET /users/:id/profile where users can only access their own.
 * ADMINS bypass this check by default.
 */
export function requireSelf(paramName: string = 'id', allowAdmin: boolean = true) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }
    if (allowAdmin && user.role === 'ADMIN') {
      next();
      return;
    }
    if (req.params[paramName] !== user.id) {
      logger.warn({ userId: user.id, paramId: req.params[paramName] }, 'requireSelf check failed');
      next(new ForbiddenError('Access denied'));
      return;
    }
    next();
  };
}
