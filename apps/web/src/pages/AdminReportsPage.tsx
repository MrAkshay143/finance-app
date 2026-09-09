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
  CheckCircle2,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { apiClient } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency } from '@finance/shared-ui-tokens';
import type { PlatformAnalyticsData, SystemHealthData } from '@finance/shared-types';

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Fetch Platform Analytics
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
    isRefetching: isAnalyticsRefetching,
  } = useQuery<PlatformAnalyticsData>({
    queryKey: ['admin-platform-analytics'],
    queryFn: async () => {
      const res = await apiClient.admin.getPlatformAnalytics();
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
      setExportSuccess(false);
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
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export CSV report', err);
    } finally {
      setIsExporting(false);
    }
  };

  const summary = analyticsData?.summary;
  const funnel = analyticsData?.funnel;

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                refetchAnalytics();
                refetchHealth();
              }}
              aria-label="Refresh platform reports"
              title="Refresh reports"
              className="p-1.5 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors"
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
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-brand-primary bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
            >
              <ArrowLeftFromLine className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4 max-w-[430px] mx-auto w-full">
        {/* 2. Platform KPI Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Users
              </span>
              <Users className="w-4 h-4 text-brand-primary" />
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {summary?.totalUsers ?? 0}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  {summary?.activeUsers ?? 0} active · {summary?.suspendedUsers ?? 0} suspended
                </p>
              </div>
            )}
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Platform GTV
              </span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency((summary?.grossTransactionVolumePaise ?? 0) / 100, 'INR')}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {summary?.totalTransactionsCount ?? 0} transactions
                </p>
              </div>
            )}
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Managed Balances
              </span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency((summary?.totalSystemBalancePaise ?? 0) / 100, 'INR')}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Across all active accounts
                </p>
              </div>
            )}
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                User Activity
              </span>
              <BarChart2 className="w-4 h-4 text-indigo-600" />
            </div>
            {isAnalyticsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {summary?.avgTransactionsPerUser ?? 0}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Avg txns per user
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* 3. Onboarding & Security Funnel */}
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
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
                  <span>3. Security Questions (KBA)</span>
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

        {/* 4. Institutional CSV Export */}
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Directory Export</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate full compliance CSV report with balances, KBA status, and dates.
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-primary text-white font-semibold rounded-xl text-xs hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Report...' : 'Export User Directory (CSV)'}</span>
            </Button>
          </div>

          {exportSuccess && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Report generated and download initiated.</span>
            </div>
          )}
        </Card>

        {/* 5. System Health & Telemetry */}
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
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
