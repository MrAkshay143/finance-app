import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Calendar,
  X,
  Laptop,
  MapPin,
  MoreVertical,
  KeyRound,
  Shield,
  User,
  Settings,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  RotateCw,
  LogOut,
  ArrowLeftFromLine,
  Download,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { CustomDropdown } from '../components/ui/CustomDropdown.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import { Pagination } from '../components/ui/Pagination.js';
import { formatAuditAction, formatAuditActionLabel, getAuditCategoryBadge, parseClientDevice } from '../utils/auditFormatters.js';
import { formatRelativeTime } from '../utils/date.js';
import type { AuditLogRecord } from '@finance/shared-types';

export const AdminAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inspectRecord, setInspectRecord] = useState<AuditLogRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const pageSize = 15;
  const categories = ['All', 'Login', 'Profile', 'Settings', 'Security', 'Admin'];

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
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
      toast.success('Audit logs exported');
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err, 'Failed to export audit logs'));
    } finally {
      setIsExporting(false);
    }
  };

  // Query audit logs
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-logs', filterCategory, debouncedSearch],
    queryFn: async () => {
      const cat = filterCategory === 'All' ? undefined : filterCategory;
      const res = await apiClient.admin.getAuditLogs({
        page: 1,
        pageSize: 50,
        category: cat,
        search: debouncedSearch || undefined,
      });
      return (res as any)?.data || res;
    },
    placeholderData: keepPreviousData,
  });

  const logs: AuditLogRecord[] = useMemo(() => {
    const raw = data?.logs || (Array.isArray(data) ? data : []);
    if (!Array.isArray(raw)) return [];

    let filtered = raw.filter((log) => {
      if (!debouncedSearch.trim()) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        log.actorEmail?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.category?.toLowerCase().includes(q) ||
        log.ipAddress?.toLowerCase().includes(q) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [data, debouncedSearch, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, debouncedSearch, sortOrder]);

  // Clamp current page to total pages if results shrink
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getActionIcon = (action: string, category?: string) => {
    const act = action?.toLowerCase() || '';
    const cat = category?.toLowerCase() || '';

    if (act.includes('login') || cat.includes('login')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
      );
    }
    if (act.includes('role') || act.includes('admin') || cat.includes('admin')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5" />
        </div>
      );
    }
    if (act.includes('profile') || cat.includes('profile')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
          <User className="w-5 h-5" />
        </div>
      );
    }
    if (act.includes('setting') || cat.includes('setting')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-5 h-5" />
      </div>
    );
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
        title="Activity Audit"
        subtitle="Track all important account activities"
        backTo="/admin"
        rightAction={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refetch()}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Refresh audit logs"
              title="Refresh logs"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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
        {/* Search Input + Filter button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search email, action or details..."
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

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-borderDefault rounded-xl text-xs font-semibold text-textDefault hover:bg-slate-50 transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-textMuted" />
            <span>Filter</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = filterCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-white border border-borderDefault text-textDefault hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Activity Header with Sort & Export */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-textDefault">
            Activity ({logs.length})
          </h3>

          <div className="flex items-center gap-2 text-xs text-textMuted">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              isLoading={isExporting}
              icon={<Download className="w-3.5 h-3.5 shrink-0" />}
              className="whitespace-nowrap shrink-0 min-h-[32px] px-2.5"
              title="Export all audit logs as CSV"
            >
              Export CSV
            </Button>

            <div className="w-32 shrink-0">
              <CustomDropdown
                size="sm"
                value={sortOrder}
                onChange={(val) => setSortOrder(val as any)}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                ]}
                searchable={false}
                aria-label="Sort audit activity"
              />
            </div>
          </div>
        </div>

        {/* Activity Stream */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
            <p className="text-xs text-rose-700 font-semibold">Failed to load system audit stream.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-white rounded-2xl border border-borderDefault p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-textDefault">No audit logs found</h4>
            <p className="text-[11px] text-textMuted">No security events matching the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((log) => {
              const client = parseClientDevice(log.details?.userAgent, log.ipAddress);
              const actorEmail = log.actorEmail || 'system';
              const categoryBadge = getAuditCategoryBadge(log.category);
              return (
                <Card
                  key={log.id}
                  padding="sm"
                  className="bg-white border border-borderDefault shadow-card hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getActionIcon(log.action, log.category)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4
                              className="text-xs font-bold text-textDefault leading-tight"
                              title={log.action}
                              data-action={log.action}
                            >
                              {formatAuditAction(log.action).title}
                            </h4>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${categoryBadge.className}`}>
                              {categoryBadge.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-textMuted mt-0.5 leading-tight">
                            {`${formatAuditAction(log.action).title} • by ${actorEmail}`}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-textMuted">
                            {formatRelativeTime(log.createdAt)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Success
                          </span>
                        </div>
                      </div>

                      <div className="mt-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700 truncate max-w-full">
                          email: {actorEmail}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-borderDefault/50 text-[11px] text-textMuted">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Laptop className="w-3.5 h-3.5 text-slate-400" />
                            <span>{client.device}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{client.location}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectRecord(log)}
                          aria-label="View log details"
                          className="p-1 rounded-lg text-slate-400 hover:text-textDefault hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                        >
                          <MoreVertical className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Centralized Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={logs.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              itemLabel="events"
            />
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={!!inspectRecord}
        onClose={() => setInspectRecord(null)}
        title="System Audit Event"
        subtitle={`ID: ${inspectRecord?.id}`}
        icon={<ShieldCheck className="w-5 h-5 text-brand-primary" />}
        footer={
          <Button variant="primary" size="sm" fullWidth onClick={() => setInspectRecord(null)}>
            Done
          </Button>
        }
      >
        {inspectRecord && (
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-textDefault">
              <div className="flex justify-between">
                <span className="text-textMuted">Action:</span>
                <span className="font-semibold text-textDefault">{formatAuditAction(inspectRecord.action).title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Technical ID:</span>
                <span className="font-mono text-[11px] text-textMuted">{inspectRecord.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Actor:</span>
                <span className="font-semibold truncate max-w-[200px]">{inspectRecord.actorEmail || 'System'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Timestamp:</span>
                <span>{new Date(inspectRecord.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Device:</span>
                <span className="font-semibold text-textDefault">{parseClientDevice(inspectRecord.details?.userAgent, inspectRecord.ipAddress).device}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Location:</span>
                <span className="font-mono">{parseClientDevice(inspectRecord.details?.userAgent, inspectRecord.ipAddress).location}</span>
              </div>
            </div>

            {inspectRecord.details && (
              <div className="space-y-1">
                <span className="font-bold text-textDefault uppercase text-[10px] tracking-wider">
                  Raw Event Metadata
                </span>
                <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40">
                  {JSON.stringify(inspectRecord.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
