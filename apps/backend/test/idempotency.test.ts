import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { prismaTestAdapter } from './fixtures/prismaTestAdapter.js';

vi.mock('../src/lib/prisma.js', async () => {
  const { prismaTestAdapter } = await import('./fixtures/prismaTestAdapter.js');
  return {
    prisma: prismaTestAdapter,
    default: prismaTestAdapter,
  };
});

import { idempotencyMiddleware } from '../src/middleware/idempotency.js';
import { prisma } from '../src/lib/prisma.js';

describe('Financial Idempotency Middleware Integration', () => {
  let app: express.Application;
  let executionCount: number;

  beforeEach(async () => {
    prismaTestAdapter.clearAll();
    executionCount = 0;
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req: any, _res, next) => {
      req.user = { id: 'test-user-id-123', role: 'USER' };
      next();
    });

    // Test mutation endpoint
    app.post('/api/v1/test-mutation', idempotencyMiddleware, (req: Request, res: Response) => {
      executionCount++;
      const { amount, fail } = req.body;
      if (fail === 500) {
        return res.status(500).json({ error: { message: 'Internal Server Error' } });
      }
      if (fail === 400) {
        return res.status(400).json({ error: { message: 'Bad Request' } });
      }
      return res.status(201).json({ success: true, count: executionCount, amount });
    });
  });

  it('passes through when X-Idempotency-Key header is omitted', async () => {
    const res1 = await request(app)
      .post('/api/v1/test-mutation')
      .send({ amount: 100 });

    expect(res1.status).toBe(201);
    expect(res1.body.count).toBe(1);

    const res2 = await request(app)
      .post('/api/v1/test-mutation')
      .send({ amount: 100 });

    expect(res2.status).toBe(201);
    expect(res2.body.count).toBe(2);
    expect(executionCount).toBe(2);
  });

  it('claims key and stores response on first request', async () => {
    const key = 'test-key-abc-1';
    const res = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ amount: 500 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, count: 1, amount: 500 });
    expect(executionCount).toBe(1);

    // Verify record in database
    const record = await prisma.idempotencyRecord.findUnique({
      where: { userId_key: { userId: 'test-user-id-123', key } },
    });
    expect(record).toBeDefined();
    expect(record?.statusCode).toBe(201);
    expect(record?.responseBody).toContain('500');
  });

  it('replays cached response on duplicate request with same idempotency key', async () => {
    const key = 'test-key-abc-2';

    // First request
    const res1 = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ amount: 250 });

    expect(res1.status).toBe(201);
    expect(res1.body.count).toBe(1);
    expect(executionCount).toBe(1);

    // Duplicate request with identical key
    const res2 = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ amount: 250 });

    expect(res2.status).toBe(201);
    expect(res2.headers['x-idempotency-replayed']).toBe('true');
    expect(res2.body.count).toBe(1); // handler did not run again!
    expect(executionCount).toBe(1);
  });

  it('returns 409 IDEMPOTENCY_CONFLICT when request is actively in progress (<60s)', async () => {
    const key = 'test-key-in-progress';

    // Manually create an in-progress record (statusCode === null)
    await prisma.idempotencyRecord.create({
      data: {
        userId: 'test-user-id-123',
        key,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    const res = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ amount: 100 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('cleans up and retries stale in-progress record (>60s) from crashed process', async () => {
    const key = 'test-key-stale-crash';

    // Create a stale record with createdAt 90 seconds ago
    const staleDate = new Date(Date.now() - 90000);
    const staleRecord = await prisma.idempotencyRecord.create({
      data: {
        userId: 'test-user-id-123',
        key,
        createdAt: staleDate,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    // Force set createdAt in mock
    staleRecord.createdAt = staleDate;

    const res = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ amount: 777 });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(777);
    expect(executionCount).toBe(1);
  });

  it('deletes idempotency record on 5xx server errors to allow client retry', async () => {
    const key = 'test-key-error-500';

    // First request triggers 500 error
    const res1 = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ fail: 500 });

    expect(res1.status).toBe(500);

    // Wait microtask for async delete
    await new Promise((r) => setTimeout(r, 50));

    // Record should have been deleted
    const record = await prisma.idempotencyRecord.findUnique({
      where: { userId_key: { userId: 'test-user-id-123', key } },
    });
    expect(record).toBeNull();

    // Client retry with same key should now succeed
    const res2 = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ amount: 999 });

    expect(res2.status).toBe(201);
    expect(res2.body.amount).toBe(999);
  });

  it('caches 4xx client errors so replaying returns identical client error', async () => {
    const key = 'test-key-error-400';

    // Request triggers 400 Bad Request
    const res1 = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ fail: 400 });

    expect(res1.status).toBe(400);

    // Wait microtask for async update
    await new Promise((r) => setTimeout(r, 50));

    // Second request with same key should replay the 400
    const res2 = await request(app)
      .post('/api/v1/test-mutation')
      .set('x-idempotency-key', key)
      .send({ fail: 400 });

    expect(res2.status).toBe(400);
    expect(res2.headers['x-idempotency-replayed']).toBe('true');
  });
});
