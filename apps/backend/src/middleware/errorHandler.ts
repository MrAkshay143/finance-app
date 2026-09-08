import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse, ApiErrorCode } from '@finance/shared-types';
import { logger } from '../lib/logger.js';
import { AppError } from '../utils/errors.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const notFoundError = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'NOT_FOUND'
  );
  next(notFoundError);
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : typeof err.status === 'number'
      ? err.status
      : 500;

  // Determine standard error code
  let code: ApiErrorCode = err.code || 'SERVER_ERROR';
  if (!err.code) {
    if (statusCode === 400 || statusCode === 422) code = 'VALIDATION_ERROR';
    else if (statusCode === 401) code = 'UNAUTHENTICATED';
    else if (statusCode === 403) code = 'FORBIDDEN';
    else if (statusCode === 404) code = 'NOT_FOUND';
    else if (statusCode === 409) code = 'CONFLICT';
    else if (statusCode === 429) code = 'RATE_LIMITED';
    else if (statusCode === 501) code = 'NOT_IMPLEMENTED';
    else if (statusCode >= 500) code = 'SERVER_ERROR';
  }

  // Handle standard express body-parser syntax error
  if (err instanceof SyntaxError && 'body' in err && statusCode === 400) {
    code = 'VALIDATION_ERROR';
  }

  // Determine user-facing message; never leak internal details or stack traces on 500
  let message = err.message;
  if (statusCode >= 500) {
    logger.error(
      {
        err: {
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
        },
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
      },
      `Unhandled server error: ${err?.message || 'Unknown error'}`
    );
    message = 'Internal Server Error';
  } else {
    logger.warn(
      {
        code,
        statusCode,
        message: err.message,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
      },
      `Client error: ${err.message}`
    );
  }

  const responseBody: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (err.details && statusCode < 500) {
    responseBody.error.details = err.details;
  }

  res.status(statusCode).json(responseBody);
}

export default errorHandler;
