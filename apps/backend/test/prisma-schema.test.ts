import { describe, it, expect, vi } from 'vitest';
import {
  PrismaClient,
  Prisma,
  UserRole,
  UserStatus,
  TxnType,
  TxnDirection,
  RecordStatus,
  AccountStatus,
  RecurringStatus,
} from '@prisma/client';
import {
  SYSTEM_CATEGORIES,
  DEFAULT_APP_SETTINGS,
  seed,
} from '../prisma/seed.js';

describe('Prisma Schema & Model Verification', () => {
  it('exposes all required models via Prisma.ModelName', () => {
    const modelNames = Object.values(Prisma.ModelName);
    const expectedModels = [
      'User',
      'RefreshToken',
      'SecurityQuestion',
      'FinanceProfile',
      'Account',
      'Category',
      'Merchant',
      'Transaction',
      'Transfer',
      'Budget',
      'Goal',
      'RecurringTransaction',
      'Notification',
      'Reminder',
      'AuditLog',
      'AppSetting',
      'UserSettings',
    ];

    for (const model of expectedModels) {
      expect(modelNames).toContain(model);
    }
    expect(modelNames.length).toBe(17);
  });

  it('exposes all required delegates on PrismaClient instance', () => {
    const client = new PrismaClient();
    expect(typeof client.user).toBe('object');
    expect(typeof client.refreshToken).toBe('object');
    expect(typeof client.securityQuestion).toBe('object');
    expect(typeof client.financeProfile).toBe('object');
    expect(typeof client.account).toBe('object');
    expect(typeof client.category).toBe('object');
    expect(typeof client.merchant).toBe('object');
    expect(typeof client.transaction).toBe('object');
    expect(typeof client.transfer).toBe('object');
    expect(typeof client.budget).toBe('object');
    expect(typeof client.goal).toBe('object');
    expect(typeof client.recurringTransaction).toBe('object');
    expect(typeof client.notification).toBe('object');
    expect(typeof client.reminder).toBe('object');
    expect(typeof client.auditLog).toBe('object');
    expect(typeof client.appSetting).toBe('object');
    expect(typeof client.userSettings).toBe('object');
  });

  it('verifies all specified enum values', () => {
    expect(UserRole).toEqual({ USER: 'USER', ADMIN: 'ADMIN' });
    expect(UserStatus).toEqual({
      ACTIVE: 'ACTIVE',
      SUSPENDED: 'SUSPENDED',
      DELETED: 'DELETED',
    });
    expect(TxnType).toEqual({
      INCOME: 'INCOME',
      EXPENSE: 'EXPENSE',
      INVESTMENT: 'INVESTMENT',
    });
    expect(TxnDirection).toEqual({ CREDIT: 'CREDIT', DEBIT: 'DEBIT' });
    expect(RecordStatus).toEqual({ ACTIVE: 'ACTIVE', DELETED: 'DELETED' });
    expect(AccountStatus).toEqual({ ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' });
    expect(RecurringStatus).toEqual({
      ACTIVE: 'ACTIVE',
      PAUSED: 'PAUSED',
      DELETED: 'DELETED',
    });
  });

  it('verifies monetary BigInt type enforcement in model inputs', () => {
    // Type-level assertion: monetary fields must accept bigint paise
    const sampleProfileInput: Prisma.FinanceProfileCreateInput = {
      user: { connect: { id: 'test-user-id' } },
      monthlyIncome: BigInt(5000000), // ₹50,000 in paise
      monthlyExpenseBudget: BigInt(3000000), // ₹30,000 in paise
      monthlyInvestmentTarget: BigInt(1500000), // ₹15,000 in paise
      savingsTarget: BigInt(10000000), // ₹1,00,000 in paise
    };
    expect(typeof sampleProfileInput.monthlyIncome).toBe('bigint');
    expect(typeof sampleProfileInput.monthlyExpenseBudget).toBe('bigint');
    expect(typeof sampleProfileInput.monthlyInvestmentTarget).toBe('bigint');
    expect(typeof sampleProfileInput.savingsTarget).toBe('bigint');

    const sampleAccountInput: Prisma.AccountCreateInput = {
      user: { connect: { id: 'test-user-id' } },
      name: 'HDFC Bank',
      accountType: 'BANK',
      openingBalance: BigInt(2500000),
      currentBalance: BigInt(2500000),
    };
    expect(typeof sampleAccountInput.openingBalance).toBe('bigint');
    expect(typeof sampleAccountInput.currentBalance).toBe('bigint');

    const sampleTransactionInput: Prisma.TransactionCreateInput = {
      user: { connect: { id: 'test-user-id' } },
      account: { connect: { id: 'test-account-id' } },
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(149900), // ₹1,499.00
      txnDate: new Date(),
    };
    expect(typeof sampleTransactionInput.amount).toBe('bigint');

    const sampleBudgetInput: Prisma.BudgetCreateInput = {
      user: { connect: { id: 'test-user-id' } },
      category: { connect: { id: 'test-cat-id' } },
      name: 'Monthly Groceries',
      targetAmount: BigInt(1500000),
      periodStart: new Date(),
    };
    expect(typeof sampleBudgetInput.targetAmount).toBe('bigint');

    const sampleGoalInput: Prisma.GoalCreateInput = {
      user: { connect: { id: 'test-user-id' } },
      name: 'Emergency Fund',
      targetAmount: BigInt(30000000),
      currentAmount: BigInt(5000000),
    };
    expect(typeof sampleGoalInput.targetAmount).toBe('bigint');
    expect(typeof sampleGoalInput.currentAmount).toBe('bigint');

    const sampleRecurringInput: Prisma.RecurringTransactionCreateInput = {
      user: { connect: { id: 'test-user-id' } },
      account: { connect: { id: 'test-account-id' } },
      type: TxnType.EXPENSE,
      amount: BigInt(49900),
      scheduleFreq: 'MONTHLY',
      nextOccurrence: new Date(),
    };
    expect(typeof sampleRecurringInput.amount).toBe('bigint');
  });

  it('contains all 17 system categories in seed dataset with valid types', () => {
    const expectedCategories = [
      { name: 'Food & Dining', type: TxnType.EXPENSE },
      { name: 'Groceries', type: TxnType.EXPENSE },
      { name: 'Fuel', type: TxnType.EXPENSE },
      { name: 'Rent', type: TxnType.EXPENSE },
      { name: 'Utilities', type: TxnType.EXPENSE },
      { name: 'Shopping', type: TxnType.EXPENSE },
      { name: 'Health & Medical', type: TxnType.EXPENSE },
      { name: 'Entertainment', type: TxnType.EXPENSE },
      { name: 'Travel & Transit', type: TxnType.EXPENSE },
      { name: 'Salary', type: TxnType.INCOME },
      { name: 'Freelance', type: TxnType.INCOME },
      { name: 'Investment Return', type: TxnType.INCOME },
      { name: 'Bonds', type: TxnType.INVESTMENT },
      { name: 'Fixed Deposit', type: TxnType.INVESTMENT },
      { name: 'Gold', type: TxnType.INVESTMENT },
      { name: 'Mutual Funds', type: TxnType.INVESTMENT },
      { name: 'Real Estate', type: TxnType.INVESTMENT },
    ];

    expect(SYSTEM_CATEGORIES.length).toBe(17);
    for (const expected of expectedCategories) {
      const match = SYSTEM_CATEGORIES.find((c) => c.name === expected.name);
      expect(match).toBeDefined();
      expect(match?.type).toBe(expected.type);
    }
  });

  it('contains default app settings for session timeout and failed attempts', () => {
    const sessionTimeout = DEFAULT_APP_SETTINGS.find((s) => s.key === 'session_timeout_minutes');
    expect(sessionTimeout).toBeDefined();
    expect(sessionTimeout?.value).toBe(15);

    const failedAttempts = DEFAULT_APP_SETTINGS.find((s) => s.key === 'max_failed_attempts');
    expect(failedAttempts).toBeDefined();
    expect(failedAttempts?.value).toBe(5);
  });

  it('executes seed logic cleanly against mocked Prisma Client', async () => {
    const mockCategoryFindFirst = vi.fn().mockResolvedValue(null);
    const mockCategoryCreate = vi.fn().mockResolvedValue({ id: 'cat-id' });
    const mockCategoryUpdate = vi.fn().mockResolvedValue({ id: 'cat-id' });
    const mockAppSettingUpsert = vi.fn().mockResolvedValue({ key: 'test', value: {} });

    const prismaTestAdapter = {
      category: {
        findFirst: mockCategoryFindFirst,
        create: mockCategoryCreate,
        update: mockCategoryUpdate,
      },
      appSetting: {
        upsert: mockAppSettingUpsert,
      },
    } as unknown as PrismaClient;

    await seed(prismaTestAdapter);

    expect(mockCategoryFindFirst).toHaveBeenCalledTimes(SYSTEM_CATEGORIES.length);
    expect(mockCategoryCreate).toHaveBeenCalledTimes(SYSTEM_CATEGORIES.length);
    expect(mockCategoryUpdate).not.toHaveBeenCalled();
    expect(mockAppSettingUpsert).toHaveBeenCalledTimes(DEFAULT_APP_SETTINGS.length);
  });
});
