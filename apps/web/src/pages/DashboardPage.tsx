import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  TrendingUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  PiggyBank,
  ShieldAlert,
  ChevronRight,
  CreditCard,
  Receipt,
  Plus,
  RefreshCw,
  PieChart as PieChartIcon,
  Landmark,
  Wallet,
  Banknote,
  Clock,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { MetricCardSkeleton, TransactionItemSkeleton } from '../components/ui/Skeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useUiStore } from '../store/uiStore.js';
import { apiClient } from '../services/apiClient.js';
import { formatCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { formatDate } from '../utils/date.js';

const CATEGORY_COLORS = [
  '#2563EB', // Blue
  '#EF4444', // Red
  '#0D9488', // Teal
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
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
    accounts?: Array<{
      id: string;
      name: string;
      accountType: string;
      balance: number;
    }>;
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

  // Query user preferences
  const { data: userSettings } = useQuery<any>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const res = await apiClient.settings.get();
      return (res as any)?.data || res;
    },
    staleTime: 5 * 60 * 1000,
  });

  const donutConfig = userSettings?.dashboardDonutsConfig || userSettings?.dashboardDonuts;
  const donutVisualsEnabled = userSettings?.donutVisualsEnabled !== false;
  const showExpenseDonut = donutVisualsEnabled && donutConfig?.expense !== false;
  const showIncomeDonut = donutVisualsEnabled && donutConfig?.income !== false;
  const showInvestmentDonut = donutVisualsEnabled && donutConfig?.investment !== false;
  const showDonutSection = showExpenseDonut || showIncomeDonut || showInvestmentDonut;
  const showQuickAdd = userSettings?.quickAddEnabled !== false && userSettings?.quickAdd !== false;

  // Extract real backend data with safe fallbacks
  const fam = dashboardData?.fam;
  const famGrade = fam?.gradeDisplay || fam?.grade || null;
  const famStatusLabel = fam?.statusLabel || 'Excellent';
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
  const investmentBreakdown = (dashboardData as any)?.investmentBreakdown || [];
  const accountSummary = dashboardData?.accountSummary || { totalBalance: 0, activeCount: 0, accounts: [] };
  const recentTransactions = dashboardData?.recentTransactions || [];

  // Segmented toggle state for Breakdown card
  type BreakdownTab = 'EXPENSE' | 'INCOME' | 'INVESTMENT';
  const [breakdownView, setBreakdownView] = React.useState<BreakdownTab>('EXPENSE');

  // Compute available tabs according to user settings and sync active tab if needed
  React.useEffect(() => {
    const availableTabs: BreakdownTab[] = [];
    if (showExpenseDonut) availableTabs.push('EXPENSE');
    if (showIncomeDonut) availableTabs.push('INCOME');
    if (showInvestmentDonut) availableTabs.push('INVESTMENT');

    if (availableTabs.length > 0 && !availableTabs.includes(breakdownView)) {
      setBreakdownView(availableTabs[0]);
    }
  }, [showExpenseDonut, showIncomeDonut, showInvestmentDonut]);

  const activeBreakdown: Array<{ categoryId?: string; categoryName: string; amount: number; percentage: number }> =
    breakdownView === 'EXPENSE'
      ? expenseBreakdown
      : breakdownView === 'INCOME'
      ? incomeBreakdown
      : investmentBreakdown;
  const totalBreakdownAmount = activeBreakdown.reduce((sum, item) => sum + item.amount, 0);

  // Interactive state for Section 4 Donut Chart (exact styling, gap, mouseover & touch details)
  const [hoveredSliceIndex, setHoveredSliceIndex] = React.useState<number | null>(null);

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50">
      {/* 1. Centralized Branded Dark Navy Header (Preserved exactly as requested) */}
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle="Financial Assessment & Wealth Hub"
      />

      {/* Main Dashboard Content Area */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
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
          /* Error Fallback State */
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
            {/* 2. Security Reminder Banner (Dynamic KBA verification) */}
            {securityBanner?.showSecurityReminder && (
              <Card className="bg-amber-50/90 border-amber-200 p-3.5" data-testid="security-reminder-banner">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-200/70 text-amber-900">
                      Security Reminder
                    </span>
                    <h4 className="text-xs font-bold text-textDefault tracking-tight mt-1">
                      Set Up Security Questions
                    </h4>
                    <p className="text-[11px] text-textMuted leading-relaxed mt-0.5">
                      Add 3 security questions to safeguard your account and enable recovery.
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

            {/* ==============================================================
             * SECTION 1: FINANCIAL HEALTH HERO CARD
             * Matches Reference Image Hero Card: vibrant blue gradient,
             * HEALTHY pill, status heading with sparkle, donut score, and Report box.
             * ============================================================== */}
            <div
              className="bg-gradient-to-br from-[#2F74EE] via-[#3B82F6] to-[#60A5FA] rounded-3xl p-4 text-white shadow-md relative overflow-hidden border border-blue-400/30"
              data-testid="fam-score-card"
            >
              {/* Subtle floating ambient glow orbs and micro-mesh overlay */}
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/20 blur-2xl pointer-events-none opacity-20 animate-ambient-glow" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-300/30 blur-2xl pointer-events-none opacity-20 animate-ambient-glow" style={{ animationDelay: '-3s' }} />
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-20" />

              <h2 className="sr-only">Financial Assessment Matrix</h2>

              <div className="flex items-center justify-between gap-2 relative z-10">
                {/* Left Column: Status Badge, Title, Subtitle, Description */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="inline-flex items-center">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                        famGrade === 'C' ? 'bg-rose-100 text-rose-800' : 'bg-[#DCFCE7] text-[#15803D]'
                      }`}
                    >
                      {famGrade === 'C' ? 'NEEDS ATTENTION' : 'HEALTHY'}
                    </span>
                  </div>

                  <div className="text-white/90 text-[11px] font-medium mt-2">
                    Your Financial Health is
                  </div>

                  <div className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                    <span>{famStatusLabel ? `${famStatusLabel}!` : 'Excellent!'}</span>
                    <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0 inline" />
                  </div>

                  <p className="text-white/80 text-[11px] leading-snug mt-1 max-w-[155px]">
                    {famScore >= 75
                      ? "Keep going! You're on track to achieve your financial goals."
                      : 'Review your targets and monthly expenses to optimize your score.'}
                  </p>
                </div>

                {/* Center Column: FAM Donut Ring */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90 filter drop-shadow-sm" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="39"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.18)"
                      strokeWidth="9"
                    />
                    {famIsAvailable ? (
                      <>
                        <defs>
                          <linearGradient id="heroFamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#818CF8" />
                            <stop offset="35%" stopColor="#34D399" />
                            <stop offset="70%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#F87171" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r="39"
                          fill="none"
                          stroke="url(#heroFamGradient)"
                          strokeWidth="9"
                          strokeDasharray={`${(Math.min(100, Math.max(0, famScore)) / 100) * (2 * Math.PI * 39)} ${2 * Math.PI * 39}`}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </>
                    ) : null}
                  </svg>

                  {/* Inner White Center Card */}
                  <div className="absolute inset-2.5 rounded-full bg-white flex flex-col items-center justify-center text-center shadow-lg border border-white/60 p-1">
                    {famGrade ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-xs leading-none">
                        {famGrade}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 leading-none">
                        N/A
                      </span>
                    )}
                    <span className="text-base font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                      {famIsAvailable ? `${famScore}%` : '0%'}
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                      Overall Score
                    </span>
                  </div>
                </div>

                {/* Right Column: Glassy Report Action Box */}
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  aria-label="View full score report"
                  className="bg-white/20 hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/30 text-white shrink-0 w-20 text-center cursor-pointer shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center mb-1 shadow-inner">
                    <TrendingUp className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                  <span className="text-[11px] font-black flex items-center justify-center text-white">
                    Report &gt;
                  </span>
                  <span className="text-[8px] text-white/80 leading-tight mt-0.5">
                    View detailed analysis
                  </span>
                </button>
              </div>
            </div>

            {/* ==============================================================
             * SECTION 2: MONTHLY STATUS PILLS
             * 3 Compact Pills in a White Card (Expenses, Investments, Income)
             * Adjusted for full text display without truncation
             * ============================================================== */}
            <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
              {/* Expenses Pill */}
              <div className="flex items-center gap-1.5 px-1 py-0.5">
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight whitespace-nowrap">Expenses</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight whitespace-nowrap">
                    {areaExpense?.statusLabel || areaExpense?.status || 'Excellent'}
                  </div>
                </div>
              </div>

              {/* Investments Pill */}
              <div className="flex items-center gap-1.5 px-1.5 py-0.5">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight whitespace-nowrap">Investments</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight whitespace-nowrap">
                    {areaInvestment?.statusLabel || areaInvestment?.status || 'Excellent'}
                  </div>
                </div>
              </div>

              {/* Income Pill */}
              <div className="flex items-center gap-1.5 px-1 py-0.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight whitespace-nowrap">Income</div>
                  <div className="text-[10px] font-semibold text-slate-500 leading-tight whitespace-nowrap">
                    {areaIncome?.statusLabel || areaIncome?.status || 'Excellent'}
                  </div>
                </div>
              </div>
            </div>

            {/* ==============================================================
             * SECTION 3: TARGET OVERVIEW
             * Header with "Manage Planning >", 3 Cards (Income, Expense, Invest)
             * ============================================================== */}
            <div className="space-y-2.5" data-testid="target-overview-cards">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-900">Target Overview</h3>
                <button
                  type="button"
                  onClick={() => navigate('/planning')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100/90 text-slate-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all border border-slate-200/80 shadow-2xs"
                >
                  <span>Manage Planning</span>
                  <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* 1. Income Card */}
                <div
                  className="bg-gradient-to-b from-[#F0FDF4]/70 to-white border border-emerald-100/90 rounded-2xl p-2 shadow-xs flex flex-col justify-between"
                  data-testid="income-overview-card"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Banknote className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Income</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-1">
                      <div className="text-xs font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(targets.income.actual, userCurrency)}
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        {`${targets.income.percent}%`}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                      of {formatCurrency(targets.income.target, userCurrency)}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, targets.income.percent))}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 mt-1 whitespace-nowrap">
                      {targets.income.percent >= 100 ? 'Target Exceeded!' : 'On Track'}
                    </div>
                  </div>
                </div>

                {/* 2. Expense Card */}
                <div
                  className="bg-gradient-to-b from-[#FEF2F2]/70 to-white border border-rose-100/90 rounded-2xl p-2 shadow-xs flex flex-col justify-between"
                  data-testid="expense-overview-card"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Expense</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-1">
                      <div className="text-xs font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(targets.expense.actual, userCurrency)}
                      </div>
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        {`${targets.expense.percent}%`}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                      limit {formatCurrency(targets.expense.target, userCurrency)}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, targets.expense.percent))}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-1 whitespace-nowrap">
                      <span>{formatCurrency(targets.expense.remaining, userCurrency)} remaining</span>
                      <span className="sr-only">spent</span>
                    </div>
                  </div>
                </div>

                {/* 3. Invest Card */}
                <div
                  className="bg-gradient-to-b from-[#FAF5FF]/70 to-white border border-purple-100/90 rounded-2xl p-2 shadow-xs flex flex-col justify-between"
                  data-testid="investment-overview-card"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <PiggyBank className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Invest</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-1">
                      <div className="text-xs font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(targets.investment.actual, userCurrency)}
                      </div>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        {`${targets.investment.percent}%`}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                      target {formatCurrency(targets.investment.target, userCurrency)}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, targets.investment.percent))}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-purple-600 mt-1 whitespace-nowrap">
                      <span>On Track!</span>
                      <span className="sr-only">invested</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==============================================================
             * SECTION 4: EXPENSE / INCOME / INVESTMENT BREAKDOWN CARD
             * Donut chart on left with center count, category legend list on right,
             * Expenses / Income / Investments pill toggle in header.
             * ============================================================== */}
            {showDonutSection && (
            <div
              className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-3"
              data-testid="expense-overview-donut-card"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 ${
                    breakdownView === 'INVESTMENT' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {breakdownView === 'EXPENSE'
                      ? 'Expense Breakdown'
                      : breakdownView === 'INCOME'
                      ? 'Income Breakdown'
                      : 'Investment Breakdown'}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* Segmented Pill Toggle */}
                  <div className="flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
                    {showExpenseDonut && (
                      <button
                        type="button"
                        onClick={() => setBreakdownView('EXPENSE')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                          breakdownView === 'EXPENSE'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Expenses
                      </button>
                    )}
                    {showIncomeDonut && (
                      <button
                        type="button"
                        onClick={() => setBreakdownView('INCOME')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                          breakdownView === 'INCOME'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Income
                      </button>
                    )}
                    {showInvestmentDonut && (
                      <button
                        type="button"
                        onClick={() => setBreakdownView('INVESTMENT')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                          breakdownView === 'INVESTMENT'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Investments
                      </button>
                    )}
                  </div>

                  {/* Total Amount in Header */}
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(totalBreakdownAmount, userCurrency)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {breakdownView === 'EXPENSE'
                        ? 'Total Spent'
                        : breakdownView === 'INCOME'
                        ? 'Total Received'
                        : 'Total Invested'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body: Donut + Legend */}
              {activeBreakdown.length === 0 ? (
                <EmptyState
                  icon={<PieChartIcon className="w-7 h-7 stroke-[1.8]" />}
                  title={
                    breakdownView === 'EXPENSE'
                      ? 'No expense breakdown'
                      : breakdownView === 'INCOME'
                      ? 'No income breakdown'
                      : 'No investment breakdown'
                  }
                  description={
                    breakdownView === 'EXPENSE'
                      ? 'Record your expenses to see category distribution.'
                      : breakdownView === 'INCOME'
                      ? 'Record your income to see source distribution.'
                      : 'Record your investments to see asset allocation.'
                  }
                  actionLabel={
                    breakdownView === 'EXPENSE'
                      ? 'Add Expense'
                      : breakdownView === 'INCOME'
                      ? 'Add Income'
                      : 'Add Investment'
                  }
                  actionIcon={<Plus className="w-4 h-4" />}
                  onAction={openPicker}
                />
              ) : (
                <div className="flex items-center justify-between gap-4 pt-1 pb-2">
                  {/* Left: SVG Multi-segment Donut with 1.5px gaps and interactive highlights */}
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg
                      className="w-full h-full -rotate-90 outline-none focus:outline-none"
                      viewBox="0 0 100 100"
                      style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth="11"
                        style={{ outline: 'none' }}
                      />
                      {(() => {
                        const circumference = 2 * Math.PI * 38;
                        let accumulatedPercent = 0;
                        return activeBreakdown.map((item, index) => {
                          const strokeColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                          const rawDashLength = (item.percentage / 100) * circumference;
                          // 1.5px gap between segments to match exact reference geometry
                          const gap = activeBreakdown.length > 1 ? 1.5 : 0;
                          const dashLength = Math.max(0.5, rawDashLength - gap);
                          const offset = (accumulatedPercent / 100) * circumference;
                          accumulatedPercent += item.percentage;
                          const isHovered = hoveredSliceIndex === index;

                          return (
                            <circle
                              key={item.categoryId || `cat-${index}`}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={isHovered ? 13 : 11}
                              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="butt"
                              className="cursor-pointer transition-all duration-200 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                              style={{
                                opacity: hoveredSliceIndex === null || isHovered ? 1 : 0.4,
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                              }}
                              onMouseEnter={() => setHoveredSliceIndex(index)}
                              onMouseLeave={() => setHoveredSliceIndex(null)}
                              onClick={(e) => {
                                (e.currentTarget as SVGElement).blur();
                                setHoveredSliceIndex(hoveredSliceIndex === index ? null : index);
                              }}
                              onTouchStart={(e) => {
                                (e.currentTarget as SVGElement).blur();
                                setHoveredSliceIndex(hoveredSliceIndex === index ? null : index);
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`${item.categoryName}: ${item.percentage}%`}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Center Readout: Default count or selected slice details */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
                      {hoveredSliceIndex !== null && activeBreakdown[hoveredSliceIndex] ? (
                        <>
                          <span className="text-sm font-black text-slate-900 leading-none">
                            {activeBreakdown[hoveredSliceIndex].percentage}%
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 truncate max-w-[65px] mt-0.5">
                            {activeBreakdown[hoveredSliceIndex].categoryName}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-base font-black text-slate-900 leading-none">
                            {activeBreakdown.length}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            Categories
                          </span>
                        </>
                      )}
                    </div>

                    {/* Floating Compact Detail Badge directly below the pie chart as an overlay */}
                    {hoveredSliceIndex !== null && activeBreakdown[hoveredSliceIndex] && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 text-white shadow-xl backdrop-blur-md px-2.5 py-0.5 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none border border-white/10">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: CATEGORY_COLORS[hoveredSliceIndex % CATEGORY_COLORS.length],
                          }}
                        />
                        <span className="max-w-[65px] truncate">{activeBreakdown[hoveredSliceIndex].categoryName}:</span>
                        <span className="font-bold text-emerald-300">
                          {formatCurrency(activeBreakdown[hoveredSliceIndex].amount, userCurrency)}
                        </span>
                        <span className="text-slate-300">({activeBreakdown[hoveredSliceIndex].percentage}%)</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Category Legend List with two-way hover sync */}
                  <div className="flex-1 space-y-1.5 min-w-0 max-h-52 overflow-y-auto pr-1">
                    {activeBreakdown.map((item, index) => {
                      const bulletColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                      const isHovered = hoveredSliceIndex === index;

                      return (
                        <div
                          key={item.categoryId || `legend-${index}`}
                          onMouseEnter={() => setHoveredSliceIndex(index)}
                          onMouseLeave={() => setHoveredSliceIndex(null)}
                          onClick={() => setHoveredSliceIndex(hoveredSliceIndex === index ? null : index)}
                          role="button"
                          tabIndex={0}
                          className={`flex items-center justify-between text-xs p-1 rounded-xl cursor-pointer transition-all ${
                            isHovered ? 'bg-blue-50/80 shadow-xs' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0 transition-transform"
                              style={{
                                backgroundColor: bulletColor,
                                transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                              }}
                            />
                            <span className={`font-semibold truncate max-w-[100px] ${isHovered ? 'text-blue-700' : 'text-slate-700'}`}>
                              {item.categoryName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-900">
                              {formatCurrency(item.amount, userCurrency)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 w-10 text-right">
                              {`${item.percentage}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* ==============================================================
             * SECTION 5: CONNECTED ACCOUNTS CARD
             * Total Liquid Balance, active count, colored account circle badges,
             * and "+ View Accounts" action.
             * ============================================================== */}
            <div
              className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-3"
              data-testid="account-summary-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Connected Accounts</h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/accounts')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100/90 text-slate-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all border border-slate-200/80 shadow-2xs"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3 h-3 stroke-[2.5]" />
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
                <div className="flex items-center justify-between mt-2 pt-1">
                  <div>
                    <div className="text-xs font-medium text-slate-400">Total Liquid Balance</div>
                    <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                      {formatCurrency(accountSummary.totalBalance, userCurrency)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {`Across ${accountSummary.activeCount} active ${accountSummary.activeCount === 1 ? 'account' : 'accounts'}`}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2.5">
                    {/* Visual Account Badge Circles */}
                    <div className="flex items-center -space-x-1.5">
                      {accountSummary.accounts && accountSummary.accounts.length > 0 ? (
                        accountSummary.accounts.slice(0, 3).map((acc, idx) => {
                          const isBank = acc.accountType === 'SAVINGS' || acc.accountType === 'CHECKING';
                          const isWallet = acc.accountType === 'WALLET' || acc.accountType === 'CASH';
                          const isCard = acc.accountType === 'CREDIT_CARD';
                          const bgClass = isBank
                            ? 'bg-blue-600 text-white'
                            : isWallet
                            ? 'bg-purple-600 text-white'
                            : isCard
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white';
                          return (
                            <div
                              key={acc.id || idx}
                              title={acc.name}
                              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${bgClass}`}
                            >
                              {isBank && <Landmark className="w-3.5 h-3.5" />}
                              {isWallet && <Wallet className="w-3.5 h-3.5" />}
                              {isCard && <CreditCard className="w-3.5 h-3.5" />}
                              {!isBank && !isWallet && !isCard && <Landmark className="w-3.5 h-3.5" />}
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white shadow-xs">
                            <Landmark className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center border-2 border-white shadow-xs">
                            <Wallet className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                        </>
                      )}
                      {accountSummary.activeCount > 3 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                          +{accountSummary.activeCount - 3}
                        </div>
                      )}
                    </div>

                    {/* View Accounts Action Button */}
                    <button
                      type="button"
                      onClick={() => navigate('/accounts')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>View Accounts</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ==============================================================
             * SECTION 6: RECENT TRANSACTIONS CARD
             * Rose receipt icon, "View All >" link, top 5 active transactions
             * with colored type icons, clean descriptions, and signed amounts.
             * ============================================================== */}
            <div
              className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-3"
              data-testid="recent-transactions-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-400 text-white flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100/90 text-slate-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all border border-slate-200/80 shadow-2xs"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3 stroke-[2.5]" />
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
                <div className="divide-y divide-slate-100 mt-1">
                  {recentTransactions.map((txn) => {
                    const isIncome = txn.type === 'INCOME';
                    const isExpense = txn.type === 'EXPENSE';
                    const isInvest = txn.type === 'INVESTMENT';
                    const isTransfer = txn.type === 'TRANSFER';

                    const chipBg = isIncome
                      ? 'bg-emerald-100 text-emerald-600'
                      : isExpense
                      ? 'bg-rose-100 text-rose-500'
                      : isInvest
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600';

                    const formattedAmount = isIncome
                      ? `+${formatCurrency(txn.amount, userCurrency)}`
                      : isExpense
                      ? `-${formatCurrency(txn.amount, userCurrency)}`
                      : formatCurrency(txn.amount, userCurrency);

                    const amountColor = isIncome
                      ? 'text-emerald-600'
                      : isExpense
                      ? 'text-rose-500'
                      : isInvest
                      ? 'text-purple-600'
                      : 'text-blue-600';

                    const rawDate = txn.txnDate || txn.date;
                    const dateStr = formatDate(rawDate);

                    const merchantName =
                      typeof txn.merchant === 'string' ? txn.merchant : txn.merchant?.name;

                    const defaultRecordLabel = isIncome
                      ? 'Income Record'
                      : isExpense
                      ? 'Expense Record'
                      : isInvest
                      ? 'Investment Record'
                      : 'Transfer Record';

                    const title = merchantName || txn.description || defaultRecordLabel;

                    const defaultTypeLabel = isIncome
                      ? 'Income'
                      : isExpense
                      ? 'Expense'
                      : isInvest
                      ? 'Investment'
                      : 'Transfer';

                    const categoryName =
                      txn.category?.name ||
                      (txn.description && merchantName ? txn.description : defaultTypeLabel);

                    return (
                      <div
                        key={txn.id}
                        onClick={() => navigate('/transactions')}
                        className="flex items-center justify-between py-2.5 hover:bg-slate-50/80 cursor-pointer transition-colors px-1 rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${chipBg}`}>
                            {isIncome && <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                            {isExpense && <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
                            {isInvest && <PiggyBank className="w-4 h-4 stroke-[2.5]" />}
                            {isTransfer && <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {title}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="truncate">{categoryName}</span>
                              {dateStr && <span>• {dateStr}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-xs font-black ${amountColor}`}>
                            {formattedAmount}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Floating Quick-Add Button */}
      {showQuickAdd && (
        <button
          type="button"
          onClick={openPicker}
          className="fixed bottom-20 right-4 sm:right-6 md:right-8 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Quick Add Transaction"
          title="Quick Add Transaction"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
