import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  KeyRound,
  AlertTriangle,
  Check,
  RotateCcw,
  Trash2,
  Lock,
  User,
  Calendar,
  Clock,
  Mail,
  Hash,
  Copy,
  ChevronRight,
  Pencil,
  Ban,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  Unlock,
  LogOut,
  ArrowLeftFromLine,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { SegmentedControl } from '../components/ui/SegmentedControl.js';
import { apiClient } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import type { AdminUserDetails, AdminUserItem } from '@finance/shared-types';

export const ManageUserDetailTabsPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'security'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch user details
  const { data: userDetails, isLoading, isError } = useQuery<AdminUserDetails>({
    queryKey: ['admin-user-details', id],
    queryFn: async () => {
      const res = await apiClient.admin.getUserDetails(id);
      return (res as any)?.data || res;
    },
    enabled: !!id,
  });

  const user: AdminUserItem | undefined = userDetails?.user;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (payload: { role?: 'USER' | 'ADMIN'; status?: 'ACTIVE' | 'SUSPENDED'; unlockAccount?: boolean }) => {
      return await apiClient.admin.updateUser(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('User settings updated successfully');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to update user');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.admin.resetUserPassword(id);
    },
    onSuccess: (res: any) => {
      const tempPass = res?.data?.temporaryPassword || res?.temporaryPassword || '';
      setTempPasswordModal(tempPass);
      showToast('Temporary password generated');
    },
  });

  // Reset KBA mutation
  const resetKbaMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.admin.resetUserKba(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', id] });
      showToast('KBA security questions reset');
    },
  });

  // Soft delete mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.admin.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      navigate('/admin/users');
    },
  });

  const getInitials = (u?: AdminUserItem) => {
    if (!u) return 'U';
    if (u.fullName) {
      const parts = u.fullName.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return u.fullName.slice(0, 2).toUpperCase();
    }
    return (u.email?.[0] || 'U').toUpperCase();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not recorded';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-8">
        <AppHeader variant="nested" title="Manage User" subtitle="Loading controls..." backTo={`/admin/users/${id}`} />
        <div className="p-4 space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex-1 flex flex-col pb-8">
        <AppHeader variant="nested" title="Manage User" subtitle="User not found" backTo="/admin/users" />
        <div className="p-4 text-center space-y-3">
          <p className="text-xs text-rose-700 font-semibold">User could not be found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
            Back to User Directory
          </Button>
        </div>
      </div>
    );
  }

  const isActive = user.status === 'ACTIVE';
  const isAdmin = user.role === 'ADMIN';

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
        title="Manage User"
        subtitle="View and manage user account"
        backTo={`/admin/users/${id}`}
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
        {/* User Card */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/70 border border-blue-100 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-brand-primary text-lg font-bold flex items-center justify-center border-2 border-blue-200">
                {getInitials(user)}
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                  isActive ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-textDefault leading-tight truncate">
                {user.fullName || user.email.split('@')[0]}
              </h3>
              <p className="text-xs text-textMuted mt-0.5 leading-tight truncate">{user.email}</p>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-primary">
                  {user.role}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/admin/users/${id}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-borderDefault shadow-xs rounded-full text-xs font-semibold text-brand-primary hover:bg-blue-50 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit User</span>
          </button>
        </div>

        {/* 3-Tab Sub Navigation */}
        <SegmentedControl
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'permissions', label: 'Permissions' },
            { value: 'security', label: 'Security' },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v as any)}
          size="sm"
          aria-label="User management tabs"
        />

        {/* Toast */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Account Details Card */}
            <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
              <div className="p-3.5 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                  <span className="text-xs font-bold text-textDefault">Account Details</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-textMuted">
                  <span>User ID</span>
                  <span className="font-mono text-[11px] text-textDefault truncate max-w-[120px]">
                    {user.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.id, 'id')}
                    className="p-1 hover:text-brand-primary rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                    aria-label="Copy User ID"
                  >
                    {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="text-textMuted">Joined</span>
                <span className="font-semibold text-textDefault">{formatDate(user.createdAt)}</span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="text-textMuted">Last login</span>
                <span className="font-semibold text-textDefault">{formatDate(user.lastLoginAt)}</span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="text-textMuted">Onboarding</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.onboardingCompleted
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {user.onboardingCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="text-textMuted">Email</span>
                <span className="font-semibold text-textDefault truncate max-w-[200px]">{user.email}</span>
              </div>
            </Card>

            {/* Account Actions Section */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-textDefault">Account Actions</h3>
              <p className="text-[11px] text-textMuted">Manage this user&apos;s access and security.</p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    updateUserMutation.mutate({ status: isActive ? 'SUSPENDED' : 'ACTIVE' })
                  }
                  className="bg-white border border-borderDefault rounded-2xl p-3.5 shadow-xs hover:border-slate-300 transition-colors text-left flex items-start justify-between"
                >
                  <div>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                        isActive ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isActive ? <Ban className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>
                    <div className="text-xs font-bold text-textDefault leading-tight">
                      {isActive ? 'Disable User' : 'Enable User'}
                    </div>
                    <div className="text-[10px] text-textMuted leading-tight mt-0.5">
                      {isActive ? 'Temporarily block access' : 'Restore access'}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateUserMutation.mutate({ role: isAdmin ? 'USER' : 'ADMIN' })
                  }
                  className="bg-white border border-borderDefault rounded-2xl p-3.5 shadow-xs hover:border-slate-300 transition-colors text-left flex items-start justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-textDefault leading-tight">
                      {isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </div>
                    <div className="text-[10px] text-textMuted leading-tight mt-0.5">
                      {isAdmin ? 'Revoke admin permissions' : 'Grant admin permissions'}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </button>

                <button
                  type="button"
                  onClick={() => resetPasswordMutation.mutate()}
                  className="bg-white border border-borderDefault rounded-2xl p-3.5 shadow-xs hover:border-slate-300 transition-colors text-left flex items-start justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-textDefault leading-tight">
                      Reset Password
                    </div>
                    <div className="text-[10px] text-textMuted leading-tight mt-0.5">
                      Generate temporary password
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </button>

                <button
                  type="button"
                  onClick={() => resetKbaMutation.mutate()}
                  className="bg-white border border-borderDefault rounded-2xl p-3.5 shadow-xs hover:border-slate-300 transition-colors text-left flex items-start justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center mb-2">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-textDefault leading-tight">
                      Reset KBA
                    </div>
                    <div className="text-[10px] text-textMuted leading-tight mt-0.5">
                      Reset security questions
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </button>
              </div>
            </div>

            {/* Delete Account Card */}
            <Card padding="none" className="bg-rose-50/40 border border-rose-200/60 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-rose-100/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-600">Delete Account</div>
                    <div className="text-[11px] text-rose-500">Deactivate and soft delete this account</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </Card>
          </div>
        )}

        {/* TAB 2: PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="space-y-4">
            <Card padding="sm" className="bg-white border border-borderDefault shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-textDefault">Admin Role Status</h3>
                  <p className="text-[11px] text-textMuted mt-0.5 leading-relaxed">
                    Access to user directory, settings, and audit logs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateUserMutation.mutate({ role: isAdmin ? 'USER' : 'ADMIN' })
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    isAdmin ? 'bg-brand-primary' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle admin role"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                      isAdmin ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-borderDefault pt-3 space-y-2 text-xs">
                <span className="font-bold text-textDefault uppercase text-[10px] tracking-wider">
                  Granted Capabilities
                </span>
                <div className="space-y-1.5 text-textMuted">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View all system user profiles and balances</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manage security policies and timeouts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Inspect global audit log stream</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Execute account suspensions and KBA resets</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-textDefault">Failed Login Attempts</div>
                  <div className="text-[11px] text-textMuted">Consecutive failed login counter</div>
                </div>
                <span className="font-bold font-mono text-sm px-2.5 py-0.5 bg-slate-100 rounded-lg">
                  {user.failedLoginAttempts || 0}
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-textDefault">Account Lockout</div>
                  <div className="text-[11px] text-textMuted">
                    {user.lockedUntil ? `Locked until ${formatDate(user.lockedUntil)}` : 'No active lockout'}
                  </div>
                </div>
                {user.lockedUntil ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Unlock className="w-3.5 h-3.5" />}
                    onClick={() => updateUserMutation.mutate({ unlockAccount: true })}
                  >
                    Unlock
                  </Button>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    Normal
                  </span>
                )}
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-textDefault">Knowledge-Based Authentication</div>
                  <div className="text-[11px] text-textMuted">Configured security questions</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetKbaMutation.mutate()}
                >
                  Reset KBA
                </Button>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-textDefault">Temporary Password</div>
                  <div className="text-[11px] text-textMuted">Generate temporary one-time password</div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => resetPasswordMutation.mutate()}
                >
                  Reset Password
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Temp Password Generated Modal */}
      <Modal
        isOpen={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        title="Password Reset Successful"
        subtitle="Share this temporary password with the user"
        icon={<Lock className="w-5 h-5 text-emerald-600" />}
        footer={
          <Button variant="primary" size="sm" fullWidth onClick={() => setTempPasswordModal(null)}>
            Done
          </Button>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-textMuted">
            A temporary password has been generated for <strong>{user.email}</strong>.
          </p>
          <div className="p-3 bg-slate-900 text-slate-100 rounded-xl flex items-center justify-between font-mono">
            <span className="font-bold text-sm">{tempPasswordModal}</span>
            <button
              type="button"
              onClick={() => {
                if (tempPasswordModal) {
                  navigator.clipboard.writeText(tempPasswordModal);
                  showToast('Password copied to clipboard');
                }
              }}
              className="px-2.5 py-1 bg-brand-primary rounded-lg text-white font-sans text-[11px] font-bold hover:bg-blue-600"
            >
              Copy
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      {(() => {
        const dialogDef = CONFIRM_DIALOGS.admin.softDeleteUser(user.email);
        return (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title={dialogDef.title}
            subtitle={`User ID: ${user.id}`}
            icon={<Trash2 className="w-5 h-5 text-rose-600" />}
            footer={
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" fullWidth onClick={() => setIsDeleteModalOpen(false)}>
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  isLoading={deleteUserMutation.isPending}
                  onClick={() => deleteUserMutation.mutate()}
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
    </div>
  );
};
