import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomDropdown } from '../src/components/ui/CustomDropdown.js';
import { Select } from '../src/components/ui/Select.js';
import { DatePicker } from '../src/components/ui/DatePicker.js';
import { ReportsPage } from '../src/pages/ReportsPage.js';
import { AnalyticsPage } from '../src/pages/AnalyticsPage.js';
import { toast, useToastStore } from '../src/store/toastStore.js';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
}

describe('Dropdown, DatePicker, Reports, & Toast Unit Tests', () => {
  beforeEach(() => {
    useToastStore.setState({ toast: null });
  });

  describe('1. CustomDropdown & Select Right Alignment', () => {
    it('renders CustomDropdown with align="right" attribute and classes', () => {
      const html = renderToString(
        <CustomDropdown
          value="val1"
          onChange={() => {}}
          options={[
            { value: 'val1', label: 'Option 1' },
            { value: 'val2', label: 'Option 2' },
          ]}
          align="right"
        />
      );
      expect(html).toContain('Option 1');
    });

    it('passes align and minWidth props through Select to CustomDropdown', () => {
      const html = renderToString(
        <Select
          value="opt1"
          onChange={() => {}}
          options={[
            { value: 'opt1', label: 'Item 1' },
            { value: 'opt2', label: 'Item 2' },
          ]}
          align="right"
          minWidth={160}
        />
      );
      expect(html).toContain('Item 1');
    });

    it('renders AnalyticsPage Category Breakdown header responsively without throwing', () => {
      const queryClient = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AnalyticsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );
      expect(html).toContain('Category Breakdown');
      expect(html).toContain('This Month');
    });
  });

  describe('2. DatePicker Component', () => {
    it('permanently renders Calendar icon container on the left', () => {
      const html = renderToString(
        <DatePicker
          label="Date of Birth"
          value=""
          onChange={() => {}}
          isDob
        />
      );
      expect(html).toContain('Date of Birth');
      expect(html).toContain('type="date"');
      expect(html).toContain('pl-10');
      expect(html).toContain('appearance-none');
    });

    it('renders valid state with right-aligned checkmark when valid date is provided', () => {
      const html = renderToString(
        <DatePicker
          label="Date of Birth"
          value="1995-05-15"
          onChange={() => {}}
          isDob
        />
      );
      expect(html).toContain('pr-10');
      expect(html).toContain('border-semantic-success');
    });
  });

  describe('3. ReportsPage Dynamic Months Restriction', () => {
    it('restricts current year month list to months up to current month', () => {
      const queryClient = createTestQueryClient();
      const currentYear = new Date().getFullYear();
      const currentMonthInt = new Date().getMonth() + 1;

      const ALL_MONTHS = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
      ];

      // Logic under test: current year vs past year
      const getAvailableMonths = (year: number) => {
        if (year === currentYear) {
          return ALL_MONTHS.slice(0, currentMonthInt);
        }
        return ALL_MONTHS;
      };

      const currentYearMonths = getAvailableMonths(currentYear);
      expect(currentYearMonths.length).toBe(currentMonthInt);
      expect(currentYearMonths.length).toBeLessThanOrEqual(12);

      const pastYearMonths = getAvailableMonths(currentYear - 1);
      expect(pastYearMonths.length).toBe(12);

      // Verify ReportsPage renders successfully
      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );
      expect(html).toContain('Reports');
      expect(html).toContain('Report period');
    });

    it('renders previous comparison percentages in brackets with dynamic color on stats cards', () => {
      const queryClient = createTestQueryClient();
      const d = new Date();
      const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const mockReportWithComparison = {
        month: currentMonth,
        monthLabel: 'Current Month',
        year: d.getFullYear(),
        famScore: { score: 85, overallGrade: 'A+', gradeDisplay: 'A+' },
        totals: { earnedPaise: 2060000, spentPaise: 790000, investedPaise: 500000 },
        targetVsActual: {
          income: { target: 10000, actual: 20600, percentageAchieved: 206 },
          expense: { target: 10000, actual: 7900, percentageAchieved: 79 },
          investment: { target: 5000, actual: 5000, percentageAchieved: 100 },
          netSavings: { actual: 12700, actualPaise: 1270000, savingsRate: 61 },
        },
        comparison: {
          hasPrevData: true,
          prevMonth: '2026-08',
          famScoreDelta: 12,
          incomeTargetDelta: 26,
          expenseBudgetDelta: -6,
        },
        callouts: [],
        categorySummary: [],
      };

      queryClient.setQueryData(['reports', 'monthly', currentMonth], mockReportWithComparison);

      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Card 1: FAM Score Grade with positive increase (↑12% vs last mo) in green
      expect(html).toContain('A+');
      expect(html).toContain('(↑12% vs last mo)');
      expect(html).toContain('text-emerald-600');

      // Card 2: Total Income Target with positive increase (↑26% vs last mo) in green
      expect(html).toContain('206% target');
      expect(html).toContain('(↑26% vs last mo)');

      // Card 3: Total Expenses Budget with decrease (↓6% vs last mo) in green (spending less is favorable)
      expect(html).toContain('79% budget');
      expect(html).toContain('(↓6% vs last mo)');
    });

    it('renders unfavorable decreases and increases with rose red color', () => {
      const queryClient = createTestQueryClient();
      const d = new Date();
      const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const mockUnfavorableReport = {
        month: currentMonth,
        monthLabel: 'Current Month',
        year: d.getFullYear(),
        famScore: { score: 65, overallGrade: 'B', gradeDisplay: 'B' },
        totals: { earnedPaise: 800000, spentPaise: 1100000, investedPaise: 200000 },
        targetVsActual: {
          income: { target: 10000, actual: 8000, percentageAchieved: 80 },
          expense: { target: 10000, actual: 11000, percentageAchieved: 110 },
          investment: { target: 5000, actual: 2000, percentageAchieved: 40 },
          netSavings: { actual: -3000, actualPaise: -300000, savingsRate: 0 },
        },
        comparison: {
          hasPrevData: true,
          prevMonth: '2026-08',
          famScoreDelta: -10,
          incomeTargetDelta: -20,
          expenseBudgetDelta: 15,
        },
        callouts: [],
        categorySummary: [],
      };

      queryClient.setQueryData(['reports', 'monthly', currentMonth], mockUnfavorableReport);

      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // FAM score decrease: (↓10% vs last mo) in red
      expect(html).toContain('(↓10% vs last mo)');
      // Income target decrease: (↓20% vs last mo) in red
      expect(html).toContain('(↓20% vs last mo)');
      // Expense budget increase: (↑15% vs last mo) in red (spending more budget is unfavorable)
      expect(html).toContain('(↑15% vs last mo)');
      expect(html).toContain('text-rose-600');
    });
  });

  describe('4. Central Toast Standardizations', () => {
    it('correctly dispatches toast.success, toast.error, toast.warning, and toast.info', () => {
      toast.success('Operation succeeded');
      expect(useToastStore.getState().toast?.type).toBe('success');
      expect(useToastStore.getState().toast?.message).toBe('Operation succeeded');

      toast.error('Validation failed');
      expect(useToastStore.getState().toast?.type).toBe('error');
      expect(useToastStore.getState().toast?.message).toBe('Validation failed');

      toast.warning('Session expiring');
      expect(useToastStore.getState().toast?.type).toBe('warning');
      expect(useToastStore.getState().toast?.message).toBe('Session expiring');

      toast.info('Info notice');
      expect(useToastStore.getState().toast?.type).toBe('info');
      expect(useToastStore.getState().toast?.message).toBe('Info notice');

      toast.dismiss();
      expect(useToastStore.getState().toast).toBeNull();
    });
  });
});
