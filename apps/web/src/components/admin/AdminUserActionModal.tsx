import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Lock,
  Unlock,
  LogOut,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { apiClient } from '../../services/apiClient.js';
import { toast } from '../../store/toastStore.js';
import { validatePassword, validateConfirmPassword } from '../../utils/validation.js';
import type { AdminUserItem } from '@finance/shared-types';

export interface AdminUserActionModalProps {
  isOpen: boolean;
  user: AdminUserItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminUserActionModal: React.FC<AdminUserActionModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Active tab or mode: 'menu' | 'password' | 'lock' | 'logout'
  const [activeView, setActiveView] = useState<'menu' | 'password' | 'lock' | 'logout'>('menu');

  // Password sub-mode: 'temp' | 'custom'
  const [passwordMode, setPasswordMode] = useState<'temp' | 'custom'>('temp');
  const [customPassword, setCustomPassword] = useState('');
  const [confirmCustomPassword, setConfirmCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Live password validation
  const passwordCheck = validatePassword(customPassword);
  const confirmCheck = validateConfirmPassword(customPassword, confirmCustomPassword);

  const handleClose = () => {
    setActiveView('menu');
    setPasswordMode('temp');
    setCustomPassword('');
    setConfirmCustomPassword('');
    setGeneratedTempPassword(null);
    setCopied(false);
    onClose();
  };

  // Reset / Set Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (newPass?: string) => {
      if (!user) throw new Error('No user selected');
      return await apiClient.admin.resetUserPassword(user.id, newPass);
    },
    onSuccess: (res: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', user?.id] });
      const tempPass = res?.data?.temporaryPassword || res?.temporaryPassword;
      if (tempPass) {
        setGeneratedTempPassword(tempPass);
      } else {
        toast.success(`Password updated successfully for ${user?.email}`);
        handleClose();
      }
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update password');
    },
  });

  // Lock / Unlock Account Mutation
  const toggleLockMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user selected');
      const isCurrentlyActive = user.status === 'ACTIVE';
      return await apiClient.admin.updateUser(user.id, {
        status: isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE',
        unlockAccount: !isCurrentlyActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', user?.id] });
      const wasActive = user?.status === 'ACTIVE';
      toast.success(
        wasActive
          ? `Account for ${user?.email} has been locked`
          : `Account for ${user?.email} has been unlocked`
      );
      handleClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to change account status');
    },
  });

  // Force Logout (Revoke Sessions) Mutation
  const forceLogoutMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user selected');
      return await apiClient.admin.revokeAllUserSessions(user.id);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', user?.id] });
      const count = res?.data?.revokedCount ?? res?.revokedCount ?? 0;
      toast.success(`Revoked ${count} active session${count === 1 ? '' : 's'} for ${user?.email}`);
      handleClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to revoke user sessions');
    },
  });

  const handleCopyPassword = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info('Temporary password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !user) return null;

  const isActive = user.status === 'ACTIVE';
  const isAdmin = user.role === 'ADMIN';

  const getInitials = (u: AdminUserItem) => {
    if (u.fullName) {
      const parts = u.fullName.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return u.fullName.slice(0, 2).toUpperCase();
    }
    return (u.email?.[0] || 'U').toUpperCase() + (u.email?.[1] || '').toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="User Management"
      subtitle={user.email}
    >
      <div className="space-y-4">
        {/* User Identity Pill */}
        <div className="p-3 bg-slate-50 border border-borderDefault rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary font-bold text-xs flex items-center justify-center border border-blue-100 shrink-0">
              {getInitials(user)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-textDefault truncate">
                {user.fullName || user.email.split('@')[0]}
              </h4>
              <p className="text-[11px] text-textMuted truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                ADMIN
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isActive ? 'ACTIVE' : 'LOCKED'}
            </span>
          </div>
        </div>

        {/* View: Menu */}
        {activeView === 'menu' && (
          <div className="space-y-2">
            {/* 1. Change Password Option */}
            <button
              type="button"
              onClick={() => setActiveView('password')}
              className="w-full p-3.5 bg-white hover:bg-slate-50 border border-borderDefault hover:border-slate-300 rounded-xl text-left flex items-center gap-3 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-textDefault">Change Password</div>
                <div className="text-[11px] text-textMuted">
                  Generate temporary credentials or set a custom password
                </div>
              </div>
            </button>

            {/* 2. Lock / Unlock Account Option */}
            <button
              type="button"
              onClick={() => setActiveView('lock')}
              className={`w-full p-3.5 bg-white hover:bg-slate-50 border border-borderDefault hover:border-slate-300 rounded-xl text-left flex items-center gap-3 transition-colors group ${
                isActive ? 'hover:border-rose-300' : 'hover:border-emerald-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                  isActive
                    ? 'bg-rose-50 text-semantic-danger'
                    : 'bg-emerald-50 text-semantic-success'
                }`}
              >
                {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-textDefault">
                  {isActive ? 'Lock Account' : 'Unlock Account'}
                </div>
                <div className="text-[11px] text-textMuted">
                  {isActive
                    ? 'Suspend access and prevent further logins'
                    : 'Restore full account access and allow logins'}
                </div>
              </div>
            </button>

            {/* 3. Force Logout Option */}
            <button
              type="button"
              onClick={() => setActiveView('logout')}
              className="w-full p-3.5 bg-white hover:bg-amber-50/40 border border-borderDefault hover:border-amber-200 rounded-xl text-left flex items-center gap-3 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-textDefault">Force Logout</div>
                <div className="text-[11px] text-textMuted">
                  Immediately revoke all active web and mobile sessions
                </div>
              </div>
            </button>
          </div>
        )}

        {/* View: Password */}
        {activeView === 'password' && (
          <div className="space-y-4">
            {/* Generated Temporary Password Display */}
            {generatedTempPassword ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Temporary Password Generated</span>
                </div>
                <p className="text-xs text-slate-600">
                  Share this password with the user. All existing sessions have been terminated.
                </p>
                <div className="flex items-center gap-2 p-2.5 bg-white border border-emerald-300 rounded-xl">
                  <code className="flex-1 font-mono text-xs font-bold text-slate-900 tracking-wider">
                    {generatedTempPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPassword(generatedTempPassword)}
                    icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={handleClose}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPasswordMode('temp')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      passwordMode === 'temp'
                        ? 'bg-white text-brand-primary shadow-xs'
                        : 'text-textMuted hover:text-textDefault'
                    }`}
                  >
                    Generate Temporary
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMode('custom')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      passwordMode === 'custom'
                        ? 'bg-white text-brand-primary shadow-xs'
                        : 'text-textMuted hover:text-textDefault'
                    }`}
                  >
                    Set Custom Password
                  </button>
                </div>

                {passwordMode === 'temp' ? (
                  <div className="p-4 bg-slate-50 border border-borderDefault rounded-2xl space-y-3">
                    <p className="text-xs text-textMuted leading-relaxed">
                      Generates a cryptographically secure temporary password and revokes all active sessions. The user will be required to change it upon login.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      fullWidth
                      isLoading={resetPasswordMutation.isPending}
                      onClick={() => resetPasswordMutation.mutate(undefined)}
                      icon={<RefreshCw className="w-4 h-4" />}
                    >
                      Generate & Revoke Sessions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        status={customPassword ? (passwordCheck.isValid ? 'valid' : 'invalid') : 'idle'}
                        validMessage={passwordCheck.message}
                        error={customPassword && !passwordCheck.isValid ? passwordCheck.message : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <Input
                      label="Confirm Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmCustomPassword}
                      onChange={(e) => setConfirmCustomPassword(e.target.value)}
                      status={confirmCustomPassword ? (confirmCheck.isValid ? 'valid' : 'invalid') : 'idle'}
                      validMessage="Passwords match"
                      error={confirmCustomPassword && !confirmCheck.isValid ? confirmCheck.message : undefined}
                    />

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      fullWidth
                      disabled={!passwordCheck.isValid || !confirmCheck.isValid}
                      isLoading={resetPasswordMutation.isPending}
                      onClick={() => resetPasswordMutation.mutate(customPassword)}
                    >
                      Set New Password
                    </Button>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView('menu')}
                  >
                    Back to Actions
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* View: Lock Account Confirmation */}
        {activeView === 'lock' && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isActive
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-semantic-danger' : 'text-semantic-success'
                  }`}
                />
                <h4 className="text-xs font-bold text-textDefault">
                  {isActive ? 'Confirm Account Lock' : 'Confirm Account Unlock'}
                </h4>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                {isActive
                  ? `Locking "${user.fullName || user.email}" will immediately suspend login access and terminate all active sessions.`
                  : `Unlocking "${user.fullName || user.email}" will restore normal login capabilities immediately.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveView('menu')}
              >
                Back
              </Button>
              <Button
                type="button"
                variant={isActive ? 'danger' : 'primary'}
                size="sm"
                isLoading={toggleLockMutation.isPending}
                onClick={() => toggleLockMutation.mutate()}
              >
                {isActive ? 'Confirm Lock' : 'Confirm Unlock'}
              </Button>
            </div>
          </div>
        )}

        {/* View: Force Logout Confirmation */}
        {activeView === 'logout' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="text-xs font-bold text-textDefault">Confirm Force Logout</h4>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                Revoking sessions will instantly log out {user.fullName || user.email} on all browsers and mobile apps. The user will need to log in again.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveView('menu')}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={forceLogoutMutation.isPending}
                onClick={() => forceLogoutMutation.mutate()}
              >
                Revoke All Sessions
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
export default AdminUserActionModal;
