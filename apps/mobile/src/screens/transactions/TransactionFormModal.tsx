import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, getCurrencySymbol } from '@finance/shared-ui-tokens';
import type { Account, Transaction } from '@finance/shared-types';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import {
  CloseIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  ArrowLeftRightIcon,
  AlertCircleIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TransactionFormType = 'income' | 'expense' | 'investment' | 'transfer';
export type TransactionFormMode = 'add' | 'edit';

export interface TransactionFormData {
  id?: string;
  type?: TransactionFormType;
  amount?: number;
  accountId?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  categoryId?: string | null;
  categoryName?: string;
  description?: string;
  merchant?: string | null;
  date?: string;
  notes?: string | null;
}

export interface TransactionFormModalProps {
  visible: boolean;
  mode: TransactionFormMode;
  type: TransactionFormType;
  initialData?: TransactionFormData | null;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
  onTypeChange?: (type: TransactionFormType) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  visible,
  mode,
  type,
  initialData,
  accounts,
  onClose,
  onSuccess,
  onTypeChange,
}) => {
  const insets = useSafeAreaInsets();
  const { symbol: userSymbol } = useUserCurrency();
  const [selectedType, setSelectedType] = useState<TransactionFormType>(type);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serverCategories, setServerCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real categories from API
  useEffect(() => {
    if (visible) {
      apiClient.categories.list().then((res: any) => {
        const list = res?.categories || res?.data?.categories || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setServerCategories(list);
        }
      }).catch(() => {});
    }
  }, [visible]);

  const currentCategories = React.useMemo(() => {
    // Only use real server categories — never fall back to hardcoded non-UUID values
    const fromServer = serverCategories.filter(
      (c) => c.type?.toLowerCase() === selectedType.toLowerCase()
    );
    return fromServer.map((c) => ({ id: c.id, name: c.name }));
  }, [serverCategories, selectedType]);


  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (visible) {
      const activeType = type || 'expense';
      setSelectedType(activeType);

      const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
      const defaultAccount = activeAccounts[0]?.id || accounts[0]?.id || '';
      const secondAccount = activeAccounts[1]?.id || accounts[1]?.id || defaultAccount;

      setAmount(initialData?.amount ? String(initialData.amount) : '');
      setAccountId(initialData?.accountId || defaultAccount);
      setSourceAccountId(initialData?.sourceAccountId || initialData?.accountId || defaultAccount);
      setDestAccountId(initialData?.destinationAccountId || secondAccount);

      setCategoryId(initialData?.categoryId || '');

      setDescription(initialData?.description || '');
      setMerchant(initialData?.merchant || '');
      setDate(
        initialData?.date
          ? initialData.date.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setNotes(initialData?.notes || '');
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible, mode, type, initialData, accounts]);

  const handleTypeSelect = (newType: TransactionFormType) => {
    setSelectedType(newType);
    if (onTypeChange) {
      onTypeChange(newType);
    }
    // Only pre-select a category if we have real server categories for the new type
    const matching = serverCategories.filter((c) => c.type?.toLowerCase() === newType.toLowerCase());
    const defaultCat = matching[0]?.id || '';
    setCategoryId(defaultCat);
  };


  // Titles and submit labels for all 8 states
  const getModalMeta = () => {
    switch (selectedType) {
      case 'income':
        return {
          title: mode === 'add' ? 'Add Income' : 'Edit Income',
          subtitle:
            mode === 'add'
              ? 'Record a new income into your accounts'
              : 'Modify the existing income details',
          submitLabel: mode === 'add' ? 'Save Income' : 'Update Income',
          color: colors.success,
          bgColor: colors.successBg,
          icon: <TrendingUpIcon size={20} color={colors.success} />,
        };
      case 'expense':
        return {
          title: mode === 'add' ? 'Add Expense' : 'Edit Expense',
          subtitle:
            mode === 'add'
              ? 'Record a new expense into your accounts'
              : 'Modify the existing expense details',
          submitLabel: mode === 'add' ? 'Save Expense' : 'Update Expense',
          color: colors.danger,
          bgColor: colors.dangerBg,
          icon: <TrendingDownIcon size={20} color={colors.danger} />,
        };
      case 'investment':
        return {
          title: mode === 'add' ? 'Add Investment' : 'Edit Investment',
          subtitle:
            mode === 'add'
              ? 'Record a new investment into your accounts'
              : 'Modify the existing investment details',
          submitLabel: mode === 'add' ? 'Save Investment' : 'Update Investment',
          color: colors.investment,
          bgColor: colors.investmentBg,
          icon: <PiggyBankIcon size={20} color={colors.investment} />,
        };
      case 'transfer':
        return {
          title: mode === 'add' ? 'Add Transfer' : 'Edit Transfer',
          subtitle:
            mode === 'add'
              ? 'Transfer funds between your connected accounts'
              : 'Modify the existing transfer transaction details',
          submitLabel: mode === 'add' ? 'Save Transfer' : 'Update Transfer',
          color: colors.primary,
          bgColor: colors.primarySoft,
          icon: <ArrowLeftRightIcon size={20} color={colors.primary} />,
        };
    }
  };

  const meta = getModalMeta();

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (selectedType === 'transfer') {
      if (!sourceAccountId) {
        setError('Please select a source account.');
        return;
      }
      if (!destAccountId) {
        setError('Please select a destination account.');
        return;
      }
      if (sourceAccountId === destAccountId) {
        setError('Source and destination accounts must be different.');
        return;
      }
    } else {
      if (!accountId) {
        setError('Please select an account.');
        return;
      }
      if (!description.trim()) {
        setError('Description is required.');
        return;
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date && date > todayStr) {
      setError('Transaction date cannot be in the future.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Resolve category: categoryId is always a real UUID from the API or empty
      let resolvedCategoryId: string | undefined = undefined;
      if (categoryId && categoryId.includes('-')) {
        // Standard UUID format — use directly
        resolvedCategoryId = categoryId;
      } else if (categoryId) {
        // Try to find by id or name in server categories as a safety net
        const found = serverCategories.find(
          (c) => c.id === categoryId || c.name.toLowerCase() === categoryId.toLowerCase()
        );
        if (found) {
          resolvedCategoryId = found.id;
        }
        // If not found, don't send a non-UUID value — leave as undefined
      }


      if (mode === 'add') {
        if (selectedType === 'transfer') {
          await apiClient.transfers.create({
            sourceAccountId,
            destinationAccountId: destAccountId,
            amount: numAmount,
            description: description.trim() || 'Internal Transfer',
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            notes: notes.trim() || undefined,
          });
        } else {
          const typeEnum = selectedType.toUpperCase() as 'INCOME' | 'EXPENSE' | 'INVESTMENT';
          await apiClient.transactions.create({
            accountId,
            type: typeEnum,
            amount: numAmount,
            categoryId: resolvedCategoryId,
            description: description.trim(),
            merchant: merchant.trim() || undefined,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            notes: notes.trim() || undefined,
          });
        }
      } else {
        // Edit mode
        if (!initialData?.id) {
          throw new Error('Transaction identifier is missing.');
        }

        const typeEnum = selectedType.toUpperCase() as 'INCOME' | 'EXPENSE' | 'INVESTMENT';
        await apiClient.transactions.update(initialData.id, {
          accountId: selectedType === 'transfer' ? sourceAccountId : accountId,
          type: selectedType === 'transfer' ? undefined : typeEnum,
          amount: numAmount,
          categoryId: resolvedCategoryId,
          description: description.trim() || (selectedType === 'transfer' ? 'Internal Transfer' : 'Transaction'),
          merchant: merchant.trim() || undefined,
          date: date ? new Date(date).toISOString() : undefined,
          notes: notes.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const availableAccounts = activeAccounts.length > 0 ? activeAccounts : accounts;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: meta.bgColor }]}>
                {meta.icon}
              </View>
              <View>
                <Text style={styles.headerTitle}>{meta.title}</Text>
                <Text style={styles.headerSubtitle}>{meta.subtitle}</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close transaction modal"
            >
              <CloseIcon size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Type Selector (Add mode only) */}
          {mode === 'add' && (
            <View style={styles.typeSelectorRow}>
              {(['income', 'expense', 'investment', 'transfer'] as TransactionFormType[]).map(
                (t) => {
                  const isSelected = selectedType === t;
                  const label = t.charAt(0).toUpperCase() + t.slice(1);
                  return (
                    <Pressable
                      key={t}
                      onPress={() => handleTypeSelect(t)}
                      style={[
                        styles.typeTab,
                        isSelected && styles.typeTabActive,
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${label} type`}
                    >
                      <Text
                        style={[
                          styles.typeTabText,
                          isSelected && styles.typeTabTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <AlertCircleIcon size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Amount */}
            <View style={styles.formGroup}>
              {(() => {
                const selectedAcc = accounts.find((a) => a.id === (selectedType === 'transfer' ? sourceAccountId : accountId));
                const activeCurrencySymbol = selectedAcc?.currency ? getCurrencySymbol(selectedAcc.currency) : userSymbol;
                return (
                  <Text style={styles.formLabel}>Amount ({activeCurrencySymbol})</Text>
                );
              })()}
              <TextInput
                style={[styles.textInput, styles.amountInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* Account Selector(s) */}
            {selectedType === 'transfer' ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>From Account</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                    {availableAccounts.map((acc) => {
                      const isSelected = sourceAccountId === acc.id;
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => setSourceAccountId(acc.id)}
                          style={[
                            styles.accountPill,
                            isSelected ? styles.accountPillSelected : styles.accountPillUnselected,
                          ]}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`From account ${acc.name}`}
                        >
                          <Text
                            style={[
                              styles.accountPillText,
                              isSelected ? styles.accountPillTextSelected : styles.accountPillTextUnselected,
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>To Account</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                    {availableAccounts.map((acc) => {
                      const isSelected = destAccountId === acc.id;
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => setDestAccountId(acc.id)}
                          style={[
                            styles.accountPill,
                            isSelected ? styles.accountPillSelected : styles.accountPillUnselected,
                          ]}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`To account ${acc.name}`}
                        >
                          <Text
                            style={[
                              styles.accountPillText,
                              isSelected ? styles.accountPillTextSelected : styles.accountPillTextUnselected,
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                  {availableAccounts.map((acc) => {
                    const isSelected = accountId === acc.id;
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => setAccountId(acc.id)}
                        style={[
                          styles.accountPill,
                          isSelected ? styles.accountPillSelected : styles.accountPillUnselected,
                        ]}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Account ${acc.name}`}
                      >
                        <Text
                          style={[
                            styles.accountPillText,
                            isSelected ? styles.accountPillTextSelected : styles.accountPillTextUnselected,
                          ]}
                        >
                          {acc.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Category Selector (for non-transfer) */}
            {selectedType !== 'transfer' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                  {currentCategories.map((cat) => {
                    const isSelected = categoryId === cat.id || categoryId === cat.name;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setCategoryId(cat.id)}
                        style={[
                          styles.categoryPill,
                          isSelected ? styles.categoryPillSelected : styles.categoryPillUnselected,
                        ]}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Category ${cat.name}`}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            isSelected ? styles.categoryPillTextSelected : styles.categoryPillTextUnselected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder={selectedType === 'transfer' ? 'Internal Transfer' : 'e.g. Monthly Salary or Supermarket'}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Merchant (optional, non-transfer) */}
            {selectedType !== 'transfer' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Merchant / Payee (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={merchant}
                  onChangeText={setMerchant}
                  placeholder="e.g. Amazon, Employer Inc."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add reference notes..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={styles.cancelButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                { backgroundColor: meta.color },
                isSubmitting && styles.submitButtonDisabled,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={meta.submitLabel}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{meta.submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  typeTab: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  typeTabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeTabTextActive: {
    color: colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  formScroll: {
    maxHeight: 380,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
  },
  accountPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    marginRight: 8,
  },
  accountPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accountPillUnselected: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  accountPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountPillTextSelected: {
    color: '#FFFFFF',
  },
  accountPillTextUnselected: {
    color: colors.textMuted,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  categoryPillUnselected: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextSelected: {
    color: colors.primary,
  },
  categoryPillTextUnselected: {
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  submitButton: {
    flex: 2,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
