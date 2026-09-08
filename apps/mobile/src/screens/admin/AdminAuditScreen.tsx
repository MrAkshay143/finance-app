import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  SearchIcon,
  UserIcon,
  GlobeIcon,
  ClockIcon,
  CloseIcon,
  ShieldIcon,
  InfoIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { formatDateTime } from '../../utils/date';
import type { AuditLogRecord } from '@finance/shared-types';

const FILTER_PILLS = [
  { id: 'all', label: 'All Events' },
  { id: 'auth', label: 'Auth & Logins' },
  { id: 'roles', label: 'Roles' },
  { id: 'security', label: 'Security' },
];

export const AdminAuditScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await apiClient.admin.getAuditLogs({
        page: 1,
        pageSize: 50,
        search: search.trim() || undefined,
        category:
          filter === 'auth'
            ? 'Login'
            : filter === 'roles'
            ? 'Admin'
            : filter === 'security'
            ? 'Security'
            : undefined,
      });
      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch {
      // Retain existing state if offline
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => {
    setIsLoading(true);
    void fetchAuditLogs();
  }, [fetchAuditLogs]);

  const onRefresh = () => {
    setIsRefreshing(true);
    void fetchAuditLogs();
  };

  const formatTimestamp = (dateStr: string) => {
    return formatDateTime(dateStr) || dateStr;
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Activity Audit"
        subtitle="Global platform security events"
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by actor, action, or IP address..."
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
          {FILTER_PILLS.map((p) => {
            const isSelected = filter === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setFilter(p.id)}
                accessible={true}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={p.label}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Audit Event Stream */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <InfoIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Audit Records Found</Text>
          <Text style={styles.emptySubtitle}>
            {search
              ? 'No system events match your current query.'
              : 'There are no platform activity logs in this category.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.streamContent,
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
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>IMMUTABLE ACTIVITY STREAM</Text>
            <Text style={styles.recordCountText}>
              {logs.length} {logs.length === 1 ? 'event' : 'events'}
            </Text>
          </View>

          <View style={styles.logsColumn}>
            {logs.map((log) => {
              const isDenied =
                log.action.includes('FAIL') ||
                log.action.includes('DENIED') ||
                (log.details as any)?.status === 'DENIED';

              return (
                <Pressable
                  key={log.id}
                  onPress={() => setSelectedLog(log)}
                  accessible={true}
                  style={({ pressed }) => [
                    styles.logCard,
                    pressed && styles.cardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={log.action}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.actionTitleGroup}>
                      <Text style={styles.actionText}>{log.action}</Text>
                      <View style={styles.actorRow}>
                        <UserIcon size={12} color={colors.textMuted} />
                        <Text style={styles.actorText} numberOfLines={1}>
                          Actor: {log.actorEmail || log.actorUserId || 'system'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isDenied ? styles.statusBadgeDenied : styles.statusBadgeSuccess,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isDenied ? styles.statusBadgeTextDenied : styles.statusBadgeTextSuccess,
                        ]}
                      >
                        {isDenied ? 'DENIED' : 'SUCCESS'}
                      </Text>
                    </View>
                  </View>

                  {log.targetEmail && (
                    <Text style={styles.targetText} numberOfLines={1}>
                      Target: {log.targetEmail}
                    </Text>
                  )}

                  <View style={styles.metaFooterRow}>
                    <View style={styles.metaItem}>
                      <GlobeIcon size={12} color={colors.textMuted} />
                      <Text style={styles.metaItemText}>
                        {log.ipAddress || 'Internal Network'}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <ClockIcon size={12} color={colors.textMuted} />
                      <Text style={styles.metaItemText}>
                        {formatTimestamp(log.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Audit Detail Modal */}
      <Modal
        visible={selectedLog !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLog(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedLog(null)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal"
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <Text style={styles.modalActionTitle}>
                  {selectedLog?.action}
                </Text>
                <Text style={styles.modalSubTitle}>
                  Global Event Identifier: {selectedLog?.id.slice(0, 12)}...
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedLog(null)}
                style={styles.modalCloseButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close audit details"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Actor</Text>
                <Text style={styles.fieldValue}>
                  {selectedLog?.actorEmail || selectedLog?.actorUserId || 'system'}
                </Text>
              </View>

              {selectedLog?.targetEmail && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Target Entity</Text>
                  <Text style={styles.fieldValue}>{selectedLog.targetEmail}</Text>
                </View>
              )}

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>IP Address</Text>
                <Text style={styles.fieldValueMono}>
                  {selectedLog?.ipAddress || 'Internal'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Recorded Timestamp</Text>
                <Text style={styles.fieldValue}>
                  {selectedLog ? formatTimestamp(selectedLog.createdAt) : ''}
                </Text>
              </View>

              <View style={styles.detailsPayloadSection}>
                <Text style={styles.fieldLabel}>Raw Details Payload</Text>
                <View style={styles.payloadBox}>
                  <Text style={styles.payloadText}>
                    {selectedLog?.details
                      ? JSON.stringify(selectedLog.details, null, 2)
                      : 'No additional details payload.'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setSelectedLog(null)}
              style={styles.dismissButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close Audit Record"
            >
              <Text style={styles.dismissButtonText}>Close Audit Record</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
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
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.background,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  streamContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  recordCountText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  logsColumn: {
    gap: 10,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionTitleGroup: {
    flex: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.text,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actorText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  targetText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeSuccess: {
    backgroundColor: colors.successBg,
  },
  statusBadgeDenied: {
    backgroundColor: colors.dangerBg,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextSuccess: {
    color: colors.success,
  },
  statusBadgeTextDenied: {
    color: colors.danger,
  },
  metaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 58, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  modalHeaderTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  modalActionTitle: {
    fontSize: 15,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.text,
  },
  modalSubTitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  modalBody: {
    gap: 12,
  },
  fieldRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  fieldValueMono: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
  },
  detailsPayloadSection: {
    paddingTop: 8,
    gap: 6,
  },
  payloadBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payloadText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.text,
    lineHeight: 16,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
