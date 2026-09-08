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
import { analyticsService } from '../src/services/analyticsService.js';
import { reportService } from '../src/services/reportService.js';
import { dashboardService } from '../src/services/dashboardService.js';

describe('TASK-4.1: Analytics & Reports Aggregation Services', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let accountId: string;
  let foodCategoryId: string;
  let shoppingCategoryId: string;
  let salaryCategoryId: string;
  let mutualFundsCategoryId: string;

  beforeEach(async () => {
    mockPrisma.clearAll();

    // 1. Signup user
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'analytics.tester@example.com',
      password: 'Password123!',
      fullName: 'Analytics User',
      mobileNumber: '+919876543210',
    });

    userToken = signupRes.body.data.tokens.accessToken;
    userId = signupRes.body.data.user.id;

    // 2. Set up Finance Profile
    await request(app)
      .put('/api/v1/profile/finance')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        monthlyIncome: 100000, // ₹1,00,000 (10000000 paise)
        monthlyExpenseBudget: 50000, // ₹50,000 (5000000 paise)
        monthlyInvestmentTarget: 25000, // ₹25,000 (2500000 paise)
      });

    // 3. Create Bank Account
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Primary HDFC Savings',
        accountType: 'BANK',
        openingBalance: 500000, // ₹5,00,000
      });
    accountId = accRes.body.data.id;

    // 4. Resolve Categories
    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`);

    const cats = catRes.body.data;
    foodCategoryId = cats.find((c: any) => c.name === 'Food & Dining')?.id;
    shoppingCategoryId = cats.find((c: any) => c.name === 'Shopping')?.id;
    salaryCategoryId = cats.find((c: any) => c.name === 'Salary')?.id;
    mutualFundsCategoryId = cats.find((c: any) => c.name === 'Mutual Funds')?.id;

    // 5. Seed September 2026 transactions
    // Income: ₹1,00,000
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: salaryCategoryId,
        type: 'INCOME',
        amount: 100000,
        txnDate: '2026-09-02T10:00:00.000Z',
        description: 'September Monthly Salary',
      });

    // Expense 1: ₹20,000 Food & Dining
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: foodCategoryId,
        type: 'EXPENSE',
        amount: 20000,
        txnDate: '2026-09-05T12:00:00.000Z',
        description: 'Groceries & Dining',
      });

    // Expense 2: ₹15,000 Shopping
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: shoppingCategoryId,
        type: 'EXPENSE',
        amount: 15000,
        txnDate: '2026-09-07T15:00:00.000Z',
        description: 'Autumn Clothes',
      });

    // Investment: ₹25,000 Mutual Funds
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: mutualFundsCategoryId,
        type: 'INVESTMENT',
        amount: 25000,
        txnDate: '2026-09-08T09:00:00.000Z',
        description: 'Index Fund SIP',
      });
  });

  describe('GET /api/v1/analytics', () => {
    it('returns 401 when unauthorized', async () => {
      const res = await request(app).get('/api/v1/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns complete analytics with 6-month historical trends and category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/analytics?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data).toHaveProperty('period');
      expect(data.period.month).toBe('2026-09');
      expect(data.period.year).toBe(2026);
      expect(data.period.monthNumber).toBe(9);

      // Summary
      expect(data.summary.earned).toBe(100000);
      expect(data.summary.earnedPaise).toBe(10000000);
      expect(data.summary.spent).toBe(35000); // 20k + 15k
      expect(data.summary.spentPaise).toBe(3500000);
      expect(data.summary.invested).toBe(25000);
      expect(data.summary.investedPaise).toBe(2500000);
      expect(data.summary.netSavings).toBe(65000); // 100k - 35k
      expect(data.summary.savingsRate).toBe(65); // (65k / 100k) * 100 = 65%

      // 6-Month Spending Trends
      expect(Array.isArray(data.spendingTrends)).toBe(true);
      expect(data.spendingTrends.length).toBe(6);
      const septTrend = data.spendingTrends[data.spendingTrends.length - 1];
      expect(septTrend.month).toBe('2026-09');
      expect(septTrend.earned).toBe(100000);
      expect(septTrend.spent).toBe(35000);
      expect(septTrend.invested).toBe(25000);
      expect(septTrend.netSavings).toBe(65000);
      expect(septTrend.savingsRate).toBe(65);

      // Category Spending Breakdown
      expect(Array.isArray(data.categoryBreakdown)).toBe(true);
      expect(data.categoryBreakdown.length).toBe(2);

      const foodBreakdown = data.categoryBreakdown.find((c: any) => c.categoryName === 'Food & Dining');
      expect(foodBreakdown).toBeDefined();
      expect(foodBreakdown.totalAmount).toBe(20000);
      expect(foodBreakdown.amountPaise).toBe(2000000);
      expect(foodBreakdown.transactionCount).toBe(1);
      // (20000 / 35000) * 100 = 57.1%
      expect(foodBreakdown.percentage).toBe(57.1);

      const shoppingBreakdown = data.categoryBreakdown.find((c: any) => c.categoryName === 'Shopping');
      expect(shoppingBreakdown).toBeDefined();
      expect(shoppingBreakdown.totalAmount).toBe(15000);
      expect(shoppingBreakdown.amountPaise).toBe(1500000);
      // (15000 / 35000) * 100 = 42.9%
      expect(shoppingBreakdown.percentage).toBe(42.9);
    });
  });

  describe('GET /api/v1/reports & POST /api/v1/reports/export', () => {
    it('rejects GET /api/v1/reports without month query param with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/v1/reports')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('generates monthly report integrating FAM score and Target vs Actual', async () => {
      const res = await request(app)
        .get('/api/v1/reports?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const report = res.body.data;
      expect(report.month).toBe('2026-09');
      expect(report.monthLabel).toBe('September 2026');
      expect(report.year).toBe(2026);

      // FAM score integrated
      expect(report.famScore).toBeDefined();
      expect(report.famScore.isAvailable).toBe(true);

      // Target vs Actual Table
      const tva = report.targetVsActual;
      // Income: Target 1,00,000, Actual 1,00,000
      expect(tva.income.target).toBe(100000);
      expect(tva.income.actual).toBe(100000);
      expect(tva.income.percentageAchieved).toBe(100);
      expect(tva.income.status).toBe('EXCELLENT');

      // Expense: Budget 50,000, Actual 35,000 (70% used <= 80% -> EXCELLENT)
      expect(tva.expense.target).toBe(50000);
      expect(tva.expense.actual).toBe(35000);
      expect(tva.expense.diff).toBe(15000); // 50k - 35k under budget
      expect(tva.expense.percentageAchieved).toBe(70);
      expect(tva.expense.status).toBe('EXCELLENT');

      // Investment: Target 25,000, Actual 25,000 (100% -> EXCELLENT)
      expect(tva.investment.target).toBe(25000);
      expect(tva.investment.actual).toBe(25000);
      expect(tva.investment.diff).toBe(0);
      expect(tva.investment.percentageAchieved).toBe(100);
      expect(tva.investment.status).toBe('EXCELLENT');

      // Net Savings: 65,000, Savings Rate: 65%
      expect(tva.netSavings.actual).toBe(65000);
      expect(tva.netSavings.savingsRate).toBe(65);

      // Callouts
      expect(Array.isArray(report.callouts)).toBe(true);
      expect(report.callouts.length).toBeGreaterThan(0);

      // Category summary
      expect(Array.isArray(report.categorySummary)).toBe(true);
      expect(report.categorySummary.length).toBe(4); // salary, food, shopping, and mutual funds
    });

    it('exports report in JSON format', async () => {
      const res = await request(app)
        .post('/api/v1/reports/export')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          month: '2026-09',
          format: 'json',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.format).toBe('json');
      expect(res.body.data.filename).toBe('finance-report-2026-09.json');
      expect(res.body.data.data.month).toBe('2026-09');
    });

    it('exports report in CSV format', async () => {
      const res = await request(app)
        .post('/api/v1/reports/export')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          month: '2026-09',
          format: 'csv',
        });

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.header['content-disposition']).toContain('attachment; filename="finance-report-2026-09.csv"');
      expect(res.text).toContain('Finance Tracker Monthly Report - September 2026');
      expect(res.text).toContain('Earned vs Income Target');
      expect(res.text).toContain('Spent vs Expense Budget');
    });

    it('verifies report totals match analytics and dashboard for the identical period', async () => {
      // 1. Fetch from Analytics
      const analytics = await analyticsService.getAnalytics(userId, { month: '2026-09' });

      // 2. Fetch from Reports
      const report = await reportService.getMonthlyReport(userId, '2026-09');

      // 3. Fetch from Dashboard
      const dashboard = await dashboardService.getDashboardSummary(userId, new Date(2026, 8, 15));

      // Compare Earned
      expect(report.totals.earnedPaise).toBe(analytics.summary.earnedPaise);
      expect(analytics.summary.earnedPaise).toBe(dashboard.targets.income.actualPaise);

      // Compare Spent
      expect(report.totals.spentPaise).toBe(analytics.summary.spentPaise);
      expect(analytics.summary.spentPaise).toBe(dashboard.targets.expense.actualPaise);

      // Compare Invested
      expect(report.totals.investedPaise).toBe(analytics.summary.investedPaise);
      expect(analytics.summary.investedPaise).toBe(dashboard.targets.investment.actualPaise);

      // Invariant: Net Savings = Earned - Spent
      expect(report.totals.netSavingsPaise).toBe(report.totals.earnedPaise - report.totals.spentPaise);
      expect(analytics.summary.netSavingsPaise).toBe(analytics.summary.earnedPaise - analytics.summary.spentPaise);
    });
  });
});
