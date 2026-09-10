import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, CONFIRM_DIALOGS, toMobileAlertArgs } from '@finance/shared-ui-tokens';
import type { Account, AccountType, AccountStatus } from '@finance/shared-types';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  PlusIcon,
  CloseIcon,
  LandmarkIcon,
  CreditCardIcon,
  WalletIcon,
  PiggyBankIcon,
  DollarSignIcon,
  BuildingIcon,
  SettingsIcon,
  ArrowLeftRightIcon,
  BarChartIcon,
  PencilIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import type { RootStackParamList } from '../../navigation/types';

const ACCOUNT_TYPES: Array<{ type: AccountType; label: string }> = [
  { type: 'BANK', label: 'Bank Account' },
  { type: 'CREDIT_CARD', label: 'Credit Card' },
  { type: 'WALLET', label: 'Digital Wallet' },
  { type: 'INVESTMENT', label: 'Investment Brokerage' },
  { type: 'CASH', label: 'Cash Reserve' },
  { type: 'LOAN', label: 'Loan Account' },
];

import { CurrencyPickerModal } from '../../components/CurrencyPickerModal';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

export { formatCurrency };

export const AccountsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [addName, setAddName] = useState('');
  const [addInstitution, setAddInstitution] = useState('');
  const [addType, setAddType] = useState<AccountType>('BANK');
  const [addAccountNumberMask, setAddAccountNumberMask] = useState('');
  const [addOpeningBalance, setAddOpeningBalance] = useState('');
  const [addCurrency, setAddCurrency] = useState('INR');
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

  const [editName, setEditName] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editType, setEditType] = useState<AccountType>('BANK');
  const [editAccountNumberMask, setEditAccountNumberMask] = useState('');
  const [editStatus, setEditStatus] = useState<AccountStatus>('ACTIVE');

  const fetchAccounts = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.accounts.list();
      const list = Array.isArray(res) ? res : (res as any)?.accounts || [];
      setAccounts(list);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load accounts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchAccounts();
  }, [fetchAccounts]);

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const totalBalance = activeAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  const handleOpenAddModal = () => {
    setAddName('');
    setAddInstitution('');
    setAddType('BANK');
    setAddAccountNumberMask('');
    setAddOpeningBalance('');
    setAddCurrency('INR');
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!addName.trim()) {
      setModalError('Account name is required.');
      return;
    }
    const balanceNum = parseFloat(addOpeningBalance) || 0;
    if (isNaN(balanceNum) || balanceNum < 0) {
      setModalError('Opening balance must be a non-negative number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);
      await apiClient.accounts.create({
        name: addName.trim(),
        institutionName: addInstitution.trim() || undefined,
        type: addType,
        accountNumberMask: addAccountNumberMask.trim() || undefined,
        openingBalance: balanceNum,
        currency: addCurrency,
      });
      setIsAddModalOpen(false);
      await fetchAccounts();
    } catch (err: any) {
      setModalError(err?.response?.data?.error?.message || err?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (account: Account) => {
    setEditingAccount(account);
    setEditName(account.name);
    setEditInstitution(account.institutionName || '');
    setEditType((account.type as AccountType) || 'BANK');
    setEditAccountNumberMask(account.accountNumberMask || '');
    setEditStatus(account.status || 'ACTIVE');
    setModalError(null);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    if (!editName.trim()) {
      setModalError('Account name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);
      await apiClient.accounts.update(editingAccount.id, {
        name: editName.trim(),
        institutionName: editInstitution.trim() || undefined,
        type: editType,
        accountNumberMask: editAccountNumberMask.trim() || undefined,
      });

      if (editStatus !== editingAccount.status) {
        await apiClient.accounts.toggleStatus(editingAccount.id, editStatus);
      }

      setEditingAccount(null);
      await fetchAccounts();
    } catch (err: any) {
      setModalError(err?.response?.data?.error?.message || err?.message || 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (account: Account) => {
    const isDeactivating = account.status === 'ACTIVE';
    const nextStatus: AccountStatus = isDeactivating ? 'INACTIVE' : 'ACTIVE';
    const dialogDef = CONFIRM_DIALOGS.accounts.toggleStatus(account.name, isDeactivating);
    const [title, message, buttons] = toMobileAlertArgs(dialogDef, async () => {
      try {
        await apiClient.accounts.toggleStatus(account.id, nextStatus);
        await fetchAccounts();
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || err?.message || 'Failed to toggle account status');
      }
    });
    Alert.alert(title, message, buttons);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return <LandmarkIcon size={20} color={colors.primary} />;
      case 'CREDIT_CARD':
        return <CreditCardIcon size={20} color={colors.investment} />;
      case 'WALLET':
        return <WalletIcon size={20} color={colors.warning} />;
      case 'INVESTMENT':
        return <PiggyBankIcon size={20} color={colors.success} />;
      case 'CASH':
        return <DollarSignIcon size={20} color={colors.primary} />;
      case 'LOAN':
        return <BuildingIcon size={20} color={colors.danger} />;
      default:
        return <LandmarkIcon size={20} color={colors.primary} />;
    }
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Accounts"
        subtitle="Connected banks & portfolios"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={handleOpenAddModal}
            accessible={true}
            style={styles.headerAddButton}
            accessibilityRole="button"
            accessibilityLabel="Add Account"
          >
            <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.headerAddButtonText}>Add</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 32 },
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
        {/* Error Notification */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircleIcon size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={fetchAccounts}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry loading accounts"
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Total Balance Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>TOTAL NET WORTH</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>
                {activeAccounts.length} Active Accounts
              </Text>
            </View>
          </View>
          <Text style={styles.heroBalanceText}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.heroSubtext}>Aggregated across all connected balances</Text>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>CONNECTED INSTITUTIONS</Text>
          <Text style={styles.sectionCount}>{accounts.length} Total</Text>
        </View>

        {/* Loading Spinner */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && accounts.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <LandmarkIcon size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No accounts connected</Text>
            <Text style={styles.emptyDescription}>
              Connect bank, card, or investment accounts to track balances.
            </Text>
            <Pressable
              onPress={handleOpenAddModal}
              accessible={true}
              style={styles.emptyCtaButton}
              accessibilityRole="button"
              accessibilityLabel="Add Account"
            >
              <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.emptyCtaText}>Add Account</Text>
            </Pressable>
          </View>
        )}

        {/* Accounts List */}
        {!isLoading &&
          accounts.map((account) => {
            const isActive = account.status === 'ACTIVE';
            return (
              <View key={account.id} style={styles.accountCard}>
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.accountIdentityRow}>
                    <View style={styles.accountIconBox}>
                      {getAccountIcon(account.type)}
                    </View>
                    <View style={styles.accountNameCol}>
                      <Text style={styles.accountNameText} numberOfLines={1}>
                        {account.name}
                      </Text>
                      <Text style={styles.institutionText} numberOfLines={1}>
                        {account.institutionName || 'Self-Managed'}
                        {account.accountNumberMask ? ` • ${account.accountNumberMask}` : ''}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleToggleStatus(account)}
                    accessible={true}
                    style={[
                      styles.statusPill,
                      isActive ? styles.statusPillActive : styles.statusPillInactive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Status: ${account.status}`}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isActive ? colors.success : colors.warning },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: isActive ? colors.success : colors.warning },
                      ]}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </Pressable>
                </View>

                {/* Balance Row */}
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>
                    {account.type.replace('_', ' ')} Balance
                  </Text>
                  <Text style={styles.balanceValueText}>
                    {formatCurrency(Number(account.currentBalance) || 0, account.currency)}
                  </Text>
                </View>

                {/* Quick Action Buttons Row */}
                <View style={styles.quickActionsRow}>
                  <Pressable
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Transactions' })}
                    accessible={true}
                    style={styles.quickActionButton}
                    accessibilityRole="button"
                    accessibilityLabel="Transactions"
                  >
                    <ArrowLeftRightIcon size={14} color={colors.primary} />
                    <Text style={styles.quickActionText}>Transactions</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Reports' })}
                    accessible={true}
                    style={styles.quickActionButton}
                    accessibilityRole="button"
                    accessibilityLabel="Analytics"
                  >
                    <BarChartIcon size={14} color={colors.primary} />
                    <Text style={styles.quickActionText}>Analytics</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleOpenEditModal(account)}
                    accessible={true}
                    style={styles.quickActionButton}
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
                  >
                    <SettingsIcon size={14} color={colors.textMuted} />
                    <Text style={[styles.quickActionText, { color: colors.textMuted }]}>
                      Settings
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* Add Account Modal */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 20 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Account</Text>
                <Text style={styles.modalSubtitle}>Connect a new bank, card, or portfolio</Text>
              </View>
              <Pressable
                onPress={() => setIsAddModalOpen(false)}
                accessible={true}
                style={styles.modalCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {modalError && (
              <View style={styles.modalErrorBox}>
                <AlertCircleIcon size={16} color={colors.danger} />
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            )}

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={addName}
                  onChangeText={setAddName}
                  placeholder="e.g. HDFC Salary Account"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Institution Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={addInstitution}
                  onChangeText={setAddInstitution}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typePillRow}>
                  {ACCOUNT_TYPES.map((t) => {
                    const isSelected = addType === t.type;
                    return (
                      <Pressable
                        key={t.type}
                        onPress={() => setAddType(t.type)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t.label}
                        style={[
                          styles.typePill,
                          isSelected ? styles.typePillSelected : styles.typePillUnselected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typePillText,
                            isSelected ? styles.typePillTextSelected : styles.typePillTextUnselected,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Number Mask</Text>
                <TextInput
                  style={styles.textInput}
                  value={addAccountNumberMask}
                  onChangeText={setAddAccountNumberMask}
                  placeholder="e.g. 1234 or •••• 1234"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Opening Balance</Text>
                <TextInput
                  style={styles.textInput}
                  value={addOpeningBalance}
                  onChangeText={setAddOpeningBalance}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Currency</Text>
                <Pressable
                  onPress={() => setIsCurrencyPickerOpen(true)}
                  style={[styles.textInput, { justifyContent: 'center' }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Select currency"
                >
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
                    {addCurrency} ({getCurrencySymbol(addCurrency)})
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <CurrencyPickerModal
              visible={isCurrencyPickerOpen}
              onClose={() => setIsCurrencyPickerOpen(false)}
              onSelect={(c) => setAddCurrency(c)}
              selectedCurrencyCode={addCurrency}
            />

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setIsAddModalOpen(false)}
                accessible={true}
                style={styles.cancelButton}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateAccount}
                disabled={isSubmitting}
                accessible={true}
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Save Account"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Account</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        visible={editingAccount !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingAccount(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 20 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Account</Text>
                <Text style={styles.modalSubtitle}>Modify account details and settings</Text>
              </View>
              <Pressable
                onPress={() => setEditingAccount(null)}
                accessible={true}
                style={styles.modalCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {modalError && (
              <View style={styles.modalErrorBox}>
                <AlertCircleIcon size={16} color={colors.danger} />
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            )}

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Account Name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Institution Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editInstitution}
                  onChangeText={setEditInstitution}
                  placeholder="Institution Name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typePillRow}>
                  {ACCOUNT_TYPES.map((t) => {
                    const isSelected = editType === t.type;
                    return (
                      <Pressable
                        key={t.type}
                        onPress={() => setEditType(t.type)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t.label}
                        style={[
                          styles.typePill,
                          isSelected ? styles.typePillSelected : styles.typePillUnselected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typePillText,
                            isSelected ? styles.typePillTextSelected : styles.typePillTextUnselected,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Number Mask</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAccountNumberMask}
                  onChangeText={setEditAccountNumberMask}
                  placeholder="e.g. 1234 or •••• 1234"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Status</Text>
                <View style={styles.statusToggleRow}>
                  <Pressable
                    onPress={() => setEditStatus('ACTIVE')}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Set Active status"
                    style={[
                      styles.statusToggleOption,
                      editStatus === 'ACTIVE' && styles.statusToggleOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        editStatus === 'ACTIVE' && styles.statusToggleTextActive,
                      ]}
                    >
                      Active
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEditStatus('INACTIVE')}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Set Inactive status"
                    style={[
                      styles.statusToggleOption,
                      editStatus === 'INACTIVE' && styles.statusToggleOptionInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        editStatus === 'INACTIVE' && styles.statusToggleTextInactive,
                      ]}
                    >
                      Inactive
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setEditingAccount(null)}
                accessible={true}
                style={styles.cancelButton}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUpdateAccount}
                disabled={isSubmitting}
                accessible={true}
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Update Account"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Account</Text>
                )}
              </Pressable>
            </View>
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
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: 9999,
  },
  headerAddButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  heroCard: {
    backgroundColor: colors.navyHeaderStart,
    borderRadius: 18,
    padding: 20,
    shadowColor: colors.navyHeaderStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  activeBadge: {
    backgroundColor: 'rgba(37, 84, 238, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(37, 84, 238, 0.4)',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
  },
  heroBalanceText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
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
  emptyIconContainer: {
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
    minHeight: 44,
    borderRadius: 9999,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  accountIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  accountIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountNameCol: {
    flex: 1,
  },
  accountNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  institutionText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    minHeight: 44,
    borderRadius: 9999,
  },
  statusPillActive: {
    backgroundColor: colors.successBg,
  },
  statusPillInactive: {
    backgroundColor: colors.warningBg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  balanceValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalErrorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  modalFormScroll: {
    maxHeight: 380,
  },
  formGroup: {
    marginBottom: 14,
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
    minHeight: 44,
    fontSize: 14,
    color: colors.text,
  },
  typePillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    marginRight: 8,
  },
  typePillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typePillUnselected: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typePillTextSelected: {
    color: '#FFFFFF',
  },
  typePillTextUnselected: {
    color: colors.textMuted,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusToggleOption: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  statusToggleOptionActive: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  statusToggleOptionInactive: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  statusToggleTextActive: {
    color: colors.success,
  },
  statusToggleTextInactive: {
    color: colors.warning,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
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
    borderRadius: 12,
    backgroundColor: colors.primary,
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
