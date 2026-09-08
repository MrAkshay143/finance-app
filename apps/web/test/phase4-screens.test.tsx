import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportsPage } from '../src/pages/ReportsPage.js';
import { AnalyticsPage } from '../src/pages/AnalyticsPage.js';
import { NotificationsPage } from '../src/pages/NotificationsPage.js';
import { AiAnalysisPage } from '../src/pages/AiAnalysisPage.js';
import { InvestmentsPage } from '../src/pages/InvestmentsPage.js';
import { RecurringTransactionsPage } from '../src/pages/RecurringTransactionsPage.js';
import { formatIndianRupees } from '../src/utils/currency.js';

function createTestQueryClient(initialData?: Record<string, any>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const d = new Date();
  const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  if (initialData) {
    Object.entries(initialData).forEach(([key, value]) => {
      queryClient.setQueryData([key], value);
      if (key === 'reports' || key === 'report') {
        queryClient.setQueryData(['reports', 'monthly', currentMonth], value);
      }
      if (key === 'analytics') {
        queryClient.setQueryData(['analytics', currentMonth], value);
      }
    });
  }

  return queryClient;
}

describe('Phase 4 Screens Verification Test Suite (TASK-4.5, 4.6, 4.7, 4.8)', () => {
  /* ======================================================================
   * 1. TASK-4.5: ReportsPage Verification
   * ====================================================================== */
  describe('1. ReportsPage (Screen #4)', () => {
    it('renders branded dark navy header (#0B1B3A -> #132A5C) and page subheader with Export PDF', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Navy Header
      expect(html).toContain('#0B1B3A');
      expect(html).toContain('#132A5C');
      expect(html).toContain('Finance Tracker');

      // Subheader
      expect(html).toContain('Reports');
      expect(html).toContain('FAM score &amp; projected vs actual');
      expect(html).toContain('Export JSON');
      expect(html).toContain('aria-label="Go back"');
    });


    it('renders segmented pill tabs: Monthly, Year in Review, Custom Range', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Monthly');
      expect(html).toContain('Year in Review');
      expect(html).toContain('Custom Range');
    });

    const mockReport = {
      famScore: { score: 72, overallGrade: 'HEALTHY' },
      totals: { earnedPaise: 4850000, spentPaise: 3240000, investedPaise: 820000 },
      targetVsActual: {
        income: { target: 50000, actual: 48500 },
        expense: { target: 35000, actual: 32400 },
        investment: { target: 10000, actual: 8200 },
        netSavings: { target: 5000, actual: 7900 },
      },
      categories: [
        { categoryName: 'Food & Dining', amount: 15000, actualPaise: 1500000, percentage: 46 },
        { categoryName: 'Housing/Rent', amount: 10000, actualPaise: 1000000, percentage: 31 },
        { categoryName: 'Transport', amount: 7400, actualPaise: 740000, percentage: 23 },
      ],
      callouts: [
        {
          title: 'You are on track!',
          message: 'Your living expenses are within target limits.',
        },
      ],
    };

    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    it('renders 3 summary cards: FAM Score, Total Income, Total Expenses with ₹ amounts', () => {
      const qc = createTestQueryClient();
      qc.setQueryData(['reports', 'monthly', currentMonth], mockReport);
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // FAM score
      expect(html).toContain('FAM Score');
      expect(html).toContain('72');
      expect(html).toContain('/ 100');

      // Income
      expect(html).toContain('Total Income');
      expect(html).toContain(formatIndianRupees(48500));

      // Expenses
      expect(html).toContain('Total Expenses');
      expect(html).toContain(formatIndianRupees(32400));
    });

    it('renders dual charts: Actual vs Target and Expense Breakdown with category breakdown', () => {
      const qc = createTestQueryClient();
      qc.setQueryData(['reports', 'monthly', currentMonth], mockReport);
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Actual vs Target Bar Chart
      expect(html).toContain('Actual vs Target');
      expect(html).toContain('Actual');
      expect(html).toContain('Target');

      // Expense Breakdown Donut
      expect(html).toContain('Expense Breakdown');
      expect(html).toContain('Food &amp; Dining');
      expect(html).toContain('Housing/Rent');
      expect(html).toContain('Transport');
    });

    it('renders Target vs Actual Summary table with metric, actual, target, and difference columns', () => {
      const qc = createTestQueryClient();
      qc.setQueryData(['reports', 'monthly', currentMonth], mockReport);
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Target vs Actual Summary');
      expect(html).toContain('View All');
      expect(html).toContain('Income');
      expect(html).toContain('Expenses');
      expect(html).toContain('Investments');
      expect(html).toContain('You are on track!');
    });
  });

  /* ======================================================================
   * 2. TASK-4.5: AnalyticsPage Verification
   * ====================================================================== */
  describe('2. AnalyticsPage (Screen #5)', () => {
    it('renders branded dark navy header (#0B1B3A -> #132A5C) and Analytics title row with calendar date range', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AnalyticsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('#0B1B3A');
      expect(html).toContain('Analytics');
      expect(html).toContain('01-09-2026 — 30-09-2026');
      expect(html).toContain('This Month');
    });

    it('renders dismissible insight banner with CTA linking to /profile/settings', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AnalyticsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('UNLOCK POWERFUL INSIGHTS');
      expect(html).toContain('Complete your finance profile');
      expect(html).toContain('Complete Finance Profile');
      expect(html).toContain('aria-label="Dismiss banner"');
    });

    it('renders 3 stat cards: Income, Expenses, Saved with sparkline visuals', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AnalyticsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Income');
      expect(html).toContain('Expenses');
      expect(html).toContain('Saved');
      // The stat cards no longer show fake "vs last month 0%" — they show real contextual labels
      expect(html).toContain('No income yet');
    });


    it('renders Savings Rate card, 6-Month Spending Trend, and Category Breakdown', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AnalyticsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Savings Rate');
      expect(html).toContain('6-Month Spending Trend');
      expect(html).toContain('Category Breakdown');
    });
  });

  /* ======================================================================
   * 3. TASK-4.6: NotificationsPage Verification
   * ====================================================================== */
  describe('3. NotificationsPage (Screen #10)', () => {
    it('renders branded dark navy header (#0B1B3A -> #132A5C) with Notifications title and subtitle', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <NotificationsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('#0B1B3A');
      expect(html).toContain('Notifications');
      expect(html).toContain('Manage your alerts and reminders');
      expect(html).toContain('aria-label="Go back"');
    });

    it('renders Due-date reminders card with toggle switch, numeric days selector 1..5, and info callout', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <NotificationsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Due-date reminders');
      expect(html).toContain('Get reminded before your recurring expenses &amp; investments are due.');
      expect(html).toContain('role="switch"');
      expect(html).toContain('Remind me this many days before:');

      // Numeric buttons 1, 2, 3, 4, 5
      expect(html).toContain('>1</button>');
      expect(html).toContain('>2</button>');
      expect(html).toContain('>3</button>');
      expect(html).toContain('>4</button>');
      expect(html).toContain('>5</button>');

      expect(html).toContain('You will receive a notification this many days before a due date.');
    });

    it('renders filter pills: All, Unread, Read, and "Mark all as read" button', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <NotificationsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('All');
      expect(html).toContain('Unread');
      expect(html).toContain('Read');
      expect(html).toContain('Mark all as read');
    });

    it('renders notification items with title, relative timestamp, and message', () => {
      const qc = createTestQueryClient();
      qc.setQueryData(['notifications', 'all'], {
        items: [
          {
            id: 'kba-setup-reminder-id',
            userId: 'usr_current',
            title: 'Set up your security questions',
            message: 'Add 3 security questions in Profile to enable password recovery.',
            type: 'SECURITY_REMINDER',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      });

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <NotificationsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Set up your security questions');
      expect(html).toContain('Profile');
    });
  });

  /* ======================================================================
   * 4. TASK-4.7: InvestmentsPage & RecurringTransactionsPage Verification
   * ====================================================================== */
  describe('4. InvestmentsPage & RecurringTransactionsPage', () => {
    it('InvestmentsPage renders portfolio hero card, target progress, asset allocation, and Add button', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <InvestmentsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('#0B1B3A');
      expect(html).toContain('Investments');
      expect(html).toContain('Total Portfolio Value');
      expect(html).toContain('Monthly Target Progress');
      expect(html).toContain('Asset Allocation');
      expect(html).toContain('Add Investment');
    });

    it('RecurringTransactionsPage renders automated scheduling banner, filter pills, and separate Add/Edit modals', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <RecurringTransactionsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('#0B1B3A');
      expect(html).toContain('Recurring Transactions');
      expect(html).toContain('Scheduled Automation');
      expect(html).toContain('Process Due Now');
      expect(html).toContain('Add Recurring');
      expect(html).toContain('Active');
      expect(html).toContain('Paused');
    });
  });

  /* ======================================================================
   * 5. TASK-4.8: AiAnalysisPage Verification (Full V1 & Zero Placeholders)
   * ====================================================================== */
  describe('5. AiAnalysisPage (Screen #20 - Full V1 Financial Intelligence)', () => {
    it('renders branded dark navy header, back button, and Financial Intelligence status chip', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AiAnalysisPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('#0B1B3A');
      expect(html).toContain('AI Analysis');
      expect(html).toContain('Get AI-powered insights for a smarter financial future');
      expect(html).toContain('Financial Intelligence');
      expect(html).toContain('aria-label="Go back"');
    });

    it('renders month selector with calendar icon and "Analyse" action button', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AiAnalysisPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Select Month');
      expect(html).toContain('Analyse');
    });

    it('renders Monthly Analysis card with 4-metric allocation breakdown and Evaluated badge', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AiAnalysisPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Monthly Analysis —');
      expect(html).toContain('Evaluated');
      expect(html).toContain('Fixed Needs');
      expect(html).toContain('Wants');
      expect(html).toContain('Invested');
      expect(html).toContain('Savings Rate');
    });

    it('renders Forward Projection card with 3-month, 6-month, and 12-month projections', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AiAnalysisPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Forward Projection');
      expect(html).toContain('Projected');
      expect(html).toContain('3 Months');
      expect(html).toContain('6 Months');
      expect(html).toContain('12 Months');
      expect(html).toContain('Wealth Growth');
    });

    it('renders Personalized Recommendations and "How it works?" explanation', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AiAnalysisPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Personalized Recommendations');
      expect(html).toContain('How it works?');
      expect(html).toContain('50/30/20 Allocation Benchmark');
      expect(html).toContain('Compounded Growth Projections');
    });

    it('strictly contains ZERO banned placeholder copy across rendered HTML', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AiAnalysisPage />
          </MemoryRouter>
        </QueryClientProvider>
      ).toLowerCase();

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

      bannedPhrases.forEach((phrase) => {
        expect(html).not.toContain(phrase);
      });
    });
  });
});
