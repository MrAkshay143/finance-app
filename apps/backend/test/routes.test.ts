import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { createApp } from '../src/app.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import { createRateLimiter } from '../src/middleware/rateLimiter.js';

describe('API Routes & Middleware Stack Verification', () => {
  const app = createApp();

  describe('Health Endpoints', () => {
    it('GET /healthz returns 200 with status ok', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('GET /readyz returns 200 with status ready', async () => {
      const res = await request(app).get('/readyz');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ready' });
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Middleware Stack Verification', () => {
    it('propagates incoming x-request-id header or generates UUID', async () => {
      const customId = 'custom-test-request-id-12345';
      const res = await request(app)
        .get('/healthz')
        .set('x-request-id', customId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(customId);
    });

    it('sets X-API-Version: 1 on all /api/v1 routes', async () => {
      const res = await request(app).get('/api/v1/auth');
      expect(res.headers['x-api-version']).toBe('1');
    });

    it('rate limiter sets rate limit headers and throttles when threshold exceeded', async () => {
      const testApp = express();
      const limiter = createRateLimiter({
        windowMs: 10000,
        max: 3,
        keyGenerator: () => 'test-client-ip',
      });
      testApp.use(limiter);
      testApp.get('/test-rate-limit', (_req, res) => {
        res.status(200).json({ success: true });
      });

      // Requests 1 to 3 should succeed
      for (let i = 0; i < 3; i++) {
        const res = await request(testApp).get('/test-rate-limit');
        expect(res.status).toBe(200);
        expect(res.headers['x-ratelimit-limit']).toBe('3');
      }

      // 4th request should be rate limited with 429 and standard error envelope
      const limitedRes = await request(testApp).get('/test-rate-limit');
      expect(limitedRes.status).toBe(429);
      expect(limitedRes.body).toEqual({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later',
        },
      });
      expect(limitedRes.headers['retry-after']).toBeDefined();
    });
  });

  describe('Mounted Route Groups under /api/v1 (Protected Resource Routes)', () => {
    const protectedRoutes = [
      '/api/v1/auth/me',
      '/api/v1/profile',
      '/api/v1/security-questions',
      '/api/v1/accounts',
      '/api/v1/transactions',
      '/api/v1/transfers',
      '/api/v1/categories',
      '/api/v1/merchants',
      '/api/v1/budgets',
      '/api/v1/goals',
      '/api/v1/dashboard',
      '/api/v1/recurring-transactions',
      '/api/v1/analytics',
      '/api/v1/reports',
      '/api/v1/ai-analysis',
      '/api/v1/investments',
      '/api/v1/notifications',
      '/api/v1/reminders',
      '/api/v1/user-settings',
      '/api/v1/account-actions/reset-profile',
      '/api/v1/audit',
      '/api/v1/import/csv',
      '/api/v1/export/data',
      '/api/v1/admin/dashboard',
      '/api/v1/admin/users',
      '/api/v1/admin/settings',
      '/api/v1/admin/audit',
    ];

    for (const route of protectedRoutes) {
      it(`returns 401 UNAUTHENTICATED for unauthenticated access to ${route}`, async () => {
        const res = await request(app).get(route);
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.error).toHaveProperty('code', 'UNAUTHENTICATED');
      });
    }

    it('returns 501 NOT_IMPLEMENTED for unhandled /api/v1/ routes', async () => {
      const res = await request(app).get('/api/v1/unknown-future-resource');
      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
    });
  });

  describe('Error Handling Middleware', () => {
    it('returns 404 NOT_FOUND for unknown routes outside /api/v1', async () => {
      const res = await request(app).get('/nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /nonexistent-route not found',
        },
      });
    });

    it('catches thrown 500 server errors and never leaks stack traces', async () => {
      const errorApp = express();
      errorApp.get('/throw-error', () => {
        throw new Error('Sensitive database connection failed with secret credentials');
      });
      errorApp.use(notFoundHandler);
      errorApp.use(errorHandler);

      const res = await request(errorApp).get('/throw-error');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal Server Error',
        },
      });
      // Ensure stack trace and internal error message are NOT present in the response
      expect(res.body.error.stack).toBeUndefined();
      expect(res.body.error.message).not.toContain('Sensitive database');
    });

    it('handles malformed JSON body with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/auth')
        .set('Content-Type', 'application/json')
        .send('{"invalidJson": ');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
