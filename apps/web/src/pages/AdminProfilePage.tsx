import React, { useState } from 'react';
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
  CheckCircle2,
  AlertTriangle,
  ArrowLeftFromLine,
  FileText,
  Sliders,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry.js';
import { useAuthStore } from '../store/authStore.js';
import { apiClient } from '../services/apiClient.js';
import { toast } from '../store/toastStore.js';
import { validatePassword, validateConfirmPassword } from '../utils/validation.js';
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

  // Live password validation
  const passwordCheck = validatePassword(newPassword);
  const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);

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
      toast.success('Admin profile details updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update profile');
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
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to change password');
    },
  });

  // Mutation: Revoke All Other Sessions
  const revokeSessionsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Admin profile session not loaded');
      return await apiClient.admin.revokeAllUserSessions(user.id);
    },
    onSuccess: (data) => {
      toast.success(`Active sessions revoked (${data?.revokedCount ?? 0} session(s))`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to revoke sessions');
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
    <div className="flex-1 flex flex-col bg-[#F3F6FC] pb-16">
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
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-brand-primary bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 whitespace-nowrap shrink-0"
            >
              <ArrowLeftFromLine className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Exit Admin</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
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
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-brand-primary" />
            <h4 className="text-xs font-bold text-slate-900">Personal Information</h4>
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
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-brand-primary" />
            <h4 className="text-xs font-bold text-slate-900">Change Password</h4>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePasswordMutation.mutate();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 p-1"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                status={newPassword ? (passwordCheck.isValid ? 'valid' : 'invalid') : 'idle'}
                validMessage={passwordCheck.message}
                error={newPassword && !passwordCheck.isValid ? passwordCheck.message : undefined}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 p-1"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type={showNewPassword ? 'text' : 'password'}
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              status={confirmPassword ? (confirmCheck.isValid ? 'valid' : 'invalid') : 'idle'}
              validMessage="Passwords match"
              error={confirmPassword && !confirmCheck.isValid ? confirmCheck.message : undefined}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
            />

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
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-900">Admin Quick Access</h4>
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
              <span className="font-semibold">Security Questions (KBA)</span>
            </div>
            <span className="text-[11px] text-textMuted font-mono">Configure</span>
          </button>
        </Card>

        {/* 5. Session Security & Sign Out */}
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900">Session Controls</h4>
          </div>

          <p className="text-xs text-textMuted leading-relaxed">
            Terminate all active browser and mobile sessions for your admin account across other devices.
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={revokeSessionsMutation.isPending}
              onClick={() => revokeSessionsMutation.mutate()}
              className="flex-1 text-xs"
            >
              Revoke Other Sessions
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfilePage;
