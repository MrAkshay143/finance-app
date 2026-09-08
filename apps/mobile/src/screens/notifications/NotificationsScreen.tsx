import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import type { NotificationItem, Reminder } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import { socketManager } from '../../services/socket';
import { formatDate } from '../../utils/date';
import {
  ChevronLeftIcon,
  CheckCheckIcon,
  ClockIcon,
  BellIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  TagIcon,
  PiggyBankIcon,
} from '../../components/icons';

export type NotificationFilter = 'all' | 'unread' | 'read';

export const formatRelativeTime = (timestamp?: string): string => {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Reminders state
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [primaryReminderId, setPrimaryReminderId] = useState<string | null>(null);

  const fetchNotificationsAndReminders = useCallback(async () => {
    try {
      const [notifRes, unreadRes, remindersRes] = await Promise.all([
        apiClient.notifications.list({ filter }),
        apiClient.notifications.getUnreadCount(),
        apiClient.reminders.list(),
      ]);

      if (notifRes?.items) {
        setNotifications(notifRes.items);
      }
      if (unreadRes?.count !== undefined) {
        setUnreadCount(unreadRes.count);
      }
      if (Array.isArray(remindersRes) && remindersRes.length > 0) {
        const firstReminder = remindersRes[0];
        setPrimaryReminderId(firstReminder.id);
        setRemindersEnabled(firstReminder.enabled);
        if (firstReminder.timingConfig?.daysBefore) {
          setReminderDays(firstReminder.timingConfig.daysBefore);
        }
      }
    } catch {
      // Retain graceful state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setIsLoading(true);
    void fetchNotificationsAndReminders();
  }, [fetchNotificationsAndReminders]);

  // Realtime Socket.IO connection
  useEffect(() => {
    let activeSocket: any = null;

    const connectSocket = async () => {
      try {
        activeSocket = await socketManager.connectNotifications(
          (incomingNotification: any) => {
            if (incomingNotification?.id) {
              setNotifications((prev) => {
                const exists = prev.some((n) => n.id === incomingNotification.id);
                if (exists) return prev;
                return [incomingNotification, ...prev];
              });
              setUnreadCount((prev) => prev + 1);
            }
          },
          (newCount: number) => {
            setUnreadCount(newCount);
          }
        );

        if (activeSocket) {
          activeSocket.on('notification:new', (notif: any) => {
            if (notif?.id) {
              setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
              setUnreadCount((prev) => prev + 1);
            }
          });
          activeSocket.on('notification:unread-count', (count: number) => {
            setUnreadCount(count);
          });
        }
      } catch {
        // Socket connection fallback
      }
    };

    void connectSocket();

    return () => {
      if (activeSocket) {
        activeSocket.off('notification:new');
        activeSocket.off('notification:unread-count');
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchNotificationsAndReminders();
  }, [fetchNotificationsAndReminders]);

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await apiClient.notifications.markAsRead(item.id);
      } catch {
        // Fallback
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    setRemindersEnabled(value);
    try {
      if (primaryReminderId) {
        await apiClient.reminders.toggleStatus(primaryReminderId, value);
      } else {
        const created = await apiClient.reminders.create({
          type: 'RECURRING_EXPENSE',
          timingConfig: { daysBefore: reminderDays },
          enabled: value,
        });
        setPrimaryReminderId(created.id);
      }
    } catch {
      // Offline fallback
    }
  };

  const handleReminderDaysChange = async (days: number) => {
    setReminderDays(days);
    try {
      if (primaryReminderId) {
        await apiClient.reminders.update(primaryReminderId, {
          timingConfig: { daysBefore: days },
        });
      } else {
        const created = await apiClient.reminders.create({
          type: 'RECURRING_EXPENSE',
          timingConfig: { daysBefore: days },
          enabled: remindersEnabled,
        });
        setPrimaryReminderId(created.id);
      }
    } catch {
      // Offline fallback
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SECURITY':
      case 'AUTH':
        return <ShieldCheckIcon size={18} color={colors.success} />;
      case 'BILL':
      case 'DUE_DATE':
      case 'RECURRING':
        return <ClockIcon size={18} color={colors.warning} />;
      case 'BUDGET':
      case 'INVESTMENT':
        return <PiggyBankIcon size={18} color={colors.investment} />;
      case 'ALERT':
      case 'WARNING':
        return <AlertCircleIcon size={18} color={colors.danger} />;
      default:
        return <BellIcon size={18} color={colors.primary} />;
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'read') return item.read;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 12 : 20 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            {navigation.canGoBack() && (
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeftIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>Realtime alerts & reminders</Text>
            </View>
          </View>

          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              style={({ pressed }) => [
                styles.markReadButton,
                pressed && styles.markReadButtonPressed,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <CheckCheckIcon size={16} color={colors.primary} />
              <Text style={styles.markReadText}>Mark all as read</Text>
            </Pressable>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['all', 'unread', 'read'] as NotificationFilter[]).map((tab) => {
            const isSelected = filter === tab;
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <Pressable
                key={tab}
                onPress={() => setFilter(tab)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${label}`}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {label}
                </Text>
                {tab === 'unread' && unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Due-Date Reminders Card */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderCardHeader}>
            <View style={styles.reminderTitleWrap}>
              <View style={styles.reminderClockIcon}>
                <ClockIcon size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.reminderTitle}>Due-Date Reminders</Text>
                <Text style={styles.reminderSub}>Automated bill & schedule alerts</Text>
              </View>
            </View>

            <Switch
              value={remindersEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#E5E7EB', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={styles.reminderDescription}>
            Get advance alerts for recurring bills and scheduled reviews.
          </Text>

          {remindersEnabled && (
            <View style={styles.reminderDaysSection}>
              <Text style={styles.reminderDaysLabel}>Reminder advance notice</Text>
              <View style={styles.reminderDaysRow}>
                {[1, 2, 3, 4, 5].map((days) => {
                  const isDaySelected = reminderDays === days;
                  return (
                    <Pressable
                      key={days}
                      onPress={() => handleReminderDaysChange(days)}
                      style={[
                        styles.daySelectorPill,
                        isDaySelected && styles.daySelectorPillActive,
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`${days} days prior`}
                    >
                      <Text
                        style={[
                          styles.daySelectorPillText,
                          isDaySelected && styles.daySelectorPillTextActive,
                        ]}
                      >
                        {days} {days === 1 ? 'day' : 'days'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Notifications List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeading}>ALERTS & NOTIFICATIONS</Text>
          <Text style={styles.listCountText}>
            {filteredNotifications.length} {filteredNotifications.length === 1 ? 'Alert' : 'Alerts'}
          </Text>
        </View>

        {isLoading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <BellIcon size={24} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications Found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? 'All caught up. You have no unread notifications.'
                : 'No notification records present for this filter.'}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleNotificationPress(item)}
                style={({ pressed }) => [
                  styles.notificationCard,
                  !item.read && styles.notificationCardUnread,
                  pressed && styles.notificationCardPressed,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.read ? 'read' : 'unread'}`}
              >
                {/* Unread indicator dot */}
                {!item.read && <View style={styles.unreadDot} />}

                {/* Category Icon */}
                <View
                  style={[
                    styles.notifIconContainer,
                    !item.read && styles.notifIconContainerUnread,
                  ]}
                >
                  {getNotificationIcon(item.type)}
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <View style={styles.notifHeaderRow}>
                    <Text
                      style={[
                        styles.notifTitle,
                        !item.read && styles.notifTitleUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.notifTimestamp}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                </View>

                <ChevronRightIcon size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    minHeight: 44,
  },
  markReadButtonPressed: {
    opacity: 0.75,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderClockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reminderSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  reminderDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  reminderDaysSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 8,
  },
  reminderDaysLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  reminderDaysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  daySelectorPill: {
    flex: 1,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  daySelectorPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  daySelectorPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  daySelectorPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  listHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  listCountText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  notificationsList: {
    gap: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    position: 'relative',
  },
  notificationCardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
  },
  notificationCardPressed: {
    opacity: 0.85,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  notifIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconContainerUnread: {
    backgroundColor: '#EFF6FF',
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '800',
  },
  notifTimestamp: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  notifMessage: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
