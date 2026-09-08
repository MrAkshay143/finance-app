import { ApiErrorCode } from '@finance/shared-types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 500,
    code: ApiErrorCode = 'SERVER_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, any>) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class NotImplementedError extends AppError {
  constructor(message = 'Endpoint not implemented') {
    super(message, 501, 'NOT_IMPLEMENTED');
  }
}

export class AccountLockedError extends AppError {
  constructor(message = 'Account is temporarily locked') {
    super(message, 403, 'ACCOUNT_LOCKED');
  }
}
