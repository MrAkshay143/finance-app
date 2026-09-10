import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  Calendar,
  Sparkles,
  BarChart3,
  TrendingUp,
  LineChart,
  Lightbulb,
  Info,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Select } from '../components/ui/Select.js';
import { formatCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { apiClient } from '../services/apiClient.js';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import type { AiAnalysisResponse } from '@finance/shared-types';

export const AiAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useSafeQueryClient();
  const { currency: userCurrency } = useUserCurrency();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthOptions = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { value: val, label };
    });
  }, []);

  const { data: aiData, isLoading, refetch, isFetching } = useQuery<AiAnalysisResponse>({
    queryKey: ['ai-analysis', selectedMonth],
    queryFn: async () => {
      return await apiClient.aiAnalysis.get(selectedMonth);
    },
  }, queryClient);

  // Defaults derived from real server response
  const analysis = aiData?.monthlyAnalysis;
  const earned = analysis?.earned ?? 0;
  const spent = analysis?.spent ?? 0;
  const invested = analysis?.invested ?? 0;
  const netSavings = analysis?.netSavings ?? 0;
  const needsRatio = analysis?.needsRatio ?? 0;
  const investmentRatio = analysis?.investmentRatio ?? 0;
  const savingsRate = analysis?.savingsRate ?? 0;
  const wantsRatio = analysis ? Math.max(0, 100 - needsRatio - investmentRatio) : 0;

  const forwardProjections = aiData?.forwardProjections || [];

  const suggestions = aiData?.suggestions || [];

  const monthLabel =
    aiData?.monthLabel ||
    (() => {
      const [y, m] = selectedMonth.split('-').map(Number);
      if (y && m) {
        const d = new Date(y, m - 1, 1);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      return 'Current Month';
    })();

  const handleSuggestionAction = (actionType?: string) => {
    if (actionType === 'CREATE_RECURRING_INVESTMENT' || actionType === 'PORTFOLIO_REVIEW') {
      navigate('/investments');
    } else if (actionType === 'BUDGET_ADJUSTMENT' || actionType === 'ALLOCATE_TO_GOAL') {
      navigate('/planning');
    } else {
      navigate('/transactions');
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Branded Dark Navy Header */}
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle="Financial Intelligence"
      />

      <div className="p-4 space-y-4">
        {/* Subheader: Back Chevron, Title, Subtitle, and Financial Intelligence Status Chip */}
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                AI Analysis
              </h1>
              <p className="text-xs text-textMuted leading-tight mt-0.5">
                Get AI-powered insights for a smarter financial future
              </p>
            </div>
          </div>

          {/* Right Status Chip: Financial Intelligence */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
            <span>Financial Intelligence</span>
          </div>
        </div>

        {/* Month Selector Card + Analyse Action Button */}
        <Card padding="sm" className="bg-white border-slate-200 shadow-sm p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Select Month
              </span>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <Select
                  options={monthOptions}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="py-1 text-xs font-semibold text-slate-800 border-0 bg-transparent focus:ring-0"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-all shadow-md shadow-brand-primary/20 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Analyse</span>
            </button>
          </div>
        </Card>

        {/* Monthly Analysis Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-brand-primary">
                <BarChart3 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Monthly Analysis: {monthLabel}
              </h3>
            </div>
            <Badge variant="success" size="sm">
              Evaluated
            </Badge>
          </div>

          {/* Allocation Breakdown 4-Metric Grid */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Fixed Needs</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">{needsRatio}%</span>
              <span className="text-[9px] text-slate-400">Target: 50%</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Wants</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">{wantsRatio}%</span>
              <span className="text-[9px] text-slate-400">Target: 30%</span>
            </div>
            <div className="bg-purple-50 rounded-xl p-2 border border-purple-100">
              <span className="text-[10px] text-purple-700 font-medium block">Invested</span>
              <span className="text-sm font-black text-purple-800 block mt-0.5">{investmentRatio}%</span>
              <span className="text-[9px] text-purple-600">Target: 20%</span>
            </div>
            <div className="bg-blue-50 rounded-xl p-2 border border-blue-100">
              <span className="text-[10px] text-brand-primary font-medium block">Savings Rate</span>
              <span className="text-sm font-black text-brand-primary block mt-0.5">{savingsRate}%</span>
              <span className="text-[9px] text-blue-600">Surplus</span>
            </div>
          </div>

          {/* Detailed Financial Breakdown & Ratio Evaluation */}
          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800">
              {aiData?.summaryNote ||
                `Analysis for ${monthLabel}: Income realized at ${formatCurrency(earned, userCurrency)} with ${formatCurrency(spent, userCurrency)} in expenses and ${formatCurrency(invested, userCurrency)} deployed into investments. Net monthly savings rate is ${savingsRate}%.`}
            </p>
            {earned === 0 && spent === 0 && invested === 0 ? (
              <p className="text-slate-500 italic text-[11px]">
                No financial transactions recorded for {monthLabel}. Record income or expenses to generate detailed ratio evaluations.
              </p>
            ) : (
              <ul className="space-y-1.5 pl-4 list-disc text-[11px] text-slate-600">
                <li>
                  <strong>Needs discipline:</strong> Spending sits at {needsRatio}% of earned income, {needsRatio <= 50 ? 'comfortably within' : 'above'} the 50% benchmark.
                </li>
                <li>
                  <strong>Wealth accumulation:</strong> Systematic investments accounted for {formatCurrency(invested, userCurrency)} ({investmentRatio}% of income).
                </li>
                <li>
                  <strong>Liquidity buffer:</strong> Unallocated monthly surplus of {formatCurrency(netSavings, userCurrency)} remains accessible in primary checking and savings accounts.
                </li>
              </ul>
            )}
          </div>
        </Card>

        {/* Forward Projection Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-semantic-investment">
                <LineChart className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Forward Projection
              </h3>
            </div>
            <Badge variant="investment" size="sm">
              Projected
            </Badge>
          </div>

          <p className="text-[11px] text-slate-500 leading-snug">
            Projections based on monthly surplus and {forwardProjections[0]?.assumedAnnualReturnRate ? `${forwardProjections[0].assumedAnnualReturnRate * 100}%` : '8%'} annual return.
          </p>

          {/* 3-Column Projection Horizon Cards or Clean Empty State */}
          {forwardProjections.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Insufficient transaction history to calculate forward wealth projections. Record savings or investments to generate AI forecasts.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {forwardProjections.map((proj) => {
                const maxWealth = forwardProjections[forwardProjections.length - 1]?.projectedWealth || 1;
                const barPercent = Math.min(100, Math.round((proj.projectedWealth / maxWealth) * 100));
                return (
                  <div
                    key={proj.label}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between text-center"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">
                        {proj.label}
                      </span>
                      <div className="mt-1.5">
                        <span className="text-[9px] text-slate-400 block">Wealth Growth</span>
                        <span className="text-xs font-black text-slate-900 block mt-0.5">
                          {formatCurrency(proj.projectedWealth, userCurrency)}
                        </span>
                      </div>
                    </div>

                    <div className="py-2 flex justify-center items-end h-16">
                      <div
                        className="w-5 bg-gradient-to-t from-brand-primary to-purple-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(20, barPercent)}%` }}
                      />
                    </div>

                    <div className="border-t border-slate-200/70 pt-1 text-[9px] text-slate-500">
                      Savings: {formatCurrency(proj.projectedSavings, userCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Suggestions Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Lightbulb className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Personalized Recommendations
            </h3>
          </div>

          {suggestions.length > 0 ? (
            <div className="space-y-2.5">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View recommendation: ${sug.title}`}
                  onClick={() => handleSuggestionAction(sug.actionType)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSuggestionAction(sug.actionType);
                    }
                  }}
                  className="bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-3 flex items-start justify-between gap-3 cursor-pointer transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          sug.priority === 'HIGH'
                            ? 'bg-rose-100 text-rose-700'
                            : sug.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {sug.priority} PRIORITY
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {sug.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {sug.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4">
              No specific recommendations yet. Record regular expenses and income to unlock tailored insights.
            </div>
          )}
        </Card>

        {/* How it works? Card */}
        <Card padding="md" className="bg-blue-50/40 border-blue-200/60 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-brand-primary">
              <Info className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              How it works?
            </h3>
          </div>

          <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
            <p>
              <strong>1. 50/30/20 Allocation Benchmark:</strong> Benchmarked against 50% needs, 30% wants, and 20% savings.
            </p>
            <p>
              <strong>2. Algorithmic Cash Flow Analysis:</strong> Transactions across accounts are classified to track spending discipline.
            </p>
            <p>
              <strong>3. Compounded Growth Projections:</strong> Wealth horizons calculate value from surplus compounding at 8% annually.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
