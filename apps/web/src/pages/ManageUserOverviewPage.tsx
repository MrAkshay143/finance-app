import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Calendar,
  Clock,
  Shield,
  Hash,
  Copy,
  Check,
  Pencil,
  Ban,
  UserCheck,
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Trash2,
  ChevronRight,
  Sliders,
  AlertTriangle,
  Lock,
  LogOut,
  ArrowLeftFromLine,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { apiClient } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { formatDateTime } from '../utils/date.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import type { AdminUserDetails, AdminUserItem } from '@finance/shared-types';

export const ManageUserOverviewPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit user state
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // Fetch user details
  const { data: userDetails, isLoading, isError, refetch } = useQuery<AdminUserDetails>({
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

  // Update user mutation (status, role, name)
  const updateUserMutation = useMutation({
    mutationFn: async (payload: { role?: 'USER' | 'ADMIN'; status?: 'ACTIVE' | 'SUSPENDED'; firstName?: string; lastName?: string }) => {
      return await apiClient.admin.updateUser(id, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsEditModalOpen(false);
      showToast('User record updated successfully');
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
    onError: (err: any) => {
      showToast(err?.message || 'Failed to reset password');
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
    onError: (err: any) => {
      showToast(err?.message || 'Failed to reset KBA');
    },
  });

  // Soft Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.admin.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      navigate('/admin/users');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to delete user');
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

  const formatDateWithRelative = (dateStr?: string | null) => {
    if (!dateStr) return 'Not recorded';
    return formatDateTime(dateStr) || dateStr;
  };

  const openEditModal = () => {
    if (user) {
      setEditFullName(user.fullName || '');
      setEditRole(user.role as any);
      setEditStatus(user.status as any);
      setIsEditModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-8">
        <AppHeader variant="nested" title="Manage User" subtitle="Loading user record..." backTo="/admin/users" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex-1 flex flex-col pb-8">
        <AppHeader variant="nested" title="Manage User" subtitle="User not found" backTo="/admin/users" />
        <div className="p-4 text-center space-y-3">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
            <p className="text-xs text-rose-700 font-semibold">Could not find user with ID {id}.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
            Back to Users
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
        subtitle="View details and manage user account"
        backTo="/admin/users"
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
              onClick={() => navigate(`/admin/users/${id}/manage`)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
              aria-label="User Detail Tabs"
              title="User Detail Tabs"
            >
              <Sliders className="w-4 h-4" />
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
        {/* Toast */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* User Profile Card */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/70 border border-blue-100 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-brand-primary text-xl font-bold flex items-center justify-center border-2 border-blue-200">
                {getInitials(user)}
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                  isActive ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-textDefault leading-tight truncate">
                {user.fullName || user.email.split('@')[0]}
              </h3>
              <p className="text-xs text-textMuted mt-0.5 leading-tight truncate">{user.email}</p>

              <div className="flex items-center gap-2 mt-2">
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
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-borderDefault shadow-xs rounded-full text-xs font-semibold text-brand-primary hover:bg-blue-50 active:scale-95 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
          >
            <Pencil className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
            <span>Edit</span>
          </button>
        </div>

        {/* Metadata Details Card */}
        <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
          {/* Email */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-textMuted">Email Address</div>
                <div className="text-xs font-bold text-textDefault truncate">{user.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(user.email, 'email')}
              className="p-1.5 text-slate-400 hover:text-brand-primary rounded-lg hover:bg-slate-50 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
              aria-label="Copy email"
            >
              {copiedField === 'email' ? (
                <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Joined Date */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[11px] text-textMuted">Joined</div>
                <div className="text-xs font-bold text-textDefault">
                  {formatDateWithRelative(user.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Last Login */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[11px] text-textMuted">Last Login</div>
                <div className="text-xs font-bold text-textDefault">
                  {formatDateWithRelative(user.lastLoginAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[11px] text-textMuted">Onboarding</div>
                <div className="text-xs font-bold text-textDefault">
                  {user.onboardingCompleted ? 'Completed' : 'Pending'}
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                user.onboardingCompleted
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {user.onboardingCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>

          {/* User ID */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-textMuted">User ID</div>
                <div className="text-xs font-mono font-bold text-textDefault truncate">
                  {user.id}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(user.id, 'id')}
              className="p-1.5 text-slate-400 hover:text-brand-primary rounded-lg hover:bg-slate-50 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
              aria-label="Copy user ID"
            >
              {copiedField === 'id' ? (
                <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Card>

        {/* Account Actions (2x2 grid) */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-textDefault">Account Actions</h3>
          <p className="text-[11px] text-textMuted">Manage this user&apos;s access, role and security.</p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Disable / Enable User */}
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
                  {isActive ? 'Temporarily block user access.' : 'Restore user access.'}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </button>

            {/* Make / Remove Admin */}
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
                  {isAdmin ? 'Revoke admin access.' : 'Grant admin permissions.'}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </button>

            {/* Reset Password */}
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
                  Generate temporary password.
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </button>

            {/* Reset KBA */}
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
                  Reset security questions.
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-1.5">
          <div className="p-4 bg-rose-50/50 border border-rose-200/70 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              <div>
                <h4 className="text-xs font-bold">Danger Zone</h4>
                <p className="text-[11px] text-rose-600">These actions are permanent or affect user access.</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              fullWidth
              className="bg-white border-rose-300 text-rose-600 hover:bg-rose-50"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </Button>

            <p className="text-[10px] text-textMuted text-center leading-relaxed">
              Soft delete: account is hidden and access revoked; data is retained.
            </p>
          </div>
        </div>

        {/* Navigate to 3 Tabs Page */}
        <Button
          variant="outline"
          size="md"
          fullWidth
          icon={<Sliders className="w-4 h-4" />}
          onClick={() => navigate(`/admin/users/${id}/manage`)}
        >
          Advanced Controls & Permissions
        </Button>
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
        subtitle={`Editing ${user.email}`}
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" fullWidth onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              isLoading={updateUserMutation.isPending}
              onClick={() => {
                const parts = editFullName.trim().split(' ');
                updateUserMutation.mutate({
                  firstName: parts[0] || '',
                  lastName: parts.slice(1).join(' ') || '',
                  role: editRole,
                  status: editStatus,
                });
              }}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Full Name"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-textDefault">System Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              className="w-full p-2.5 bg-white border border-borderDefault rounded-xl text-xs font-semibold text-textDefault"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-textDefault">Account Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full p-2.5 bg-white border border-borderDefault rounded-xl text-xs font-semibold text-textDefault"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </Modal>

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
            A temporary password has been generated for <strong>{user.email}</strong>. The user will be required to change it on their next login.
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
            compact
            title={dialogDef.title}
            icon={<Trash2 className="w-4 h-4 text-rose-600" />}
            footer={
              <>
                <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={deleteUserMutation.isPending}
                  onClick={() => deleteUserMutation.mutate()}
                >
                  {dialogDef.confirmLabel}
                </Button>
              </>
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
