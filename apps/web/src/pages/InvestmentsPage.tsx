import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  PiggyBank,
  TrendingUp,
  PieChart,
  Calendar,
  Layers,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { formatCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { formatDate } from '../utils/date.js';
import { apiClient } from '../services/apiClient.js';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import { useUiStore } from '../store/uiStore.js';
import type { InvestmentsOverviewResponse } from '@finance/shared-types';

export const InvestmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useSafeQueryClient();
  const { currency: userCurrency } = useUserCurrency();
  const openAddModal = useUiStore((state) => state.openAddModal);
  const openEditModal = useUiStore((state) => state.openEditModal);

  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data: investmentsData, isLoading } = useQuery<InvestmentsOverviewResponse>({
    queryKey: ['investments'],
    queryFn: async () => {
      return await apiClient.investments.getOverview();
    },
  }, queryClient);

  const totalInvested = investmentsData?.totalInvested ?? 0;
  const monthlyInvested = investmentsData?.monthlyInvested ?? 0;
  const targetComparison = investmentsData?.targetComparison;
  const targetAmount = targetComparison?.target ?? 0;
  const percentageAchieved = targetComparison?.percentageAchieved ?? 0;

  const categoryBreakdown = investmentsData?.categoryBreakdown || [];
  const recentInvestments = investmentsData?.recentInvestments || [];
  const monthlyTrend = investmentsData?.monthlyTrend || [];

  const categoryColors: Record<string, string> = {
    'Mutual Funds': '#7C4DE0',
    'Stocks & Equity': '#2554EE',
    'Fixed Deposit': '#10B981',
    'Gold & Precious Metals': '#F59E0B',
    'Real Estate': '#0D9488',
    'Bonds & Debt': '#EC4899',
    'Other Investments': '#64748B',
  };

  const filteredInvestments = filterCategory === 'all'
    ? recentInvestments
    : recentInvestments.filter((item: any) => item.category?.name === filterCategory || item.categoryName === filterCategory);

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Branded Dark Navy Header */}
      <AppHeader
        variant="nested"
        title="Investments"
        subtitle="Portfolio & Wealth Accumulation"
        rightAction={
          <Button
            variant="primary"
            size="sm"
            onClick={() => openAddModal('investment')}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Add
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Total Invested Hero Card */}
        <div className="bg-gradient-to-tr from-[#1E1B4B] via-[#2E1065] to-[#4338CA] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-purple-200">
                <PiggyBank className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-purple-200">
                Total Portfolio Value
              </span>
            </div>
            <Badge variant="investment" size="sm">
              ACTIVE WEALTH
            </Badge>
          </div>

          <div className="mt-3">
            <h2 className="text-3xl font-black text-white tracking-tight">
              {formatCurrency(totalInvested, userCurrency)}
            </h2>
            <p className="text-xs text-purple-200/80 mt-1">
              Total deposits across all accounts
            </p>
          </div>
        </div>

        {/* Current Month Investment vs Target Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-semantic-investment">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Monthly Target Progress
              </h3>
            </div>
            <span className="text-xs font-black text-semantic-investment">
              {percentageAchieved}% Achieved
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs">
            <div className="text-slate-600 font-medium">
              Invested this month:{' '}
              <strong className="text-slate-900 font-bold">
                {formatCurrency(monthlyInvested, userCurrency)}
              </strong>
            </div>
            <div className="text-slate-500">
              Target: {formatCurrency(targetAmount, userCurrency)}
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-semantic-investment transition-all duration-500"
              style={{ width: `${Math.min(100, percentageAchieved)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              {percentageAchieved >= 100
                ? 'Target achieved for this cycle!'
                : `${formatCurrency(Math.max(0, targetAmount - monthlyInvested), userCurrency)} remaining to target`}
            </span>
            <button
              type="button"
              onClick={() => navigate('/profile/settings')}
              className="text-brand-primary font-semibold hover:underline"
            >
              Adjust Target
            </button>
          </div>
        </Card>

        {/* Category Breakdown Card */}
        <Card padding="md" className="bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-brand-primary">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Asset Allocation
              </h3>
            </div>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="space-y-3 pt-1">
              {categoryBreakdown.map((cat) => {
                const color = categoryColors[cat.categoryName] || '#7C4DE0';
                return (
                  <div key={cat.categoryId || cat.categoryName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span>{cat.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatCurrency(cat.totalAmount, userCurrency)}</span>
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
            <div className="text-center py-4 text-xs text-slate-500">
              No investment categories recorded yet.
            </div>
          )}
        </Card>

        {/* Recent Investments Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Investments
            </h3>
            <button
              type="button"
              onClick={() => openAddModal('investment')}
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Investment</span>
            </button>
          </div>

          {filteredInvestments.length > 0 ? (
            <div className="space-y-2">
              {filteredInvestments.map((inv: any) => (
                <div
                  key={inv.id}
                  onClick={() => openEditModal('investment', {
                    id: inv.id,
                    amount: inv.amount,
                    type: 'investment',
                    accountId: inv.accountId,
                    description: inv.description,
                    merchant: inv.merchant?.name || inv.merchant,
                    date: inv.txnDate || inv.date,
                  })}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between hover:border-purple-300 transition-colors cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-semantic-investment flex items-center justify-center shrink-0">
                      <PiggyBank className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {inv.description || inv.category?.name || 'Investment'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {inv.account?.name || 'Investment Account'} • {inv.txnDate ? formatDate(inv.txnDate) : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-semantic-investment">
                      {formatCurrency(inv.amount, userCurrency)}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Edit</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card padding="lg" className="text-center bg-white border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-semantic-investment mx-auto mb-2">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No investment records yet</h4>
              <p className="text-[11px] text-slate-500 mt-1 mb-3">
                Track your mutual funds, equity SIPs, and fixed deposits.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAddModal('investment')}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Investment
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
