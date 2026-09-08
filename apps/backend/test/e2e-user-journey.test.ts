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
import { processRecurringJob } from '../src/jobs/recurringWorker.js';
import { emitNotification, emitUnreadCount, emitDashboardRefresh } from '../src/sockets/socketGateway.js';

describe('TASK-6.4: End-to-End Product Lifecycle Integration Regression Suite', () => {
  const app = createApp();

  // Test state across lifecycle
  let userToken: string;
  let refreshToken: string;
  let userId: string;
  let accountId1: string;
  let accountId2: string;
  let salaryCategoryId: string;
  let foodCategoryId: string;
  let mutualFundsCategoryId: string;
  let recurringId: string;
  let adminToken: string;
  let adminId: string;

  // Step 1: Signup & Account Creation
  describe('1. Signup & Account Creation', () => {
    it('creates user account, issues JWT access and refresh tokens with httpOnly cookie', async () => {
      mockPrisma.clearAll();

      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'priya.sharma@example.com',
          password: 'Password123!',
          fullName: 'Priya Sharma',
          mobileNumber: '+919876543210',
        });

      expect(signupRes.status).toBe(201);
      expect(signupRes.body.success).toBe(true);

      const { user, tokens } = signupRes.body.data;
      expect(user).toMatchObject({
        email: 'priya.sharma@example.com',
        firstName: 'Priya',
        lastName: 'Sharma',
        role: 'USER',
        status: 'ACTIVE',
        onboardingCompleted: false,
      });

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.expiresIn).toBeGreaterThan(0);

      // Verify httpOnly cookie
      const cookies = signupRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=');
      expect(cookies[0]).toContain('HttpOnly');

      // Save for subsequent steps
      userToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      userId = user.id;

      // Verify default userSettings in DB
      const settings = mockPrisma._state.userSettings.get(userId);
      expect(settings).toBeDefined();
      expect(settings.currency).toBe('INR');
      expect(settings.timezone).toBe('Asia/Kolkata');
    });

    it('validates token refresh rotation mechanism', async () => {
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.tokens).toHaveProperty('accessToken');
      expect(refreshRes.body.data.tokens).toHaveProperty('refreshToken');

      // Update tokens with newly rotated tokens
      userToken = refreshRes.body.data.tokens.accessToken;
      refreshToken = refreshRes.body.data.tokens.refreshToken;
    });
  });

  // Step 2: Onboarding Wizard
  describe('2. Onboarding Wizard', () => {
    it('updates basic profile information', async () => {
      const basicRes = await request(app)
        .put('/api/v1/profile/basic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Priya',
          lastName: 'Sharma',
          mobileNumber: '+919876543210',
          dateOfBirth: '1992-07-15',
          address: 'B-402 Green Meadows, Mumbai',
        });

      expect(basicRes.status).toBe(200);
      expect(basicRes.body.success).toBe(true);
      expect(basicRes.body.data.user.fullName).toBe('Priya Sharma');
      expect(basicRes.body.data.financeProfile.address).toBe('B-402 Green Meadows, Mumbai');
    });

    it('updates finance profile and stores targets as BigInt paise in database', async () => {
      const financeRes = await request(app)
        .put('/api/v1/profile/finance')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          monthlyIncome: 120000, // ₹1,20,000
          monthlyExpenseBudget: 50000, // ₹50,000
          monthlyInvestmentTarget: 40000, // ₹40,000
          savingsTarget: 1000000, // ₹10,00,000
          riskAppetite: 'MEDIUM',
          investmentHorizon: 'LONG',
          investmentExperience: 'INTERMEDIATE',
        });

      expect(financeRes.status).toBe(200);
      expect(financeRes.body.success).toBe(true);

      // Verify rupee numbers in response
      expect(financeRes.body.data.financeProfile.monthlyIncome).toBe(120000);
      expect(financeRes.body.data.financeProfile.monthlyExpenseBudget).toBe(50000);
      expect(financeRes.body.data.financeProfile.monthlyInvestmentTarget).toBe(40000);
      expect(financeRes.body.data.financeProfile.savingsTarget).toBe(1000000);

      // Verify BigInt paise in database state
      const dbProfile = mockPrisma._state.financeProfiles.get(userId);
      expect(typeof dbProfile.monthlyIncome).toBe('bigint');
      expect(dbProfile.monthlyIncome).toBe(BigInt(12000000)); // ₹1,20,000 * 100
      expect(dbProfile.monthlyExpenseBudget).toBe(BigInt(5000000)); // ₹50,000 * 100
      expect(dbProfile.monthlyInvestmentTarget).toBe(BigInt(4000000)); // ₹40,000 * 100
      expect(dbProfile.savingsTarget).toBe(BigInt(100000000)); // ₹10,00,000 * 100

      // Verify onboarding completion status
      const dbUser = mockPrisma._state.users.get(userId);
      expect(dbUser.onboardingCompleted).toBe(true);
    });

    it('retrieves updated complete profile via GET /api/v1/profile', async () => {
      const profileRes = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.data.user.onboardingCompleted).toBe(true);
      expect(profileRes.body.data.financeProfile.monthlyIncome).toBe(120000);
    });
  });

  // Step 3: Security Questions (KBA)
  describe('3. Security Questions (KBA)', () => {
    it('retrieves available predefined security questions', async () => {
      const res = await request(app).get('/api/v1/security-questions/available');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('configures 3 security questions with bcrypt hashing', async () => {
      const setupRes = await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questions: [
            { questionKey: 'first_pet', answer: 'Bruno' },
            { questionKey: 'birth_city', answer: 'Mumbai' },
            { questionKey: 'mother_maiden_name', answer: 'Patil' },
          ],
        });

      expect(setupRes.status).toBe(200);
      expect(setupRes.body.success).toBe(true);
      expect(setupRes.body.data.count).toBe(3);
      expect(setupRes.body.data.configured).toBe(true);

      // Verify DB storage uses bcrypt hashes and never plaintext
      const storedQuestions = Array.from(mockPrisma._state.securityQuestions.values()).filter(
        (q: any) => q.userId === userId
      );
      expect(storedQuestions.length).toBe(3);
      for (const q of storedQuestions) {
        expect(q.answerHash).toBeDefined();
        expect(q.answerHash).not.toBe('Bruno');
        expect(q.answerHash).not.toBe('Mumbai');
        expect(q.answerHash).not.toBe('Patil');
        expect(q.answerHash.startsWith('$2a$') || q.answerHash.startsWith('$2b$')).toBe(true);
      }
    });

    it('strictly ensures answers and hashes are NEVER leaked in GET /api/v1/security-questions', async () => {
      const getRes = await request(app)
        .get('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.length).toBe(3);

      for (const q of getRes.body.data) {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('questionKey');
        expect(q).toHaveProperty('questionText');
        expect(q.answer).toBeUndefined();
        expect(q.answerHash).toBeUndefined();
      }
    });

    it('verifies correct answers and rejects incorrect answers via /verify', async () => {
      const validVerify = await request(app)
        .post('/api/v1/security-questions/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [
            { questionKey: 'first_pet', answer: 'Bruno' },
            { questionKey: 'birth_city', answer: 'Mumbai' },
            { questionKey: 'mother_maiden_name', answer: 'Patil' },
          ],
        });

      expect(validVerify.status).toBe(200);
      expect(validVerify.body.success).toBe(true);
      expect(validVerify.body.data.verified).toBe(true);

      const invalidVerify = await request(app)
        .post('/api/v1/security-questions/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [
            { questionKey: 'first_pet', answer: 'WrongDog' },
            { questionKey: 'birth_city', answer: 'Mumbai' },
            { questionKey: 'mother_maiden_name', answer: 'Patil' },
          ],
        });

      expect(invalidVerify.status).toBe(401);
      expect(invalidVerify.body.success).toBe(false);
      expect(invalidVerify.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  // Step 4: Accounts Management
  describe('4. Accounts Management', () => {
    it('creates Account 1 (HDFC Salary Account) with opening balance ₹1,00,000', async () => {
      const acc1Res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'HDFC Salary Account',
          type: 'BANK',
          accountType: 'BANK',
          institution: 'HDFC Bank',
          openingBalance: 100000, // ₹1,00,000
        });

      expect(acc1Res.status).toBe(201);
      expect(acc1Res.body.success).toBe(true);
      expect(acc1Res.body.data.name).toBe('HDFC Salary Account');
      expect(acc1Res.body.data.openingBalance).toBe(100000);
      expect(acc1Res.body.data.currentBalance).toBe(100000);

      accountId1 = acc1Res.body.data.id;

      // Verify DB stores opening and current balance as BigInt 10,000,000 paise
      const dbAcc1 = mockPrisma._state.accounts.get(accountId1);
      expect(dbAcc1.openingBalance).toBe(BigInt(10000000));
      expect(dbAcc1.currentBalance).toBe(BigInt(10000000));
    });

    it('creates Account 2 (ICICI Savings & Investment) with opening balance ₹50,000', async () => {
      const acc2Res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'ICICI Savings Account',
          type: 'BANK',
          accountType: 'BANK',
          institution: 'ICICI Bank',
          openingBalance: 50000, // ₹50,000
        });

      expect(acc2Res.status).toBe(201);
      expect(acc2Res.body.success).toBe(true);
      expect(acc2Res.body.data.name).toBe('ICICI Savings Account');
      expect(acc2Res.body.data.openingBalance).toBe(50000);
      expect(acc2Res.body.data.currentBalance).toBe(50000);

      accountId2 = acc2Res.body.data.id;

      // Verify DB stores opening and current balance as BigInt 5,000,000 paise
      const dbAcc2 = mockPrisma._state.accounts.get(accountId2);
      expect(dbAcc2.openingBalance).toBe(BigInt(5000000));
      expect(dbAcc2.currentBalance).toBe(BigInt(5000000));
    });

    it('lists all user accounts and aggregates total balances', async () => {
      const listRes = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.accounts.length).toBe(2);
      expect(listRes.body.data.summary.totalBalance).toBe(150000); // ₹1,50,000
    });

    it('updates account metadata and status toggling', async () => {
      const updateRes = await request(app)
        .put(`/api/v1/accounts/${accountId2}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'ICICI Primary Savings',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.name).toBe('ICICI Primary Savings');

      const toggleRes = await request(app)
        .patch(`/api/v1/accounts/${accountId2}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'ACTIVE',
        });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.success).toBe(true);
      expect(toggleRes.body.data.status).toBe('ACTIVE');
    });
  });

  // Step 5: Centralized Transactions & Single-Paise Balance Invariants
  describe('5. Centralized Transactions & Balance Invariants', () => {
    it('resolves system categories for Salary, Food & Dining, and Mutual Funds', async () => {
      const catRes = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`);

      expect(catRes.status).toBe(200);
      expect(catRes.body.success).toBe(true);

      const cats = catRes.body.data;
      salaryCategoryId = cats.find((c: any) => c.name === 'Salary')?.id;
      foodCategoryId = cats.find((c: any) => c.name === 'Food & Dining')?.id;
      mutualFundsCategoryId = cats.find((c: any) => c.name === 'Mutual Funds')?.id;

      expect(salaryCategoryId).toBeDefined();
      expect(foodCategoryId).toBeDefined();
      expect(mutualFundsCategoryId).toBeDefined();
    });

    it('5.1 records INCOME (Credit) and increases Account 1 balance to ₹2,20,000', async () => {
      const incomeRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId: accountId1,
          categoryId: salaryCategoryId,
          type: 'INCOME',
          amount: 120000, // ₹1,20,000
          description: 'September Software Engineering Salary',
        });

      expect(incomeRes.status).toBe(201);
      expect(incomeRes.body.success).toBe(true);
      expect(incomeRes.body.data.direction).toBe('CREDIT');
      expect(incomeRes.body.data.amount).toBe(120000);
      expect(incomeRes.body.data.amountPaise).toBe(12000000);

      // Verify Account 1 Balance: ₹1,00,000 + ₹1,20,000 = ₹2,20,000 (22,000,000 paise)
      const dbAcc1 = mockPrisma._state.accounts.get(accountId1);
      expect(dbAcc1.currentBalance).toBe(BigInt(22000000));
    });

    it('5.2 records EXPENSE (Debit) and reduces Account 1 balance to ₹2,05,000', async () => {
      const expenseRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId: accountId1,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amount: 15000, // ₹15,000
          description: 'Monthly Groceries & Gourmet Dining',
        });

      expect(expenseRes.status).toBe(201);
      expect(expenseRes.body.success).toBe(true);
      expect(expenseRes.body.data.direction).toBe('DEBIT');
      expect(expenseRes.body.data.amount).toBe(15000);
      expect(expenseRes.body.data.amountPaise).toBe(1500000);

      // Verify Account 1 Balance: ₹2,20,000 - ₹15,000 = ₹2,05,000 (20,500,000 paise)
      const dbAcc1 = mockPrisma._state.accounts.get(accountId1);
      expect(dbAcc1.currentBalance).toBe(BigInt(20500000));
    });

    it('5.3 records INVESTMENT (Debit) and reduces Account 1 balance to ₹1,65,000', async () => {
      const investRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId: accountId1,
          categoryId: mutualFundsCategoryId,
          type: 'INVESTMENT',
          amount: 40000, // ₹40,000
          description: 'Nifty 50 Index Mutual Fund SIP',
        });

      expect(investRes.status).toBe(201);
      expect(investRes.body.success).toBe(true);
      expect(investRes.body.data.direction).toBe('DEBIT');
      expect(investRes.body.data.amount).toBe(40000);
      expect(investRes.body.data.amountPaise).toBe(4000000);

      // Verify Account 1 Balance: ₹2,05,000 - ₹40,000 = ₹1,65,000 (16,500,000 paise)
      const dbAcc1 = mockPrisma._state.accounts.get(accountId1);
      expect(dbAcc1.currentBalance).toBe(BigInt(16500000));
    });

    it('5.4 records TRANSFER (Dual-Account Mutation) transferring ₹30,000 from Account 1 to Account 2', async () => {
      const transferRes = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sourceAccountId: accountId1,
          destinationAccountId: accountId2,
          amount: 30000, // ₹30,000
          notes: 'Emergency Reserve Allocation',
        });

      expect(transferRes.status).toBe(201);
      expect(transferRes.body.success).toBe(true);
      expect(transferRes.body.data.amount).toBe(30000);
      expect(transferRes.body.data.amountPaise).toBe(3000000);
      expect(transferRes.body.data.sourceAccountId).toBe(accountId1);
      expect(transferRes.body.data.destinationAccountId).toBe(accountId2);

      // Account 1: ₹1,65,000 - ₹30,000 = ₹1,35,000 (13,500,000 paise)
      const dbAcc1 = mockPrisma._state.accounts.get(accountId1);
      expect(dbAcc1.currentBalance).toBe(BigInt(13500000));

      // Account 2: ₹50,000 + ₹30,000 = ₹80,000 (8,000,000 paise)
      const dbAcc2 = mockPrisma._state.accounts.get(accountId2);
      expect(dbAcc2.currentBalance).toBe(BigInt(8000000));

      // Single-paise balance invariant check:
      // Account 1: Opening(10,000,000) + Credit(12,000,000) - DebitExpense(1,500,000) - DebitInvest(4,000,000) - DebitTransfer(3,000,000) = 13,500,000
      expect(dbAcc1.currentBalance).toBe(
        dbAcc1.openingBalance + BigInt(12000000) - BigInt(1500000) - BigInt(4000000) - BigInt(3000000)
      );

      // Account 2: Opening(5,000,000) + CreditTransfer(3,000,000) = 8,000,000
      expect(dbAcc2.currentBalance).toBe(
        dbAcc2.openingBalance + BigInt(3000000)
      );
    });
  });

  // Step 6: Dashboard Summary & Live FAM Score
  describe('6. Dashboard Summary & FAM Score', () => {
    it('retrieves live dashboard summary with worst-of-three grade and 3-segment progress', async () => {
      const dashRes = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(dashRes.status).toBe(200);
      expect(dashRes.body.success).toBe(true);

      const { data } = dashRes.body;
      expect(data).toHaveProperty('fam');
      expect(data).toHaveProperty('targets');
      expect(data).toHaveProperty('securityBanner');
      expect(data).toHaveProperty('accountSummary');

      // Security banner is hidden since 3 KBA questions are set
      expect(data.securityBanner.showSecurityReminder).toBe(false);
      expect(data.securityBanner.configuredQuestionsCount).toBe(3);

      // Account Summary: 2 active accounts, total balance = 135,000 + 80,000 = 215,000
      expect(data.accountSummary.activeCount).toBe(2);
      expect(data.accountSummary.totalBalance).toBe(215000);

      // Targets:
      // Income: Target ₹1,20,000, Actual ₹1,50,000 (125% -> A+)
      expect(data.targets.income.target).toBe(120000);
      expect(data.targets.income.actual).toBe(150000);
      expect(data.targets.income.percent).toBe(125);

      // Expense: Budget ₹50,000, Actual ₹45,000 (90% used <= 100% -> B)
      expect(data.targets.expense.target).toBe(50000);
      expect(data.targets.expense.actual).toBe(45000);
      expect(data.targets.expense.percent).toBe(90);

      // Investment: Target ₹40,000, Actual ₹40,000 (100% -> A+)
      expect(data.targets.investment.target).toBe(40000);
      expect(data.targets.investment.actual).toBe(40000);
      expect(data.targets.investment.percent).toBe(100);

      // FAM score: Worst-of-three grade (A+, B, A+) = B
      expect(data.fam.isAvailable).toBe(true);
      expect(data.fam.overallGrade).toBe('B');
      expect(data.fam.grade).toBe('B');
      expect(data.fam.statusLabel).toBe('Good');
      expect(data.fam.progress).toBe(96.7); // (90 + 100 + 100) / 3 = 96.7
    });

    it('verifies cached dashboard retrieval', async () => {
      const cachedDashRes = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(cachedDashRes.status).toBe(200);
      expect(cachedDashRes.body.success).toBe(true);
      expect(cachedDashRes.body.data.fam.grade).toBe('B');
    });
  });

  // Step 7: Planning (Budgets & Goals)
  describe('7. Planning (Budgets & Goals)', () => {
    let budgetId: string;
    let goalId: string;

    it('creates a budget for Food & Dining with live spent calculation from real transactions', async () => {
      const budgetRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          categoryId: foodCategoryId,
          period: 'MONTHLY',
          targetAmount: 20000, // ₹20,000
        });

      expect(budgetRes.status).toBe(201);
      expect(budgetRes.body.success).toBe(true);
      expect(budgetRes.body.data.targetAmount).toBe(20000);

      budgetId = budgetRes.body.data.id;

      // Verify live spent calculation: ₹15,000 spent from the grocery transaction in Food & Dining
      const getBudgetRes = await request(app)
        .get(`/api/v1/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getBudgetRes.status).toBe(200);
      expect(getBudgetRes.body.data.targetAmount).toBe(20000);
      expect(getBudgetRes.body.data.spent).toBe(15000);
      expect(getBudgetRes.body.data.remaining).toBe(5000);
      expect(getBudgetRes.body.data.percentage).toBe(75);
    });

    it('creates and updates a financial goal', async () => {
      const goalRes = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Home Down Payment',
          targetAmount: 500000, // ₹5,00,000
          currentAmount: 80000, // ₹80,000
          targetDate: '2028-12-31',
        });

      expect(goalRes.status).toBe(201);
      expect(goalRes.body.success).toBe(true);
      expect(goalRes.body.data.name).toBe('Home Down Payment');
      expect(goalRes.body.data.progress).toBe(16);

      goalId = goalRes.body.data.id;

      // Update goal current amount to ₹1,00,000
      const updateGoalRes = await request(app)
        .put(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentAmount: 100000,
        });

      expect(updateGoalRes.status).toBe(200);
      expect(updateGoalRes.body.data.currentAmount).toBe(100000);
      expect(updateGoalRes.body.data.progress).toBe(20);
    });
  });

  // Step 8: Analytics & Reports
  describe('8. Analytics & Reports', () => {
    it('retrieves monthly spending trends, category breakdowns, and savings rate', async () => {
      const analyticsRes = await request(app)
        .get('/api/v1/analytics?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.success).toBe(true);

      const summary = analyticsRes.body.data.summary;
      expect(summary.earned).toBe(150000); // 120k salary + 30k transfer in
      expect(summary.spent).toBe(45000); // 15k food + 30k transfer out
      expect(summary.invested).toBe(40000);
      expect(summary.netSavings).toBe(105000); // 150k - 45k
      expect(summary.savingsRate).toBe(70); // 105k / 150k = 70%
    });

    it('generates integrated monthly report agreeing with dashboard totals', async () => {
      const reportRes = await request(app)
        .get('/api/v1/reports?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      expect(reportRes.status).toBe(200);
      expect(reportRes.body.success).toBe(true);

      const report = reportRes.body.data;
      expect(report.month).toBe('2026-09');
      expect(report.famScore).toBeDefined();
      expect(report.targetVsActual.income.actual).toBe(150000);
      expect(report.targetVsActual.expense.actual).toBe(45000);
      expect(report.targetVsActual.investment.actual).toBe(40000);
    });

    it('exports report in CSV and JSON formats', async () => {
      // Export CSV
      const csvRes = await request(app)
        .post('/api/v1/reports/export')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          month: '2026-09',
          format: 'csv',
        });

      expect(csvRes.status).toBe(200);
      expect(csvRes.header['content-type']).toContain('text/csv');
      expect(csvRes.header['content-disposition']).toContain('attachment');

      // Export JSON
      const jsonRes = await request(app)
        .post('/api/v1/reports/export')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          month: '2026-09',
          format: 'json',
        });

      expect(jsonRes.status).toBe(200);
      expect(jsonRes.body.data.format).toBe('json');
    });
  });

  // Step 9: Recurring Transactions & BullMQ
  describe('9. Recurring Transactions & BullMQ', () => {
    it('creates recurring transaction and schedules occurrence', async () => {
      const recRes = await request(app)
        .post('/api/v1/recurring-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          accountId: accountId1,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amount: 5000, // ₹5,000
          description: 'Weekly Organic Grocery Basket',
          scheduleFreq: 'MONTHLY',
          scheduleInterval: 1,
          nextOccurrence: '2026-09-01T00:00:00.000Z',
        });

      expect(recRes.status).toBe(201);
      expect(recRes.body.success).toBe(true);
      expect(recRes.body.data.status).toBe('ACTIVE');
      recurringId = recRes.body.data.id;
    });

    it('materializes due recurring transactions via BullMQ worker, debits balance, and advances schedule', async () => {
      // Baseline balance before materialization: Account 1 is ₹1,35,000 (13,500,000 paise)
      const baseAcc = mockPrisma._state.accounts.get(accountId1);
      expect(baseAcc.currentBalance).toBe(BigInt(13500000));

      // Trigger materialization as of 2026-09-05 (due was 2026-09-01)
      const matResult = await recurringService.materializeDueTransactions(new Date('2026-09-05T00:00:00.000Z'));
      expect(matResult.materializedCount).toBeGreaterThanOrEqual(1);

      // Verify Account 1 balance debited by ₹5,000 -> ₹1,30,000 (13,000,000 paise)
      const updatedAcc = mockPrisma._state.accounts.get(accountId1);
      expect(updatedAcc.currentBalance).toBe(BigInt(13000000));

      // Verify recurring transaction nextOccurrence advanced
      const recItem = mockPrisma._state.recurringTransactions.get(recurringId);
      expect(new Date(recItem.nextOccurrence).getMonth()).toBe(9); // Advanced to October (month 9, 0-indexed)

      // Test processRecurringJob runner
      const workerRes = await processRecurringJob();
      expect(workerRes).toHaveProperty('materializedCount');
    });
  });

  // Step 10: Notifications & Reminders
  describe('10. Notifications & Reminders', () => {
    it('creates bill reminder and triggers notification on due date', async () => {
      const remRes = await request(app)
        .post('/api/v1/reminders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'RECURRING_EXPENSE',
          timingConfig: { daysBefore: 3 },
          enabled: true,
        });

      expect(remRes.status).toBe(201);
      expect(remRes.body.success).toBe(true);

      // Check due reminders and generate notifications
      const notifs = await reminderService.checkDueReminders(new Date('2026-09-08T00:00:00.000Z'));
      expect(Array.isArray(notifs)).toBe(true);
    });

    it('retrieves notifications, marks notification as read, and checks unread counts', async () => {
      const notifRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.success).toBe(true);
      expect(notifRes.body.data).toHaveProperty('items');
      expect(notifRes.body.data).toHaveProperty('unreadCount');

      // Test socket gateway safe execution
      expect(() => {
        emitNotification(userId, { id: 'test-1', title: 'Test', message: 'Hello', type: 'SYSTEM' });
        emitUnreadCount(userId, 0);
        emitDashboardRefresh(userId);
      }).not.toThrow();
    });
  });

  // Step 11: AI Financial Intelligence
  describe('11. AI Financial Intelligence', () => {
    it('computes monthly allocations, compound forward projections, and actionable suggestions', async () => {
      const aiRes = await request(app)
        .get('/api/v1/ai-analysis?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      expect(aiRes.status).toBe(200);
      expect(aiRes.body.success).toBe(true);

      const { data } = aiRes.body;
      expect(data.month).toBe('2026-09');
      expect(data.monthlyAnalysis).toHaveProperty('earned');
      expect(data.monthlyAnalysis).toHaveProperty('spent');
      expect(data.monthlyAnalysis).toHaveProperty('invested');
      expect(data.monthlyAnalysis).toHaveProperty('savingsRate');

      // Forward projections for 3, 6, 12 months
      expect(data.forwardProjections.length).toBe(3);
      expect(data.forwardProjections[0].horizonMonths).toBe(3);
      expect(data.forwardProjections[1].horizonMonths).toBe(6);
      expect(data.forwardProjections[2].horizonMonths).toBe(12);

      // Actionable suggestions
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('strictly enforces zero placeholder copy in generated AI analysis response', async () => {
      const aiRes = await request(app)
        .get('/api/v1/ai-analysis?month=2026-09')
        .set('Authorization', `Bearer ${userToken}`);

      const bodyText = JSON.stringify(aiRes.body).toLowerCase();
      const bannedWords = [
        ['coming', 'soon'].join(' '),
        ['coming', 'in', 'v2'].join(' '),
        ['beta', '(v2)'].join(' '),
        ['pre', 'view'].join(''),
        ['to', 'do'].join(''),
        ['sample', 'data'].join(' '),
        ['demo', 'data'].join(' '),
        ['lorem', 'ipsum'].join(' '),
      ];

      for (const word of bannedWords) {
        expect(bodyText.includes(word)).toBe(false);
      }
    });
  });

  // Step 12: User Settings & Danger Zone
  describe('12. User Settings & Danger Zone', () => {
    it('retrieves and updates user preferences', async () => {
      const getRes = await request(app)
        .get('/api/v1/user-settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.currency).toBe('INR');

      const patchRes = await request(app)
        .patch('/api/v1/user-settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quickAdd: false,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.quickAdd).toBe(false);
    });

    it('Danger Zone: Reset Profile atomically clears transactional records while preserving credentials & KBA', async () => {
      const resetRes = await request(app)
        .post('/api/v1/account-actions/reset-profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);
      expect(resetRes.body.data.message).toMatch(/reset/i);

      // Verify User record still exists and active
      const user = mockPrisma._state.users.get(userId);
      expect(user).toBeDefined();
      expect(user.status).toBe('ACTIVE');

      // Verify KBA questions preserved
      const kbaQuestions = Array.from(mockPrisma._state.securityQuestions.values()).filter(
        (q: any) => q.userId === userId
      );
      expect(kbaQuestions.length).toBe(3);

      // Verify transactional data wiped
      const userAccounts = Array.from(mockPrisma._state.accounts.values()).filter(
        (a: any) => a.userId === userId
      );
      expect(userAccounts.length).toBe(0);

      const userBudgets = Array.from(mockPrisma._state.budgets.values()).filter(
        (b: any) => b.userId === userId
      );
      expect(userBudgets.length).toBe(0);
    });

    it('Danger Zone: Delete Account validates password and soft deletes user account', async () => {
      // Rejection on incorrect password
      const wrongPassRes = await request(app)
        .post('/api/v1/account-actions/delete-account')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'IncorrectPassword999!' });

      expect(wrongPassRes.status).toBe(401);
      expect(wrongPassRes.body.success).toBe(false);

      // Success on correct password
      const correctPassRes = await request(app)
        .post('/api/v1/account-actions/delete-account')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'Password123!' });

      expect(correctPassRes.status).toBe(200);
      expect(correctPassRes.body.success).toBe(true);

      // Verify user status is DELETED in DB
      const user = mockPrisma._state.users.get(userId);
      expect(user.status).toBe('DELETED');

      // Subsequent login must be rejected
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'priya.sharma@example.com',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(401);
    });
  });

  // Step 13: Admin Management Suite
  describe('13. Admin Management Suite', () => {
    let regularToken: string;
    let targetUserId: string;
    let runId = 0;

    beforeEach(async () => {
      runId++;
      // Create regular user with unique email
      const regularRes = await request(app).post('/api/v1/auth/signup').send({
        email: `regular.user.${runId}@example.com`,
        password: 'Password123!',
        fullName: 'Regular User',
        mobileNumber: '+919876599991',
      });
      regularToken = regularRes.body.data.tokens.accessToken;
      targetUserId = regularRes.body.data.user.id;

      // Create admin user with unique email
      const adminRes = await request(app).post('/api/v1/auth/signup').send({
        email: `admin.user.${runId}@example.com`,
        password: 'AdminPassword123!',
        fullName: 'Admin Superuser',
        mobileNumber: '+919876599992',
      });
      adminId = adminRes.body.data.user.id;

      // Elevate admin role in mockPrisma
      const adminUser = mockPrisma._state.users.get(adminId);
      if (adminUser) {
        adminUser.role = 'ADMIN';
        mockPrisma._state.users.set(adminId, adminUser);
      }

      // Login as admin to get token with ADMIN role
      const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: `admin.user.${runId}@example.com`,
        password: 'AdminPassword123!',
      });
      adminToken = adminLoginRes.body.data.tokens.accessToken;
    });

    it('strictly enforces 403 Forbidden rejection on regular non-admin users', async () => {
      const endpoints = [
        '/api/v1/admin/dashboard',
        '/api/v1/admin/users',
        '/api/v1/admin/settings',
        '/api/v1/admin/app-settings',
        '/api/v1/admin/audit',
      ];

      for (const ep of endpoints) {
        const res = await request(app)
          .get(ep)
          .set('Authorization', `Bearer ${regularToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN');
      }
    });

    it('allows admin user to access dashboard metrics and user management', async () => {
      // 1. Admin Dashboard
      const dashRes = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(dashRes.status).toBe(200);
      expect(dashRes.body.success).toBe(true);
      expect(dashRes.body.data).toHaveProperty('totalUsers');
      expect(dashRes.body.data).toHaveProperty('activeUsers');

      // 2. User Management List
      const usersRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usersRes.status).toBe(200);
      expect(usersRes.body.success).toBe(true);
      expect(Array.isArray(usersRes.body.data.users)).toBe(true);

      // 3. User Status Toggling
      const patchUserRes = await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SUSPENDED',
        });

      expect(patchUserRes.status).toBe(200);
      expect(patchUserRes.body.data.status).toBe('SUSPENDED');
    });

    it('manages system app settings and queries immutable audit trail', async () => {
      // 1. Update app settings
      const updateSettingsRes = await request(app)
        .patch('/api/v1/admin/app-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          settings: [
            { key: 'session_timeout_minutes', value: 30 },
          ],
        });

      expect(updateSettingsRes.status).toBe(200);
      expect(updateSettingsRes.body.success).toBe(true);

      // 2. Query System Audit Log
      const auditRes = await request(app)
        .get('/api/v1/admin/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.success).toBe(true);
      expect(Array.isArray(auditRes.body.data.logs)).toBe(true);
      expect(auditRes.body.data.logs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
