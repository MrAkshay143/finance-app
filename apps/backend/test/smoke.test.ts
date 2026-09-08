import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Backend Smoke Test', () => {
  it('healthz endpoint returns 200 and ok status', async () => {
    const app = createApp();
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('unimplemented api routes return 501', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });
});
