import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Calendar,
  ChevronDown,
  X,
  User,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Info,
  BarChart3,
  PieChart,
  FileText,
  Sprout,
  Coins,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { formatCurrency, formatCompactCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { formatDateRange } from '../utils/date.js';
import { apiClient } from '../services/apiClient.js';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import { useAuthStore } from '../store/authStore.js';
import type { AnalyticsOverview } from '@finance/shared-types';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountId = searchParams.get('accountId') || undefined;

  const queryClient = useSafeQueryClient();
  const { currency: userCurrency } = useUserCurrency();
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('This Month');
  const [selectedTrendHorizon, setSelectedTrendHorizon] = useState<string>('Last 6 Months');
  const [selectedCategoryPeriod, setSelectedCategoryPeriod] = useState<string>('This Month');
  const [categoryType, setCategoryType] = useState<'EXPENSE' | 'INCOME' | 'INVESTMENT'>('EXPENSE');

  // Fetch accounts list for account filter & switcher
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => apiClient.accounts.list(),
  }, queryClient);

  const accounts = React.useMemo(() => {
    if (!accountsData) return [];
    if (Array.isArray(accountsData)) return accountsData;
    if (Array.isArray((accountsData as any)?.accounts)) return (accountsData as any).accounts;
    return [];
  }, [accountsData]);

  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const { data: analyticsData, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics', selectedMonth, accountId || 'all'],
    queryFn: async () => {
      return await apiClient.analytics.get({ month: selectedMonth, accountId });
    },
    placeholderData: keepPreviousData,
  }, queryClient);

  const handlePeriodToggle = () => {
    if (selectedPeriod === 'This Month') {
      setSelectedPeriod('Last Month');
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    } else {
      setSelectedPeriod('This Month');
      const d = new Date();
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  const earned = analyticsData?.summary?.earned ?? 0;
  const spent = analyticsData?.summary?.spent ?? 0;
  const netSaved = analyticsData?.summary?.netSavings ?? 0;
  const savingsRate = analyticsData?.summary?.savingsRate ?? 0;

  const spendingTrends = analyticsData?.spendingTrends || [];
  const displayedTrends =
    selectedTrendHorizon === 'Last 3 Months'
      ? spendingTrends.slice(-3)
      : spendingTrends;

  const maxTrendSpent = Math.max(...displayedTrends.map((t) => t.spent), 1000);
  const maxCeiling = Math.max(10000, Math.ceil(maxTrendSpent / 10000) * 10000);
  const gridSteps = [
    maxCeiling,
    Math.round(maxCeiling * 0.75),
    Math.round(maxCeiling * 0.5),
    Math.round(maxCeiling * 0.25),
    0,
  ];

  const activeCategoryBreakdown: Array<{ categoryId?: string; categoryName: string; totalAmount: number; percentage: number }> =
    categoryType === 'EXPENSE'
      ? (analyticsData?.expenseCategoryBreakdown || analyticsData?.categoryBreakdown || [])
      : categoryType === 'INCOME'
      ? (analyticsData?.incomeCategoryBreakdown || [])
      : ((analyticsData as any)?.investmentCategoryBreakdown || []);

  const hasSpendingTrendData = displayedTrends.some((t) => t.spent > 0);
  const hasCategoryData = activeCategoryBreakdown.length > 0;

  // Month date range indicator: derived from API data or computed from selected month in DD-MM-YYYY format
  const dateRangeLabel = (() => {
    if (analyticsData?.period?.startDate && analyticsData?.period?.endDate) {
      return formatDateRange(analyticsData.period.startDate, analyticsData.period.endDate);
    }
    // Compute from selectedMonth
    const [yr, mo] = selectedMonth.split('-').map(Number);
    if (yr && mo) {
      const lastDay = new Date(yr, mo, 0).getDate();
      const start = `01-${String(mo).padStart(2, '0')}-${yr}`;
      const end = `${String(lastDay).padStart(2, '0')}-${String(mo).padStart(2, '0')}-${yr}`;
      return `${start} - ${end}`;
    }
    return '';
  })();


  // Dynamic empty-state trend months (past 6 months)
  const emptyTrendMonths = React.useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }
    return months;
  }, []);

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Branded Dark Navy Header */}
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle="Trends & Spending Insights"
      />

      <div className="p-4 space-y-4">
        {/* Title row with blue vertical bar accent, date range indicator, and period dropdown */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="flex items-center">
              {/* Blue vertical accent bar */}
              <div className="w-1 h-6 bg-brand-primary rounded-full mr-2 shrink-0" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Analytics
              </h1>
            </div>
            {/* Calendar date range indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 pl-3 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{dateRangeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Right Period Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handlePeriodToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-primary/60 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Account Filter Chips */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('accountId');
                setSearchParams(newParams);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                !accountId
                  ? 'bg-[#132A5C] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              All Accounts
            </button>
            {accounts.map((acc: any) => {
              const isSelected = acc.id === accountId;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('accountId', acc.id);
                    setSearchParams(newParams);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{acc.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Account Context Banner */}
        {selectedAccount && (
          <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    {selectedAccount.name}
                  </h3>
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md">
                    {selectedAccount.institutionName || selectedAccount.institution || selectedAccount.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Individual account analytics & transaction report
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('accountId');
                setSearchParams(newParams);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-blue-100/60"
              title="View all accounts report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dismissible Insight Banner */}
        {!isBannerDismissed && !onboardingCompleted && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100/90 via-blue-50/70 to-indigo-50/80 border border-blue-200/80 p-4 shadow-sm">
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              aria-label="Dismiss banner"
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/50 transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 max-w-[240px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">
                  UNLOCK POWERFUL INSIGHTS
                </span>
                <h2 className="text-lg font-black text-slate-900 leading-tight">
                  Complete your finance profile
                </h2>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Set monthly targets to measure and chart your progress.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/profile/settings')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-md shadow-brand-primary/20 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Complete Finance Profile</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Vector Document Illustration with Progress Ring */}
              <div className="relative shrink-0 pr-2">
                <div className="w-24 h-28 bg-white/90 rounded-xl border border-blue-200 shadow-sm p-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-8 h-1 bg-slate-200 rounded" />
                    <div className="w-12 h-1 bg-slate-200 rounded" />
                  </div>
                  {/* Mini Bars */}
                  <div className="flex items-end gap-1 h-8 px-1">
                    <div className="w-2 bg-brand-primary rounded-t" style={{ height: '50%' }} />
                    <div className="w-2 bg-brand-primary rounded-t" style={{ height: '80%' }} />
                    <div className="w-2 bg-blue-300 rounded-t" style={{ height: '65%' }} />
                    <div className="w-2 bg-blue-400 rounded-t" style={{ height: '95%' }} />
                  </div>
                  {/* Donut Badge */}
                  <div className="flex justify-center">
                    <div className="w-9 h-9 rounded-full border-4 border-emerald-400 border-t-brand-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    </div>
                  </div>
                </div>
                {/* Handwritten note decoration */}
                <div className="absolute -top-1 -right-3 rotate-12 text-[9px] font-bold text-brand-primary leading-tight">
                  Know<br />your money<br />Better!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3 Stat Cards Side-by-Side: Income, Expenses, Saved */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* 1. Income Card */}
          <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">Income</span>
            </div>
            <div className="my-2">
              <span className="text-base font-black text-emerald-700">
                {formatCurrency(earned, userCurrency)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">
              {earned > 0 ? 'This period' : 'No income yet'}
            </div>
          </div>

          {/* 2. Expenses Card */}
          <div className="bg-[#FEF2F2] border border-rose-100 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">Expenses</span>
            </div>
            <div className="my-2">
              <span className="text-base font-black text-rose-600">
                {formatCurrency(spent, userCurrency)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">
              {spent > 0 ? 'This period' : 'No expenses yet'}
            </div>
          </div>

          {/* 3. Saved Card */}
          <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-brand-primary">
                <Wallet className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">Saved</span>
            </div>
            <div className="my-2">
              <span className="text-base font-black text-brand-primary">
                {formatCurrency(netSaved, userCurrency)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">
              {savingsRate > 0 ? `${savingsRate}% rate` : 'No savings yet'}
            </div>
          </div>

        </div>

        {/* Savings Rate Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm">
          <div className="flex items-center divide-x divide-slate-100">
            {/* Left side: Percentage & Progress Bar */}
            <div className="flex-1 pr-4 space-y-2">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                <span>Savings Rate</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {savingsRate}%
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {earned > 0
                    ? `${formatCurrency(netSaved, userCurrency)} saved from ${formatCurrency(earned, userCurrency)} income`
                    : 'No income recorded in this period'}
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                />
              </div>
            </div>

            {/* Right side: Plant vector badge + Callout */}
            <div className="flex-1 pl-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <Sprout className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="bg-blue-50/80 rounded-xl p-2.5 border border-blue-100">
                <p className="text-[11px] text-brand-primary font-medium leading-relaxed">
                  Track cash flow to grow your savings rate.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 6-Month Spending Trend Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-brand-primary">
                <BarChart3 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                6-Month Spending Trend
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTrendHorizon((h) => (h === 'Last 6 Months' ? 'Last 3 Months' : 'Last 6 Months'))}
              className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span>{selectedTrendHorizon}</span>
              <ChevronDown className="w-3 h-3 text-brand-primary" />
            </button>
          </div>

          {/* Trend Chart with Dynamic Y-Axis lines based on real max ceiling */}
          <div className="pt-2">
            <div className="relative h-44 flex flex-col justify-between text-[10px] text-slate-400">
              {/* Dynamic Horizontal Grid lines */}
              {gridSteps.map((stepVal, idx) => (
                <div
                  key={idx}
                  className={`pb-1 flex justify-between ${
                    idx === gridSteps.length - 1
                      ? 'border-b border-slate-200'
                      : 'border-b border-dashed border-slate-200'
                  }`}
                >
                  <span>{formatCompactCurrency(stepVal, userCurrency)}</span>
                </div>
              ))}

              {/* Data Bars or Empty State */}
              {hasSpendingTrendData ? (
                <div className="absolute inset-0 pl-10 pr-2 pt-2 flex items-end justify-between gap-3">
                  {displayedTrends.map((trend) => {
                    const heightPercent = Math.min(100, Math.round((trend.spent / maxCeiling) * 100));
                    return (
                      <div key={trend.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className="w-full max-w-[28px] bg-brand-primary rounded-t-md transition-all duration-300"
                          style={{ height: `${trend.spent > 0 ? Math.max(3, heightPercent) : 0}%` }}
                        />
                        <span className="text-[10px] font-medium text-slate-600 mt-1">
                          {trend.monthLabel.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">No data available</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Add your transactions to see your spending trend.
                  </p>
                </div>
              )}
            </div>

            {/* X-axis labels if empty state */}
            {!hasSpendingTrendData && (
              <div className="flex justify-between text-[10px] text-slate-500 pt-2 px-3">
                {emptyTrendMonths.map((m, idx) => (
                  <span key={`${m}-${idx}`}>{m}</span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Category Breakdown Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-brand-primary">
                <PieChart className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Category Breakdown
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Segmented Expenses / Income Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setCategoryType('EXPENSE')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    categoryType === 'EXPENSE'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryType('INCOME')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    categoryType === 'INCOME'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryType('INVESTMENT')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    categoryType === 'INVESTMENT'
                      ? 'bg-white text-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Investments
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategoryPeriod((p) => (p === 'This Month' ? 'Last Month' : 'This Month'))}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span>{selectedCategoryPeriod}</span>
                <ChevronDown className="w-3 h-3 text-brand-primary" />
              </button>
            </div>
          </div>

          {/* Category Content: Chart + List or Empty State */}
          {hasCategoryData ? (
            <div className="space-y-3 pt-1">
              {activeCategoryBreakdown.map((cat, idx) => {
                const colors = ['#2554EE', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#94A3B8'];
                const color = colors[idx % colors.length];
                return (
                  <div key={cat.categoryId || cat.categoryName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate">{cat.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-slate-900">{formatCurrency(cat.totalAmount, userCurrency)}</span>
                        <span className="text-slate-500 text-[11px]">({cat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${cat.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between py-4 px-2">
              {/* Circular placeholder half-ring */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth="4"
                    strokeDasharray="75 25"
                  />
                </svg>
              </div>

              {/* Text Callout */}
              <div className="flex-1 pl-6 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mb-1">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  {categoryType === 'EXPENSE' ? 'No expense data yet' : 'No income data yet'}
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {categoryType === 'EXPENSE'
                    ? 'Add transactions to see category breakdown.'
                    : 'Add income to see category breakdown.'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
