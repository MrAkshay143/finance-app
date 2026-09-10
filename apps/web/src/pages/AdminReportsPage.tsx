import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  Users,
  ShieldCheck,
  CreditCard,
  Download,
  Activity,
  Server,
  Database,
  Clock,
  LogOut,
  ArrowLeftFromLine,
  RefreshCw,
  TrendingUp,
  PieChart,
  Wallet,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { formatCurrency } from '@finance/shared-ui-tokens';
import type { PlatformAnalyticsData, SystemHealthData } from '@finance/shared-types';

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { currency } = useUserCurrency();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Platform Analytics with dynamic timeframe
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
    isRefetching: isAnalyticsRefetching,
  } = useQuery<PlatformAnalyticsData>({
    queryKey: ['admin-platform-analytics', timeframe],
    queryFn: async () => {
      const res = await apiClient.admin.getPlatformAnalytics({ timeframe });
      return (res as any)?.data || res;
    },
  });

  // Fetch System Health
  const {
    data: healthData,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
    isRefetching: isHealthRefetching,
  } = useQuery<SystemHealthData>({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const res = await apiClient.admin.getSystemHealth();
      return (res as any)?.data || res;
    },
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await apiClient.admin.exportUsersCsv();
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `institutional_users_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('User directory CSV exported successfully');
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err, 'Failed to export CSV report'));
    } finally {
      setIsExporting(false);
    }
  };

  const summary = analyticsData?.summary;
  const funnel = analyticsData?.funnel;
  const transactionDistribution = analyticsData?.transactionDistribution || [];
  const topSpendingCategories = analyticsData?.topSpendingCategories || [];
  const liquidityBreakdown = analyticsData?.liquidityBreakdown || [];

  const totalTxnVolume = transactionDistribution.reduce((acc, t) => acc + t.volumePaise, 0);

  return (
    <div className="flex-1 flex flex-col bg-[#F3F6FC] pb-12">
      {/* 1. Branded Admin Header */}
      <AppHeader
        variant="nested"
        title="Platform Reports"
        subtitle="User progression, volume & telemetry"
        backTo="/admin"
        showNotifications={false}
        showAvatar={false}
        rightAction={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                refetchAnalytics();
                refetchHealth();
              }}
              aria-label="Refresh platform reports"
              title="Refresh reports"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isAnalyticsRefetching || isHealthRefetching ? 'animate-spin text-brand-primary' : ''
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Exit to personal mode"
              title="Exit to personal mode"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 whitespace-nowrap shrink-0"
            >
              <ArrowLeftFromLine className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Exit Admin</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 shrink-0"
              aria-label="Log Out"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-3 space-y-4 max-w-[430px] mx-auto w-full">
        {/* Compact Toolbar: Timeframe Selector + Compact CSV Export */}
        <div className="flex items-center justify-between gap-2 p-1.5 bg-white border border-borderDefault rounded-2xl shadow-card">
          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
            {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase transition-colors whitespace-nowrap shrink-0 ${
                  timeframe === tf
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-textMuted hover:text-textDefault'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Compact Export CSV Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting}
            isLoading={isExporting}
            onClick={handleExportCsv}
            icon={<Download className={`w-3.5 h-3.5 shrink-0 ${isExporting ? 'animate-bounce text-brand-primary' : ''}`} />}
            className="whitespace-nowrap shrink-0 font-semibold min-h-[32px] px-2.5"
          >
            Export CSV
          </Button>
        </div>

        {/* 2. Platform KPI Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Users */}
          <div className="p-3.5 rounded-2xl border border-borderDefault/80 bg-white shadow-card transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                Total Users
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div>
                <p className="text-2xl font-black text-textDefault tracking-tight">
                  {summary?.totalUsers ?? 0}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {summary?.activeUsers ?? 0} active
                  </span>
                  {(summary?.suspendedUsers ?? 0) > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                      {summary?.suspendedUsers} suspended
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Platform GTV */}
          <div className="p-3.5 rounded-2xl border border-borderDefault/80 bg-white shadow-card transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                Platform GTV ({timeframe.toUpperCase()})
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <p className="text-2xl font-black text-textDefault tracking-tight">
                  {formatCurrency((summary?.grossTransactionVolumePaise ?? 0) / 100, currency)}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {summary?.totalTransactionsCount ?? 0} txns
                  </span>
                  <span className="text-[10px] text-textMuted font-medium">recorded</span>
                </div>
              </div>
            )}
          </div>

          {/* Managed Balances */}
          <div className="p-3.5 rounded-2xl border border-borderDefault/80 bg-white shadow-card transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                Managed Balances
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <p className="text-2xl font-black text-textDefault tracking-tight">
                  {formatCurrency((summary?.totalSystemBalancePaise ?? 0) / 100, currency)}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Live Pool
                  </span>
                  <span className="text-[10px] text-textMuted font-medium">all accounts</span>
                </div>
              </div>
            )}
          </div>

          {/* Activity Index */}
          <div className="p-3.5 rounded-2xl border border-borderDefault/80 bg-white shadow-card transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                Activity Index
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div>
                <p className="text-2xl font-black text-textDefault tracking-tight">
                  {summary?.avgTransactionsPerUser ?? 0}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    Txns / User
                  </span>
                  <span className="text-[10px] text-textMuted font-medium">avg velocity</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Transaction Breakdown by Type */}
        <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-primary" />
              <h3 className="text-sm font-bold text-slate-900">Transaction Distribution</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-brand-primary rounded-full">
              {timeframe.toUpperCase()} Breakdown
            </span>
          </div>

          {isAnalyticsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : transactionDistribution.length === 0 ? (
            <p className="text-xs text-textMuted text-center py-3">
              No transactions recorded in this timeframe.
            </p>
          ) : (
            <div className="space-y-2.5">
              {transactionDistribution.map((item) => {
                const percentage =
                  totalTxnVolume > 0
                    ? Math.round((item.volumePaise / totalTxnVolume) * 100)
                    : 0;

                let badgeColor = 'bg-slate-100 text-slate-700';
                let barColor = 'bg-slate-500';
                if (item.type === 'INCOME') {
                  badgeColor = 'bg-emerald-50 text-emerald-700';
                  barColor = 'bg-emerald-500';
                } else if (item.type === 'EXPENSE') {
                  badgeColor = 'bg-rose-50 text-rose-700';
                  barColor = 'bg-rose-500';
                } else if (item.type === 'TRANSFER') {
                  badgeColor = 'bg-blue-50 text-blue-700';
                  barColor = 'bg-blue-500';
                } else if (item.type === 'INVESTMENT') {
                  badgeColor = 'bg-purple-50 text-purple-700';
                  barColor = 'bg-purple-500';
                }

                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeColor}`}>
                          {item.type}
                        </span>
                        <span className="text-textMuted font-normal text-[11px]">
                          ({item.count} txns)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-textDefault">
                          {formatCurrency(item.volumePaise / 100, currency)}
                        </span>
                        <span className="text-textMuted text-[10px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 4. Top Spending Categories & Liquidity Breakdown */}
        <div className="grid grid-cols-1 gap-3">
          {/* Top Spending Categories */}
          <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Top Spending Categories</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {timeframe.toUpperCase()}
              </span>
            </div>

            {isAnalyticsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : topSpendingCategories.length === 0 ? (
              <p className="text-xs text-textMuted text-center py-3">
                No categorized expenses in this timeframe.
              </p>
            ) : (
              <div className="space-y-2">
                {topSpendingCategories.map((cat, idx) => (
                  <div key={cat.categoryName} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-textMuted font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-textDefault truncate">
                        {cat.categoryName}
                      </span>
                      <span className="text-[10px] text-textMuted">({cat.count} txns)</span>
                    </div>
                    <span className="font-bold text-semantic-danger shrink-0">
                      {formatCurrency(cat.volumePaise / 100, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* System Liquidity by Account Type */}
          <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">System Liquidity Breakdown</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Live
              </span>
            </div>

            {isAnalyticsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : liquidityBreakdown.length === 0 ? (
              <p className="text-xs text-textMuted text-center py-3">
                No active accounts registered.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {liquidityBreakdown.map((liq) => (
                  <div key={liq.accountType} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {liq.accountType}
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {formatCurrency(liq.balancePaise / 100, currency)}
                    </div>
                    <div className="text-[10px] text-textMuted mt-0.5">
                      {liq.count} account{liq.count === 1 ? '' : 's'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 5. Onboarding & Security Funnel */}
        <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Progression Funnel</h3>
              <p className="text-xs text-slate-500">Registration to account funding</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-brand-primary rounded-md">
              Lifecycle
            </span>
          </div>

          {isAnalyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Step 1: Registered */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>1. Registered Users</span>
                  <span>{funnel?.totalRegistered ?? 0} (100%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Step 2: Onboarded */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>2. Profile Onboarded</span>
                  <span>
                    {funnel?.onboardedCount ?? 0} ({funnel?.onboardedPercentage ?? 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${funnel?.onboardedPercentage ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Step 3: KBA Secured */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>3. Security Questions</span>
                  <span>
                    {funnel?.kbaConfiguredCount ?? 0} ({funnel?.kbaPercentage ?? 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${funnel?.kbaPercentage ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Step 4: Accounts Linked */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>4. Accounts Linked</span>
                  <span>
                    {funnel?.accountsLinkedCount ?? 0} ({funnel?.accountsLinkedPercentage ?? 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${funnel?.accountsLinkedPercentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 6. System Health & Telemetry */}
        <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">System Telemetry</h3>
            </div>
            {isHealthLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {healthData?.status ?? 'HEALTHY'}
              </span>
            )}
          </div>

          {isHealthLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <Database className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[11px]">DB Latency</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {healthData?.database.latencyMs ?? 0} ms
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[11px]">Uptime</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {Math.floor((healthData?.uptimeSeconds ?? 0) / 3600)}h{' '}
                  {Math.floor(((healthData?.uptimeSeconds ?? 0) % 3600) / 60)}m
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[11px]">Heap Memory</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {healthData?.memory.heapUsedMB ?? 0} / {healthData?.memory.heapTotalMB ?? 0} MB
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <Server className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[11px]">Total Audit Logs</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {healthData?.tableCounts.auditLogs ?? 0}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminReportsPage;

