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
import { investmentService } from '../src/services/investmentService.js';
import { aiService } from '../src/services/aiService.js';

describe('TASK-4.4: AI Financial Intelligence & Investments Services', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let accountId: string;
  let mutualFundsId: string;
  let goldId: string;
  let fixedDepositId: string;
  let foodId: string;
  let salaryId: string;

  beforeEach(async () => {
    mockPrisma.clearAll();

    // 1. User Signup
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'ai.invest@example.com',
      password: 'Password123!',
      fullName: 'Investor User',
      mobileNumber: '+919876543212',
    });

    userToken = signupRes.body.data.tokens.accessToken;
    userId = signupRes.body.data.user.id;

    // 2. Setup Finance Profile
    await request(app)
      .put('/api/v1/profile/finance')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        monthlyIncome: 150000, // ₹1,50,000
        monthlyExpenseBudget: 60000, // ₹60,000
        monthlyInvestmentTarget: 50000, // ₹50,000
      });

    // 3. Create Account
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Investment Demat & Savings',
        accountType: 'BANK',
        openingBalance: 1000000, // ₹10,00,000
      });
    accountId = accRes.body.data.id;

    // 4. Resolve Categories
    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`);

    const cats = catRes.body.data;
    mutualFundsId = cats.find((c: any) => c.name === 'Mutual Funds')?.id;
    goldId = cats.find((c: any) => c.name === 'Gold')?.id;
    fixedDepositId = cats.find((c: any) => c.name === 'Fixed Deposit')?.id;
    foodId = cats.find((c: any) => c.name === 'Food & Dining')?.id;
    salaryId = cats.find((c: any) => c.name === 'Salary')?.id;

    // 5. Seed Transactions for September 2026
    // Income: ₹1,50,000
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: salaryId,
        type: 'INCOME',
        amount: 150000,
        txnDate: '2026-09-01T10:00:00.000Z',
        description: 'September Compensation',
      });

    // Expense: ₹45,000 Food & Dining
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: foodId,
        type: 'EXPENSE',
        amount: 45000,
        txnDate: '2026-09-04T12:00:00.000Z',
        description: 'Household Food & Dining',
      });

    // Investment 1: ₹30,000 Mutual Funds
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: mutualFundsId,
        type: 'INVESTMENT',
        amount: 30000,
        txnDate: '2026-09-05T09:00:00.000Z',
        description: 'Nifty 50 Index Fund',
      });

    // Investment 2: ₹20,000 Sovereign Gold
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        accountId,
        categoryId: goldId,
        type: 'INVESTMENT',
        amount: 20000,
        txnDate: '2026-09-07T09:00:00.000Z',
        description: 'Gold ETF Tranche',
      });
  });

  describe('GET /api/v1/investments & GET /api/v1/investments/summary', () => {
    it('returns portfolio overview with target comparison and category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/investments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      // Total Invested: 30k + 20k = 50,000
      expect(data.totalInvested).toBe(50000);
      expect(data.totalInvestedPaise).toBe(5000000);
      expect(data.monthlyInvested).toBe(50000);

      // Target Comparison: target 50k, actual 50k -> 100%
      expect(data.targetComparison.target).toBe(50000);
      expect(data.targetComparison.actual).toBe(50000);
      expect(data.targetComparison.diff).toBe(0);
      expect(data.targetComparison.percentageAchieved).toBe(100);

      // Category Breakdown: Mutual Funds (60%), Gold (40%)
      expect(data.categoryBreakdown.length).toBe(2);
      const mf = data.categoryBreakdown.find((c: any) => c.categoryName === 'Mutual Funds');
      expect(mf).toBeDefined();
      expect(mf.totalAmount).toBe(30000);
      expect(mf.percentage).toBe(60);

      const gold = data.categoryBreakdown.find((c: any) => c.categoryName === 'Gold');
      expect(gold).toBeDefined();
      expect(gold.totalAmount).toBe(20000);
      expect(gold.percentage).toBe(40);

      // Recent Investments list
      expect(data.recentInvestments.length).toBe(2);
      expect(data.recentInvestments[0].type).toBe('INVESTMENT');

      // 6-Month Trend
      expect(data.monthlyTrend.length).toBe(6);
    });

    it('returns identical structure via GET /api/v1/investments/summary', async () => {
      const res = await request(app)
        .get('/api/v1/investments/summary')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalInvested).toBe(50000);
    });
  });

  describe('GET /api/v1/ai-analysis', () => {
    it('returns structured monthly allocations, compound forward projections, and smart suggestions', async () => {
      const res = await request(app)
        .get('/api/v1/ai-analysis?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.month).toBe('2026-09');
      expect(data.monthLabel).toContain('September 2026');

      // Monthly Analysis
      const ma = data.monthlyAnalysis;
      expect(ma.earned).toBe(150000);
      expect(ma.spent).toBe(45000);
      expect(ma.invested).toBe(50000);
      expect(ma.netSavings).toBe(105000); // 150k - 45k
      // needsRatio: 45000 / 150000 = 30%
      expect(ma.needsRatio).toBe(30);
      // investmentRatio: 50000 / 150000 = 33%
      expect(ma.investmentRatio).toBe(33);
      // savingsRate: 105000 / 150000 = 70%
      expect(ma.savingsRate).toBe(70);

      // Forward Projections: 3, 6, 12 months
      expect(data.forwardProjections.length).toBe(3);
      const [p3, p6, p12] = data.forwardProjections;
      expect(p3.horizonMonths).toBe(3);
      expect(p3.projectedSavings).toBe(105000 * 3); // 315,000
      expect(p3.projectedWealth).toBeGreaterThan(150000);

      expect(p6.horizonMonths).toBe(6);
      expect(p6.projectedSavings).toBe(105000 * 6); // 630,000

      expect(p12.horizonMonths).toBe(12);
      expect(p12.projectedSavings).toBe(105000 * 12); // 1,260,000

      // Smart Suggestions
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions.length).toBeGreaterThanOrEqual(1);
      for (const sug of data.suggestions) {
        expect(sug).toHaveProperty('id');
        expect(sug).toHaveProperty('title');
        expect(sug).toHaveProperty('description');
        expect(sug).toHaveProperty('priority');
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(sug.priority);
      }

      // Summary Note
      expect(typeof data.summaryNote).toBe('string');
      expect(data.summaryNote.length).toBeGreaterThan(20);
    });

    it('strictly confirms zero placeholder copy in generated AI analysis response', async () => {
      const res = await request(app)
        .get('/api/v1/ai-analysis?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      const jsonString = JSON.stringify(res.body).toLowerCase();

      const bannedPhrases = [
        ['coming', 'soon'].join(' '),
        ['coming', 'in', 'v2'].join(' '),
        ['beta', '(v2)'].join(' '),
        ['pre', 'view'].join(''),
        ['to', 'do'].join(''),
        ['sample', 'data'].join(' '),
        ['demo', 'data'].join(' '),
        ['lorem', 'ipsum'].join(' '),
      ];

      for (const phrase of bannedPhrases) {
        expect(jsonString.includes(phrase)).toBe(false);
      }
    });
  });
});
