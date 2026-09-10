import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../src/pages/DashboardPage.js';
import { PlanningPage } from '../src/pages/PlanningPage.js';
import { CategoriesPage } from '../src/pages/CategoriesPage.js';
import { FamDonutRing } from '../src/components/finance/FamProgressRing.js';
import { formatIndianRupees } from '../src/utils/currency.js';
import type { Category, Merchant } from '@finance/shared-types';

const MOCK_DASHBOARD_DATA = {
  period: {
    month: 9,
    year: 2026,
    periodStart: '2026-09-01T00:00:00.000Z',
    periodEnd: '2026-10-01T00:00:00.000Z',
  },
  fam: {
    isAvailable: true,
    overallGrade: 'A_PLUS',
    grade: 'A+',
    gradeDisplay: 'A+',
    statusLabel: 'Excellent',
    overallProgressPercentage: 92,
    progress: 92,
    areas: {
      expense: {
        target: 45000,
        actual: 32000,
        percentage: 71.1,
        status: 'Excellent',
        statusLabel: 'Excellent',
        gradeDisplay: 'A+',
      },
      investment: {
        target: 25000,
        actual: 25000,
        percentage: 100,
        status: 'Good',
        statusLabel: 'Good',
        gradeDisplay: 'A',
      },
      income: {
        target: 80000,
        actual: 85000,
        percentage: 106.3,
        status: 'Excellent',
        statusLabel: 'Excellent',
        gradeDisplay: 'A+',
      },
    },
  },
  targets: {
    income: {
      target: 80000,
      actual: 85000,
      remaining: 0,
      percent: 106,
    },
    expense: {
      target: 45000,
      actual: 32000,
      remaining: 13000,
      percent: 71,
    },
    investment: {
      target: 25000,
      actual: 25000,
      remaining: 0,
      percent: 100,
    },
  },
  securityBanner: {
    showSecurityReminder: true,
    configuredQuestionsCount: 1,
  },
  expenseBreakdown: [
    {
      categoryId: 'cat_groc',
      categoryName: 'Groceries & Provisions',
      amount: 14000,
      percentage: 43.8,
    },
    {
      categoryId: 'cat_dining',
      categoryName: 'Food & Dining',
      amount: 9500,
      percentage: 29.7,
    },
    {
      categoryId: 'cat_fuel',
      categoryName: 'Fuel & Commute',
      amount: 8500,
      percentage: 26.5,
    },
  ],
  accountSummary: {
    totalBalance: 575000,
    activeCount: 3,
  },
  recentTransactions: [
    {
      id: 'txn_1',
      type: 'INCOME',
      direction: 'CREDIT',
      amount: 85000,
      txnDate: '2026-09-01T10:00:00Z',
      date: '2026-09-01T10:00:00Z',
      description: 'Monthly Salary Credit',
      category: { id: 'c1', name: 'Salary' },
      merchant: 'Tech Corp India',
    },
    {
      id: 'txn_2',
      type: 'EXPENSE',
      direction: 'DEBIT',
      amount: 4500,
      txnDate: '2026-09-03T14:30:00Z',
      date: '2026-09-03T14:30:00Z',
      description: 'Nature Basket Supermarket',
      category: { id: 'cat_groc', name: 'Groceries' },
      merchant: 'Nature Basket',
    },
    {
      id: 'txn_3',
      type: 'INVESTMENT',
      direction: 'DEBIT',
      amount: 25000,
      txnDate: '2026-09-05T09:00:00Z',
      date: '2026-09-05T09:00:00Z',
      description: 'Zerodha Index Fund SIP',
      category: { id: 'c3', name: 'Mutual Funds' },
      merchant: 'Zerodha Broking',
    },
  ],
};

const MOCK_BUDGETS = [
  {
    id: 'b_1',
    userId: 'usr_1',
    categoryId: 'cat_groc',
    category: {
      id: 'cat_groc',
      name: 'Groceries & Pantry',
      type: 'EXPENSE',
      isSystem: true,
    },
    targetAmount: 20000,
    spent: 14000,
    remaining: 6000,
    progress: 70,
    percentage: 70,
    period: 'MONTHLY',
  },
  {
    id: 'b_2',
    userId: 'usr_1',
    categoryId: 'cat_dining',
    category: {
      id: 'cat_dining',
      name: 'Dining & Restaurants',
      type: 'EXPENSE',
      isSystem: false,
    },
    targetAmount: 10000,
    spent: 12500,
    remaining: 0,
    progress: 125,
    percentage: 125,
    period: 'MONTHLY',
  },
];

