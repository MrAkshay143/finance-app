import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma } from './fixtures/mockPrisma.js';

vi.mock('../src/lib/prisma.js', async () => {
  const { mockPrisma } = await import('./fixtures/mockPrisma.js');
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

import { createApp } from '../src/app.js';

describe('TASK-2.2: Accounts CRUD Endpoints & Business Logic', () => {
  const app = createApp();
  let userTokenA: string;
  let userIdA: string;
  let userTokenB: string;
  let userIdB: string;

  beforeEach(async () => {
    mockPrisma.clearAll();

    // Create User A
    const signupA = await request(app).post('/api/v1/auth/signup').send({
      email: 'user.a@example.com',
      password: 'Password123!',
      fullName: 'Alice Account',
      mobileNumber: '+919876543201',
    });
    userTokenA = signupA.body.data.tokens.accessToken;
    userIdA = signupA.body.data.user.id;

    // Create User B
    const signupB = await request(app).post('/api/v1/auth/signup').send({
      email: 'user.b@example.com',
      password: 'Password123!',
      fullName: 'Bob Account',
      mobileNumber: '+919876543202',
    });
    userTokenB = signupB.body.data.tokens.accessToken;
    userIdB = signupB.body.data.user.id;
  });

  describe('POST /api/v1/accounts - Create Account', () => {
    it('creates an account with openingBalance in BigInt paise and sets currentBalance = openingBalance', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'HDFC Salary Account',
          type: 'BANK',
          institutionName: 'HDFC Bank',
          accountNumberMask: '1234',
          openingBalance: 25000, // ₹25,000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: 'HDFC Salary Account',
        accountType: 'BANK',
        institution: 'HDFC Bank',
        accountIdentifier: '1234',
        openingBalance: 25000,
        openingBalancePaise: 2500000,
        currentBalance: 25000,
        currentBalancePaise: 2500000,
        status: 'ACTIVE',
      });

      // Verify Prisma database stored value is BigInt paise
      const dbAccount = mockPrisma._state.accounts.get(res.body.data.id);
      expect(typeof dbAccount.openingBalance).toBe('bigint');
      expect(dbAccount.openingBalance).toBe(BigInt(2500000));
      expect(dbAccount.currentBalance).toBe(BigInt(2500000));
      expect(dbAccount.userId).toBe(userIdA);
    });

    it('rejects account creation with missing name (422 VALIDATION_ERROR)', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          type: 'BANK',
          openingBalance: 1000,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/accounts - List Accounts & Aggregates', () => {
    it('returns accounts with total balance aggregate and active count', async () => {
      // Create 2 accounts for User A
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Checking Account',
          type: 'BANK',
          openingBalance: 15000,
        });

      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Savings Account',
          type: 'BANK',
          openingBalance: 35000,
        });

      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accounts.length).toBe(2);
      expect(res.body.data.summary).toMatchObject({
        totalBalance: 50000, // 15000 + 35000
        totalBalancePaise: 5000000,
        activeCount: 2,
        totalCount: 2,
      });
    });

    it('enforces ownership isolation in list (User B cannot see User A accounts)', async () => {
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: "User A's Secret Account",
          type: 'INVESTMENT',
          openingBalance: 100000,
        });

      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accounts.length).toBe(0);
      expect(res.body.data.summary.totalBalance).toBe(0);
      expect(res.body.data.summary.activeCount).toBe(0);
    });
  });

  describe('GET /api/v1/accounts/:id - Account Detail', () => {
    it('returns account detail with recentTransactions', async () => {
      const created = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Primary Wallet',
          type: 'WALLET',
          openingBalance: 5000,
        });

      const accountId = created.body.data.id;

      const res = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(accountId);
      expect(res.body.data.name).toBe('Primary Wallet');
      expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
    });

    it('rejects access to another user account with 403 FORBIDDEN', async () => {
      const created = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: "User A's Account",
          type: 'BANK',
          openingBalance: 1000,
        });

      const accountId = created.body.data.id;

      const res = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 NOT_FOUND for nonexistent account', async () => {
      const res = await request(app)
        .get('/api/v1/accounts/nonexistent-id')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/accounts/:id - Update Account', () => {
    it('updates account metadata (name, institution, accountType, accountIdentifier)', async () => {
      const created = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Old Account Name',
          type: 'BANK',
          openingBalance: 2000,
        });

      const accountId = created.body.data.id;

      const res = await request(app)
        .put(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'New Account Name',
          institutionName: 'Axis Bank',
          accountNumberMask: '9876',
          type: 'CREDIT_CARD',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Account Name');
      expect(res.body.data.institution).toBe('Axis Bank');
      expect(res.body.data.accountType).toBe('CREDIT_CARD');
      expect(res.body.data.accountIdentifier).toBe('9876');
    });

    it('rejects update by another user with 403 FORBIDDEN', async () => {
      const created = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Alice Wallet',
          type: 'WALLET',
          openingBalance: 500,
        });

      const res = await request(app)
        .put(`/api/v1/accounts/${created.body.data.id}`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          name: 'Hacked Name',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /api/v1/accounts/:id/status - Toggle Account Status', () => {
    it('toggles account status between ACTIVE and INACTIVE and updates aggregate totals', async () => {
      const created = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Fixed Deposit',
          type: 'INVESTMENT',
          openingBalance: 100000,
        });

      const accountId = created.body.data.id;

      // Deactivate account
      const deactRes = await request(app)
        .patch(`/api/v1/accounts/${accountId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'INACTIVE' });

      expect(deactRes.status).toBe(200);
      expect(deactRes.body.data.status).toBe('INACTIVE');

      // Verify list aggregate excludes inactive account from total balance and active count
      const listRes = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(listRes.body.data.summary.totalBalance).toBe(0);
      expect(listRes.body.data.summary.activeCount).toBe(0);
      expect(listRes.body.data.summary.totalCount).toBe(1);

      // Reactivate account
      const reactRes = await request(app)
        .patch(`/api/v1/accounts/${accountId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'ACTIVE' });

      expect(reactRes.status).toBe(200);
      expect(reactRes.body.data.status).toBe('ACTIVE');
    });

    it('rejects status change by non-owner with 403 FORBIDDEN', async () => {
      const created = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Alice Bank',
          type: 'BANK',
          openingBalance: 1000,
        });

      const res = await request(app)
        .patch(`/api/v1/accounts/${created.body.data.id}/status`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
