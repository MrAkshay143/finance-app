import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { apiClient } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import type { AppSettings, UpdateAppSettingsInput } from '@finance/shared-types';
import { toast } from '../store/toastStore.js';

export const AdminAppSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sessionTimeout, setSessionTimeout] = useState<number>(120);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState<number>(5);

  // Fetch app settings
  const { data: settingsData, isLoading, isError } = useQuery<AppSettings>({
    queryKey: ['admin-app-settings'],
    queryFn: async () => {
      const res = await apiClient.admin.getAppSettings();
      return (res as any)?.data || res;
    },
  });

  useEffect(() => {
    if (settingsData) {
      if (settingsData.sessionTimeoutMinutes) {
        setSessionTimeout(settingsData.sessionTimeoutMinutes);
      }
      if (settingsData.maxFailedLoginAttempts || settingsData.maxFailedAttempts) {
        setMaxFailedAttempts(settingsData.maxFailedLoginAttempts || settingsData.maxFailedAttempts || 5);
      }
    }
  }, [settingsData]);

  // Mutation to update app settings
  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateAppSettingsInput) => {
      return await apiClient.admin.updateAppSettings(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-settings'] });
      toast.success('Settings updated successfully');
      setTimeout(() => {
        navigate('/admin');
      }, 500);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update settings');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      sessionTimeoutMinutes: sessionTimeout,
      maxFailedLoginAttempts: maxFailedAttempts,
      maxFailedAttempts: maxFailedAttempts,
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
    <div className="flex-1 flex flex-col pb-8">
      <AppHeader
        variant="nested"
        title="Platform Settings"
        subtitle="Platform policies, timeouts & lockout limits"
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
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              aria-label="Log Out"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Main Settings Card */}
        <div className="bg-white border border-borderDefault rounded-3xl shadow-lg p-5 space-y-4">
          {/* Card Header */}
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Setting 1: Session Timeout */}
              <div className="bg-slate-50/70 border border-borderDefault/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-textDefault">Session timeout</h3>
                    <p className="text-[11px] text-textMuted mt-0.5 leading-tight">
                      Automatically log out users after a period of inactivity.
                    </p>
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-borderDefault rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setSessionTimeout((prev) => Math.max(5, prev - 15))}
                      className="w-10 h-10 flex items-center justify-center text-textDefault hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label="Decrease session timeout"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 h-10 text-center font-bold text-xs text-textDefault focus:outline-none border-x border-borderDefault"
                      aria-label="Session timeout in minutes"
                    />
                    <button
                      type="button"
                      onClick={() => setSessionTimeout((prev) => Math.min(1440, prev + 15))}
                      className="w-10 h-10 flex items-center justify-center text-textDefault hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label="Increase session timeout"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <span className="px-3 py-2.5 bg-white border border-borderDefault rounded-xl text-xs font-semibold text-textMuted">
                    minutes
                  </span>
                </div>
              </div>

              {/* Setting 2: Max Failed Login Attempts */}
              <div className="bg-slate-50/70 border border-borderDefault/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-textDefault">Max failed attempts</h3>
                    <p className="text-[11px] text-textMuted mt-0.5 leading-tight">
                      Lock accounts after repeated failed sign-in attempts.
                    </p>
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-borderDefault rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setMaxFailedAttempts((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center text-textDefault hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label="Decrease max attempts"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      value={maxFailedAttempts}
                      onChange={(e) => setMaxFailedAttempts(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 h-10 text-center font-bold text-xs text-textDefault focus:outline-none border-x border-borderDefault"
                      aria-label="Max failed login attempts"
                    />
                    <button
                      type="button"
                      onClick={() => setMaxFailedAttempts((prev) => Math.min(20, prev + 1))}
                      className="w-10 h-10 flex items-center justify-center text-textDefault hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label="Increase max attempts"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <span className="px-3 py-2.5 bg-white border border-borderDefault rounded-xl text-xs font-semibold text-textMuted">
                    attempts
                  </span>
                </div>

                <div className="text-[10px] text-textMuted font-medium">
                  Current: {maxFailedAttempts} attempts
                </div>
              </div>

              {/* Info Banner */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-brand-primary">
                <Info className="w-4 h-4 shrink-0" />
                <span className="font-medium">These settings apply to all users in the system.</span>
              </div>

              {/* Footer Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => navigate('/admin')}
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
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
