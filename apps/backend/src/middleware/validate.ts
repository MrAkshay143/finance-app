import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = formatZodIssues(result.error);
      const firstMessage = result.error.issues[0]?.message || 'Validation error';
      return next(new ValidationError(firstMessage, details));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = formatZodIssues(result.error);
      const firstMessage = result.error.issues[0]?.message || 'Validation error';
      return next(new ValidationError(firstMessage, details));
    }
    req.query = result.data as any;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details = formatZodIssues(result.error);
      const firstMessage = result.error.issues[0]?.message || 'Validation error';
      return next(new ValidationError(firstMessage, details));
    }
    req.params = result.data as any;
    next();
  };
}

function formatZodIssues(error: ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'field';
    details[key] = issue.message;
  }
  return details;
}
