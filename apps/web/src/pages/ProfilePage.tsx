import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  FileText,
  Building2,
  Tag,
  Store,
  Link2,
  Pencil,
  Camera,
  ChevronRight,
  BarChart2,
  ArrowRight,
  LogOut,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { useAuthStore } from '../store/authStore.js';
import { apiClient } from '../services/apiClient.js';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, kbaConfigured, logout, fetchProfile } = useAuthStore();
  const [financeProfile, setFinanceProfile] = useState<any>(null);
  const [famScore, setFamScore] = useState<string>('—');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    apiClient.profile
      .getFinanceProfile()
      .then((fp) => {
        if (fp) setFinanceProfile(fp);
      })
      .catch(() => {});

    apiClient.fam
      .getScore()
      .then((fam: any) => {
        if (fam) {
          const grade =
            fam.gradeDisplay ||
            (fam.overallGrade === 'A_PLUS'
              ? 'A+'
              : fam.overallGrade === 'NOT_AVAILABLE'
              ? '—'
              : fam.overallGrade) ||
            '—';
          setFamScore(grade);
        }
      })
      .catch(() => {});
  }, [fetchProfile]);

  // Calculate profile completion percentage:
  // - Basic profile filled (firstName, lastName, email): 35%
  // - Finance targets configured (income, budget, investment): 35%
  // - KBA security questions setup: 30%
  const completionPercentage = useMemo(() => {
    let score = 0;
    const hasBasic = Boolean(user?.firstName && user?.email);
    if (hasBasic) score += 35;

    const hasFinance = Boolean(
      financeProfile &&
        (Number(financeProfile.monthlyIncome) > 0 || Number(financeProfile.monthlyExpenseBudget) > 0)
    );
    if (hasFinance) score += 35;

    if (kbaConfigured) score += 30;

    return score;
  }, [user, financeProfile, kbaConfigured]);

  const initials = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.fullName.slice(0, 2).toUpperCase();
    }
    return user?.email ? user.email[0].toUpperCase() : 'U';
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setAvatarError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size must not exceed 5MB.');
      return;
    }

    setAvatarError(null);
    setIsUploadingAvatar(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await apiClient.profile.uploadAvatar(base64Data);
        await fetchProfile();
      } catch (err: any) {
        setAvatarError(err?.response?.data?.message || err?.message || 'Failed to upload profile picture.');
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.onerror = () => {
      setAvatarError('Failed to read selected image file.');
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col pb-6">
      {/* Branded Root Header */}
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle={`Welcome back, ${user?.firstName || user?.fullName || 'User'}`}
      />

      <div className="p-4 space-y-4">
        {/* Page Title & Edit Profile Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-brand-primary rounded-full" />
            <div>
              <h2 className="text-lg font-bold text-textDefault tracking-tight leading-tight">
                Profile
              </h2>
              <p className="text-xs text-textMuted mt-0.5">
                Manage your personal and finance details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile/settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-brand-primary text-xs font-semibold transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* User Hero & Profile Completion Card */}
        <Card className="p-4 space-y-4 shadow-card">
          {avatarError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {avatarError}
            </div>
          )}

          {/* Avatar and Identity Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              {/* Circular Avatar with Camera Badge */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label="Upload profile avatar"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label="Change profile photo"
                  className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-brand-primary text-white text-xl font-bold shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  {isUploadingAvatar ? (
                    <span className="text-[10px] font-medium">Uploading...</span>
                  ) : user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || 'User Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label="Upload new photo"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-brand-primary hover:bg-slate-50 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-textDefault leading-tight">
                  {user?.fullName || user?.firstName || 'User'}
                </h3>
                <p className="text-xs text-textMuted mt-0.5">{user?.email || '—'}</p>
                <div className="mt-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-brand-primary text-[10px] font-semibold">
                    Free Plan
                  </span>
                </div>
              </div>
            </div>

            {/* FAM Score Mini Cardlet */}
            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center justify-center min-w-[76px] shadow-sm">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <span>FAM Score</span>
                <Info className="w-2.5 h-2.5" />
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-textDefault">{famScore}</span>
                <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Profile Completion Status */}
          {completionPercentage >= 100 ? (
            <div className="pt-2.5 border-t border-borderDefault flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile Completed</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                100%
              </span>
            </div>
          ) : (
            <div className="pt-2 border-t border-borderDefault space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-textDefault">
                <span>Profile Completion</span>
                <span>{completionPercentage}%</span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-textMuted leading-tight">
                  Complete your finance profile for personalized insights.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    !kbaConfigured
                      ? navigate('/security/questions')
                      : navigate('/profile/settings')
                  }
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-brand-primary rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>Complete Profile</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Section: PROFILE */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider px-1">
            Profile
          </h3>
          <Card padding="none" className="divide-y divide-borderDefault overflow-hidden shadow-card">
            {/* Basic Profile */}
            <button
              type="button"
              onClick={() => navigate('/profile/settings?tab=basic')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-brand-primary shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-textDefault">Basic Profile</h4>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    Update your personal information
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Finance Profile */}
            <button
              type="button"
              onClick={() => navigate('/profile/settings?tab=finance')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-semantic-investment shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-textDefault">Finance Profile</h4>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    Set your income, expenses and goals
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </Card>
        </div>

        {/* Section: FINANCE */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider px-1">
            Finance
          </h3>
          <Card padding="none" className="divide-y divide-borderDefault overflow-hidden shadow-card">
            {/* Accounts */}
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-semantic-success shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-textDefault">Accounts</h4>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    Manage your bank accounts and wallets
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Categories */}
            <button
              type="button"
              onClick={() => navigate('/categories')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-textDefault">Categories</h4>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    Customize your income & expense categories
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Merchants */}
            <button
              type="button"
              onClick={() => navigate('/merchants')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-textDefault">Merchants</h4>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    Manage and view your saved merchants
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </Card>
        </div>

        {/* Section: MORE */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider px-1">
            More
          </h3>
          <Card padding="none" className="divide-y divide-borderDefault overflow-hidden shadow-card">
            {/* Integrations */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-textDefault">Integrations</h4>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    Connect with third-party services
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </Card>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-semantic-danger bg-red-50/50 hover:bg-red-50 active:bg-red-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
