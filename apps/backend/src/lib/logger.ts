import pino from 'pino';
import { env } from '../config/env.js';

export const PII_REDACT_PATHS = [
  // Authentication credentials & secrets
  'password',
  'confirmPassword',
  'passwordHash',
  '*.password',
  '*.confirmPassword',
  '*.passwordHash',
  'body.password',
  'body.confirmPassword',
  'body.passwordHash',

  // Security question answers
  'answers',
  'answers[*]',
  'answer',
  'answerHash',
  '*.answers',
  '*.answers[*]',
  '*.answer',
  '*.answerHash',
  'body.answers',
  'body.answers[*]',
  'body.answer',
  'body.answerHash',

  // Session & JWT tokens
  'token',
  'accessToken',
  'refreshToken',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  'body.token',
  'body.accessToken',
  'body.refreshToken',

  // Sensitive HTTP headers
  'authorization',
  'Authorization',
  '*.authorization',
  '*.Authorization',
  'req.headers.authorization',
  'req.headers.Authorization',
  'headers.authorization',
  'headers.Authorization',
  'req.headers.cookie',
  'headers.cookie',
];

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: PII_REDACT_PATHS,
    censor: '[REDACTED]',
  },
});

export default logger;
