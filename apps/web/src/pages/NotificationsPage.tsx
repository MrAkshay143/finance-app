import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { Skeleton } from '../components/ui/Skeleton.js';
import {
  ChevronLeft,
  Calendar,
  Info,
  CheckSquare,
  Shield,
  ShieldCheck,
  Bell,
  AlertTriangle,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Pagination } from '../components/ui/Pagination.js';
import { toast } from '../store/toastStore.js';
import { apiClient, getStoredAccessToken, getFriendlyErrorMessage } from '../services/apiClient.js';
import { FinanceSocketManager } from '@finance/api-client';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import { useUiStore } from '../store/uiStore.js';
import { getSocketBaseUrl } from '../hooks/useRealtimeSync.js';
import { formatRelativeTime } from '../utils/date.js';
import type { NotificationItem, Reminder } from '@finance/shared-types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useSafeQueryClient();
  const setUnreadCount = useUiStore((state) => state.setUnreadCount);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [reminderDays, setReminderDays] = useState<number>(2);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [tempEnabled, setTempEnabled] = useState<boolean>(true);
  const [tempDays, setTempDays] = useState<number>(2);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Fetch Reminders
  const { data: remindersData } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      return await apiClient.reminders.list();
    },
  }, queryClient);

  // Sync reminder state from server if exists
  useEffect(() => {
    if (remindersData && remindersData.length > 0) {
      const primaryReminder = remindersData[0];
      setRemindersEnabled(primaryReminder.enabled);
      const days = primaryReminder.timingConfig?.daysBefore;
      if (typeof days === 'number' && days >= 1 && days <= 5) {
        setReminderDays(days);
      }
    }
  }, [remindersData]);

  // Fetch Notifications
  const { data: notificationsResponse, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ['notifications', activeFilter],
    queryFn: async () => {
      return await apiClient.notifications.list({
        filter: activeFilter === 'all' ? undefined : activeFilter,
        page: 1,
        pageSize: 50,
      });
    },
    placeholderData: keepPreviousData,
  }, queryClient);

  // Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.notifications.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      apiClient.notifications.getUnreadCount().then((res) => setUnreadCount(res.count)).catch(() => {});
    },
  }, queryClient);

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.notifications.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
    },
  }, queryClient);

  // Save / Update Reminder preference
  const saveReminderConfig = async (enabled: boolean, days: number) => {
    try {
      if (remindersData && remindersData.length > 0) {
        const id = remindersData[0].id;
        await apiClient.reminders.update(id, {
          enabled,
          timingConfig: { daysBefore: days },
        });
      } else {
        await apiClient.reminders.create({
          type: 'RECURRING_EXPENSE',
          timingConfig: { daysBefore: days },
          enabled,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    } catch {
      // Fallback: keep local state
    }
  };

  const handleToggleReminders = () => {
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    saveReminderConfig(next, reminderDays);
  };

  const handleSelectDays = (days: number) => {
    setReminderDays(days);
    saveReminderConfig(remindersEnabled, days);
  };

  // Realtime Socket.IO Connection for Notifications
  useEffect(() => {
    const socketUrl = getSocketBaseUrl();
    const socketManager = new FinanceSocketManager({
      url: socketUrl,
      getAccessToken: () => getStoredAccessToken(),
    });

    socketManager
      .connectNotifications(
        () => {
          // Invalidate notifications cache on new notification event
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        (count: number) => {
          setUnreadCount(count);
        }
      )
      .catch(() => {
        // Socket connection silent failover
      });

    return () => {
      socketManager.disconnectAll();
    };
  }, [queryClient, setUnreadCount]);

  const items = notificationsResponse?.items || [];
  const unreadCount = notificationsResponse?.unreadCount ?? items.filter((i) => !i.read).length;

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SECURITY_REMINDER':
      case 'KBA_ALERT':
        return <ShieldCheck className="w-5 h-5 text-brand-primary stroke-[2.2]" />;
      case 'DUE_DATE':
      case 'REMINDER':
        return <Calendar className="w-5 h-5 text-brand-primary stroke-[2.2]" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-semantic-warning stroke-[2.2]" />;
      default:
        return <Bell className="w-5 h-5 text-brand-primary stroke-[2.2]" />;
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) {
      markAsReadMutation.mutate(item.id);
    }
    setSelectedNotification(item);
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Branded Nested Header */}
      <AppHeader
        variant="nested"
        title="Notifications"
        subtitle="Manage your alerts and reminders"
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">

        {/* Compact Due-Date Reminders Card */}
        <Card padding="sm" className="bg-white border-slate-200 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 truncate">
                Due-Date Reminders
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {remindersEnabled
                  ? `Active • ${reminderDays} ${reminderDays === 1 ? 'day' : 'days'} before due date`
                  : 'Disabled • Tap Manage to configure'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTempEnabled(remindersEnabled);
              setTempDays(reminderDays);
              setIsReminderModalOpen(true);
            }}
            className="!py-1 !px-2.5 !text-xs shrink-0 whitespace-nowrap"
          >
            Manage
          </Button>
        </Card>

        {/* Filter Segmented Control: All, Unread, Read */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeFilter === 'all'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeFilter === 'unread'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('read')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeFilter === 'read'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Read
          </button>
        </div>

        {/* Action row: N unread notification(s) & Mark all as read button */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-medium text-slate-600">
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            className="flex items-center gap-1.5 font-bold text-brand-primary hover:text-blue-700 transition-colors"
          >
            <CheckSquare className="w-4 h-4 stroke-[2.2]" />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Notification Item Cards List */}
        {isNotificationsLoading && !notificationsResponse ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : items.length === 0 ? (
          <Card padding="md" className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-white border-slate-200">
            <Bell className="w-8 h-8 text-slate-300" />
            <h4 className="text-xs font-bold text-slate-800">No notifications right now</h4>
            <p className="text-[11px] text-slate-500">You are all caught up! New alerts will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex items-start gap-3 relative ${
                  item.read
                    ? 'bg-white border-slate-200 opacity-80'
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
              >
                {/* Unread blue dot indicator */}
                {!item.read && (
                  <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-3" />
                )}

                {/* Icon badge in soft-blue square */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  {getNotificationIcon(item.type)}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                </div>

                {/* Right chevron */}
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
              </div>
            ))}

            {/* Centralized Pagination */}
            {items.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={items.length}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                itemLabel="notifications"
              />
            )}
          </div>
        )}
      </div>

      {/* Due-Date Reminder Settings Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Due-Date Reminders"
        subtitle="Configure alerts for recurring expenses & investments"
        icon={<Calendar className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReminderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                setRemindersEnabled(tempEnabled);
                setReminderDays(tempDays);
                await saveReminderConfig(tempEnabled, tempDays);
                setIsReminderModalOpen(false);
                toast.success('Reminder settings saved successfully');
              }}
            >
              Save Settings
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Enable Reminders</span>
              <span className="text-[11px] text-slate-500">Receive alerts ahead of upcoming bills</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={tempEnabled}
              onClick={() => setTempEnabled(!tempEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                tempEnabled ? 'bg-brand-primary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  tempEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Remind me this many days before:
            </label>
            <div className="flex items-center gap-2.5">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = tempDays === num;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={!tempEnabled}
                    onClick={() => setTempDays(num)}
                    className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      !tempEnabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                        : isSelected
                        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25 scale-105'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-primary/60'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-brand-primary shrink-0" />
            <span>
              You will receive an in-app notification {tempDays} {tempDays === 1 ? 'day' : 'days'} before a due date.
            </span>
          </div>
        </div>
      </Modal>

      {/* Compact Notification Detail Modal */}
      {selectedNotification && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedNotification(null)}
          title="Notification Details"
          maxWidth="max-w-[380px]"
        >
          <div className="space-y-4">
            {/* Header / Type / Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0 border border-blue-100/60 shadow-sm">
                {getNotificationIcon(selectedNotification.type)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedNotification.type.replace(/_/g, ' ')}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {formatRelativeTime(selectedNotification.createdAt)}
                </p>
              </div>
            </div>

            {/* Title & Body */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {selectedNotification.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-2">
              {(selectedNotification.type.includes('SECURITY') ||
                selectedNotification.title.toLowerCase().includes('security') ||
                selectedNotification.title.toLowerCase().includes('password')) && (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setSelectedNotification(null);
                    navigate('/security/questions');
                  }}
                >
                  Security Setup
                </Button>
              )}
              {(selectedNotification.type.includes('DUE_DATE') ||
                selectedNotification.type.includes('REMINDER')) && (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setSelectedNotification(null);
                    navigate('/recurring');
                  }}
                >
                  View Recurring
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
