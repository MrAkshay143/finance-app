import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  Download,
  Calendar,
  Info,
  PieChart,
  BarChart3,
  Target,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Award,
  Wallet,
  CreditCard,
  Check,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Select } from '../components/ui/Select.js';
import { Input } from '../components/ui/Input.js';
import { formatCurrency, formatCompactCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { apiClient } from '../services/apiClient.js';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import type { MonthlyReportResponse } from '@finance/shared-types';

const CATEGORY_COLORS = ['#2554EE', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#94A3B8'];
const MAX_BAR_HEIGHT_PX = 88;

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useSafeQueryClient();
  const { currency: userCurrency } = useUserCurrency();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [activeTab, setActiveTab] = useState<'monthly' | 'year' | 'custom'>('monthly');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Generate last 6 months for selector
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { value: val, label: i === 0 ? `${label} (current)` : label };
  });

  const yearOptions = [
    { value: new Date().getFullYear().toString(), label: `${new Date().getFullYear()}` },
    { value: (new Date().getFullYear() - 1).toString(), label: `${new Date().getFullYear() - 1}` },
    { value: (new Date().getFullYear() - 2).toString(), label: `${new Date().getFullYear() - 2}` },
  ];

  // 1. Monthly Report Query
  const { data: reportData } = useQuery<MonthlyReportResponse>({
    queryKey: ['reports', 'monthly', selectedMonth],
    queryFn: async () => {
      return await apiClient.reports.getMonthly(selectedMonth);
    },
    enabled: activeTab === 'monthly',
  }, queryClient);

  // 2. Annual Report Query
  const { data: annualData } = useQuery<any>({
    queryKey: ['reports', 'annual', selectedYear],
    queryFn: async () => {
      return await apiClient.reports.getAnnual(selectedYear);
    },
    enabled: activeTab === 'year',
  }, queryClient);

  // 3. Custom Range Report Query
  const { data: customData } = useQuery<any>({
    queryKey: ['reports', 'custom', customStartDate, customEndDate],
    queryFn: async () => {
      return await apiClient.reports.getCustom(customStartDate, customEndDate);
    },
    enabled: activeTab === 'custom' && Boolean(customStartDate && customEndDate),
  }, queryClient);

  // Monthly Metrics with robust fallbacks
  const earnedActual =
    reportData?.targetVsActual?.income?.actual ??
    (reportData?.totals?.earnedPaise ? reportData.totals.earnedPaise / 100 : 0);
  const earnedProjected =
    reportData?.targetVsActual?.income?.target ??
    (reportData?.famScore?.areas?.income?.target ?? 0);
  const earnedDiff = earnedActual - earnedProjected;

  const expenseActual =
    reportData?.targetVsActual?.expense?.actual ??
    (reportData?.totals?.spentPaise ? reportData.totals.spentPaise / 100 : 0);
  const expenseProjected =
    reportData?.targetVsActual?.expense?.target ??
    (reportData?.famScore?.areas?.expense?.target ?? 0);
  const expenseDiff = expenseActual - expenseProjected;

  const investmentActual =
    reportData?.targetVsActual?.investment?.actual ??
    (reportData?.totals?.investedPaise ? reportData.totals.investedPaise / 100 : 0);
  const investmentProjected =
    reportData?.targetVsActual?.investment?.target ??
    (reportData?.famScore?.areas?.investment?.target ?? 0);
  const investmentDiff = investmentActual - investmentProjected;

  const famScoreVal =
    typeof reportData?.famScore?.overallProgressPercentage === 'number'
      ? Math.round(reportData.famScore.overallProgressPercentage)
      : typeof reportData?.famScore?.progress === 'number'
      ? Math.round(reportData.famScore.progress)
      : typeof reportData?.famScore?.score === 'number'
      ? Math.round(reportData.famScore.score)
      : 0;

  const famGradeVal =
    reportData?.famScore?.gradeDisplay ||
    (reportData?.famScore?.overallGrade === 'A_PLUS' ? 'A+' : reportData?.famScore?.overallGrade) ||
    reportData?.famScore?.grade ||
    '—';

  const formatBarBadge = (amount: number): string => {
    return formatCompactCurrency(amount, userCurrency);
  };

  // Real Category Breakdown for current month
  interface CategoryBreakdownItem {
    name: string;
    percent: number;
    amount: number;
    color: string;
  }

  const categoryBreakdown: CategoryBreakdownItem[] = (
    reportData?.categorySummary ||
    ((reportData as any)?.categories as any[]) ||
    []
  )
    .filter((c: any) => !c.type || c.type === 'EXPENSE')
    .slice(0, 6)
    .map((c: any, idx: number): CategoryBreakdownItem => ({
      name: c.categoryName || c.name || 'Other',
      percent: Math.round(c.percentage) || 0,
      amount: c.totalAmount ?? (c.actualPaise ? c.actualPaise / 100 : c.amount ?? 0),
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

  const maxChartVal = Math.max(earnedActual, earnedProjected, expenseActual, expenseProjected, investmentActual, investmentProjected, 100);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Export data for the currently active report tab
      let res: any;
      if (activeTab === 'year') {
        res = await apiClient.reports.getAnnual(selectedYear);
      } else if (activeTab === 'custom') {
        res = await apiClient.reports.getCustom(customStartDate, customEndDate);
      } else {
        res = await apiClient.reports.export({
          month: selectedMonth,
          format: 'json',
        });
      }

      const blob = new Blob([JSON.stringify(res?.data ?? res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileLabel = activeTab === 'year' ? selectedYear.toString() : activeTab === 'custom' ? `${customStartDate}_${customEndDate}` : selectedMonth;
      a.download = `finance-report-${fileLabel}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch {
      window.print();
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Branded Dark Navy Header */}
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle="Monthly Financial Statement"
      />

      <div className="p-4 space-y-4">
        {/* Subheader with Back Chevron, Title, Subtitle, and Export PDF button */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-8 h-8 rounded-full flex items-center justify-center text-textDefault hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-800 stroke-[2.5]" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Reports
              </h1>
              <p className="text-xs text-textMuted leading-tight mt-0.5">
                FAM score &amp; projected vs actual
              </p>
            </div>
          </div>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            aria-label="Export report as JSON"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-brand-primary/60 text-slate-700 text-xs font-semibold shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-all"
          >
            {exportSuccess ? (
              <Check className="w-4 h-4 text-semantic-success stroke-[2.5]" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            )}
            <span>Export JSON</span>
            <ChevronDown className="w-3.5 h-3.5 text-textMuted" aria-hidden="true" />
          </button>

        </div>

        {/* Segmented Pill Tabs: Monthly (default), Year in Review, Custom Range */}
        <div role="tablist" aria-label="Report period" className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'monthly'}
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-all ${
              activeTab === 'monthly'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'year'}
            onClick={() => setActiveTab('year')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-all ${
              activeTab === 'year'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Year in Review
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'custom'}
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-all ${
              activeTab === 'custom'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: MONTHLY REPORT                                        */}
        {/* ============================================================ */}
        {activeTab === 'monthly' && (
          <div className="space-y-4">
            {/* Report Month Picker/Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 pl-1">
                Report month
              </label>
              <Card padding="sm" className="flex items-center justify-between gap-3 bg-white border-slate-200">
                <div className="flex items-center gap-2 pl-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <Select
                    options={monthOptions}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="py-1.5 text-xs font-medium border-0 focus:ring-0 text-slate-800 bg-transparent"
                  />
                </div>
              </Card>
            </div>

            {/* 3 Summary Cards Side-by-Side */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. FAM Score Card */}
              <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-brand-primary">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                    <span>FAM Score</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-lg font-black text-brand-primary">
                      {famScoreVal > 0 ? famScoreVal : (famGradeVal !== '—' ? famScoreVal : '—')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ 100</span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-blue-100/80">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-primary bg-blue-100/90 px-1.5 py-0.5 rounded-md">
                    {famGradeVal}
                  </span>
                </div>
              </div>

              {/* 2. Total Income Card */}
              <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-slate-700">
                    Total Income
                  </span>
                  <div className="mt-0.5">
                    <span className="text-sm font-black text-emerald-700 leading-tight">
                      {formatCurrency(earnedActual, userCurrency)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-emerald-100/80">
                  <span className="text-[10px] font-bold text-emerald-700">
                    {earnedProjected > 0 ? `${Math.round((earnedActual / earnedProjected) * 100)}% target` : 'Active'}
                  </span>
                </div>
              </div>

              {/* 3. Total Expenses Card */}
              <div className="bg-[#FEF2F2] border border-rose-100 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-slate-700">
                    Total Expenses
                  </span>
                  <div className="mt-0.5">
                    <span className="text-sm font-black text-rose-600 leading-tight">
                      {formatCurrency(expenseActual, userCurrency)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-rose-100/80">
                  <span className="text-[10px] font-bold text-rose-700">
                    {expenseProjected > 0 ? `${Math.round((expenseActual / expenseProjected) * 100)}% budget` : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dual Chart Layout: Actual vs Projected & Expense Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left Chart Card: Actual vs Projected */}
              <Card padding="sm" className="p-3 bg-white border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                      Actual vs Target
                    </h3>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                      <span className="text-slate-600">Actual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-200" />
                      <span className="text-slate-600">Target</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Vertical Bar Chart */}
                <div className="pt-3">
                  <div className="h-40 flex items-end justify-between gap-3 border-b border-slate-200 pb-2 px-1">
                    {/* Income Column */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="w-full flex items-end justify-center gap-1.5 h-32">
                        {/* Actual Bar */}
                        <div
                          className="flex flex-col items-center justify-end h-full group cursor-pointer"
                          title={`Income Actual: ${formatCurrency(earnedActual, userCurrency)}`}
                        >
                          <span className="text-[8px] font-bold text-brand-primary mb-1 select-none whitespace-nowrap">
                            {formatBarBadge(earnedActual)}
                          </span>
                          <div
                            className="w-4 sm:w-5 bg-brand-primary rounded-t-sm transition-all duration-500 shadow-xs hover:brightness-110"
                            style={{ height: `${Math.max(4, Math.round((earnedActual / maxChartVal) * MAX_BAR_HEIGHT_PX))}px` }}
                          />
                        </div>
                        {/* Target Bar */}
                        <div
                          className="flex flex-col items-center justify-end h-full group cursor-pointer"
                          title={`Income Target: ${formatCurrency(earnedProjected, userCurrency)}`}
                        >
                          <span className="text-[8px] font-semibold text-slate-400 mb-1 select-none whitespace-nowrap">
                            {formatBarBadge(earnedProjected)}
                          </span>
                          <div
                            className="w-4 sm:w-5 bg-blue-200 rounded-t-sm transition-all duration-500 shadow-xs hover:brightness-95"
                            style={{ height: `${Math.max(4, Math.round((earnedProjected / maxChartVal) * MAX_BAR_HEIGHT_PX))}px` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-700 font-semibold mt-1 select-none">Income</span>
                    </div>

                    {/* Expenses Column */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="w-full flex items-end justify-center gap-1.5 h-32">
                        {/* Actual Bar */}
                        <div
                          className="flex flex-col items-center justify-end h-full group cursor-pointer"
                          title={`Expenses Actual: ${formatCurrency(expenseActual, userCurrency)}`}
                        >
                          <span className="text-[8px] font-bold text-brand-primary mb-1 select-none whitespace-nowrap">
                            {formatBarBadge(expenseActual)}
                          </span>
                          <div
                            className="w-4 sm:w-5 bg-brand-primary rounded-t-sm transition-all duration-500 shadow-xs hover:brightness-110"
                            style={{ height: `${Math.max(4, Math.round((expenseActual / maxChartVal) * MAX_BAR_HEIGHT_PX))}px` }}
                          />
                        </div>
                        {/* Target Bar */}
                        <div
                          className="flex flex-col items-center justify-end h-full group cursor-pointer"
                          title={`Expenses Budget: ${formatCurrency(expenseProjected, userCurrency)}`}
                        >
                          <span className="text-[8px] font-semibold text-slate-400 mb-1 select-none whitespace-nowrap">
                            {formatBarBadge(expenseProjected)}
                          </span>
                          <div
                            className="w-4 sm:w-5 bg-blue-200 rounded-t-sm transition-all duration-500 shadow-xs hover:brightness-95"
                            style={{ height: `${Math.max(4, Math.round((expenseProjected / maxChartVal) * MAX_BAR_HEIGHT_PX))}px` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-700 font-semibold mt-1 select-none">Expenses</span>
                    </div>

                    {/* Investments Column */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="w-full flex items-end justify-center gap-1.5 h-32">
                        {/* Actual Bar */}
                        <div
                          className="flex flex-col items-center justify-end h-full group cursor-pointer"
                          title={`Investments Actual: ${formatCurrency(investmentActual, userCurrency)}`}
                        >
                          <span className="text-[8px] font-bold text-brand-primary mb-1 select-none whitespace-nowrap">
                            {formatBarBadge(investmentActual)}
                          </span>
                          <div
                            className="w-4 sm:w-5 bg-brand-primary rounded-t-sm transition-all duration-500 shadow-xs hover:brightness-110"
                            style={{ height: `${Math.max(4, Math.round((investmentActual / maxChartVal) * MAX_BAR_HEIGHT_PX))}px` }}
                          />
                        </div>
                        {/* Target Bar */}
                        <div
                          className="flex flex-col items-center justify-end h-full group cursor-pointer"
                          title={`Investments Target: ${formatCurrency(investmentProjected, userCurrency)}`}
                        >
                          <span className="text-[8px] font-semibold text-slate-400 mb-1 select-none whitespace-nowrap">
                            {formatBarBadge(investmentProjected)}
                          </span>
                          <div
                            className="w-4 sm:w-5 bg-blue-200 rounded-t-sm transition-all duration-500 shadow-xs hover:brightness-95"
                            style={{ height: `${Math.max(4, Math.min(MAX_BAR_HEIGHT_PX, Math.round((investmentProjected / maxChartVal) * MAX_BAR_HEIGHT_PX)))}px` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-700 font-semibold mt-1 select-none truncate max-w-full">Invest</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Right Chart Card: Expense Breakdown */}
              <Card padding="sm" className="p-3 bg-white border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                      Expense Breakdown
                    </h3>
                  </div>

                  {/* Donut Chart with Center Total */}
                  <div className="py-2 flex items-center justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="transparent" stroke="#F1F5F9" strokeWidth="4.5" />
                        {categoryBreakdown.length > 0 && (() => {
                          const circumference = 2 * Math.PI * 14;
                          let accumulated = 0;
                          return categoryBreakdown.map((cat) => {
                            const segLength = (cat.percent / 100) * circumference;
                            const offset = (accumulated / 100) * circumference;
                            accumulated += cat.percent;
                            return (
                              <circle
                                key={cat.name}
                                cx="18"
                                cy="18"
                                r="14"
                                fill="transparent"
                                stroke={cat.color}
                                strokeWidth="4.5"
                                strokeDasharray={`${segLength} ${circumference}`}
                                strokeDashoffset={-offset}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
                        <span className="text-[9px] font-black text-slate-900 leading-tight truncate max-w-[60px]">
                          {formatCurrency(expenseActual, userCurrency)}
                        </span>
                        <span className="text-[8px] text-slate-500 font-medium">Total</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown Legend */}
                {categoryBreakdown.length > 0 ? (
                  <div className="space-y-1 pt-1 border-t border-slate-100 text-[10px]">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-slate-700">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-slate-500">{cat.percent}%</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(cat.amount, userCurrency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 text-center text-[10px] text-slate-400">
                    No expense categories recorded
                  </div>
                )}
              </Card>
            </div>

            {/* Category Summary Card with Table */}
            <Card padding="none" className="bg-white border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center text-brand-primary">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Target vs Actual Summary
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="text-xs font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded"
                >
                  View All
                </button>
              </div>

              <div className="p-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[11px] text-slate-500 font-semibold border-b border-slate-100 pb-2">
                      <th className="pb-2">Metric</th>
                      <th className="pb-2 text-right">Actual</th>
                      <th className="pb-2 text-right">Target</th>
                      <th className="pb-2 text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Row 1: Income */}
                    <tr>
                      <td className="py-2.5 flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                        <span>Income</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">
                        {formatCurrency(earnedActual, userCurrency)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatCurrency(earnedProjected, userCurrency)}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${earnedDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {earnedDiff >= 0 ? '+' : ''}{formatCurrency(earnedDiff, userCurrency)}
                      </td>
                    </tr>

                    {/* Row 2: Expenses */}
                    <tr>
                      <td className="py-2.5 flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        </span>
                        <span>Expenses</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">
                        {formatCurrency(expenseActual, userCurrency)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatCurrency(expenseProjected, userCurrency)}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${expenseDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {expenseDiff > 0 ? '+' : ''}{formatCurrency(expenseDiff, userCurrency)}
                      </td>
                    </tr>

                    {/* Row 3: Investments */}
                    <tr>
                      <td className="py-2.5 flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <PiggyBank className="w-3.5 h-3.5" />
                        </span>
                        <span>Investments</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">
                        {formatCurrency(investmentActual, userCurrency)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatCurrency(investmentProjected, userCurrency)}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${investmentDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {investmentDiff >= 0 ? '+' : ''}{formatCurrency(investmentDiff, userCurrency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Callout Banner */}
            {reportData?.callouts && reportData.callouts.length > 0 && (
              <div className="bg-[#ECFDF5] border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Target className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-emerald-950">
                    {reportData.callouts[0].title || 'Financial Assessment'}
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                    {reportData.callouts[0].message}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: YEAR IN REVIEW                                        */}
        {/* ============================================================ */}
        {activeTab === 'year' && (
          <div className="space-y-4">
            {/* Year Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 pl-1">
                Select Year
              </label>
              <Card padding="sm" className="flex items-center justify-between gap-3 bg-white border-slate-200">
                <div className="flex items-center gap-2 pl-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <Select
                    options={yearOptions}
                    value={selectedYear.toString()}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="py-1.5 text-xs font-medium border-0 focus:ring-0 text-slate-800 bg-transparent"
                  />
                </div>
              </Card>
            </div>

            {/* 3 Annual Metrics Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-700">Annual Income</span>
                <div className="mt-1 text-sm font-black text-emerald-700">
                  {formatCurrency(annualData?.totals?.totalIncome ?? 0, userCurrency)}
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  Avg: {formatCurrency(annualData?.averageMonthlyIncome ?? 0, userCurrency)}/mo
                </div>
              </div>

              <div className="bg-[#FEF2F2] border border-rose-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-700">Annual Outflow</span>
                <div className="mt-1 text-sm font-black text-rose-600">
                  {formatCurrency(annualData?.totals?.totalExpense ?? 0, userCurrency)}
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  Avg: {formatCurrency(annualData?.averageMonthlyExpense ?? 0, userCurrency)}/mo
                </div>
              </div>

              <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-700">Net Savings</span>
                <div className="mt-1 text-sm font-black text-brand-primary">
                  {formatCurrency(annualData?.totals?.netSavings ?? 0, userCurrency)}
                </div>
                <div className="mt-1 text-[10px] text-brand-primary font-bold">
                  Rate: {annualData?.totals?.savingsRate ?? 0}%
                </div>
              </div>
            </div>

            {/* 12-Month Bar Chart */}
            <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-slate-900">12-Month Performance ({selectedYear})</h3>
                </div>
                <span className="text-[11px] text-textMuted">
                  Best Month: <strong className="text-brand-primary">{annualData?.bestSavingsMonth || '—'}</strong>
                </span>
              </div>

              <div className="pt-2">
                <div className="h-32 flex items-end justify-between gap-1 border-b border-slate-100 pb-1">
                  {(annualData?.months || []).map((m: any) => {
                    const maxM = Math.max(...(annualData?.months || []).map((x: any) => Math.max(x.income, x.expense, 1)));
                    const incH = Math.round((m.income / maxM) * 100);
                    const expH = Math.round((m.expense / maxM) * 100);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center gap-0.5 h-24">
                          <div
                            className="w-1.5 bg-emerald-500 rounded-t-xs"
                            style={{ height: `${Math.max(2, incH)}%` }}
                            title={`Income: ${formatCurrency(m.income, userCurrency)}`}
                          />
                          <div
                            className="w-1.5 bg-rose-400 rounded-t-xs"
                            style={{ height: `${Math.max(2, expH)}%` }}
                            title={`Expense: ${formatCurrency(m.expense, userCurrency)}`}
                          />
                        </div>
                        <span className="text-[8px] text-slate-500 font-medium">{m.monthName.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Income</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-slate-600">Expenses</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Categories Card */}
            <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-slate-900">Top Expense Categories ({selectedYear})</h3>
              </div>

              {(annualData?.topExpenseCategories || []).length > 0 ? (
                <div className="space-y-2 pt-1">
                  {annualData.topExpenseCategories.map((c: any, idx: number) => (
                    <div key={c.categoryName} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                        <span className="font-semibold text-slate-800">{c.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatCurrency(c.totalAmount, userCurrency)}</span>
                        <span className="text-[11px] text-slate-500">({c.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No expense category records for {selectedYear}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: CUSTOM RANGE REPORT                                   */}
        {/* ============================================================ */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            {/* Date Pickers */}
            <Card padding="sm" className="p-3 bg-white border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Select Date Range</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  label="From Date"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  icon={<Calendar className="w-4 h-4 text-slate-400" />}
                />
                <Input
                  label="To Date"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  icon={<Calendar className="w-4 h-4 text-slate-400" />}
                />
              </div>
            </Card>

            {/* 3 Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-700">Income</span>
                <div className="mt-1 text-sm font-black text-emerald-700">
                  {formatCurrency(customData?.totals?.totalIncome ?? 0, userCurrency)}
                </div>
              </div>

              <div className="bg-[#FEF2F2] border border-rose-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-700">Outflow</span>
                <div className="mt-1 text-sm font-black text-rose-600">
                  {formatCurrency(customData?.totals?.totalExpense ?? 0, userCurrency)}
                </div>
              </div>

              <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-700">Net Savings</span>
                <div className="mt-1 text-sm font-black text-brand-primary">
                  {formatCurrency(customData?.totals?.netSavings ?? 0, userCurrency)}
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <Card padding="none" className="bg-white border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Period Category Breakdown</h3>
                <span className="text-[11px] text-textMuted">
                  {customData?.totals?.transactionCount ?? 0} transactions
                </span>
              </div>

              {(customData?.categorySummary || []).length > 0 ? (
                <div className="p-3 divide-y divide-slate-100">
                  {customData.categorySummary.map((c: any, idx: number) => (
                    <div key={`${c.type}-${c.categoryName}`} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            c.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.type}
                        </span>
                        <span className="font-semibold text-slate-800">{c.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatCurrency(c.totalAmount, userCurrency)}</span>
                        <span className="text-[11px] text-slate-500">({c.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No transaction records found within this date range
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
