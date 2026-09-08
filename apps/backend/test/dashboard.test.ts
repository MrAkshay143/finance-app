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
import { calculateFamScore } from '../src/services/famService.js';

describe('TASK-3.1: FAM Math, Dashboard Summary API & Redis Cache', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    mockPrisma.clearAll();

    // Create a fresh test user
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'dashboard.user@example.com',
      password: 'Password123!',
      fullName: 'Devin Dash',
      mobileNumber: '+919876500001',
    });

    userToken = signupRes.body.data.tokens.accessToken;
    userId = signupRes.body.data.user.id;
  });

  describe('FAM Mathematical Calculation Rules', () => {
    const periodStart = new Date(2026, 8, 1);
    const periodEnd = new Date(2026, 9, 1);

    it('calculates Expense grades correctly: <= 80% -> A+, 81-100% -> B, > 100% -> C', () => {
      const baseTargets = {
        expenseTargetPaise: BigInt(5000000), // ₹50,000
        investmentTargetPaise: BigInt(2000000), // ₹20,000
        incomeTargetPaise: BigInt(10000000), // ₹100,000
        investedPaise: BigInt(2000000), // 100% -> A+
        earnedPaise: BigInt(10000000), // 100% -> A+
        totalTxnCount: 5,
        onboardingCompleted: true,
        hasFinanceProfile: true,
        month: 9,
        year: 2026,
        periodStart,
        periodEnd,
      };

      // 1. Expense <= 80%: spent ₹35,000 / ₹50,000 = 70% -> A+
      const scoreA = calculateFamScore({
        ...baseTargets,
        spentPaise: BigInt(3500000),
      });
      expect(scoreA.isAvailable).toBe(true);
      expect(scoreA.expense.grade).toBe('A_PLUS');
      expect(scoreA.expense.gradeDisplay).toBe('A+');
      expect(scoreA.expense.statusLabel).toBe('Excellent');
      expect(scoreA.expense.percentage).toBe(70);

      // 2. Expense 81-100%: spent ₹45,000 / ₹50,000 = 90% -> B
      const scoreB = calculateFamScore({
        ...baseTargets,
        spentPaise: BigInt(4500000),
      });
      expect(scoreB.expense.grade).toBe('B');
      expect(scoreB.expense.gradeDisplay).toBe('B');
      expect(scoreB.expense.statusLabel).toBe('Good');
      expect(scoreB.expense.percentage).toBe(90);

      // 3. Expense > 100%: spent ₹60,000 / ₹50,000 = 120% -> C
      const scoreC = calculateFamScore({
        ...baseTargets,
        spentPaise: BigInt(6000000),
      });
      expect(scoreC.expense.grade).toBe('C');
      expect(scoreC.expense.gradeDisplay).toBe('C');
      expect(scoreC.expense.statusLabel).toBe('Poor');
      expect(scoreC.expense.percentage).toBe(120);
    });

    it('calculates Investment grades correctly: >= 100% -> A+, 70-99% -> B, < 70% -> C', () => {
      const baseTargets = {
        expenseTargetPaise: BigInt(5000000),
        investmentTargetPaise: BigInt(2000000), // ₹20,000
        incomeTargetPaise: BigInt(10000000),
        spentPaise: BigInt(3000000), // 60% -> A+
        earnedPaise: BigInt(10000000), // 100% -> A+
        totalTxnCount: 5,
        onboardingCompleted: true,
        hasFinanceProfile: true,
        month: 9,
        year: 2026,
        periodStart,
        periodEnd,
      };

      // 1. Investment >= 100%: invested ₹22,000 / ₹20,000 = 110% -> A+
      const scoreA = calculateFamScore({
        ...baseTargets,
        investedPaise: BigInt(2200000),
      });
      expect(scoreA.investment.grade).toBe('A_PLUS');
      expect(scoreA.investment.gradeDisplay).toBe('A+');
      expect(scoreA.investment.statusLabel).toBe('Excellent');
      expect(scoreA.investment.percentage).toBe(110);

      // 2. Investment 70-99%: invested ₹16,000 / ₹20,000 = 80% -> B
      const scoreB = calculateFamScore({
        ...baseTargets,
        investedPaise: BigInt(1600000),
      });
      expect(scoreB.investment.grade).toBe('B');
      expect(scoreB.investment.gradeDisplay).toBe('B');
      expect(scoreB.investment.statusLabel).toBe('Good');
      expect(scoreB.investment.percentage).toBe(80);

      // 3. Investment < 70%: invested ₹10,000 / ₹20,000 = 50% -> C
      const scoreC = calculateFamScore({
        ...baseTargets,
        investedPaise: BigInt(1000000),
      });
      expect(scoreC.investment.grade).toBe('C');
      expect(scoreC.investment.gradeDisplay).toBe('C');
      expect(scoreC.investment.statusLabel).toBe('Poor');
      expect(scoreC.investment.percentage).toBe(50);
    });

    it('calculates Income grades correctly: >= 100% -> A+, 70-99% -> B, < 70% -> C', () => {
      const baseTargets = {
        expenseTargetPaise: BigInt(5000000),
        investmentTargetPaise: BigInt(2000000),
        incomeTargetPaise: BigInt(10000000), // ₹100,000
        spentPaise: BigInt(3000000), // A+
        investedPaise: BigInt(2000000), // A+
        totalTxnCount: 5,
        onboardingCompleted: true,
        hasFinanceProfile: true,
        month: 9,
        year: 2026,
        periodStart,
        periodEnd,
      };

      // 1. Income >= 100%: earned ₹100,000 -> 100% -> A+
      const scoreA = calculateFamScore({
        ...baseTargets,
        earnedPaise: BigInt(10000000),
      });
      expect(scoreA.income.grade).toBe('A_PLUS');
      expect(scoreA.income.gradeDisplay).toBe('A+');
      expect(scoreA.income.percentage).toBe(100);

      // 2. Income 70-99%: earned ₹75,000 -> 75% -> B
      const scoreB = calculateFamScore({
        ...baseTargets,
        earnedPaise: BigInt(7500000),
      });
      expect(scoreB.income.grade).toBe('B');
      expect(scoreB.income.gradeDisplay).toBe('B');
      expect(scoreB.income.percentage).toBe(75);

      // 3. Income < 70%: earned ₹50,000 -> 50% -> C
      const scoreC = calculateFamScore({
        ...baseTargets,
        earnedPaise: BigInt(5000000),
      });
      expect(scoreC.income.grade).toBe('C');
      expect(scoreC.income.gradeDisplay).toBe('C');
      expect(scoreC.income.percentage).toBe(50);
    });

    it('determines Overall Grade as the worst of the three areas', () => {
      const base = {
        expenseTargetPaise: BigInt(5000000),
        investmentTargetPaise: BigInt(2000000),
        incomeTargetPaise: BigInt(10000000),
        totalTxnCount: 5,
        onboardingCompleted: true,
        hasFinanceProfile: true,
        month: 9,
        year: 2026,
        periodStart,
        periodEnd,
      };

      // All A+ -> Overall A+
      const allA = calculateFamScore({
        ...base,
        spentPaise: BigInt(3500000), // 70% -> A+
        investedPaise: BigInt(2200000), // 110% -> A+
        earnedPaise: BigInt(10500000), // 105% -> A+
      });
      expect(allA.overallGrade).toBe('A_PLUS');
      expect(allA.grade).toBe('A+');
      expect(allA.statusLabel).toBe('Excellent');

      // One area is B, none is C -> Overall B
      const oneB = calculateFamScore({
        ...base,
        spentPaise: BigInt(4500000), // 90% -> B
        investedPaise: BigInt(2200000), // 110% -> A+
        earnedPaise: BigInt(10500000), // 105% -> A+
      });
      expect(oneB.overallGrade).toBe('B');
      expect(oneB.grade).toBe('B');
      expect(oneB.statusLabel).toBe('Good');

      // One area is C -> Overall C (even if others are A+)
      const oneC = calculateFamScore({
        ...base,
        spentPaise: BigInt(6000000), // 120% -> C
        investedPaise: BigInt(2200000), // 110% -> A+
        earnedPaise: BigInt(10500000), // 105% -> A+
      });
      expect(oneC.overallGrade).toBe('C');
      expect(oneC.grade).toBe('C');
      expect(oneC.statusLabel).toBe('Poor');
    });

    it('computes Progress Ring as average of three areas with each area capped at 100%', () => {
      // Expense 50% (capped 50), Investment 120% (capped 100), Income 90% (capped 90)
      // Expected = (50 + 100 + 90) / 3 = 240 / 3 = 80%
      const res = calculateFamScore({
        expenseTargetPaise: BigInt(5000000),
        investmentTargetPaise: BigInt(2000000),
        incomeTargetPaise: BigInt(10000000),
        spentPaise: BigInt(2500000), // 50%
        investedPaise: BigInt(2400000), // 120%
        earnedPaise: BigInt(9000000), // 90%
        totalTxnCount: 4,
        onboardingCompleted: true,
        hasFinanceProfile: true,
        month: 9,
        year: 2026,
        periodStart,
        periodEnd,
      });

      expect(res.overallProgressPercentage).toBe(80);
      expect(res.progress).toBe(80);
    });

    it('returns Not Available state (— / NA) if profile incomplete, targets unset, or 0 transactions', () => {
      const valid = {
        expenseTargetPaise: BigInt(5000000),
        investmentTargetPaise: BigInt(2000000),
        incomeTargetPaise: BigInt(10000000),
        spentPaise: BigInt(2500000),
        investedPaise: BigInt(2000000),
        earnedPaise: BigInt(10000000),
        totalTxnCount: 1,
        onboardingCompleted: true,
        hasFinanceProfile: true,
        month: 9,
        year: 2026,
        periodStart,
        periodEnd,
      };

      // Case 1: Incomplete onboarding
      const notOnboarded = calculateFamScore({
        ...valid,
        onboardingCompleted: false,
      });
      expect(notOnboarded.isAvailable).toBe(false);
      expect(notOnboarded.overallGrade).toBe('NOT_AVAILABLE');
      expect(notOnboarded.grade).toBe('—');
      expect(notOnboarded.gradeDisplay).toBe('NA');
      expect(notOnboarded.overallProgressPercentage).toBe(0);

      // Case 2: Targets unset (0 target)
      const zeroTarget = calculateFamScore({
        ...valid,
        expenseTargetPaise: BigInt(0),
      });
      expect(zeroTarget.isAvailable).toBe(false);
      expect(zeroTarget.grade).toBe('—');
      expect(zeroTarget.overallProgressPercentage).toBe(0);

      // Case 3: 0 transactions exist this month
      const zeroTxns = calculateFamScore({
        ...valid,
        totalTxnCount: 0,
      });
      expect(zeroTxns.isAvailable).toBe(false);
      expect(zeroTxns.grade).toBe('—');
      expect(zeroTxns.overallProgressPercentage).toBe(0);
    });
  });

  describe('GET /api/v1/dashboard - Full Dashboard Summary API & Caching', () => {
    it('returns 401 UNAUTHENTICATED when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns initial dashboard with NA fam and security reminder banner when KBA is not configured', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data).toHaveProperty('fam');
      expect(data).toHaveProperty('targets');
      expect(data).toHaveProperty('securityBanner');
      expect(data).toHaveProperty('expenseBreakdown');
      expect(data).toHaveProperty('accountSummary');
      expect(data).toHaveProperty('recentTransactions');

      // Security reminder is TRUE because KBA is NOT configured (0 questions < 3)
      expect(data.securityBanner.showSecurityReminder).toBe(true);

      // FAM is NOT available because no profile, no targets, no txns
      expect(data.fam.isAvailable).toBe(false);
      expect(data.fam.grade).toBe('—');
      expect(data.fam.gradeDisplay).toBe('NA');

      // Account summary empty
      expect(data.accountSummary.activeCount).toBe(0);
      expect(data.accountSummary.totalBalance).toBe(0);
    });

    it('updates security banner to false after configuring 3 KBA questions', async () => {
      // Configure 3 KBA questions
      await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questions: [
            { questionKey: 'first_pet', answer: 'Barnaby' },
            { questionKey: 'birth_city', answer: 'Bristol' },
            { questionKey: 'mother_maiden_name', answer: 'Smith' },
          ],
        });

      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.securityBanner.showSecurityReminder).toBe(false);
      expect(res.body.data.securityBanner.configuredQuestionsCount).toBe(3);
    });

    it('computes live FAM, targets, category breakdown, account summary, and handles cache hit & invalidation on transaction creation', async () => {
      // 1. Setup Finance Profile targets: Income ₹100,000, Expense ₹50,000, Investment ₹20,000
      await request(app)
        .put('/api/v1/profile/finance')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          monthlyIncome: 100000,
          monthlyExpenseBudget: 50000,
          monthlyInvestmentTarget: 20000,
        });

      // 2. Create an Account with ₹25,000 balance
      const accRes = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'HDFC Bank',
          type: 'BANK',
          openingBalance: 25000,
        });
      accountId = accRes.body.data.id;

      // 3. Create initial transactions:
      // - Income: ₹100,000 (100% -> A+)
      // - Investment: ₹20,000 (100% -> A+)
      // - Expense: ₹30,000 (60% -> A+) in Food & Dining
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'INCOME',
          amount: 100000,
          description: 'Monthly Salary',
        });

      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'INVESTMENT',
          amount: 20000,
          description: 'SIP Index Fund',
        });

      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'EXPENSE',
          amount: 30000,
          description: 'Dinner & Groceries',
        });

      // 4. First Dashboard read -> fetches fresh data and caches payload
      const dash1 = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(dash1.status).toBe(200);
      const data1 = dash1.body.data;

      // FAM should be Available and A+
      expect(data1.fam.isAvailable).toBe(true);
      expect(data1.fam.overallGrade).toBe('A_PLUS');
      expect(data1.fam.grade).toBe('A+');
      expect(data1.fam.statusLabel).toBe('Excellent');

      // Targets check
      expect(data1.targets.income.actual).toBe(100000);
      expect(data1.targets.income.percent).toBe(100);
      expect(data1.targets.investment.actual).toBe(20000);
      expect(data1.targets.investment.percent).toBe(100);
      expect(data1.targets.expense.actual).toBe(30000);
      expect(data1.targets.expense.percent).toBe(60);
      expect(data1.targets.expense.remaining).toBe(20000);

      // Account summary check: opening 25000 + 100000 income - 20000 investment - 30000 expense = 75000
      expect(data1.accountSummary.activeCount).toBe(1);
      expect(data1.accountSummary.totalBalance).toBe(75000);

      // Recent transactions check: 3 transactions
      expect(data1.recentTransactions.length).toBe(3);

      // 5. Second Dashboard read -> CACHE HIT!
      const dash2 = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(dash2.status).toBe(200);
      expect(dash2.body.data._cached).toBe(true);
      expect(dash2.body.data.recentTransactions.length).toBe(3);

      // 6. Mutate data: Add a new Expense transaction of ₹10,000
      // This MUST invalidate the dashboard cache!
      const newTxnRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId,
          type: 'EXPENSE',
          amount: 10000,
          description: 'Weekend Shopping',
        });
      expect(newTxnRes.status).toBe(201);

      // 7. Third Dashboard read -> Cache was invalidated, freshly computed!
      const dash3 = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(dash3.status).toBe(200);
      expect(dash3.body.data._cached).toBeUndefined(); // Fresh calculation!
      expect(dash3.body.data.recentTransactions.length).toBe(4);
      expect(dash3.body.data.recentTransactions[0].description).toBe('Weekend Shopping');
      // Expense total is now ₹40,000 / ₹50,000 = 80% (still A+)
      expect(dash3.body.data.targets.expense.actual).toBe(40000);
      expect(dash3.body.data.targets.expense.percent).toBe(80);
    });

    it('GET /api/v1/dashboard/fam returns FAM calculation payload', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/fam')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isAvailable');
      expect(res.body.data).toHaveProperty('overallGrade');
      expect(res.body.data).toHaveProperty('areas');
    });
  });
});
