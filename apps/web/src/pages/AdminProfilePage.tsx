import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Shield,
  KeyRound,
  User,
  Mail,
  Phone,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftFromLine,
  FileText,
  Sliders,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry.js';
import { useAuthStore } from '../store/authStore.js';
import { apiClient } from '../services/apiClient.js';
import { getFriendlyErrorMessage } from '@finance/api-client';
import { toast } from '../store/toastStore.js';
import { validatePassword, validateConfirmPassword, generateSecurePassword } from '../utils/validation.js';
import { formatDateTime } from '../utils/date.js';

export const AdminProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  // Profile Edit State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Live password validation
  const passwordCheck = validatePassword(newPassword);
  const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);

  // Password strength calculation matching SignupPage standards
  const strengthDetails = useMemo(() => {
    if (!newPassword) {
      return { segmentCount: 0, barColor: 'bg-slate-200', textColor: 'text-slate-400' };
    }
    switch (passwordCheck.strengthLabel) {
      case 'Strong':
        return { segmentCount: 4, barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
      case 'Good':
        return { segmentCount: 3, barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
      case 'Fair':
        return { segmentCount: 2, barColor: 'bg-amber-500', textColor: 'text-amber-600' };
      case 'Weak':
      default:
        return { segmentCount: 1, barColor: 'bg-rose-500', textColor: 'text-rose-600' };
    }
  }, [newPassword, passwordCheck.strengthLabel]);

  // Real-time password criteria checklist matching SignupPage
  const passwordCriteriaList = useMemo(() => {
    return [
      { label: '8+ characters', met: passwordCheck.criteria.minLength },
      { label: 'Uppercase (A-Z)', met: passwordCheck.criteria.hasUpper },
      { label: 'Lowercase (a-z)', met: passwordCheck.criteria.hasLower },
      { label: 'One number (0-9)', met: passwordCheck.criteria.hasNumber },
      { label: 'Special symbol (!@#$)', met: passwordCheck.criteria.hasSpecial },
    ];
  }, [passwordCheck.criteria]);

  // Password generator handler
  const handleGeneratePassword = () => {
    const generated = generateSecurePassword(16);
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    navigator.clipboard.writeText(generated).catch(() => {});
    toast.success('Password copied');
  };

  // Mutation: Update Profile Details
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.profile.updateBasic({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        mobileNumber: mobileNumber.trim() || undefined,
        phone: mobileNumber.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await checkAuth();
      toast.success('Profile updated');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to update profile'));
    },
  });

  // Mutation: Change Password
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword) throw new Error('Current password is required');
      if (!passwordCheck.isValid) throw new Error('New password does not meet requirements');
      if (!confirmCheck.isValid) throw new Error('Passwords do not match');

      return await apiClient.auth.changePassword({
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to change password'));
    },
  });

  // Mutation: Revoke All Other Sessions
  const revokeSessionsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Admin profile session not loaded');
      return await apiClient.admin.revokeAllUserSessions(user.id);
    },
    onSuccess: () => {
      toast.success('Active sessions signed out');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to revoke sessions'));
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : (user?.email?.[0] || 'A').toUpperCase();

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 pb-20">
      {/* Branded Header */}
      <AppHeader
        variant="nested"
        title="Admin Profile"
        subtitle="Identity, credentials & security"
        backTo="/admin"
        showNotifications={false}
        showAvatar={false}
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

      <div className="px-4 py-4 space-y-4 max-w-[430px] mx-auto w-full">
        {/* 1. Admin Identity Hero Card */}
        <div className="p-4 bg-gradient-to-br from-[#0B1B3A] to-[#162D5A] text-white rounded-2xl shadow-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-gradient-to-tr from-brand-primary to-blue-400 text-white font-extrabold text-lg flex items-center justify-center shadow-md border-2 border-white/20 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white leading-tight truncate">
                {user?.fullName || user?.email?.split('@')[0]}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  SYSTEM ADMINISTRATOR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Personal Information Card */}
        <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-borderDefault/60">
            <User className="w-4 h-4 text-brand-primary" />
            <h4 className="text-sm font-bold text-textDefault">Personal Information</h4>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate();
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="First Name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              disabled
              value={user?.email || ''}
              helperText="Email cannot be changed directly"
              icon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <PhoneInputWithCountry
              label="Mobile Number"
              value={mobileNumber}
              onChange={(val) => setMobileNumber(val)}
              helperText="Institutional contact phone number"
            />

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                isLoading={updateProfileMutation.isPending}
              >
                Save Personal Details
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Change Password Card */}
        <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-borderDefault/60">
            <KeyRound className="w-4 h-4 text-brand-primary" />
            <h4 className="text-sm font-bold text-textDefault">Change Password</h4>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePasswordMutation.mutate();
            }}
            className="space-y-3"
          >
            {/* Current Password */}
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    className="text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-new-password" className="block text-xs font-semibold text-textDefault">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-blue-700 transition-colors focus:outline-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Generate Secure Password</span>
                </button>
              </div>
              <Input
                id="admin-new-password"
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                status={newPassword ? (passwordCheck.isValid ? 'valid' : 'invalid') : 'idle'}
                validMessage={passwordCheck.message}
                error={newPassword && !passwordCheck.isValid ? passwordCheck.message : undefined}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {/* Interactive 4-Segment Strength Meter & 2-Column Criteria Checklist matching SignupPage */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-600">Password Strength</span>
                <span
                  className={`text-[11px] font-bold ${
                    newPassword ? strengthDetails.textColor : 'text-slate-400'
                  }`}
                >
                  {newPassword ? passwordCheck.strengthLabel : 'Not entered'}
                </span>
              </div>

              {/* 4-Segment Strength Bar */}
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={`h-full rounded-full transition-all duration-300 ${
                      newPassword && seg <= strengthDetails.segmentCount
                        ? strengthDetails.barColor
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* 2-Column Criteria Checklist */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-0.5 text-[11px]">
                {passwordCriteriaList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 min-w-0">
                    {item.met ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        item.met ? 'text-slate-700 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                status={confirmPassword ? (confirmCheck.isValid ? 'valid' : 'invalid') : 'idle'}
                validMessage={confirmPassword && confirmCheck.isValid ? 'Passwords match' : undefined}
                error={confirmPassword && !confirmCheck.isValid ? confirmCheck.message : undefined}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    className="text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                disabled={!currentPassword || !passwordCheck.isValid || !confirmCheck.isValid}
                isLoading={changePasswordMutation.isPending}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* 4. Admin Navigation & Quick Links */}
        <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-borderDefault/60">
            <Sliders className="w-4 h-4 text-brand-primary" />
            <h4 className="text-sm font-bold text-textDefault">Admin Quick Access</h4>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/audit')}
            className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-primary" />
              <span className="font-semibold">System Audit Logs</span>
            </div>
            <span className="text-[11px] text-textMuted font-mono">/admin/audit</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/settings')}
            className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-primary" />
              <span className="font-semibold">Platform Security Parameters</span>
            </div>
            <span className="text-[11px] text-textMuted font-mono">/admin/settings</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/security/questions')}
            className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold">Security Questions</span>
            </div>
            <span className="text-[11px] text-textMuted font-medium">Configure</span>
          </button>
        </Card>

        {/* 5. Session Security & Sign Out */}
        <Card className="p-4 bg-white border border-borderDefault shadow-card rounded-2xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-borderDefault/60">
            <Shield className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-textDefault">Session Controls</h4>
          </div>

          <p className="text-xs text-textMuted leading-relaxed">
            Sign out of your account on all other active devices.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={revokeSessionsMutation.isPending}
              onClick={() => revokeSessionsMutation.mutate()}
              className="whitespace-nowrap shrink-0 justify-center"
            >
              Revoke Other Sessions
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut className="w-3.5 h-3.5 shrink-0" />}
              className="whitespace-nowrap shrink-0 justify-center"
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfilePage;
