import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, CONFIRM_DIALOGS, toMobileAlertArgs } from '@finance/shared-ui-tokens';
import type {
  RecurringTransaction,
  Account,
  Category,
  CreateRecurringTransactionInput,
} from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import { formatDate as formatCentralDate } from '../../utils/date';
import {
  ChevronLeftIcon,
  PlusIcon,
  RepeatIcon,
  CloseIcon,
  TrashIcon,
  CalendarIcon,
  CheckIcon,
} from '../../components/icons';

import { formatCurrency } from '../../utils/currency';

export { formatCurrency };

export const formatDate = (dateVal?: string): string => {
  return formatCentralDate(dateVal);
};

export type FrequencyFilter = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const RecurringScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { symbol: userSymbol } = useUserCurrency();
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFreq, setSelectedFreq] = useState<FrequencyFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formType, setFormType] = useState<'EXPENSE' | 'INCOME' | 'INVESTMENT'>('EXPENSE');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formFreq, setFormFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const defaultNextOccurrence = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }, []);
  const [formNextOccurrence, setFormNextOccurrence] = useState<string>(defaultNextOccurrence);

  const fetchRecurring = useCallback(async () => {
    try {
      const [recList, accList, catList] = await Promise.all([
        apiClient.recurring.list(),
        apiClient.accounts.list(),
        apiClient.categories.list(),
      ]);

      if (Array.isArray(recList)) {
        setItems(recList);
      }
      if (accList?.accounts) {
        setAccounts(accList.accounts);
        if (accList.accounts.length > 0 && !formAccountId) {
          setFormAccountId(accList.accounts[0].id);
        }
      }
      if (Array.isArray(catList)) {
        setCategories(catList);
        if (catList.length > 0 && !formCategoryId) {
          setFormCategoryId(catList[0].id);
        }
      }
    } catch {
      // Retain graceful state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [formAccountId, formCategoryId]);

  useEffect(() => {
    setIsLoading(true);
    void fetchRecurring();
  }, [fetchRecurring]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchRecurring();
  }, [fetchRecurring]);

  const handleToggleStatus = async (item: RecurringTransaction) => {
    const newStatus = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await apiClient.recurring.toggleStatus(item.id, newStatus);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus as any } : i))
      );
    } catch {
      // Fallback
    }
  };

  const handleDelete = (item: RecurringTransaction) => {
    const desc = item.description || item.category?.name || 'this schedule';
    const dialogDef = CONFIRM_DIALOGS.recurring.delete(desc);
    const [title, message, buttons] = toMobileAlertArgs(dialogDef, async () => {
      try {
        await apiClient.recurring.delete(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch {
        // Fallback
      }
    });
    Alert.alert(title, message, buttons);
  };

  const handleCreateRecurring = async () => {
    const parsedAmount = parseFloat(formAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    const effectiveAccountId = formAccountId || accounts[0]?.id;
    if (!effectiveAccountId) {
      Alert.alert('Account Required', 'Please create an account first before adding recurring schedules.');
      return;
    }

    try {
      setIsSubmitting(true);
      const input: CreateRecurringTransactionInput = {
        accountId: effectiveAccountId,
        categoryId: formCategoryId || undefined,
        type: formType,
        amount: parsedAmount,
        description: formDescription || `${formFreq.toLowerCase()} transaction`,
        scheduleFreq: formFreq,
        nextOccurrence: formNextOccurrence || defaultNextOccurrence,
      };

      const created = await apiClient.recurring.create(input);
      setItems((prev) => [created, ...prev]);
      setIsModalVisible(false);
      setFormAmount('');
      setFormDescription('');
    } catch {
      Alert.alert('Error', 'Unable to create recurring transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedFreq === 'ALL') return true;
    return item.scheduleFreq === selectedFreq;
  });

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'INCOME':
        return colors.success;
      case 'INVESTMENT':
        return colors.investment;
      default:
        return colors.danger;
    }
  };

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
              >
                <ChevronLeftIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <View>
              <Text style={styles.headerTitle}>Recurring</Text>
              <Text style={styles.headerSubtitle}>Subscriptions & regular schedules</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setIsModalVisible(true)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add Recurring"
          >
            <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* Frequency Filter Chips */}
        <View style={styles.freqPillsRow}>
          {(['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as FrequencyFilter[]).map((freq) => {
            const isSelected = selectedFreq === freq;
            const label = freq === 'ALL' ? 'All' : freq.charAt(0) + freq.slice(1).toLowerCase();
            return (
              <Pressable
                key={freq}
                onPress={() => setSelectedFreq(freq)}
                style={[styles.freqPill, isSelected && styles.freqPillActive]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${label} frequency`}
              >
                <Text
                  style={[
                    styles.freqPillText,
                    isSelected && styles.freqPillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading recurring schedules...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <RepeatIcon size={24} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Recurring Transactions</Text>
            <Text style={styles.emptySubtitle}>
              Tap Add above to create automated recurring schedules.
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map((item) => {
              const amount = item.amount ?? (item.amountPaise ? item.amountPaise / 100 : 0);
              const isActive = item.status === 'ACTIVE';
              const typeColor = getTypeColor(item.type);

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemCardTop}>
                    <View style={styles.itemLeft}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.freqBadge, { backgroundColor: '#EFF6FF' }]}>
                          <Text style={styles.freqBadgeText}>{item.scheduleFreq}</Text>
                        </View>
                        <View style={[styles.typeBadge, { borderColor: typeColor }]}>
                          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                            {item.type}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.description || item.category?.name || 'Recurring Schedule'}
                      </Text>

                      <View style={styles.dueRow}>
                        <CalendarIcon size={14} color={colors.textMuted} />
                        <Text style={styles.dueText}>
                          Next due: {formatDate(item.nextOccurrence)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemRight}>
                      <Text style={[styles.itemAmount, { color: typeColor }]}>
                        {item.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(amount)}
                      </Text>

                      <View style={styles.statusToggleRow}>
                        <Text style={styles.statusLabel}>{isActive ? 'Active' : 'Paused'}</Text>
                        <Switch
                          value={isActive}
                          onValueChange={() => handleToggleStatus(item)}
                          trackColor={{ false: '#E5E7EB', true: colors.primary }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.itemCardBottom}>
                    <Text style={styles.accountText}>
                       Account: {item.account?.name || 'Primary Account'}
                    </Text>

                    <Pressable
                      onPress={() => handleDelete(item)}
                      style={styles.deleteButton}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Delete recurring schedule"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <TrashIcon size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Recurring Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Recurring Schedule</Text>
              <Pressable
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <CloseIcon size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Type Selector */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>TRANSACTION TYPE</Text>
                <View style={styles.typeSelectorRow}>
                  {(['EXPENSE', 'INCOME', 'INVESTMENT'] as const).map((t) => {
                    const isSelected = formType === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setFormType(t)}
                        style={[styles.typeOption, isSelected && styles.typeOptionActive]}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t}
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            isSelected && styles.typeOptionTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Amount */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>AMOUNT ({userSymbol})</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={formAmount}
                  onChangeText={setFormAmount}
                />
              </View>

              {/* Description */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>DESCRIPTION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Netflix Subscription, House Rent"
                  placeholderTextColor={colors.textMuted}
                  value={formDescription}
                  onChangeText={setFormDescription}
                />
              </View>

              {/* Frequency */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>FREQUENCY</Text>
                <View style={styles.freqSelectorRow}>
                  {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((freq) => {
                    const isSelected = formFreq === freq;
                    return (
                      <Pressable
                        key={freq}
                        onPress={() => setFormFreq(freq)}
                        style={[styles.freqOption, isSelected && styles.freqOptionActive]}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={freq}
                      >
                        <Text
                          style={[
                            styles.freqOptionText,
                            isSelected && styles.freqOptionTextActive,
                          ]}
                        >
                          {freq}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Next Due Date */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>NEXT DUE DATE (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={defaultNextOccurrence}
                  placeholderTextColor={colors.textMuted}
                  value={formNextOccurrence}
                  onChangeText={setFormNextOccurrence}
                />
              </View>

              {/* Account Selection */}
              {accounts.length > 0 && (
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>ACCOUNT</Text>
                  <View style={styles.selectOptionsRow}>
                    {accounts.map((acc) => {
                      const isSelected = formAccountId === acc.id;
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => setFormAccountId(acc.id)}
                          style={[styles.selectChip, isSelected && styles.selectChipActive]}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Select account ${acc.name}`}
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              isSelected && styles.selectChipTextActive,
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={styles.modalCancelButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateRecurring}
                  disabled={isSubmitting}
                  style={[styles.modalSubmitButton, isSubmitting && { opacity: 0.7 }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Create Schedule"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Create Schedule</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    minWidth: 44,
    minHeight: 44,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  freqPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  freqPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freqPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  freqPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  freqPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
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
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  itemCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemLeft: {
    flex: 1,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freqBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freqBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  itemCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  accountText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  deleteButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  modalCloseButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  modalForm: {
    gap: 16,
    paddingBottom: 24,
  },
  formSection: {
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
  },
  typeOption: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeOptionActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  freqSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  freqOption: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freqOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  freqOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  freqOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  selectOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  selectChipText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  selectChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modalSubmitButton: {
    flex: 2,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
