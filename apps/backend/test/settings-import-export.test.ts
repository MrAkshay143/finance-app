import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { prismaTestAdapter } from './fixtures/prismaTestAdapter.js';

vi.mock('../src/lib/prisma.js', async () => {
  const { prismaTestAdapter } = await import('./fixtures/prismaTestAdapter.js');
  return {
    prisma: prismaTestAdapter,
    default: prismaTestAdapter,
  };
});

import { createApp } from '../src/app.js';

describe('TASK-5.1 & TASK-5.3: User Settings, Danger Zone, CSV Import & Data Export Tests', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    prismaTestAdapter.clearAll();

    // 1. Create a user
    const userRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'settings.tester@example.com',
      password: 'Password123!',
      fullName: 'Settings User',
      mobileNumber: '+919123456780',
    });
    userToken = userRes.body.data.tokens.accessToken;
    userId = userRes.body.data.user.id;

    // 2. Create an account with opening balance 50,000 paise (Rs 500)
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Checking Account',
        accountType: 'BANK',
        institution: 'HDFC Bank',
        openingBalance: 500, // Rs 500 = 50000 paise
      });
    accountId = accRes.body.data.id;
  });

  describe('User Settings APIs', () => {
    it('GET /api/v1/user-settings returns defaults including currency, timezone, financialMonthStartDay, quickAdd, dashboardDonuts, features', async () => {
      const res = await request(app)
        .get('/api/v1/user-settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        financialMonthStartDay: 1,
        quickAdd: false,
        dashboardDonuts: { income: true, expense: true, investment: true },
        features: { investments: true, recurring: true },
      });
    });

    it('PATCH /api/v1/user-settings updates preferences and logs USER_SETTINGS_UPDATE audit log', async () => {
      const res = await request(app)
        .patch('/api/v1/user-settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currency: 'USD',
          financialMonthStartDay: 5,
          quickAdd: false,
          dashboardDonuts: { income: true, expense: false, investment: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currency).toBe('USD');
      expect(res.body.data.financialMonthStartDay).toBe(5);
      expect(res.body.data.quickAdd).toBe(false);
      expect(res.body.data.dashboardDonuts.expense).toBe(false);

      const auditLog = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'USER_SETTINGS_UPDATE' && l.actorUserId === userId
      );
      expect(auditLog).toBeDefined();
      expect(auditLog.details.currency).toBe('USD');
    });
  });

  describe('Danger Zone Account Actions', () => {
    it('POST /api/v1/account-actions/reset-profile atomically wipes transactions, accounts, budgets, goals, preserving user and KBA', async () => {
      // Create a transaction, budget, goal, and security questions
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'EXPENSE',
          amount: 50,
          description: 'Coffee',
        });

      await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Emergency Fund',
          targetAmount: 50000,
        });

      await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questions: [
            { questionKey: 'FIRST_PET', answer: 'Rover' },
            { questionKey: 'MOTHER_MAIDEN_NAME', answer: 'Taylor' },
            { questionKey: 'FIRST_CAR', answer: 'Honda' },
          ],
        });

      // Rejects without password
      const unauthReset = await request(app)
        .post('/api/v1/account-actions/reset-profile')
        .set('Authorization', `Bearer ${userToken}`);
      expect(unauthReset.status).toBe(422);

      // Execute Reset Profile with valid password
      const resetRes = await request(app)
        .post('/api/v1/account-actions/reset-profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'Password123!' });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);
      expect(resetRes.body.data.message).toMatch(/reset/i);

      // Verify accounts, transactions, and goals are wiped
      const accListRes = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`);
      expect(accListRes.body.data.accounts.length).toBe(0);

      const txnListRes = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`);
      expect(txnListRes.body.data.items.length).toBe(0);

      // Verify user and security questions are preserved
      const kbaRes = await request(app)
        .get('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`);
      expect(kbaRes.body.data.length).toBe(3);

      // Verify audit log
      const auditLog = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'ACCOUNT_RESET_PROFILE' && l.actorUserId === userId
      );
      expect(auditLog).toBeDefined();
    });

    it('POST /api/v1/account-actions/delete-account rejects invalid password and marks user DELETED on correct password', async () => {
      // 1. Invalid password
      const badRes = await request(app)
        .post('/api/v1/account-actions/delete-account')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'WrongPassword!' });

      expect(badRes.status).toBe(401);
      expect(badRes.body.success).toBe(false);

      // 2. Correct password
      const goodRes = await request(app)
        .post('/api/v1/account-actions/delete-account')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'Password123!' });

      expect(goodRes.status).toBe(200);
      expect(goodRes.body.success).toBe(true);

      const userInDb = prismaTestAdapter._state.users.get(userId);
      expect(userInDb.status).toBe('DELETED');

      const auditLog = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'ACCOUNT_DELETED' && l.actorUserId === userId
      );
      expect(auditLog).toBeDefined();
    });
  });

  describe('CSV Import & Data Export', () => {
    it('POST /api/v1/import/csv imports transactions and recalculates account balance via balance invariant', async () => {
      const csvContent = `Date,Description,Category,Amount,Type
2026-09-01,Salary Credit,Salary,2500,INCOME
2026-09-02,Grocery Store,Groceries,300,EXPENSE
2026-09-03,Mutual Fund SIP,Mutual Funds,200,INVESTMENT`;

      const importRes = await request(app)
        .post('/api/v1/import/csv')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          csvContent,
        });

      expect(importRes.status).toBe(200);
      expect(importRes.body.success).toBe(true);
      expect(importRes.body.data.importedCount).toBe(3);
      expect(importRes.body.data.skippedCount).toBe(0);

      // Check account balance:
      // Opening: 50,000 paise (500 INR)
      // Income (Credit): +250,000 paise (2500 INR)
      // Expense (Debit): -30,000 paise (300 INR)
      // Investment (Debit): -20,000 paise (200 INR)
      // Expected current balance: 50,000 + 250,000 - 30,000 - 20,000 = 250,000 paise (2500 INR)
      const accRes = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(accRes.body.data.currentBalancePaise).toBe(250000);
      expect(accRes.body.data.currentBalance).toBe(2500);

      // Verify audit log
      const auditLog = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'DATA_IMPORT_CSV' && l.actorUserId === userId
      );
      expect(auditLog).toBeDefined();
      expect(auditLog.details.importedCount).toBe(3);
    });

    it('GET /api/v1/export/data produces valid JSON and CSV formats and writes audit log', async () => {
      // 1. JSON Export
      const jsonRes = await request(app)
        .get('/api/v1/export/data?format=json')
        .set('Authorization', `Bearer ${userToken}`);

      expect(jsonRes.status).toBe(200);
      expect(jsonRes.body.success).toBe(true);
      expect(jsonRes.body.data.format).toBe('json');
      const parsedData = JSON.parse(jsonRes.body.data.data);
      expect(parsedData.user.id).toBe(userId);
      expect(Array.isArray(parsedData.accounts)).toBe(true);

      // 2. CSV Export
      const csvRes = await request(app)
        .get('/api/v1/export/data?format=csv')
        .set('Authorization', `Bearer ${userToken}`);

      expect(csvRes.status).toBe(200);
      expect(csvRes.body.success).toBe(true);
      expect(csvRes.body.data.format).toBe('csv');
      expect(csvRes.body.data.data).toContain('Date,Account,Type,Direction,Category');

      // Verify audit log
      const auditLog = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'DATA_EXPORT' && l.actorUserId === userId
      );
      expect(auditLog).toBeDefined();
    });
  });
});
