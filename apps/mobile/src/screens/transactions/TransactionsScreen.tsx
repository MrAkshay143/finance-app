import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { colors, CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import type { Transaction, Account, TxnType } from '@finance/shared-types';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  SearchIcon,
  CloseIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  ArrowLeftRightIcon,
  ReceiptIcon,
  AlertCircleIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { formatDate as formatCentralDate } from '../../utils/date';
import {
  TransactionFormModal,
  TransactionFormMode,
  TransactionFormType,
  TransactionFormData,
} from './TransactionFormModal';

const FILTER_TABS = ['All', 'Income', 'Expense', 'Investment', 'Transfer'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

import { formatCurrency } from '../../utils/currency';
import { useUserCurrency } from '../../hooks/useUserCurrency';

export { formatCurrency };

export const formatDate = (dateStr?: string): string => {
  return formatCentralDate(dateStr);
};

export const TransactionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { currency: userCurrency } = useUserCurrency();
  const [selectedTab, setSelectedTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Centralized Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TransactionFormMode>('add');
  const [modalType, setModalType] = useState<TransactionFormType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<TransactionFormData | null>(null);

  // Soft-delete modal state
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [txnsRes, accountsRes] = await Promise.all([
        apiClient.transactions.list(),
        apiClient.accounts.list(),
      ]);

      const txnsList = Array.isArray(txnsRes)
        ? txnsRes
        : (txnsRes as any)?.items || (txnsRes as any)?.data || [];
      const accountsList = Array.isArray(accountsRes)
        ? accountsRes
        : (accountsRes as any)?.accounts || [];

      setTransactions(txnsList);
      setAccounts(accountsList);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message || err?.message || 'Failed to load transaction records'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchData();
  }, [fetchData]);

  // Map account IDs to account names for fast lookup
  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) {
      map.set(a.id, a.name);
    }
    return map;
  }, [accounts]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // 1. Tab filter
      if (selectedTab === 'Income' && txn.type !== 'INCOME') return false;
      if (selectedTab === 'Expense' && txn.type !== 'EXPENSE') return false;
      if (selectedTab === 'Investment' && txn.type !== 'INVESTMENT') return false;
      if (selectedTab === 'Transfer') {
        const desc = (txn.description || '').toLowerCase();
        const isTransfer =
          desc.includes('transfer') || (txn as any).transferId || (txn as any).transfer;
        if (!isTransfer) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const desc = (txn.description || '').toLowerCase();
        const merchant = (txn.merchant || '').toLowerCase();
        const notes = (txn.notes || '').toLowerCase();
        const accountName = (accountNameMap.get(txn.accountId) || '').toLowerCase();
        return (
          desc.includes(q) ||
          merchant.includes(q) ||
          notes.includes(q) ||
          accountName.includes(q)
        );
      }

      return true;
    });
  }, [transactions, selectedTab, searchQuery, accountNameMap]);

  // Open modal in Add mode
  const handleOpenAdd = (explicitType?: TransactionFormType) => {
    let defaultType: TransactionFormType = explicitType || 'expense';
    if (!explicitType) {
      if (selectedTab === 'Income') defaultType = 'income';
      else if (selectedTab === 'Investment') defaultType = 'investment';
      else if (selectedTab === 'Transfer') defaultType = 'transfer';
    }

    setModalMode('add');
    setModalType(defaultType);
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (route.params?.openAdd) {
      handleOpenAdd(route.params.defaultType);
    }
  }, [route.params]);

  // Open modal in Edit mode
  const handleOpenEdit = (txn: Transaction) => {
    let tType: TransactionFormType = 'expense';
    if (txn.type === 'INCOME') tType = 'income';
    else if (txn.type === 'INVESTMENT') tType = 'investment';
    else if (
      (txn.description || '').toLowerCase().includes('transfer') ||
      (txn as any).transferId
    ) {
      tType = 'transfer';
    }

    setModalMode('edit');
    setModalType(tType);
    setEditingTransaction({
      id: txn.id,
      type: tType,
      amount: Number(txn.amount) || 0,
      accountId: txn.accountId,
      sourceAccountId: txn.accountId,
      categoryId: txn.categoryId || null,
      description: txn.description,
      merchant: txn.merchant || null,
      date: txn.date,
      notes: txn.notes || null,
    });
    setIsModalOpen(true);
  };

  // Trigger delete confirmation
  const handlePromptDelete = (txn: Transaction) => {
    setDeletingTransaction(txn);
    setDeleteError(null);
  };

  // Confirm soft delete
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await apiClient.transactions.delete(deletingTransaction.id);
      setDeletingTransaction(null);
      await fetchData();
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.error?.message || err?.message || 'Failed to delete transaction'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getSemanticChip = (txn: Transaction) => {
    const isTransfer =
      (txn.description || '').toLowerCase().includes('transfer') || (txn as any).transferId;

    if (isTransfer) {
      return {
        label: 'Transfer',
        textColor: colors.primary,
        bgColor: colors.primarySoft,
        icon: <ArrowLeftRightIcon size={12} color={colors.primary} />,
        prefix: '',
      };
    }

    switch (txn.type) {
      case 'INCOME':
        return {
          label: 'Income',
          textColor: colors.success,
          bgColor: colors.successBg,
          icon: <TrendingUpIcon size={12} color={colors.success} />,
          prefix: '+ ',
        };
      case 'EXPENSE':
        return {
          label: 'Expense',
          textColor: colors.danger,
          bgColor: colors.dangerBg,
          icon: <TrendingDownIcon size={12} color={colors.danger} />,
          prefix: '- ',
        };
      case 'INVESTMENT':
        return {
          label: 'Investment',
          textColor: colors.investment,
          bgColor: colors.investmentBg,
          icon: <PiggyBankIcon size={12} color={colors.investment} />,
          prefix: '',
        };
      default:
        return {
          label: 'Transaction',
          textColor: colors.textMuted,
          bgColor: colors.background,
          icon: <ReceiptIcon size={12} color={colors.textMuted} />,
          prefix: '',
        };
    }
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Transactions"
        subtitle={`${filteredTransactions.length} records`}
        rightAction={
          <Pressable
            onPress={() => handleOpenAdd()}
            style={styles.headerAddButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add Transaction"
          >
            <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.headerAddButtonText}>Add</Text>
          </Pressable>
        }
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by description, merchant, notes..."
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={styles.searchClearButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <CloseIcon size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedTab === tab;
            let activeColor: string = colors.primary;
            if (tab === 'Income') activeColor = colors.success;
            else if (tab === 'Expense') activeColor = colors.danger;
            else if (tab === 'Investment') activeColor = colors.investment;
            else if (tab === 'Transfer') activeColor = colors.primary;

            return (
              <Pressable
                key={tab}
                onPress={() => setSelectedTab(tab)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tab}`}
                style={[
                  styles.filterPill,
                  isSelected
                    ? { backgroundColor: activeColor, borderColor: activeColor }
                    : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircleIcon size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={fetchData}
              style={styles.retryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry loading transactions"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Transactions List */}
        <ScrollView
          contentContainerStyle={[
            styles.listContainer,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {!isLoading && filteredTransactions.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <ReceiptIcon size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No transactions recorded</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? `No transactions match "${searchQuery}". Try another search.`
                  : 'No transactions recorded yet. Tap below to add one.'}
              </Text>
              <Pressable
                onPress={() => handleOpenAdd()}
                style={styles.emptyCtaButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add Transaction"
              >
                <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.emptyCtaText}>Add Transaction</Text>
              </Pressable>
            </View>
          )}

          {!isLoading &&
            filteredTransactions.map((txn) => {
              const chip = getSemanticChip(txn);
              const accountName = accountNameMap.get(txn.accountId) || 'Account';
              const formattedDate = formatDate(txn.date);

              return (
                <View key={txn.id} style={styles.transactionCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.titleColumn}>
                      <Text style={styles.descriptionText} numberOfLines={1}>
                        {txn.description}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaAccountText} numberOfLines={1}>
                          {accountName}
                        </Text>
                        {txn.merchant && (
                          <>
                            <Text style={styles.metaBullet}>•</Text>
                            <Text style={styles.metaMerchantText} numberOfLines={1}>
                              {txn.merchant}
                            </Text>
                          </>
                        )}
                        {formattedDate.length > 0 && (
                          <>
                            <Text style={styles.metaBullet}>•</Text>
                            <Text style={styles.metaDateText}>{formattedDate}</Text>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Amount */}
                    <Text
                      style={[
                        styles.amountText,
                        { color: chip.textColor },
                      ]}
                    >
                      {chip.prefix}
                      {formatCurrency(
                        Number(txn.amount) || 0,
                        accounts.find((a) => a.id === txn.accountId)?.currency || userCurrency
                      )}
                    </Text>
                  </View>

                  {/* Card Bottom Row: Semantic Chip + Actions */}
                  <View style={styles.cardBottomRow}>
                    <View style={[styles.semanticChip, { backgroundColor: chip.bgColor }]}>
                      {chip.icon}
                      <Text style={[styles.semanticChipText, { color: chip.textColor }]}>
                        {chip.label}
                      </Text>
                    </View>

                    <View style={styles.actionButtonsGroup}>
                      <Pressable
                        onPress={() => handleOpenEdit(txn)}
                        style={styles.cardActionButton}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Edit Transaction"
                      >
                        <PencilIcon size={15} color={colors.primary} />
                        <Text style={styles.cardActionEditText}>Edit</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handlePromptDelete(txn)}
                        style={styles.cardActionButton}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Delete Transaction"
                      >
                        <TrashIcon size={15} color={colors.danger} />
                        <Text style={styles.cardActionDeleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
        </ScrollView>
      </View>

      {/* Centralized Add/Edit Modal */}
      <TransactionFormModal
        visible={isModalOpen}
        mode={modalMode}
        type={modalType}
        initialData={editingTransaction}
        accounts={accounts}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          void fetchData();
        }}
        onTypeChange={(newType) => setModalType(newType)}
      />

      {/* Soft-Delete Confirmation Modal */}
      <Modal
        visible={deletingTransaction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingTransaction(null)}
      >
        <View style={styles.deleteBackdrop}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteIconBox}>
              <TrashIcon size={28} color={colors.danger} />
            </View>
            {(() => {
              const dialogDef = CONFIRM_DIALOGS.transactions.delete(deletingTransaction?.description);
              return (
                <>
                  <Text style={styles.deleteTitle}>{dialogDef.title}</Text>
                  <Text style={styles.deleteMessage}>{dialogDef.message}</Text>

                  {deleteError && (
                    <View style={styles.deleteErrorBox}>
                      <AlertCircleIcon size={16} color={colors.danger} />
                      <Text style={styles.deleteErrorText}>{deleteError}</Text>
                    </View>
                  )}

                  <View style={styles.deleteActionRow}>
                    <Pressable
                      onPress={() => setDeletingTransaction(null)}
                      style={styles.deleteCancelButton}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel"
                    >
                      <Text style={styles.deleteCancelText}>{dialogDef.cancelLabel}</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleConfirmDelete}
                      disabled={isDeleting}
                      style={[styles.deleteConfirmButton, isDeleting && styles.deleteButtonDisabled]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm Delete"
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.deleteConfirmText}>{dialogDef.confirmLabel}</Text>
                      )}
                    </Pressable>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    borderRadius: 9999,
  },
  headerAddButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  searchClearButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterPillInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: colors.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 9999,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleColumn: {
    flex: 1,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaAccountText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  metaBullet: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metaMerchantText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaDateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  semanticChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  semanticChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cardActionEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  cardActionDeleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  deleteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 58, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  deleteModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  deleteIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  deleteErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  deleteErrorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },
  deleteActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  deleteConfirmButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