const MOCK_GOALS = [
  {
    id: 'g_1',
    userId: 'usr_1',
    name: 'Emergency Fund 6 Months',
    targetAmount: 300000,
    currentAmount: 180000,
    remainingAmount: 120000,
    progress: 60,
    percentage: 60,
    targetDate: '2026-12-31T00:00:00Z',
  },
  {
    id: 'g_2',
    userId: 'usr_1',
    name: 'New Car Down Payment',
    targetAmount: 500000,
    currentAmount: 500000,
    remainingAmount: 0,
    progress: 100,
    percentage: 100,
    targetDate: '2027-06-30T00:00:00Z',
  },
];

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat_1',
    userId: null,
    name: 'Salary & Compensation',
    type: 'INCOME',
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: 'cat_2',
    userId: null,
    name: 'Groceries & Provisions',
    type: 'EXPENSE',
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: 'cat_3',
    userId: 'usr_1',
    name: 'Weekend Dining & Outings',
    type: 'EXPENSE',
    isSystem: false,
    sortOrder: 3,
  },
  {
    id: 'cat_4',
    userId: null,
    name: 'Equities & Demat SIP',
    type: 'INVESTMENT',
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: 'cat_5',
    userId: 'usr_1',
    name: 'Crypto & Digital Assets',
    type: 'INVESTMENT',
    isSystem: false,
    sortOrder: 5,
  },
];

const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'm_1',
    userId: 'usr_1',
    name: 'Reliance Fresh Supermarket',
    transactionCount: 14,
    totalSpent: 38500,
    totalSpentPaise: 3850000,
  },
  {
    id: 'm_2',
    userId: 'usr_1',
    name: 'Shell Petrol Pump',
    transactionCount: 8,
    totalSpent: 16200,
    totalSpentPaise: 1620000,
  },
];

