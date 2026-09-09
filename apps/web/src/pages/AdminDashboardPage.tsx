import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  ChevronRight,
  Settings,
  FileText,
  Filter,
  MoreVertical,
  ChevronDown,
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
import { AdminUserActionModal } from '../components/admin/AdminUserActionModal.js';
import type { AdminDashboardMetrics, AdminUserItem } from '@finance/shared-types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ADMIN'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const [actionModalUser, setActionModalUser] = useState<AdminUserItem | null>(null);

  // Query Metrics
  const { data: metricsData, isLoading: isMetricsLoading } = useQuery<AdminDashboardMetrics>({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      const res = await apiClient.admin.getDashboard();
      return (res as any)?.data || res;
    },
  });

  // Query Users
  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useQuery<AdminUserItem[]>({
    queryKey: ['admin-users', filter, search, sortBy],
    queryFn: async () => {
      const params: any = { pageSize: 50 };
      if (search) params.search = search;
      if (filter === 'ACTIVE') params.status = 'ACTIVE';
      if (filter === 'SUSPENDED') params.status = 'SUSPENDED';
      if (filter === 'ADMIN') params.role = 'ADMIN';

      const res = await apiClient.admin.getUsers(params);
      const raw = (res as any)?.data?.users || (res as any)?.users || (Array.isArray(res) ? res : []);
      return Array.isArray(raw) ? raw : [];
    },
  });

  const users = useMemo(() => {
    const list = Array.isArray(usersData) ? [...usersData] : [];
    return list.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.fullName || a.email || '';
        const nameB = b.fullName || b.email || '';
        return nameA.localeCompare(nameB);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [usersData, sortBy]);

  const metrics = {
    totalUsers: metricsData?.totalUsers ?? users.length,
    activeUsers: metricsData?.activeUsers ?? users.filter((u) => u.status === 'ACTIVE').length,
    suspendedUsers: metricsData?.suspendedUsers ?? users.filter((u) => u.status === 'SUSPENDED').length,
    adminUsers: metricsData?.adminUsers ?? metricsData?.adminsCount ?? users.filter((u) => u.role === 'ADMIN').length,
  };

  const getInitials = (user: AdminUserItem) => {
    if (user.fullName) {
      const parts = user.fullName.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.fullName.slice(0, 2).toUpperCase();
    }
    return (user.email?.[0] || 'U').toUpperCase() + (user.email?.[1] || '').toUpperCase();
  };

  const formatLastActive = (user: AdminUserItem) => {
    if (!user.lastLoginAt) return 'Never logged in';
    const diffMs = Date.now() - new Date(user.lastLoginAt).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `Last active ${diffDays}d ago`;
    if (diffHours > 0) return `Last active ${diffHours}h ago`;
    return 'Last active recently';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-8">
      <AppHeader
        variant="nested"
        title="Admin"
        subtitle="Manage users and permissions"
        backTo="/dashboard"
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
              onClick={() => navigate('/admin/audit')}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B3A]"
              aria-label="Activity Audit"
              title="Audit Logs"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/settings')}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B3A]"
              aria-label="Admin Settings"
              title="Platform Settings"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
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
        {/* 4 Metric Cards */}
        <div className="grid grid-cols-4 gap-2">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-3 flex flex-col justify-between shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xl font-black leading-tight">
                {isMetricsLoading ? '0' : metrics.totalUsers}
              </div>
              <div className="text-[10px] text-blue-100 font-medium leading-tight mt-0.5">
                Total Users
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex flex-col justify-between shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-black text-emerald-900 leading-tight">
                {isMetricsLoading ? '0' : metrics.activeUsers}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium leading-tight mt-0.5">
                Active
              </div>
            </div>
          </div>

          {/* Suspended */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex flex-col justify-between shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-black text-amber-900 leading-tight">
                {isMetricsLoading ? '0' : metrics.suspendedUsers}
              </div>
              <div className="text-[10px] text-amber-700 font-medium leading-tight mt-0.5">
                Suspended
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 flex flex-col justify-between shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-black text-purple-900 leading-tight">
                {isMetricsLoading ? '0' : metrics.adminUsers}
              </div>
              <div className="text-[10px] text-purple-700 font-medium leading-tight mt-0.5">
                Admins
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar + Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-borderDefault rounded-xl text-xs text-textDefault placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-borderDefault rounded-xl text-xs font-semibold text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              aria-label="Filter users"
            >
              <option value="ALL">Filter: All</option>
              <option value="ACTIVE">Filter: Active</option>
              <option value="SUSPENDED">Filter: Suspended</option>
              <option value="ADMIN">Filter: Admins</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-textMuted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Header row: Users count and Sort */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-textDefault">
            Users ({users.length})
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-textMuted">
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-textDefault focus:outline-none cursor-pointer"
              aria-label="Sort users"
            >
              <option value="name">Name</option>
              <option value="recent">Recent</option>
            </select>
          </div>
        </div>

        {/* User List */}
        {isUsersLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : isUsersError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
            <p className="text-xs text-rose-700 font-semibold">Failed to load users list.</p>
            <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
              Retry
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-white rounded-2xl border border-borderDefault p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-textDefault">No users found</h4>
            <p className="text-[11px] text-textMuted">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {users.map((item) => {
              const initials = getInitials(item);
              const isActive = item.status === 'ACTIVE';
              const isAdmin = item.role === 'ADMIN';

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/admin/users/${item.id}`)}
                  className="bg-white border border-borderDefault rounded-2xl p-3.5 shadow-xs hover:border-slate-300 active:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar Initials with Status Dot */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-brand-primary font-bold text-xs flex items-center justify-center border border-blue-100">
                        {initials}
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                          isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-textDefault leading-tight truncate">
                        {item.fullName || item.email.split('@')[0]}
                      </h4>
                      <p className="text-[11px] text-textMuted mt-0.5 leading-tight truncate">
                        {item.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-textMuted">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{isActive ? 'Active' : 'Suspended'}</span>
                        <span>•</span>
                        <span>{formatLastActive(item)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Badges & Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          <Shield className="w-2.5 h-2.5" />
                          ADMIN
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionModalUser(item);
                      }}
                      aria-label={`Options for ${item.fullName || item.email}`}
                      title="User Actions"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info Banner */}
        <div className="pt-4 pb-2 flex flex-col items-center justify-center text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-textDefault">All users are here!</h4>
          <p className="text-[11px] text-textMuted max-w-[260px]">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
      </div>

      {/* Admin User Action Modal */}
      <AdminUserActionModal
        isOpen={Boolean(actionModalUser)}
        user={actionModalUser}
        onClose={() => setActionModalUser(null)}
        onSuccess={() => refetchUsers()}
      />
    </div>
  );
};
