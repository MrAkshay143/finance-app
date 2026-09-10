import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Clock,
  Lock,
  Info,
  Check,
  Minus,
  Plus,
  X,
  LogOut,
  ArrowLeftFromLine,
  Shield,
  Globe,
  Mail,
  AlertTriangle,
  Database,
  RefreshCw,
  Download,
  Trash2,
  KeyRound,
  DollarSign,
  BarChart3,
  Tag,
  Layers,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { Modal } from '../components/ui/Modal.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import type { AppSettings, UpdateAppSettingsInput } from '@finance/shared-types';
import { COUNTRIES } from '@finance/shared-types';
import { SUPPORTED_CURRENCIES } from '@finance/shared-ui-tokens';
import { toast } from '../store/toastStore.js';

export const AdminAppSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // General Platform State
  const [platformName, setPlatformName] = useState<string>('Finance Tracker');
  const [supportEmail, setSupportEmail] = useState<string>('support@imakshay.in');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(
    'Platform is currently undergoing scheduled maintenance. Please try again shortly.'
  );
  const [allowUserRegistration, setAllowUserRegistration] = useState<boolean>(true);

  // Security Policies State
  const [sessionTimeout, setSessionTimeout] = useState<number>(60);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState<number>(5);
  const [lockoutDuration, setLockoutDuration] = useState<number>(15);
  const [passwordMinLength, setPasswordMinLength] = useState<number>(8);
  const [requireKba, setRequireKba] = useState<boolean>(true);

  // Financial Defaults State
  const [defaultCountry, setDefaultCountry] = useState<string>('IN');
  const [defaultCurrency, setDefaultCurrency] = useState<string>('INR');
  const [defaultBudgetPeriod, setDefaultBudgetPeriod] = useState<'MONTHLY' | 'WEEKLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [famExpenseThreshold, setFamExpenseThreshold] = useState<number>(80);
  const [famInvestmentThreshold, setFamInvestmentThreshold] = useState<number>(100);
  const [famIncomeThreshold, setFamIncomeThreshold] = useState<number>(100);

  // Maintenance Dialog State
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);
  const [purgeRetentionDays, setPurgeRetentionDays] = useState<number>(90);

  // Fetch app settings
  const { data: settingsData, isLoading } = useQuery<AppSettings>({
    queryKey: ['admin-app-settings'],
    queryFn: async () => {
      const res = await apiClient.admin.getAppSettings();
      return (res as any)?.data || res;
    },
  });

  const hasLoadedSettingsRef = useRef(false);

  useEffect(() => {
    if (settingsData && !hasLoadedSettingsRef.current) {
      if (settingsData.platformName) setPlatformName(settingsData.platformName);
      if (settingsData.supportEmail) setSupportEmail(settingsData.supportEmail);
      if (settingsData.maintenanceMode !== undefined) setMaintenanceMode(settingsData.maintenanceMode);
      if (settingsData.maintenanceMessage !== undefined) setMaintenanceMessage(settingsData.maintenanceMessage);
      if (settingsData.allowUserRegistration !== undefined) setAllowUserRegistration(settingsData.allowUserRegistration);

      if (settingsData.sessionTimeoutMinutes) setSessionTimeout(settingsData.sessionTimeoutMinutes);
      if (settingsData.maxFailedAttempts || settingsData.maxFailedLoginAttempts) {
        setMaxFailedAttempts(settingsData.maxFailedAttempts || settingsData.maxFailedLoginAttempts || 5);
      }
      if (settingsData.lockoutDurationMinutes) setLockoutDuration(settingsData.lockoutDurationMinutes);
      if (settingsData.passwordMinLength) setPasswordMinLength(settingsData.passwordMinLength);
      if (settingsData.requireKbaForSensitiveActions !== undefined) {
        setRequireKba(settingsData.requireKbaForSensitiveActions);
      }

      if (settingsData.defaultCountry) setDefaultCountry(settingsData.defaultCountry);
      if (settingsData.defaultBaseCurrency) setDefaultCurrency(settingsData.defaultBaseCurrency);
      if (settingsData.defaultBudgetPeriod) setDefaultBudgetPeriod(settingsData.defaultBudgetPeriod);
      if (settingsData.famExpenseThresholdPercent) setFamExpenseThreshold(settingsData.famExpenseThresholdPercent);
      if (settingsData.famInvestmentThresholdPercent) setFamInvestmentThreshold(settingsData.famInvestmentThresholdPercent);
      if (settingsData.famIncomeThresholdPercent) setFamIncomeThreshold(settingsData.famIncomeThresholdPercent);
      hasLoadedSettingsRef.current = true;
    }
  }, [settingsData]);

  // Mutation to update app settings
  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateAppSettingsInput) => {
      return await apiClient.admin.updateAppSettings(payload);
    },
    onSuccess: () => {
      hasLoadedSettingsRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['admin-app-settings'] });
      toast.success('Settings saved');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to update settings'));
    },
  });

  // Maintenance mutations
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.admin.clearCache();
    },
    onSuccess: () => {
      toast.success('System cache cleared');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to clear cache'));
    },
  });

  const runRecurringMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.admin.runRecurringTransactions();
    },
    onSuccess: () => {
      toast.success('Recurring payments processed');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to run recurring transactions'));
    },
  });

  const exportAuditMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.admin.exportAuditLogsCsv();
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_audit_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Audit logs exported');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to export audit logs'));
    },
  });

  const purgeAuditMutation = useMutation({
    mutationFn: async (days: number) => {
      return await apiClient.admin.purgeAuditLogs(days);
    },
    onSuccess: (res: any) => {
      setIsPurgeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      toast.success(res?.purgedCount ? `Purged ${res.purgedCount} audit logs` : 'Audit logs purged');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to purge audit logs'));
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      platformName,
      supportEmail,
      maintenanceMode,
      maintenanceMessage,
      allowUserRegistration,
      sessionTimeoutMinutes: sessionTimeout,
      maxFailedAttempts,
      maxFailedLoginAttempts: maxFailedAttempts,
      lockoutDurationMinutes: lockoutDuration,
      passwordMinLength,
      requireKbaForSensitiveActions: requireKba,
      defaultCountry,
      defaultBaseCurrency: defaultCurrency,
      defaultBudgetPeriod,
      famExpenseThresholdPercent: famExpenseThreshold,
      famInvestmentThresholdPercent: famInvestmentThreshold,
      famIncomeThresholdPercent: famIncomeThreshold,
    });
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <AppHeader
        variant="nested"
        title="Platform Settings"
        subtitle="Platform policies, timeouts & controls"
        backTo="/admin"
        rightAction={
          <div className="flex items-center gap-1.5">
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

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Admin Profile Hero Card */}
            <div className="bg-white border border-borderDefault rounded-2xl shadow-card p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-textDefault truncate">{user?.fullName || 'Administrator'}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                      {user?.role === 'ADMIN' ? 'System Admin' : 'User'}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted truncate mt-0.5">{user?.email || 'admin@imakshay.in'}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/profile')}
                icon={<UserCheck className="w-3.5 h-3.5 shrink-0" />}
                className="whitespace-nowrap shrink-0"
              >
                My Profile
              </Button>
            </div>

            {/* Card 1: App Settings (General Platform) */}
            <div className="bg-white border border-borderDefault rounded-2xl shadow-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-textDefault leading-tight">App Settings</h2>
                    <p className="text-xs text-textMuted mt-0.5 leading-tight">
                      Configure security settings for all users.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  aria-label="Close app settings"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3.5">
                {/* Platform Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-textDefault">Platform Name</label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    placeholder="Finance Tracker"
                    className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                {/* Support Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-textDefault">Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@finance.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                {/* Allow User Registration Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-borderDefault/80 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-textDefault">Allow User Registration</h3>
                    <p className="text-[11px] text-textMuted mt-0.5">Enable new signups on login page</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowUserRegistration}
                    onClick={() => setAllowUserRegistration((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      allowUserRegistration ? 'bg-brand-primary' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        allowUserRegistration ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-rose-50/60 border border-rose-200/60 rounded-2xl">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-rose-900">Maintenance Mode</h3>
                      <p className="text-[11px] text-rose-700/80 mt-0.5">
                        Temporarily restrict access for non-admin users
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={maintenanceMode}
                    onClick={() => setMaintenanceMode((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      maintenanceMode ? 'bg-rose-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Custom Maintenance Notice */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-textDefault">Custom Maintenance Notice</label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Platform is currently undergoing scheduled maintenance. Please try again shortly."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
                  />
                  <p className="text-[11px] text-textMuted">
                    Displayed dynamically on the maintenance screen to non-admin users.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Security Policies */}
            <div className="bg-white border border-borderDefault rounded-2xl shadow-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-textDefault leading-tight">Security Policies</h2>
                  <p className="text-xs text-textMuted mt-0.5 leading-tight">
                    Lockout limits, password rules & session timeout
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Session Timeout */}
                <div className="bg-slate-50 border border-borderDefault/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-textDefault">Session timeout</h3>
                      <p className="text-[11px] text-textMuted mt-0.5">Inactivity duration before automatic logout</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-borderDefault rounded-xl overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSessionTimeout((prev) => Math.max(5, prev - 15))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                        aria-label="Decrease session timeout"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-14 h-8 text-center font-bold text-xs text-textDefault focus:outline-none border-x border-borderDefault"
                        aria-label="Session timeout in minutes"
                      />
                      <button
                        type="button"
                        onClick={() => setSessionTimeout((prev) => Math.min(1440, prev + 15))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                        aria-label="Increase session timeout"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-textMuted">minutes</span>
                  </div>
                </div>

                {/* Max Failed Attempts */}
                <div className="bg-slate-50 border border-borderDefault/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-textDefault">Max failed attempts</h3>
                      <p className="text-[11px] text-textMuted mt-0.5">Locks account after repeated sign-in failures</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-borderDefault rounded-xl overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setMaxFailedAttempts((prev) => Math.max(1, prev - 1))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                        aria-label="Decrease max attempts"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        value={maxFailedAttempts}
                        onChange={(e) => setMaxFailedAttempts(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-14 h-8 text-center font-bold text-xs text-textDefault focus:outline-none border-x border-borderDefault"
                        aria-label="Max failed login attempts"
                      />
                      <button
                        type="button"
                        onClick={() => setMaxFailedAttempts((prev) => Math.min(20, prev + 1))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                        aria-label="Increase max attempts"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-textMuted">attempts</span>
                  </div>
                </div>

                {/* Lockout Duration */}
                <div className="bg-slate-50 border border-borderDefault/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-textDefault">Lockout Duration</h3>
                      <p className="text-[11px] text-textMuted mt-0.5">Cool-off period before unlocked accounts can retry</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-borderDefault rounded-xl overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setLockoutDuration((prev) => Math.max(5, prev - 5))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        value={lockoutDuration}
                        onChange={(e) => setLockoutDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-14 h-8 text-center font-bold text-xs text-textDefault focus:outline-none border-x border-borderDefault"
                      />
                      <button
                        type="button"
                        onClick={() => setLockoutDuration((prev) => Math.min(1440, prev + 5))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-textMuted">minutes</span>
                  </div>
                </div>

                {/* Password Min Length */}
                <div className="bg-slate-50 border border-borderDefault/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <KeyRound className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-textDefault">Minimum Password Length</h3>
                      <p className="text-[11px] text-textMuted mt-0.5">Enforce strong password policy for accounts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-borderDefault rounded-xl overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPasswordMinLength((prev) => Math.max(6, prev - 1))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        value={passwordMinLength}
                        onChange={(e) => setPasswordMinLength(Math.max(6, parseInt(e.target.value, 10) || 8))}
                        className="w-14 h-8 text-center font-bold text-xs text-textDefault focus:outline-none border-x border-borderDefault"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordMinLength((prev) => Math.min(32, prev + 1))}
                        className="w-9 h-8 flex items-center justify-center text-textDefault hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-textMuted">characters</span>
                  </div>
                </div>

                {/* Require Security Questions Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-borderDefault/80 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-textDefault">Require Security Questions for Sensitive Actions</h3>
                    <p className="text-[11px] text-textMuted mt-0.5">Prompt security questions before sensitive operations</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={requireKba}
                    onClick={() => setRequireKba((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requireKba ? 'bg-brand-primary' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        requireKba ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Info Banner */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-brand-primary">
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="font-medium">These settings apply to all users in the system.</span>
                </div>
              </div>
            </div>

            {/* Card 3: Financial Defaults & Targets */}
            <div className="bg-white border border-borderDefault rounded-2xl shadow-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-textDefault leading-tight">Financial Defaults</h2>
                  <p className="text-xs text-textMuted mt-0.5 leading-tight">
                    Base currency, default period, and financial targets
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* System Default Country */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-textDefault">System Default Country</label>
                  <select
                    value={defaultCountry}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDefaultCountry(val);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs font-semibold text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Currency */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-textDefault">System Base Currency</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs font-semibold text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  >
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} ({curr.symbol}) - {curr.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Budget Period */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-textDefault">Default Budgeting Period</label>
                  <select
                    value={defaultBudgetPeriod}
                    onChange={(e) => setDefaultBudgetPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs font-semibold text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                {/* FAM Thresholds */}
                <div className="bg-slate-50 border border-borderDefault/80 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-textDefault">Financial Health Target Ratios</h3>
                      <p className="text-[11px] text-textMuted mt-0.5">
                        Target thresholds for budget and financial health scoring
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-borderDefault rounded-xl p-2.5 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-textMuted uppercase">Expense Max</span>
                      <div className="text-xs font-bold text-textDefault">{famExpenseThreshold}%</div>
                      <input
                        type="range"
                        min="20"
                        max="150"
                        step="5"
                        value={famExpenseThreshold}
                        onChange={(e) => setFamExpenseThreshold(Number(e.target.value))}
                        className="w-full accent-brand-primary"
                      />
                    </div>
                    <div className="bg-white border border-borderDefault rounded-xl p-2.5 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-textMuted uppercase">Invest Target</span>
                      <div className="text-xs font-bold text-textDefault">{famInvestmentThreshold}%</div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="5"
                        value={famInvestmentThreshold}
                        onChange={(e) => setFamInvestmentThreshold(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                    <div className="bg-white border border-borderDefault rounded-xl p-2.5 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-textMuted uppercase">Income Target</span>
                      <div className="text-xs font-bold text-textDefault">{famIncomeThreshold}%</div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="5"
                        value={famIncomeThreshold}
                        onChange={(e) => setFamIncomeThreshold(Number(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: System Maintenance & Controls */}
            <div className="bg-white border border-borderDefault rounded-2xl shadow-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-textDefault leading-tight">System Controls</h2>
                  <p className="text-xs text-textMuted mt-0.5 leading-tight">
                    Maintenance actions, cache, and data exports
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Clear Cache */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-borderDefault/80 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-textDefault">Clear System Cache</h3>
                    <p className="text-[11px] text-textMuted mt-0.5">Refresh temporary system data</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCacheMutation.mutate()}
                    isLoading={clearCacheMutation.isPending}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    className="whitespace-nowrap shrink-0"
                  >
                    Clear Cache
                  </Button>
                </div>

                {/* Run Recurring Materialization */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-borderDefault/80 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-textDefault">Process Scheduled Transactions</h3>
                    <p className="text-[11px] text-textMuted mt-0.5">Post all due scheduled transactions now</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runRecurringMutation.mutate()}
                    isLoading={runRecurringMutation.isPending}
                    icon={<Check className="w-3.5 h-3.5" />}
                    className="whitespace-nowrap shrink-0"
                  >
                    Run Now
                  </Button>
                </div>

                {/* Export Audit Logs CSV */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-borderDefault/80 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-textDefault">Export Audit Logs</h3>
                    <p className="text-[11px] text-textMuted mt-0.5">Download all system audit logs as CSV</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportAuditMutation.mutate()}
                    isLoading={exportAuditMutation.isPending}
                    icon={<Download className="w-3.5 h-3.5" />}
                    className="whitespace-nowrap shrink-0"
                  >
                    Export CSV
                  </Button>
                </div>

                {/* Purge Audit Logs */}
                <div className="flex items-center justify-between p-3 bg-rose-50/50 border border-rose-100 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-rose-950">Clear Old Audit Logs</h3>
                    <p className="text-[11px] text-rose-700/80 mt-0.5">Delete logs older than retention period</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsPurgeModalOpen(true)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    className="whitespace-nowrap shrink-0"
                  >
                    Clear Logs
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => navigate('/admin')}
                className="whitespace-nowrap"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                isLoading={updateMutation.isPending}
                icon={<Check className="w-4 h-4" />}
                onClick={handleSave}
                className="whitespace-nowrap"
              >
                Save
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Compact Purge Audit Logs Modal */}
      <Modal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        title="Purge Old Logs"
        compact={true}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPurgeModalOpen(false)}
              className="whitespace-nowrap"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={purgeAuditMutation.isPending}
              onClick={() => purgeAuditMutation.mutate(purgeRetentionDays)}
              className="whitespace-nowrap"
            >
              Purge
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-textMuted leading-relaxed">
            Select retention horizon. Audit records older than this period will be deleted.
          </p>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-textDefault">Retention Period</label>
            <select
              value={purgeRetentionDays}
              onChange={(e) => setPurgeRetentionDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs font-semibold text-textDefault focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value={30}>Older than 30 days</option>
              <option value={60}>Older than 60 days</option>
              <option value={90}>Older than 90 days</option>
              <option value={180}>Older than 180 days</option>
              <option value={365}>Older than 1 year</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