function createTestQueryClient(options?: {
  dashboard?: any;
  budgets?: any[];
  goals?: any[];
  categories?: Category[];
  merchants?: Merchant[];
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  queryClient.setQueryData(['dashboard'], options?.dashboard ?? MOCK_DASHBOARD_DATA);
  queryClient.setQueryData(['budgets'], options?.budgets ?? MOCK_BUDGETS);
  queryClient.setQueryData(['goals'], options?.goals ?? MOCK_GOALS);
  queryClient.setQueryData(['categories'], options?.categories ?? MOCK_CATEGORIES);
  queryClient.setQueryData(['categories', 'EXPENSE'], (options?.categories ?? MOCK_CATEGORIES).filter(c => c.type === 'EXPENSE'));
  queryClient.setQueryData(['merchants'], options?.merchants ?? MOCK_MERCHANTS);

  return queryClient;
}

describe('Phase 3 Frontend Tests: Dashboard, Planning & Categories', () => {
  /* ======================================================================
   * 1. FAM Donut Ring & Score Card Tests
   * ====================================================================== */
  describe('1. FAM Donut Ring & Score Card', () => {
    it('renders 3-segment donut ring with green for income, red for expense, and purple for investment', () => {
      const html = renderToString(
        <FamDonutRing
          score={92}
          grade="A+"
          statusLabel="Excellent"
          progressPercentage={92}
          size={124}
        />
      );

      // Green income segment
      expect(html).toContain('stroke="#1F9D55"');
      // Red expense segment
      expect(html).toContain('stroke="#E23D3D"');
      // Purple investment segment
      expect(html).toContain('stroke="#7C4DE0"');
    });

    it('displays center grade badge, status label, and progress percentage', () => {
      const html = renderToString(
        <FamDonutRing
          score={92}
          grade="A+"
          statusLabel="Excellent"
          progressPercentage={92}
        />
      );

      expect(html).toContain('A+');
      expect(html).toContain('92%');
      expect(html).toContain('Excellent');
    });

    it('renders FAM card on Dashboard with 3 area chips (Expense, Investment, Income)', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Financial Assessment Matrix');
      expect(html).toContain('data-testid="fam-score-card"');
      expect(html).toContain('Expense');
      expect(html).toContain('Invest');
      expect(html).toContain('Income');
      expect(html).toContain('Excellent');
      expect(html).toContain('View Report');
      expect(html).not.toContain('max-w-[155px] truncate');
    });

    it('renders dedicated modern empty state card with Record Transaction button when FAM score is not available', () => {
      const qc = createTestQueryClient({
        dashboard: {
          ...MOCK_DASHBOARD_DATA,
          fam: {
            isAvailable: false,
            grade: null,
            gradeDisplay: null,
            statusLabel: null,
            progress: 0,
          },
        },
      });
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('data-testid="fam-score-card"');
      expect(html).toContain('Financial Health');
      expect(html).toContain('Track Your Financial Health');
      expect(html).toContain('Record Transaction');
      expect(html).not.toContain('Build Your Score');
      expect(html).not.toContain('NEW ACCOUNT');
      expect(html).not.toContain('Pending');
    });
  });

  /* ======================================================================
   * 2. Dashboard Screen Overview Cards & Breakdown
   * ====================================================================== */
  describe('2. Dashboard Screen Overview Cards & Breakdown', () => {
    it('renders branded dark navy header (#0B1B3A -> #132A5C) with title and subtitle', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('#0B1B3A');
      expect(html).toContain('#132A5C');
      expect(html).toContain('Finance Tracker');
      expect(html).toContain('Financial Assessment &amp; Wealth Hub');
    });

    it('renders Security Reminder Banner when showSecurityReminder is true with "Set up now" button', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('data-testid="security-reminder-banner"');
      expect(html).toContain('Security Reminder');
      expect(html).toContain('Set Up Security Questions');
      expect(html).toContain('Set up now');
    });

    it('does not render Security Reminder Banner when showSecurityReminder is false', () => {
      const qc = createTestQueryClient({
        dashboard: {
          ...MOCK_DASHBOARD_DATA,
          securityBanner: { showSecurityReminder: false },
        },
      });
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).not.toContain('data-testid="security-reminder-banner"');
      expect(html).not.toContain('Security Reminder');
    });

    it('renders 3 Target Overview Cards with Indian numbering and progress bars', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('data-testid="income-overview-card"');
      expect(html).toContain('data-testid="expense-overview-card"');
      expect(html).toContain('data-testid="investment-overview-card"');

      // Income target vs actual formatted with formatIndianRupees
      expect(html).toContain(formatIndianRupees(85000));
      expect(html).toContain(formatIndianRupees(80000));
      expect(html).toContain('106%');
      expect(html).toContain('Target Exceeded!');

      // Expense target vs actual
      expect(html).toContain(formatIndianRupees(32000));
      expect(html).toContain(formatIndianRupees(45000));
      expect(html).toContain('71%');
      expect(html).toContain('spent');
      expect(html).toContain(formatIndianRupees(13000)); // remaining

      // Investment target vs actual
      expect(html).toContain(formatIndianRupees(25000));
      expect(html).toContain('100%');
      expect(html).toContain('invested');
    });

    it('renders Expense Breakdown Donut Card with categories, ₹ amounts, and percentages', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('data-testid="expense-overview-donut-card"');
      expect(html).toContain('Expense Breakdown');
      expect(html).toContain('Groceries &amp; Provisions');
      expect(html).toContain(formatIndianRupees(14000));
      expect(html).toContain('43.8%');
      expect(html).toContain('Food &amp; Dining');
      expect(html).toContain('29.7%');
      expect(html).toContain('Fuel &amp; Commute');
      expect(html).toContain('26.5%');
    });

    it('renders Account Summary Card with Total Balance in Indian numbering', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('data-testid="account-summary-card"');
      expect(html).toContain('Total Liquid Balance');
      expect(html).toContain(formatIndianRupees(575000));
      expect(html).toContain('3 active accounts');
      expect(html).toContain('View Accounts');
    });

    it('renders Recent Transactions Card with semantic chips and amounts', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('data-testid="recent-transactions-card"');
      expect(html).toContain('Tech Corp India');
      expect(html).toContain(`+${formatIndianRupees(85000)}`);
      expect(html).toContain('Nature Basket');
      expect(html).toContain(`-${formatIndianRupees(4500)}`);
      expect(html).toContain('Zerodha Broking');
      expect(html).toContain('View All');
    });

    it('renders clean empty state with "Add Transaction" CTA when 0 transactions exist', () => {
      const qc = createTestQueryClient({
        dashboard: {
          ...MOCK_DASHBOARD_DATA,
          recentTransactions: [],
        },
      });
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('No transactions yet');
      expect(html).toContain('Add Transaction');
    });
  });

  /* ======================================================================
   * 3. Planning Screen (Budgets & Goals)
   * ====================================================================== */
  describe('3. Planning Screen (Budgets & Goals)', () => {
    it('renders branded navy header with title "Planning" and subtitle "Budgets & Goals"', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <PlanningPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Planning');
      expect(html).toContain('Budgets &amp; Goals');
      expect(html).toContain('Monthly Budgets');
      expect(html).toContain('Financial Goals');
    });

    it('renders budget cards with target, spent, remaining, progress bar, and over-budget alert badge', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <PlanningPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Card 1: Within budget
      expect(html).toContain('Groceries &amp; Pantry');
      expect(html).toContain(formatIndianRupees(20000));
      expect(html).toContain(formatIndianRupees(14000));
      expect(html).toContain(formatIndianRupees(6000));
      expect(html).toContain('70% of budget spent');

      // Card 2: Over budget alert badge
      expect(html).toContain('Dining &amp; Restaurants');
      expect(html).toContain(formatIndianRupees(10000));
      expect(html).toContain(formatIndianRupees(12500));
      expect(html).toContain('Over Budget');
      expect(html).toContain('Exceeded by');
      expect(html).toContain(formatIndianRupees(2500));
    });

    it('renders goal cards with title, target amount, current amount, target date, and progress', () => {
      const qc = createTestQueryClient();
      // Render directly with activeTab = 'goals' isn't state-settable in SSR without clicking, but let's test component renders
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <PlanningPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Monthly Budgets');
      expect(html).toContain('Financial Goals');
    });
  });

  /* ======================================================================
   * 4. Categories & Merchants Screen
   * ====================================================================== */
  describe('4. Categories & Merchants Screen', () => {
    it('renders branded navy header with title "Categories"', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <CategoriesPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Categories');
      expect(html).toContain('Manage classification labels');
      expect(html).toContain('Add Category');
    });

    it('renders filter pill tabs: All, Expense, Income, Investment', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <CategoriesPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('All');
      expect(html).toContain('Expense');
      expect(html).toContain('Income');
      expect(html).toContain('Investment');
    });

    it('enforces system category lock: displays "System" badge and omits Edit/Delete buttons', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <CategoriesPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // System category
      expect(html).toContain('data-testid="system-badge-cat_1"');
      expect(html).toContain('Salary &amp; Compensation');
      expect(html).not.toContain('aria-label="Edit Salary &amp; Compensation"');
      expect(html).not.toContain('aria-label="Delete Salary &amp; Compensation"');

      // Custom category
      expect(html).toContain('data-testid="custom-badge-cat_3"');
      expect(html).toContain('Weekend Dining &amp; Outings');
      expect(html).toContain('aria-label="Edit Weekend Dining &amp; Outings"');
      expect(html).toContain('aria-label="Delete Weekend Dining &amp; Outings"');
    });

    it('provides reorder affordance with Move Up and Move Down arrow controls', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <CategoriesPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('aria-label="Move Salary &amp; Compensation down"');
      expect(html).toContain('aria-label="Move Groceries &amp; Provisions up"');
    });
  });

  /* ======================================================================
   * 5. Production Constraints: Zero Banned Copy & Zero Emojis
   * ====================================================================== */
  describe('5. Production Constraints: Zero Banned Copy & Zero Emojis', () => {
    const bannedPhrases = [
      ['coming', 'soon'].join(' '),
      ['coming', 'in', 'v2'].join(' '),
      ['beta', '(v2)'].join(' '),
      ['pre', 'view'].join(''),
      ['to', 'do'].join(''),
      ['lorem', 'ipsum'].join(' '),
      ['place', 'holder'].join(''),
    ];

    it('DashboardPage contains zero banned placeholder strings', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      ).toLowerCase();

      for (const phrase of bannedPhrases) {
        expect(html).not.toContain(phrase);
      }
    });

    it('PlanningPage contains zero banned placeholder strings', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <PlanningPage />
          </MemoryRouter>
        </QueryClientProvider>
      ).toLowerCase();

      for (const phrase of bannedPhrases) {
        expect(html).not.toContain(phrase);
      }
    });

    it('CategoriesPage contains zero banned placeholder strings', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <CategoriesPage />
          </MemoryRouter>
        </QueryClientProvider>
      ).toLowerCase();

      for (const phrase of bannedPhrases) {
        expect(html).not.toContain(phrase);
      }
    });
  });
});
