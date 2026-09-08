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
  ShieldCheckIcon,
  KeyRoundIcon,
  UserIcon,
  SettingsIcon,
  ShieldIcon,
  ReceiptIcon,
  GlobeIcon,
  ClockIcon,
  CloseIcon,
  InfoIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { formatDateTime } from '../../utils/date';
import type { AuditLogRecord } from '@finance/shared-types';

const CATEGORIES = [
  'All',
  'Login',
  'Transactions',
  'Profile',
  'Settings',
  'Security',
];

export const AuditLogScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const categoryParam = selectedCategory === 'All' ? undefined : selectedCategory;
      const res = await apiClient.audit.listUserLogs({
        page: 1,
        pageSize: 50,
        search: search.trim() || undefined,
        category: categoryParam,
      });
      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch {
      // Offline fallback: keep current logs
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    setIsLoading(true);
    void fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setIsRefreshing(true);
    void fetchLogs();
  };

  const getEventIcon = (category?: string) => {
    switch (category) {
      case 'Login':
        return <KeyRoundIcon size={18} color={colors.primary} />;
      case 'Profile':
        return <UserIcon size={18} color={colors.investment} />;
      case 'Settings':
        return <SettingsIcon size={18} color={colors.warning} />;
      case 'Security':
        return <ShieldIcon size={18} color={colors.success} />;
      case 'Transactions':
        return <ReceiptIcon size={18} color={colors.primary} />;
      default:
        return <ShieldCheckIcon size={18} color={colors.primary} />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    return formatDateTime(dateStr) || dateStr;
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Audit Log"
        subtitle="Security & Activity Timeline"
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activity events by action or details..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={12}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <CloseIcon size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat}`}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Activity Timeline List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <InfoIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Activity Records Found</Text>
          <Text style={styles.emptySubtitle}>
            {search
              ? 'No events match your current search query.'
              : 'There are no audit logs recorded in this category.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.timelineContent,
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
            <Text style={styles.listHeaderTitle}>IMMUTABLE EVENT RECORDS</Text>
            <Text style={styles.recordCountText}>
              {logs.length} {logs.length === 1 ? 'event' : 'events'}
            </Text>
          </View>

          <View style={styles.cardsColumn}>
            {logs.map((log) => (
              <Pressable
                key={log.id}
                onPress={() => setSelectedLog(log)}
                style={({ pressed }) => [
                  styles.eventCard,
                  pressed && styles.cardPressed,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${log.action}, ${log.category || 'general'}, ${formatTimestamp(log.createdAt)}`}
              >
                <View style={styles.eventHeaderRow}>
                  <View style={styles.eventLeftGroup}>
                    <View style={styles.eventIconContainer}>
                      {getEventIcon(log.category)}
                    </View>
                    <View style={styles.eventTitleColumn}>
                      <Text style={styles.eventActionText}>{log.action}</Text>
                      {log.category ? (
                        <View style={styles.categoryChip}>
                          <Text style={styles.categoryChipText}>
                            {log.category}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.eventTimestamp}>
                    {formatTimestamp(log.createdAt)}
                  </Text>
                </View>

                {log.details && Object.keys(log.details).length > 0 && (
                  <Text style={styles.eventDetailsSnippet} numberOfLines={2}>
                    {typeof log.details === 'string'
                      ? log.details
                      : JSON.stringify(log.details)}
                  </Text>
                )}

                <View style={styles.eventMetadataFooter}>
                  <View style={styles.metaItem}>
                    <GlobeIcon size={12} color={colors.textMuted} />
                    <Text style={styles.metaItemText}>
                      {log.ipAddress || 'Internal IP'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <ClockIcon size={12} color={colors.textMuted} />
                    <Text style={styles.metaItemText}>Recorded Server-Side</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Event Details Modal */}
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
          accessibilityLabel="Dismiss event details modal"
        >
          <View style={styles.detailsModalCard}>
            <View style={styles.detailsModalHeader}>
              <View style={styles.detailsTitleGroup}>
                <Text style={styles.detailsActionTitle}>
                  {selectedLog?.action}
                </Text>
                <Text style={styles.detailsCategoryText}>
                  Category: {selectedLog?.category || 'General'}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedLog(null)}
                style={styles.modalCloseButton}
                hitSlop={12}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close record details"
              >
                <CloseIcon size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.detailsModalBody}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Record Identifier</Text>
                <Text style={styles.fieldValueMono}>{selectedLog?.id}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Timestamp</Text>
                <Text style={styles.fieldValue}>
                  {selectedLog ? formatTimestamp(selectedLog.createdAt) : ''}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Origin IP Address</Text>
                <Text style={styles.fieldValueMono}>
                  {selectedLog?.ipAddress || 'Internal Network'}
                </Text>
              </View>

              {selectedLog?.actorEmail && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Actor Email</Text>
                  <Text style={styles.fieldValue}>{selectedLog.actorEmail}</Text>
                </View>
              )}

              <View style={styles.detailsPayloadSection}>
                <Text style={styles.fieldLabel}>Event Payload Details</Text>
                <View style={styles.payloadBox}>
                  <Text style={styles.payloadText}>
                    {selectedLog?.details
                      ? JSON.stringify(selectedLog.details, null, 2)
                      : 'No additional metadata attached.'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setSelectedLog(null)}
              style={styles.modalDismissButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close Record"
            >
              <Text style={styles.modalDismissButtonText}>Close Record</Text>
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
    paddingBottom: 8,
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
  categoryPillsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  categoryPillTextActive: {
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
  timelineContent: {
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
    fontWeight: '500',
  },
  cardsColumn: {
    gap: 10,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.75,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  eventIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitleColumn: {
    flex: 1,
    gap: 4,
  },
  eventActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  categoryChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  eventTimestamp: {
    fontSize: 11,
    color: colors.textMuted,
  },
  eventDetailsSnippet: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  eventMetadataFooter: {
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
  detailsModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    gap: 16,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  detailsTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  detailsActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  detailsCategoryText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsModalBody: {
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
  modalDismissButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDismissButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
