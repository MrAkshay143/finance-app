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
import { recurringService } from '../src/services/recurringService.js';
import { reminderService } from '../src/services/reminderService.js';
import { notificationService } from '../src/services/notificationService.js';
import { processRecurringJob } from '../src/jobs/recurringWorker.js';
import { processReminderJob } from '../src/jobs/reminderWorker.js';
import { emitNotification, emitUnreadCount, emitDashboardRefresh } from '../src/sockets/socketGateway.js';

describe('TASK-4.2 & TASK-4.3: Recurring Transactions, Reminders, BullMQ Workers & Notifications', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let accountId: string;
  let rentCategoryId: string;
  let sipCategoryId: string;

  beforeEach(async () => {
    mockPrisma.clearAll();

    // Signup user
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'recurring.tester@example.com',
      password: 'Password123!',
      fullName: 'Recurring User',
      mobileNumber: '+919876543211',
    });

    userToken = signupRes.body.data.tokens.accessToken;
    userId = signupRes.body.data.user.id;

    // Create Account with ₹1,00,000 balance
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Salary Account',
        accountType: 'BANK',
        openingBalance: 100000,
      });
    accountId = accRes.body.data.id;

    // Fetch categories
    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`);

    const cats = catRes.body.data;
    rentCategoryId = cats.find((c: any) => c.name === 'Rent')?.id;
    sipCategoryId = cats.find((c: any) => c.name === 'Mutual Funds')?.id;
  });

  describe('Recurring Transactions CRUD', () => {
    let recurringId: string;

    it('creates a recurring expense transaction', async () => {
      const res = await request(app)
        .post('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          categoryId: rentCategoryId,
          type: 'EXPENSE',
          amount: 25000, // ₹25,000
          description: 'Monthly Apartment Rent',
          scheduleFreq: 'MONTHLY',
          scheduleInterval: 1,
          nextOccurrence: '2026-09-01T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(25000);
      expect(res.body.data.amountPaise).toBe(2500000);
      expect(res.body.data.scheduleFreq).toBe('MONTHLY');
      expect(res.body.data.status).toBe('ACTIVE');

      recurringId = res.body.data.id;
    });

    it('lists recurring transactions with filters', async () => {
      // Create first
      const createRes = await request(app)
        .post('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          categoryId: sipCategoryId,
          type: 'INVESTMENT',
          amount: 10000,
          description: 'Weekly Equity SIP',
          scheduleFreq: 'WEEKLY',
          nextOccurrence: '2026-09-05T00:00:00.000Z',
        });
      const createdId = createRes.body.data.id;

      const listRes = await request(app)
        .get('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

      // Filter by type
      const filterRes = await request(app)
        .get('/api/v1/recurring-transactions?type=INVESTMENT')
        .set('Authorization', `Bearer ${userToken}`);

      expect(filterRes.status).toBe(200);
      expect(filterRes.body.data.every((r: any) => r.type === 'INVESTMENT')).toBe(true);
    });

    it('updates recurring transaction details', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'EXPENSE',
          amount: 1000,
          description: 'Internet Bill',
          scheduleFreq: 'MONTHLY',
          nextOccurrence: '2026-09-10T00:00:00.000Z',
        });

      const id = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/v1/recurring-transactions/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1200,
          description: 'High-speed Internet Bill',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.amount).toBe(1200);
      expect(updateRes.body.data.description).toBe('High-speed Internet Bill');
    });

    it('toggles recurring transaction status (ACTIVE <-> PAUSED)', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'EXPENSE',
          amount: 500,
          description: 'Music Streaming',
          scheduleFreq: 'MONTHLY',
          nextOccurrence: '2026-09-15T00:00:00.000Z',
        });

      const id = createRes.body.data.id;

      const patchRes = await request(app)
        .patch(`/api/v1/recurring-transactions/${id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'PAUSED' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('PAUSED');
    });

    it('soft-deletes recurring transaction', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'EXPENSE',
          amount: 500,
          description: 'Gym Membership',
          scheduleFreq: 'MONTHLY',
          nextOccurrence: '2026-09-15T00:00:00.000Z',
        });

      const id = createRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/v1/recurring-transactions/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(delRes.status).toBe(200);

      // Should no longer appear in default active list
      const listRes = await request(app)
        .get('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(listRes.body.data.find((r: any) => r.id === id)).toBeUndefined();
    });
  });

  describe('Materialization & BullMQ Worker Execution', () => {
    it('materializes due recurring transactions, updates account balance, and advances nextOccurrence', async () => {
      // 1. Initial Account Balance: ₹1,00,000 (10000000 paise)
      const initialAccount = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(initialAccount.body.data.currentBalance).toBe(100000);

      // 2. Create monthly recurring rent of ₹25,000 due on 2026-09-01
      const dueOccurrence = new Date('2026-09-01T00:00:00.000Z');
      const rec = await recurringService.createRecurring(userId, {
        accountId,
        categoryId: rentCategoryId,
        type: 'EXPENSE',
        amount: 25000,
        description: 'Monthly Apartment Rent',
        scheduleFreq: 'MONTHLY',
        scheduleInterval: 1,
        nextOccurrence: dueOccurrence,
      });

      // 3. Trigger materialization as of 2026-09-05 (which is >= 2026-09-01)
      const asOfDate = new Date('2026-09-05T00:00:00.000Z');
      const matResult = await recurringService.materializeDueTransactions(asOfDate);

      expect(matResult.materializedCount).toBe(1);
      expect(matResult.materializedTransactions.length).toBe(1);

      const createdTxn = matResult.materializedTransactions[0];
      expect(createdTxn.amount).toBe(BigInt(2500000));
      expect(createdTxn.type).toBe('EXPENSE');
      expect(createdTxn.direction).toBe('DEBIT');

      // 4. Verify Account Balance deducted by ₹25,000 -> ₹75,000
      const updatedAccount = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(updatedAccount.body.data.currentBalance).toBe(75000);

      // 5. Verify RecurringTransaction advanced to next month (2026-10-01)
      const updatedRec = await recurringService.getRecurring(userId, rec.id);
      expect(new Date(updatedRec.nextOccurrence).toISOString().substring(0, 10)).toBe('2026-10-01');

      // 6. Running materialization again on the same date should be idempotent (0 materialized)
      const rerun = await recurringService.materializeDueTransactions(asOfDate);
      expect(rerun.materializedCount).toBe(0);
    });

    it('executes BullMQ recurring worker function cleanly', async () => {
      // Test direct worker execution
      const workerRes = await processRecurringJob();
      expect(workerRes).toHaveProperty('materializedCount');
      expect(typeof workerRes.materializedCount).toBe('number');
    });
  });

  describe('Reminders & Notifications Service', () => {
    it('creates and lists reminders', async () => {
      const res = await request(app)
        .post('/api/v1/reminders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'RECURRING_EXPENSE',
          timingConfig: { daysBefore: 3 },
          enabled: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('RECURRING_EXPENSE');

      const listRes = await request(app)
        .get('/api/v1/reminders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('generates notifications when recurring transaction due-dates approach', async () => {
      // Create reminder: 3 days before
      await reminderService.createReminder(userId, {
        type: 'RECURRING_EXPENSE',
        timingConfig: { daysBefore: 3 },
        enabled: true,
      });

      // Create recurring transaction due in 2 days (as of 2026-09-08 -> due on 2026-09-10)
      const refDate = new Date('2026-09-08T10:00:00.000Z');
      const nextDue = new Date('2026-09-10T00:00:00.000Z');

      await recurringService.createRecurring(userId, {
        accountId,
        type: 'EXPENSE',
        amount: 3000,
        description: 'Electricity Bill',
        scheduleFreq: 'MONTHLY',
        nextOccurrence: nextDue,
      });

      // Run reminder check job
      const notifs = await reminderService.checkDueReminders(refDate);
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs[0].type).toBe('DUE_DATE');
      expect(notifs[0].title).toContain('Upcoming Payment: Electricity Bill');

      // Verify notification appears in GET /api/v1/notifications
      const listNotifRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(listNotifRes.status).toBe(200);
      expect(listNotifRes.body.data.unreadCount).toBeGreaterThanOrEqual(1);

      // Verify GET /api/v1/notifications/unread-count
      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.count).toBe(listNotifRes.body.data.unreadCount);

      // Mark single notification as read
      const notifId = notifs[0].id;
      const readRes = await request(app)
        .patch(`/api/v1/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.read).toBe(true);

      // Mark all as read
      const markAllRes = await request(app)
        .post('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(markAllRes.status).toBe(200);
      expect(markAllRes.body.success).toBe(true);

      // Unread count should now be 0
      const finalCountRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(finalCountRes.body.data.count).toBe(0);
    });

    it('executes BullMQ reminder worker function cleanly', async () => {
      const workerRes = await processReminderJob();
      expect(workerRes).toHaveProperty('checkedCount');
      expect(typeof workerRes.checkedCount).toBe('number');
    });

    it('handles socketGateway emit calls safely without crashing in disconnected test environment', () => {
      expect(() => {
        emitNotification(userId, { id: '1', title: 'Test', message: 'Hello', type: 'SYSTEM' });
        emitUnreadCount(userId, 5);
        emitDashboardRefresh(userId);
      }).not.toThrow();
    });
  });
});
