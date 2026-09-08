import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  UsersIcon,
  SearchIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  ShieldIcon,
  SettingsIcon,
  FileTextIcon,
  CheckIcon,
  CloseIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { formatDate } from '../../utils/date';
import type { AdminDashboardMetrics, AdminUserItem } from '@finance/shared-types';
import type { RootStackParamList } from '../../navigation/types';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Users' },
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'admin', label: 'Admins' },
];

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAdminData = useCallback(async () => {
    try {
      const [dashboardMetrics, userList] = await Promise.all([
        apiClient.admin.getDashboard(),
        apiClient.admin.getUsers({
          search: search.trim() || undefined,
          status:
            filter === 'active'
              ? 'ACTIVE'
              : filter === 'suspended'
              ? 'SUSPENDED'
              : undefined,
          role: filter === 'admin' ? 'ADMIN' : undefined,
        }),
      ]);

      if (dashboardMetrics) setMetrics(dashboardMetrics);
      if (userList) {
        const items = Array.isArray(userList)
          ? userList
          : (userList as any).users || (userList as any).data || [];
        setUsers(items);
      }
    } catch {
      // Fallback in test/offline environment
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => {
    setIsLoading(true);
    void fetchAdminData();
  }, [fetchAdminData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    void fetchAdminData();
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatLastActive = (dateStr?: string | null) => {
    if (!dateStr) return 'Never';
    return formatDate(dateStr) || 'Recently';
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Admin Console"
        subtitle="User directory & platform controls"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <View style={styles.headerRightButtons}>
            <Pressable
              onPress={() => navigation.navigate('AdminAudit')}
              style={styles.headerIconButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View Global Audit"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FileTextIcon size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('AdminSettings')}
              style={styles.headerIconButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View Admin Settings"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SettingsIcon size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 4 Summary Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Total Users */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabel}>TOTAL USERS</Text>
              <UsersIcon size={16} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>
              {metrics ? metrics.totalUsers.toLocaleString() : (isLoading ? '—' : users.length.toString())}
            </Text>
            <Text style={styles.metricSubMuted}>Total registered</Text>
          </View>

          {/* Card 2: Active Users */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabel}>ACTIVE USERS</Text>
              <ShieldCheckIcon size={16} color={colors.success} />
            </View>
            <Text style={styles.metricValue}>
              {metrics ? metrics.activeUsers.toLocaleString() : (isLoading ? '—' : users.filter(u => u.status === 'ACTIVE').length.toString())}
            </Text>
            <Text style={styles.metricSubSuccess}>Active accounts</Text>
          </View>

          {/* Card 3: Suspended Users */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabel}>SUSPENDED</Text>
              <AlertCircleIcon size={16} color={colors.danger} />
            </View>
            <Text style={styles.metricValue}>
              {metrics ? metrics.suspendedUsers.toLocaleString() : (isLoading ? '—' : users.filter(u => u.status === 'SUSPENDED').length.toString())}
            </Text>
            <Text style={styles.metricSubDanger}>Access restricted</Text>
          </View>

          {/* Card 4: Admins */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabel}>ADMINS</Text>
              <ShieldIcon size={16} color={colors.investment} />
            </View>
            <Text style={styles.metricValue}>
              {metrics ? metrics.adminUsers.toLocaleString() : (isLoading ? '—' : users.filter(u => u.role === 'ADMIN').length.toString())}
            </Text>
            <Text style={styles.metricSubMuted}>Elevated roles</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or user ID..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <CloseIcon size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = filter === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setFilter(opt.id)}
                accessible={true}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* User Directory List */}
        <View style={styles.sectionContainer}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>USER DIRECTORY</Text>
            <Text style={styles.userCountText}>
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No users found matching query.</Text>
            </View>
          ) : (
            <View style={styles.usersCard}>
              {users.map((u, index) => {
                const isLast = index === users.length - 1;
                const initials = getInitials(u.fullName, u.email);
                const isActive = u.status === 'ACTIVE';

                return (
                  <Pressable
                    key={u.id}
                    onPress={() => navigation.navigate('ManageUser', { userId: u.id })}
                    accessible={true}
                    style={({ pressed }) => [
                      styles.userRow,
                      !isLast && styles.userRowBorder,
                      pressed && styles.rowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Manage user ${u.fullName || u.email}`}
                  >
                    <View style={styles.userRowLeft}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{initials}</Text>
                      </View>
                      <View style={styles.userInfoColumn}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userNameText} numberOfLines={1}>
                            {u.fullName || 'User'}
                          </Text>
                          {u.role === 'ADMIN' && (
                            <View style={styles.adminBadge}>
                              <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userEmailText} numberOfLines={1}>
                          {u.email}
                        </Text>
                        <Text style={styles.userMetaText}>
                          Active {formatLastActive(u.lastLoginAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.userRowRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          isActive
                            ? styles.statusBadgeActive
                            : styles.statusBadgeSuspended,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isActive
                              ? styles.statusBadgeTextActive
                              : styles.statusBadgeTextSuspended,
                          ]}
                        >
                          {u.status}
                        </Text>
                      </View>
                      <ChevronRightIcon size={16} color="#98A2B3" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  metricSubSuccess: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  metricSubMuted: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metricSubDanger: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.danger,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 8,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  userCountText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  usersCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  userRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  userInfoColumn: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  adminBadge: {
    backgroundColor: colors.investmentBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.investment,
  },
  userEmailText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  userMetaText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  userRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: colors.successBg,
  },
  statusBadgeSuspended: {
    backgroundColor: colors.dangerBg,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: colors.success,
  },
  statusBadgeTextSuspended: {
    color: colors.danger,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
