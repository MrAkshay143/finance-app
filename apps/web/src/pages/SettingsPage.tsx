import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Clock,
  Calendar,
  Bell,
  Zap,
  PieChart,
  Grid,
  Shield,
  AlertTriangle,
  Lock,
  KeyRound,
  RotateCcw,
  Trash2,
  LogOut,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Repeat,
  Check,
  Sparkles,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@finance/shared-ui-tokens';
import { Input } from '../components/ui/Input.js';
import { apiClient } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import type { UserSettings, UpdateUserSettingsInput } from '@finance/shared-types';
import { toast } from '../store/toastStore.js';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  // Modals state
  const [prefModal, setPrefModal] = useState<'currency' | 'timezone' | 'startDay' | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Form states for modals
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Donut individual toggles
  const [incomeDonut, setIncomeDonut] = useState(true);
  const [expenseDonut, setExpenseDonut] = useState(true);
  const [investmentDonut, setInvestmentDonut] = useState(true);

  // Query Settings
  const { data: settingsData } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const res = await apiClient.settings.get();
      return (res as any)?.data || res;
    },
  });

  // Settings default fallback
  const settings: UserSettings = {
    userId: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    financialMonthStartDay: 1,
    quickAddEnabled: true,
    donutVisualsEnabled: true,
    investmentsTrackingEnabled: true,
    recurringTrackingEnabled: true,
    reminderDaysBeforeDue: 3,
    notificationsEnabled: true,
    ...settingsData,
  };

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: UpdateUserSettingsInput) => {
      const res = await apiClient.settings.update(updates);
      return (res as any)?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Preferences updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update preferences');
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    if (key === 'quickAdd') {
      updateSettingsMutation.mutate({ quickAddEnabled: value });
    } else if (key === 'incomeDonut') {
      setIncomeDonut(value);
      const anyDonut = value || expenseDonut || investmentDonut;
      updateSettingsMutation.mutate({ donutVisualsEnabled: anyDonut });
    } else if (key === 'expenseDonut') {
      setExpenseDonut(value);
      const anyDonut = incomeDonut || value || investmentDonut;
      updateSettingsMutation.mutate({ donutVisualsEnabled: anyDonut });
    } else if (key === 'investmentDonut') {
      setInvestmentDonut(value);
      const anyDonut = incomeDonut || expenseDonut || value;
      updateSettingsMutation.mutate({ donutVisualsEnabled: anyDonut });
    } else if (key === 'investments') {
      updateSettingsMutation.mutate({ investmentsTrackingEnabled: value });
    } else if (key === 'recurring') {
      updateSettingsMutation.mutate({ recurringTrackingEnabled: value });
    }
  };

  // Reset Profile Mutation
  const resetProfileMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.accountActions.resetProfile();
    },
    onSuccess: () => {
      setIsResetModalOpen(false);
      queryClient.invalidateQueries();
      toast.success('Profile and transactions reset cleanly');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset profile');
    },
  });

  // Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (pwd: string) => {
      return await apiClient.accountActions.deleteAccount(pwd);
    },
    onSuccess: async () => {
      setIsDeleteModalOpen(false);
      await logout();
      navigate('/login');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Incorrect password';
      setDeleteError(msg);
      toast.error(msg);
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.auth.changePassword({ currentPassword, newPassword });
    },
    onSuccess: () => {
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
      toast.success('Password updated successfully');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update password';
      setPasswordError(msg);
      toast.error(msg);
    },
  });

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError(null);
    changePasswordMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col pb-8">
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle="Manage your account & preferences"
      />

      <div className="p-4 space-y-4">
        {/* Subheader with right badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-textDefault">Settings</h2>
            <p className="text-xs text-textMuted">Customize your experience</p>
          </div>

          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-2 flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-brand-primary leading-tight">Make it yours</div>
              <div className="text-[10px] text-textMuted leading-tight">Simple. Secure. Personal.</div>
            </div>
          </div>
        </div>

        {/* 1. Preferences Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Settings className="w-4 h-4 text-brand-primary" />
            <div>
              <h3 className="text-xs font-bold text-textDefault">Preferences</h3>
              <p className="text-[11px] text-textMuted leading-tight">Set your basic preferences for the app.</p>
            </div>
          </div>

          <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
            {/* Currency */}
            <button
              type="button"
              onClick={() => setPrefModal('currency')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  {getCurrencySymbol(settings.currency)}
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Currency</div>
                  <div className="text-[11px] text-textMuted">Set your preferred currency</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-textDefault">
                <span>{settings.currency || 'INR'}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* Timezone */}
            <button
              type="button"
              onClick={() => setPrefModal('timezone')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Timezone</div>
                  <div className="text-[11px] text-textMuted">Set your local timezone</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-textDefault">
                <span>{settings.timezone || 'Asia/Kolkata'}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* Financial Month Start */}
            <button
              type="button"
              onClick={() => setPrefModal('startDay')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Financial Month Start</div>
                  <div className="text-[11px] text-textMuted">Choose the starting day of your financial month</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-textDefault">
                <span>Day {settings.financialMonthStartDay || 1}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          </Card>
        </div>

        {/* 2. Notifications Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Bell className="w-4 h-4 text-brand-primary" />
            <div>
              <h3 className="text-xs font-bold text-textDefault">Notifications</h3>
              <p className="text-[11px] text-textMuted leading-tight">Manage your notifications and reminders.</p>
            </div>
          </div>

          <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Notifications</div>
                  <div className="text-[11px] text-textMuted">Manage push and email notifications</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Reminders</div>
                  <div className="text-[11px] text-textMuted">Get an expense or investment reminder near your month-end</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </Card>
        </div>

        {/* 3. Quick Actions Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-4 h-4 text-brand-primary" />
            <div>
              <h3 className="text-xs font-bold text-textDefault">Quick Actions</h3>
              <p className="text-[11px] text-textMuted leading-tight">Faster ways to add transactions.</p>
            </div>
          </div>

          <Card padding="sm" className="bg-white border border-borderDefault shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center font-bold text-lg">
                  +
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Quick-add button</div>
                  <div className="text-[11px] text-textMuted">Show floating '+' button for quick entry.</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle('quickAdd', !(settings.quickAddEnabled ?? true))}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  (settings.quickAddEnabled ?? true) ? 'bg-brand-primary' : 'bg-slate-300'
                }`}
                aria-label="Toggle quick-add button"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    (settings.quickAddEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* 4. Dashboard Donuts Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <PieChart className="w-4 h-4 text-brand-primary" />
            <div>
              <h3 className="text-xs font-bold text-textDefault">Dashboard Donuts</h3>
              <p className="text-[11px] text-textMuted leading-tight">Choose which planned vs actual donuts appear on your dashboard.</p>
            </div>
          </div>

          <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
            {/* Income Donut */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-textDefault">Income donut</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('incomeDonut', !incomeDonut)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  incomeDonut ? 'bg-brand-primary' : 'bg-slate-300'
                }`}
                aria-label="Toggle income donut"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    incomeDonut ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Expense Donut */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-textDefault">Expense donut</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('expenseDonut', !expenseDonut)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  expenseDonut ? 'bg-brand-primary' : 'bg-slate-300'
                }`}
                aria-label="Toggle expense donut"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    expenseDonut ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Investment Donut */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-textDefault">Investment donut</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('investmentDonut', !investmentDonut)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  investmentDonut ? 'bg-brand-primary' : 'bg-slate-300'
                }`}
                aria-label="Toggle investment donut"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    investmentDonut ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* 5. Features Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Grid className="w-4 h-4 text-brand-primary" />
            <div>
              <h3 className="text-xs font-bold text-textDefault">Features</h3>
              <p className="text-[11px] text-textMuted leading-tight">Enable or disable optional features.</p>
            </div>
          </div>

          <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
            {/* Investments */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Investments</div>
                  <div className="text-[11px] text-textMuted">Show investments tab and related features</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggle('investments', !(settings.investmentsTrackingEnabled ?? true))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  (settings.investmentsTrackingEnabled ?? true) ? 'bg-brand-primary' : 'bg-slate-300'
                }`}
                aria-label="Toggle investments feature"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    (settings.investmentsTrackingEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Recurring Transactions */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Recurring transactions</div>
                  <div className="text-[11px] text-textMuted">Enable recurring transactions tracking.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggle('recurring', !(settings.recurringTrackingEnabled ?? true))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  (settings.recurringTrackingEnabled ?? true) ? 'bg-brand-primary' : 'bg-slate-300'
                }`}
                aria-label="Toggle recurring transactions feature"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    (settings.recurringTrackingEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* 6. Security Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-brand-primary" />
            <div>
              <h3 className="text-xs font-bold text-textDefault">Security</h3>
              <p className="text-[11px] text-textMuted leading-tight">Keep your account safe.</p>
            </div>
          </div>

          <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Change password</div>
                  <div className="text-[11px] text-textMuted">Update your account login credentials</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/security/questions')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-textDefault">Security questions (KBA)</div>
                  <div className="text-[11px] text-textMuted">Configure recovery answers and challenge tier</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </Card>
        </div>

        {/* 7. Danger Zone */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <div>
              <h3 className="text-xs font-bold text-rose-600">Danger Zone</h3>
              <p className="text-[11px] text-textMuted leading-tight">Irreversible actions. Please be careful.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
              {/* Reset Profile */}
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-textDefault">Reset Profile</div>
                    <div className="text-[11px] text-textMuted">Clear all your data and start fresh</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Delete My Account */}
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-rose-50/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-600">Delete My Account</div>
                    <div className="text-[11px] text-textMuted">Permanently delete your account and all data</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </Card>

            {/* Log Out Row */}
            <Card padding="none" className="bg-rose-50/40 border border-rose-200/60 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-3.5 flex items-center justify-between hover:bg-rose-100/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-600">Log Out</div>
                    <div className="text-[11px] text-rose-500">Sign out from your account</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </Card>
          </div>
        </div>
      </div>

      {/* Preferences Modals */}
      {/* 1. Currency Modal */}
      <Modal
        isOpen={prefModal === 'currency'}
        onClose={() => setPrefModal(null)}
        title="Select Currency"
        subtitle="Primary currency used across all dashboards"
      >
        <div className="space-y-2">
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                updateSettingsMutation.mutate({ currency: c.code });
                setPrefModal(null);
              }}
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors ${
                (settings.currency || 'INR') === c.code
                  ? 'border-brand-primary bg-blue-50/70 text-brand-primary font-bold'
                  : 'border-borderDefault bg-white text-textDefault hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black w-6 text-center">{c.symbol}</span>
                <span className="text-xs">{c.name} ({c.code})</span>
              </div>
              {(settings.currency || 'INR') === c.code && <Check className="w-4 h-4 text-brand-primary" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* 2. Timezone Modal */}
      <Modal
        isOpen={prefModal === 'timezone'}
        onClose={() => setPrefModal(null)}
        title="Select Timezone"
        subtitle="Used for accurate dates and notification scheduling"
      >
        <div className="space-y-2">
          {[
            { zone: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 'UTC +5:30' },
            { zone: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC -5:00' },
            { zone: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC +0:00' },
            { zone: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: 'UTC +4:00' },
            { zone: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', offset: 'UTC +8:00' },
          ].map((tz) => (
            <button
              key={tz.zone}
              type="button"
              onClick={() => {
                updateSettingsMutation.mutate({ timezone: tz.zone });
                setPrefModal(null);
              }}
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors ${
                (settings.timezone || 'Asia/Kolkata') === tz.zone
                  ? 'border-brand-primary bg-blue-50/70 text-brand-primary font-bold'
                  : 'border-borderDefault bg-white text-textDefault hover:bg-slate-50'
              }`}
            >
              <div className="text-left">
                <div className="text-xs">{tz.label}</div>
                <div className="text-[11px] text-textMuted font-mono">{tz.offset} • {tz.zone}</div>
              </div>
              {(settings.timezone || 'Asia/Kolkata') === tz.zone && <Check className="w-4 h-4 text-brand-primary" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* 3. Start Day Modal */}
      <Modal
        isOpen={prefModal === 'startDay'}
        onClose={() => setPrefModal(null)}
        title="Financial Month Start Day"
        subtitle="Aligns budgeting cycles with your salary date"
      >
        <div className="space-y-2">
          {[
            { day: 1, label: 'Day 1 of Month (Calendar default)' },
            { day: 5, label: 'Day 5 of Month' },
            { day: 15, label: 'Day 15 of Month (Mid-month cycle)' },
            { day: 25, label: 'Day 25 of Month (Salary cycle)' },
          ].map((d) => (
            <button
              key={d.day}
              type="button"
              onClick={() => {
                updateSettingsMutation.mutate({ financialMonthStartDay: d.day });
                setPrefModal(null);
              }}
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors ${
                (settings.financialMonthStartDay || 1) === d.day
                  ? 'border-brand-primary bg-blue-50/70 text-brand-primary font-bold'
                  : 'border-borderDefault bg-white text-textDefault hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-medium">{d.label}</span>
              {(settings.financialMonthStartDay || 1) === d.day && <Check className="w-4 h-4 text-brand-primary" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordError(null);
        }}
        title="Change Password"
        subtitle="Update your account password"
        icon={<Lock className="w-5 h-5 text-brand-primary" />}
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              isLoading={changePasswordMutation.isPending}
              onClick={handleSavePassword}
            >
              Save Password
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSavePassword} className="space-y-3">
          {passwordError && (
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">
              {passwordError}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 8 characters"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* Reset Profile Modal */}
      {(() => {
        const dialogDef = CONFIRM_DIALOGS.settings.resetTargets();
        return (
          <Modal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            title={dialogDef.title}
            subtitle={dialogDef.subtitle}
            icon={<RotateCcw className="w-5 h-5 text-amber-600" />}
            footer={
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setIsResetModalOpen(false)}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  isLoading={resetProfileMutation.isPending}
                  onClick={() => resetProfileMutation.mutate()}
                >
                  {dialogDef.confirmLabel}
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs text-textMuted leading-relaxed">
              <p>{dialogDef.message}</p>
            </div>
          </Modal>
        );
      })()}

      {/* Delete Account Modal */}
      {(() => {
        const dialogDef = CONFIRM_DIALOGS.settings.deleteAccount();
        return (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setDeleteError(null);
              setDeletePassword('');
            }}
            title={dialogDef.title}
            subtitle={dialogDef.subtitle}
            icon={<Trash2 className="w-5 h-5 text-rose-600" />}
            footer={
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteError(null);
                    setDeletePassword('');
                  }}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  isLoading={deleteAccountMutation.isPending}
                  disabled={!deletePassword}
                  onClick={() => deleteAccountMutation.mutate(deletePassword)}
                >
                  {dialogDef.confirmLabel}
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs text-textMuted leading-relaxed">
              <p className="text-rose-700 font-medium">{dialogDef.message}</p>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-textDefault">
                  Enter your password to confirm deletion:
                </label>
                <Input
                  type="password"
                  placeholder="Your account password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError(null);
                  }}
                  error={deleteError || undefined}
                />
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
