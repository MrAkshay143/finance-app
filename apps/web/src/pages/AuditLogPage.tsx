import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Search,
  X,
  SlidersHorizontal,
  KeyRound,
  Shield,
  ArrowLeftRight,
  User,
  Settings,
  ShieldCheck,
  Laptop,
  MapPin,
  MoreVertical,
  Calendar,
  Layers,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { Pagination } from '../components/ui/Pagination.js';
import { apiClient } from '../services/apiClient.js';
import { formatDate, formatDateTime } from '../utils/date.js';
import { formatAuditAction, parseClientDevice } from '../utils/auditFormatters.js';
import type { AuditLogRecord } from '@finance/shared-types';

export const AuditLogPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inspectRecord, setInspectRecord] = useState<AuditLogRecord | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = ['All', 'Login', 'Transactions', 'Profile', 'Settings', 'Security'];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-audit-logs', selectedCategory, debouncedSearch],
    queryFn: async () => {
      const categoryParam = selectedCategory === 'All' ? undefined : selectedCategory;
      const res = await apiClient.audit.getUserAuditLogs({
        page: 1,
        pageSize: 50,
        category: categoryParam,
        search: debouncedSearch || undefined,
      });
      return (res as any)?.data || res;
    },
    placeholderData: keepPreviousData,
  });

  const logs: AuditLogRecord[] = useMemo(() => {
    const rawLogs = data?.logs || (Array.isArray(data) ? data : []);
    if (!Array.isArray(rawLogs)) return [];

    return rawLogs.filter((log) => {
      if (!debouncedSearch.trim()) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        log.action?.toLowerCase().includes(q) ||
        log.category?.toLowerCase().includes(q) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(q)
      );
    });
  }, [data, debouncedSearch]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;

  // Reset currentPage to 1 on search or category filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));

  // Clamp current page if logs list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated logs slice
  const paginatedLogs = useMemo(() => {
    return logs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [logs, currentPage]);

  // Group paginated logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [dateStr: string]: AuditLogRecord[] } = {};
    paginatedLogs.forEach((log) => {
      const dateKey = formatDate(log.createdAt) || 'Recent Activity';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    return groups;
  }, [paginatedLogs]);

  const getActionIcon = (action: string, category?: string) => {
    const cat = category?.toLowerCase() || '';
    const act = action?.toLowerCase() || '';

    if (cat.includes('login') || act.includes('login') || act.includes('auth')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
      );
    }
    if (cat.includes('transact') || act.includes('transact')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
      );
    }
    if (cat.includes('profile') || act.includes('profile') || act.includes('user')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <User className="w-5 h-5" />
        </div>
      );
    }
    if (cat.includes('setting') || act.includes('setting')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <Shield className="w-5 h-5" />
      </div>
    );
  };

  const formatTimestamp = (dateStr: string) => {
    return formatDateTime(dateStr);
  };

  return (
    <div className="flex-1 flex flex-col pb-8">
      <AppHeader
        variant="nested"
        title="Audit Log"
        subtitle="A record of key actions on your account"
        backTo="/menu"
      />

      <div className="p-4 space-y-4">

        {/* Search Bar + Filter Icon */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actions, type, details..."
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
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
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

        {/* Audit Log Stream */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
            <p className="text-xs text-rose-700 font-semibold">Failed to load audit logs.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shadow-xs">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-textDefault">That&apos;s all for now</h3>
              <p className="text-xs text-textMuted mt-0.5">
                You&apos;re all caught up! New activity will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedLogs).map(([dateLabel, entries]) => (
              <div key={dateLabel} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-textDefault">{dateLabel}</h3>
                  <span className="text-[11px] text-textMuted">
                    {entries.length} {entries.length === 1 ? 'event' : 'events'}
                  </span>
                </div>

                <div className="space-y-2">
                  {entries.map((log) => {
                    const client = parseClientDevice(log.details?.userAgent, log.ipAddress);
                    const actionInfo = formatAuditAction(log.action);
                    return (
                      <Card
                        key={log.id}
                        padding="sm"
                        className="bg-white border border-borderDefault shadow-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getActionIcon(log.action, log.category)}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className="text-xs font-bold text-textDefault truncate"
                                title={log.action}
                                data-action={log.action}
                              >
                                {actionInfo.title}
                              </h4>
                              <span className="text-[10px] text-textMuted shrink-0">
                                {formatTimestamp(log.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-textMuted mt-0.5 leading-tight">
                              {log.details?.description ||
                                log.details?.message ||
                                actionInfo.description ||
                                log.category ||
                                'Activity recorded.'}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-borderDefault/50">
                              <div className="flex items-center gap-3 text-[11px] text-textMuted">
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
                                aria-label="View event details"
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
                </div>
              </div>
            ))}

            {/* Centralized App-Style Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={logs.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="logs"
            />

            {/* End of Feed Illustration */}
            <div className="pt-4 pb-2 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-textDefault">That&apos;s all for now</h4>
                <p className="text-[11px] text-textMuted mt-0.5">
                  You&apos;re all caught up! New activity will appear here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!inspectRecord}
        onClose={() => setInspectRecord(null)}
        title="Audit Event Details"
        subtitle={`ID: ${inspectRecord?.id?.slice(0, 8)}...`}
        icon={<ShieldCheck className="w-5 h-5 text-brand-primary" />}
        footer={
          <Button variant="primary" size="sm" fullWidth onClick={() => setInspectRecord(null)}>
            Done
          </Button>
        }
      >
        {inspectRecord && (
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-textMuted">Action:</span>
                <span className="font-semibold text-textDefault">{formatAuditAction(inspectRecord.action).title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Technical ID:</span>
                <span className="font-mono text-[11px] text-textMuted">{inspectRecord.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Category:</span>
                <span className="font-semibold text-textDefault">{inspectRecord.category || formatAuditAction(inspectRecord.action).category || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Timestamp:</span>
                <span className="text-textDefault">{formatTimestamp(inspectRecord.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Device:</span>
                <span className="font-semibold text-textDefault">{parseClientDevice(inspectRecord.details?.userAgent, inspectRecord.ipAddress).device}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Location:</span>
                <span className="font-mono text-textDefault">{parseClientDevice(inspectRecord.details?.userAgent, inspectRecord.ipAddress).location}</span>
              </div>
            </div>

            {inspectRecord.details && (
              <div className="space-y-1">
                <span className="font-bold text-textDefault uppercase text-[10px] tracking-wider">
                  Event Metadata
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
