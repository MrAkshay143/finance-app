import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  PiggyBank,
  ShieldAlert,
  ChevronRight,
  CreditCard,
  Receipt,
  Plus,
  RefreshCw,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { FamDonutRing } from '../components/finance/FamProgressRing.js';
import { MetricCardSkeleton, TransactionItemSkeleton } from '../components/ui/Skeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useUiStore } from '../store/uiStore.js';
import { apiClient } from '../services/apiClient.js';
import { formatCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { formatDate } from '../utils/date.js';

const CATEGORY_COLORS = [
  '#2554EE', // Primary Blue
  '#E23D3D', // Danger Red
  '#1F9D55', // Emerald Green
  '#7C4DE0', // Purple
  '#E68A2E', // Amber Orange
  '#06B6D4', // Cyan Sky
  '#EC4899', // Pink
  '#64748B', // Slate
];

interface DashboardTransactionItem {
  id: string;
  type: string;
  direction?: string;
  amount: number;
  description?: string;
  txnDate?: string | Date;
  date?: string | Date;
  category?: { id: string; name: string; type?: string } | null;
  merchant?: string | { id: string; name: string } | null;
}

interface DashboardSummaryData {
  period?: {
    month: number;
    year: number;
    periodStart: string;
    periodEnd: string;
  };
  fam?: {
    isAvailable: boolean;
    overallGrade: string;
    grade: string;
    gradeDisplay?: string;
    statusLabel: string;
    overallProgressPercentage: number;
    progress: number;
    areas?: {
      expense: { target: number; actual: number; percentage: number; status: string; statusLabel?: string; gradeDisplay?: string };
      investment: { target: number; actual: number; percentage: number; status: string; statusLabel?: string; gradeDisplay?: string };
      income: { target: number; actual: number; percentage: number; status: string; statusLabel?: string; gradeDisplay?: string };
    };
    expense?: { target: number; actual: number; percentage: number; status: string; statusLabel?: string; gradeDisplay?: string };
    investment?: { target: number; actual: number; percentage: number; status: string; statusLabel?: string; gradeDisplay?: string };
    income?: { target: number; actual: number; percentage: number; status: string; statusLabel?: string; gradeDisplay?: string };
  };
  targets?: {
    income: { target: number; actual: number; remaining: number; percent: number };
    expense: { target: number; actual: number; remaining: number; percent: number };
    investment: { target: number; actual: number; remaining: number; percent: number };
  };
  securityBanner?: {
    showSecurityReminder: boolean;
    configuredQuestionsCount?: number;
  };
  expenseBreakdown?: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    amountPaise?: number;
    percentage: number;
  }>;
  incomeBreakdown?: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    amountPaise?: number;
    percentage: number;
  }>;
  accountSummary?: {
    totalBalance: number;
    totalBalancePaise?: number;
    activeCount: number;
  };
  recentTransactions?: DashboardTransactionItem[];
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const openPicker = useUiStore((state) => state.openPicker);
  const { currency: userCurrency } = useUserCurrency();

  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useQuery<DashboardSummaryData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.rawAxios.get('/dashboard');
      return res.data?.data || res.data;
    },
    staleTime: 60 * 1000,
  });

  // Extract data with safe fallbacks
  const fam = dashboardData?.fam;
  // Only show real FAM data: no dummy grade/score fallbacks
  const famGrade = fam?.gradeDisplay || fam?.grade || null;
  const famStatusLabel = fam?.statusLabel || null;
  const famScore = fam?.progress ?? fam?.overallProgressPercentage ?? 0;
  const famIsAvailable = fam?.isAvailable !== false && famGrade !== null;


  const areaExpense = fam?.areas?.expense || fam?.expense;
  const areaInvestment = fam?.areas?.investment || fam?.investment;
  const areaIncome = fam?.areas?.income || fam?.income;

  const targets = dashboardData?.targets || {
    income: { target: 0, actual: 0, remaining: 0, percent: 0 },
    expense: { target: 0, actual: 0, remaining: 0, percent: 0 },
    investment: { target: 0, actual: 0, remaining: 0, percent: 0 },
  };

  const securityBanner = dashboardData?.securityBanner;
  const expenseBreakdown = dashboardData?.expenseBreakdown || [];
  const incomeBreakdown = dashboardData?.incomeBreakdown || [];
  const accountSummary = dashboardData?.accountSummary || { totalBalance: 0, activeCount: 0 };
  const recentTransactions = dashboardData?.recentTransactions || [];

  // Toggle state for Expense / Income breakdown card
  const [breakdownView, setBreakdownView] = React.useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Active breakdown array for the selected view
  const activeBreakdown = breakdownView === 'EXPENSE' ? expenseBreakdown : incomeBreakdown;
  const totalBreakdownAmount = activeBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex-1 flex flex-col">
      {/* 1. Root Branded Dark Navy Header Block (#0B1B3A -> #132A5C) */}
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle="Financial Assessment & Wealth Hub"
      />

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* Loading Skeleton State */}
        {isLoading ? (
          <div className="space-y-4" data-testid="dashboard-loading">
            <MetricCardSkeleton />
            <div className="grid grid-cols-3 gap-2.5">
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </div>
            <MetricCardSkeleton />
            <div className="space-y-2">
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
            </div>
          </div>
        ) : isError ? (
          /* Error State */
          <Card className="p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-semantic-danger-bg text-semantic-danger mx-auto flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-textDefault">Unable to load dashboard data</h3>
              <p className="text-xs text-textMuted mt-1">Please check your connection and try again.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry
            </Button>
          </Card>
        ) : (
          <>
            {/* 2. Security Reminder Banner (Rendered conditionally if showSecurityReminder === true) */}
            {securityBanner?.showSecurityReminder && (
              <Card className="bg-amber-50/80 border-amber-200 p-3.5" data-testid="security-reminder-banner">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-200/70 text-amber-900">
                        Security Reminder
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-textDefault tracking-tight mt-1">
                      Security Questions (KBA) Pending
                    </h4>
                    <p className="text-[11px] text-textMuted leading-relaxed mt-0.5">
                      Configure your 3 security questions to protect account recovery.
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/security/questions')}
                        className="!py-1 !px-3 !text-xs !bg-amber-600 hover:!bg-amber-700 !border-amber-600"
                      >
                        Set up now
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* 3. FAM Score Card */}
            <Card className="p-4 space-y-3.5" data-testid="fam-score-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {famIsAvailable ? (
                      <Badge variant={famGrade === 'C' ? 'danger' : 'success'} size="sm">
                        {famGrade === 'C' ? 'NEEDS ATTENTION' : 'HEALTHY'}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        NOT AVAILABLE
                      </Badge>
                    )}
                    <span className="text-xs text-textMuted font-medium">Monthly Status</span>
                  </div>
                  <h2 className="text-base font-bold text-textDefault tracking-tight mt-1">
                    Financial Assessment Matrix
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  aria-label="View full score report"
                  className="inline-flex items-center text-xs font-semibold text-brand-primary hover:underline"
                >
                  <span>Report</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              {/* FAM Ring & Center Info */}
              <div className="flex items-center justify-center py-1">
                {famIsAvailable ? (
                  <FamDonutRing
                    score={famScore}
                    grade={famGrade ?? undefined}
                    statusLabel={famStatusLabel ?? undefined}
                    progressPercentage={famScore}
                    size={124}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[124px] text-center">
                    <span className="text-3xl font-black text-slate-300">N/A</span>
                    <p className="text-xs text-textMuted mt-1">
                      Set your finance targets to see your FAM score
                    </p>
                  </div>
                )}
              </div>



              {/* 3 Area Chips Below Ring: Expense, Investment, Income Statuses */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-borderDefault">
                {/* Expense Status Chip */}
                <div className="p-2 rounded-xl bg-gray-50 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-semantic-danger shrink-0" />
                    <span className="text-[10px] font-semibold text-textMuted uppercase">Expense</span>
                  </div>
                  <span className="text-xs font-bold text-textDefault mt-0.5">
                    {areaExpense?.statusLabel || areaExpense?.status || 'Not Set'}
                  </span>
                </div>

                {/* Investment Status Chip */}
                <div className="p-2 rounded-xl bg-gray-50 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-semantic-investment shrink-0" />
                    <span className="text-[10px] font-semibold text-textMuted uppercase">Invest</span>
                  </div>
                  <span className="text-xs font-bold text-textDefault mt-0.5">
                    {areaInvestment?.statusLabel || areaInvestment?.status || 'Not Set'}
                  </span>
                </div>

                {/* Income Status Chip */}
                <div className="p-2 rounded-xl bg-gray-50 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-semantic-success shrink-0" />
                    <span className="text-[10px] font-semibold text-textMuted uppercase">Income</span>
                  </div>
                  <span className="text-xs font-bold text-textDefault mt-0.5">
                    {areaIncome?.statusLabel || areaIncome?.status || 'Not Set'}
                  </span>
                </div>
              </div>
            </Card>

            {/* 4. 3 Target Overview Cards with Progress Bars */}
            <div className="space-y-2.5" data-testid="target-overview-cards">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  Target Overview
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/planning')}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  Manage Planning
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Income Overview Card */}
                <Card padding="sm" className="space-y-2 flex flex-col justify-between" data-testid="income-overview-card">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Income</span>
                      <div className="w-6 h-6 rounded-lg bg-semantic-success-bg text-semantic-success flex items-center justify-center">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-textDefault mt-1 truncate">
                      {formatCurrency(targets.income.actual, userCurrency)}
                    </div>
                    <div className="text-[10px] text-textMuted mt-0.5">
                      of {formatCurrency(targets.income.target, userCurrency)}
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-semantic-success h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, targets.income.percent))}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-semantic-success flex justify-between">
                      <span>{`${targets.income.percent}%`}</span>
                      <span>earned</span>
                    </div>
                  </div>
                </Card>

                {/* 2. Expense Overview Card */}
                <Card padding="sm" className="space-y-2 flex flex-col justify-between" data-testid="expense-overview-card">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Expense</span>
                      <div className="w-6 h-6 rounded-lg bg-semantic-danger-bg text-semantic-danger flex items-center justify-center">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-textDefault mt-1 truncate">
                      {formatCurrency(targets.expense.actual, userCurrency)}
                    </div>
                    <div className="text-[10px] text-textMuted mt-0.5">
                      limit {formatCurrency(targets.expense.target, userCurrency)}
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-semantic-danger h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, targets.expense.percent))}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-semantic-danger flex justify-between">
                      <span>{`${targets.expense.percent}%`}</span>
                      <span>spent</span>
                    </div>
                    <div className="text-[9px] text-textMuted font-medium truncate">
                      Rem: {formatCurrency(targets.expense.remaining, userCurrency)}
                    </div>
                  </div>
                </Card>

                {/* 3. Investment Overview Card */}
                <Card padding="sm" className="space-y-2 flex flex-col justify-between" data-testid="investment-overview-card">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Invest</span>
                      <div className="w-6 h-6 rounded-lg bg-semantic-investment-bg text-semantic-investment flex items-center justify-center">
                        <PiggyBank className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-textDefault mt-1 truncate">
                      {formatCurrency(targets.investment.actual, userCurrency)}
                    </div>
                    <div className="text-[10px] text-textMuted mt-0.5">
                      target {formatCurrency(targets.investment.target, userCurrency)}
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-semantic-investment h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, targets.investment.percent))}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-semantic-investment flex justify-between">
                      <span>{`${targets.investment.percent}%`}</span>
                      <span>invested</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 5. Expense Overview Donut Card with Category Breakdown */}
            <Card className="p-4 space-y-3" data-testid="expense-overview-donut-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-textDefault uppercase tracking-wider">
                    {breakdownView === 'EXPENSE' ? 'Expense Breakdown' : 'Income Breakdown'}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Segmented Expenses / Income Toggle: matches AnalyticsPage pattern */}
                  <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setBreakdownView('EXPENSE')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                        breakdownView === 'EXPENSE'
                          ? 'bg-white text-rose-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Expenses
                    </button>
                    <button
                      type="button"
                      onClick={() => setBreakdownView('INCOME')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                        breakdownView === 'INCOME'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                  <span className="text-xs font-bold text-textDefault">
                    {formatCurrency(totalBreakdownAmount, userCurrency)}
                  </span>
                </div>
              </div>

              {activeBreakdown.length === 0 ? (
                <EmptyState
                  icon={<PieChartIcon className="w-7 h-7 stroke-[1.8]" />}
                  title={breakdownView === 'EXPENSE' ? 'No expense breakdown' : 'No income breakdown'}
                  description={
                    breakdownView === 'EXPENSE'
                      ? 'Record your expenses to see category distribution.'
                      : 'Record your income to see source distribution.'
                  }
                  actionLabel={breakdownView === 'EXPENSE' ? 'Add Expense' : 'Add Income'}
                  actionIcon={<Plus className="w-4 h-4" />}
                  onAction={openPicker}
                />
              ) : (
                <div className="space-y-3 pt-1">
                  {/* SVG Multi-segment Donut Ring */}
                  <div className="flex items-center justify-center py-2">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#E7ECF5"
                          strokeWidth="10"
                        />
                        {/* Segment arcs */}
                        {(() => {
                          const circumference = 2 * Math.PI * 40;
                          let accumulatedPercent = 0;
                          return activeBreakdown.map((item, index) => {
                            const strokeColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                            const dashLength = (item.percentage / 100) * circumference;
                            const offset = (accumulatedPercent / 100) * circumference;
                            accumulatedPercent += item.percentage;
                            return (
                              <circle
                                key={item.categoryId || `cat-${index}`}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="10"
                                strokeDasharray={`${dashLength} ${circumference}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                              />
                            );
                          });
                        })()}
                      </svg>
                      {/* Center total */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-extrabold text-textDefault">
                          {activeBreakdown.length}
                        </span>
                        <span className="text-[9px] font-medium text-textMuted">
                          Categories
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="space-y-2 pt-1 border-t border-borderDefault">
                    {activeBreakdown.map((item, index) => {
                      const bulletColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                      return (
                        <div
                          key={item.categoryId || `legend-${index}`}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: bulletColor }}
                            />
                            <span className="font-semibold text-textDefault truncate">
                              {item.categoryName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-textDefault">
                              {formatCurrency(item.amount, userCurrency)}
                            </span>
                            <span className="text-[11px] font-medium text-textMuted w-9 text-right">
                              {`${item.percentage}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>


            {/* 6. Account Summary Card */}
            <Card className="p-4 space-y-3" data-testid="account-summary-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-textDefault uppercase tracking-wider">
                    Connected Accounts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/accounts')}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  Manage
                </button>
              </div>
              {accountSummary.activeCount === 0 ? (
                <EmptyState
                  icon={<CreditCard className="w-7 h-7 stroke-[1.8]" />}
                  title="No connected accounts"
                  description="Add your accounts to start tracking your net worth."
                  actionLabel="Add Account"
                  actionIcon={<Plus className="w-4 h-4" />}
                  onAction={() => navigate('/accounts')}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-textMuted">Total Liquid Balance</div>
                    <div className="text-lg font-extrabold text-textDefault mt-0.5">
                      {formatCurrency(accountSummary.totalBalance, userCurrency)}
                    </div>
                    <div className="text-[11px] text-textMuted mt-0.5">
                      {`${accountSummary.activeCount} active ${accountSummary.activeCount === 1 ? 'account' : 'accounts'}`}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/accounts')}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    View Accounts
                  </Button>
                </div>
              )}
            </Card>

            {/* 7. Recent Transactions Card */}
            <Card className="p-4 space-y-3" data-testid="recent-transactions-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-textDefault uppercase tracking-wider">
                    Recent Transactions
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  View All
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="w-7 h-7 stroke-[1.8]" />}
                  title="No transactions recorded"
                  description="Record income, expenses, and investments to track FAM score."
                  actionLabel="Add Transaction"
                  actionIcon={<Plus className="w-4 h-4" />}
                  onAction={openPicker}
                />
              ) : (
                <div className="space-y-2.5">
                  {recentTransactions.map((txn) => {
                    const isIncome = txn.type === 'INCOME';
                    const isExpense = txn.type === 'EXPENSE';
                    const isInvest = txn.type === 'INVESTMENT';
                    const isTransfer = txn.type === 'TRANSFER';

                    const chipBg = isIncome
                      ? 'bg-semantic-success-bg text-semantic-success'
                      : isExpense
                      ? 'bg-semantic-danger-bg text-semantic-danger'
                      : isInvest
                      ? 'bg-semantic-investment-bg text-semantic-investment'
                      : 'bg-blue-50 text-brand-primary';

                    const formattedAmount = isIncome
                      ? `+${formatCurrency(txn.amount, userCurrency)}`
                      : isExpense
                      ? `-${formatCurrency(txn.amount, userCurrency)}`
                      : formatCurrency(txn.amount, userCurrency);

                    const amountColor = isIncome
                      ? 'text-semantic-success'
                      : isExpense
                      ? 'text-semantic-danger'
                      : isInvest
                      ? 'text-semantic-investment'
                      : 'text-brand-primary';

                    const rawDate = txn.txnDate || txn.date;
                    const dateStr = formatDate(rawDate);

                    const merchantName =
                      typeof txn.merchant === 'string' ? txn.merchant : txn.merchant?.name;

                    return (
                      <div
                        key={txn.id}
                        onClick={() => navigate('/transactions')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-borderDefault"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${chipBg}`}
                          >
                            {isIncome && <ArrowDownLeft className="w-4 h-4" />}
                            {isExpense && <ArrowUpRight className="w-4 h-4" />}
                            {isInvest && <PiggyBank className="w-4 h-4" />}
                            {isTransfer && <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-textDefault truncate">
                              {txn.description || merchantName || txn.category?.name || txn.type}
                            </div>
                            <div className="text-[11px] text-textMuted flex items-center gap-1.5 mt-0.5">
                              {txn.category?.name && (
                                <span className="truncate">{txn.category.name}</span>
                              )}
                              {merchantName && !txn.category?.name && (
                                <span className="truncate">{merchantName}</span>
                              )}
                              {dateStr && <span>• {dateStr}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-xs font-extrabold ${amountColor}`}>
                            {formattedAmount}
                          </div>
                          <div className="text-[10px] text-textMuted uppercase font-medium mt-0.5">
                            {txn.type}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
