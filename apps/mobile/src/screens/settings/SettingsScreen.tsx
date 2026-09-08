import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, CONFIRM_DIALOGS, toMobileAlertArgs } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  ChevronRightIcon,
  BellIcon,
  ShieldIcon,
  AlertCircleIcon,
  LogOutIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/types';

import { SUPPORTED_CURRENCIES } from '@finance/shared-ui-tokens';

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} (${c.symbol}) - ${c.name}`,
}));

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
];

const CYCLE_START_OPTIONS = [
  { value: '1', label: '1st of month (Calendar cycle)' },
  { value: '15', label: '15th of month (Mid-month cycle)' },
  { value: '25', label: '25th of month (Salary cycle)' },
];

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuthStore();

  // Settings State
  const [currency, setCurrency] = useState<string>('INR');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [startDay, setStartDay] = useState<string>('1');

  // Toggles State
  const [quickAdd, setQuickAdd] = useState<boolean>(true);
  const [showExpenseDonut, setShowExpenseDonut] = useState<boolean>(true);
  const [showFamDonut, setShowFamDonut] = useState<boolean>(true);
  const [enableInvestments, setEnableInvestments] = useState<boolean>(true);
  const [enableRecurring, setEnableRecurring] = useState<boolean>(true);

  // Modals & Danger Zone State
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Dropdown Picker Modals
  const [pickerModalType, setPickerModalType] = useState<
    'currency' | 'timezone' | 'cycle' | null
  >(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await apiClient.settings.get();
      if (data) {
        if (data.currency) setCurrency(data.currency);
        if (data.timezone) setTimezone(data.timezone);
        if (data.financialMonthStartDay) {
          setStartDay(String(data.financialMonthStartDay));
        }
        if (data.quickAddEnabled !== undefined) {
          setQuickAdd(data.quickAddEnabled);
        }
        if (data.donutVisualsEnabled !== undefined) {
          setShowExpenseDonut(data.donutVisualsEnabled);
          setShowFamDonut(data.donutVisualsEnabled);
        }
        if (data.investmentsTrackingEnabled !== undefined) {
          setEnableInvestments(data.investmentsTrackingEnabled);
        }
        if (data.recurringTrackingEnabled !== undefined) {
          setEnableRecurring(data.recurringTrackingEnabled);
        }
      }
    } catch {
      // Retain standard defaults if offline
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateSettingField = async (fields: Record<string, any>) => {
    try {
      await apiClient.settings.update(fields as any);
      setActionFeedback('Preferences updated');
      setTimeout(() => setActionFeedback(null), 2000);
    } catch (err: any) {
      Alert.alert(
        'Update Failed',
        err?.response?.data?.error?.message || err?.message || 'Could not update preferences.'
      );
    }
  };

  const handleResetProfile = async () => {
    setIsProcessingAction(true);
    try {
      await apiClient.accountActions.resetProfile();
      setIsResetModalOpen(false);
      Alert.alert(
        'Profile Targets Reset',
        'Your monthly budget and investment targets have been reset to defaults.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert(
        'Reset Failed',
        err?.response?.data?.error?.message || 'Could not reset profile targets.'
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Password Required', 'Please enter your password to confirm deletion.');
      return;
    }

    setIsProcessingAction(true);
    try {
      await apiClient.accountActions.deleteAccount(deletePassword);
      setIsDeleteModalOpen(false);
      await logout();
    } catch (err: any) {
      Alert.alert(
        'Deletion Failed',
        err?.response?.data?.error?.message || 'Invalid password or deletion error.'
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSignOut = () => {
    const dialogDef = CONFIRM_DIALOGS.settings.signOut();
    const [title, message, buttons] = toMobileAlertArgs(dialogDef, () => {
      void logout();
    });
    Alert.alert(title, message, buttons);
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Settings"
        subtitle="Preferences & Security"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {actionFeedback && (
          <View style={styles.feedbackBanner}>
            <CheckIcon size={16} color={colors.success} />
            <Text style={styles.feedbackText}>{actionFeedback}</Text>
          </View>
        )}

        {/* General Preferences Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>GENERAL PREFERENCES</Text>
          <View style={styles.card}>
            {/* Currency selector */}
            <Pressable
              onPress={() => setPickerModalType('currency')}
              style={[styles.row, styles.rowBorder]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Select Default Currency"
            >
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>Default Currency</Text>
                <Text style={styles.rowValue}>
                  {CURRENCY_OPTIONS.find((c) => c.value === currency)?.label || currency}
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>

            {/* Timezone selector */}
            <Pressable
              onPress={() => setPickerModalType('timezone')}
              style={[styles.row, styles.rowBorder]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Select Timezone"
            >
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>System Timezone</Text>
                <Text style={styles.rowValue}>
                  {TIMEZONE_OPTIONS.find((t) => t.value === timezone)?.label || timezone}
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>

            {/* Cycle start day selector */}
            <Pressable
              onPress={() => setPickerModalType('cycle')}
              style={styles.row}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Select Financial Month Start Day"
            >
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>Financial Month Start Day</Text>
                <Text style={styles.rowValue}>
                  {CYCLE_START_OPTIONS.find((c) => c.value === startDay)?.label ||
                    `Day ${startDay}`}
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>
          </View>
        </View>

        {/* Notifications & Reminders Navigation Link */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS & REMINDERS</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              style={styles.row}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Configure Due Date Reminders"
            >
              <View style={styles.itemWithIcon}>
                <View style={styles.iconChip}>
                  <BellIcon size={18} color={colors.primary} />
                </View>
                <View style={styles.rowTextColumn}>
                  <Text style={styles.rowLabel}>Due-Date Reminders & Alerts</Text>
                  <Text style={styles.rowSub}>
                    Configure bill thresholds and scheduled notices
                  </Text>
                </View>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>
          </View>
        </View>

        {/* Dashboard Experience Toggles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>DASHBOARD EXPERIENCE</Text>
          <View style={styles.card}>
            {/* Quick-Add */}
            <View style={[styles.toggleRow, styles.rowBorder]}>
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>Quick-Add Transaction Bar</Text>
                <Text style={styles.rowSub}>
                  Show instant entry shortcut row on dashboard
                </Text>
              </View>
              <Switch
                value={quickAdd}
                onValueChange={(val) => {
                  setQuickAdd(val);
                  void updateSettingField({ quickAddEnabled: val });
                }}
                trackColor={{ false: '#E4E7EC', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Expense Donut */}
            <View style={[styles.toggleRow, styles.rowBorder]}>
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>Expense Overview Donut</Text>
                <Text style={styles.rowSub}>
                  Display category expense breakdown ring
                </Text>
              </View>
              <Switch
                value={showExpenseDonut}
                onValueChange={(val) => {
                  setShowExpenseDonut(val);
                  void updateSettingField({ donutVisualsEnabled: val });
                }}
                trackColor={{ false: '#E4E7EC', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* FAM Assessment Donut */}
            <View style={styles.toggleRow}>
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>FAM Assessment Donut</Text>
                <Text style={styles.rowSub}>
                  Display 3-segment allocation ring on header
                </Text>
              </View>
              <Switch
                value={showFamDonut}
                onValueChange={(val) => {
                  setShowFamDonut(val);
                  void updateSettingField({ donutVisualsEnabled: val });
                }}
                trackColor={{ false: '#E4E7EC', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Feature Modules Toggles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>FEATURE MODULES</Text>
          <View style={styles.card}>
            <View style={[styles.toggleRow, styles.rowBorder]}>
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>Investments Portfolio Module</Text>
                <Text style={styles.rowSub}>
                  Enable equity, mutual funds, and asset tracking
                </Text>
              </View>
              <Switch
                value={enableInvestments}
                onValueChange={(val) => {
                  setEnableInvestments(val);
                  void updateSettingField({ investmentsTrackingEnabled: val });
                }}
                trackColor={{ false: '#E4E7EC', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.rowTextColumn}>
                <Text style={styles.rowLabel}>Recurring Transactions Module</Text>
                <Text style={styles.rowSub}>
                  Enable automated monthly schedules and bills
                </Text>
              </View>
              <Switch
                value={enableRecurring}
                onValueChange={(val) => {
                  setEnableRecurring(val);
                  void updateSettingField({ recurringTrackingEnabled: val });
                }}
                trackColor={{ false: '#E4E7EC', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>SECURITY & AUTHENTICATION</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => navigation.navigate('SecurityQuestions')}
              style={styles.row}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Manage Security Questions"
            >
              <View style={styles.itemWithIcon}>
                <View style={[styles.iconChip, { backgroundColor: colors.warningBg }]}>
                  <ShieldIcon size={18} color={colors.warning} />
                </View>
                <View style={styles.rowTextColumn}>
                  <Text style={styles.rowLabel}>Security Questions (KBA)</Text>
                  <Text style={styles.rowSub}>
                    Setup or verify 3 recovery questions
                  </Text>
                </View>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.dangerHeaderRow}>
            <AlertCircleIcon size={16} color={colors.danger} />
            <Text style={styles.dangerSectionTitle}>DANGER ZONE</Text>
          </View>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerNoticeText}>
              Destructive actions are permanent. Proceed with caution.
            </Text>

            <View style={styles.dangerActionsList}>
              <Pressable
                onPress={() => setIsResetModalOpen(true)}
                style={({ pressed }) => [
                  styles.dangerOutlineButton,
                  pressed && styles.buttonPressed,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reset Profile Targets"
              >
                <Text style={styles.dangerOutlineButtonText}>Reset Profile Targets</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDeletePassword('');
                  setIsDeleteModalOpen(true);
                }}
                style={({ pressed }) => [
                  styles.dangerOutlineButton,
                  pressed && styles.buttonPressed,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Delete Account"
              >
                <Text style={styles.dangerOutlineButtonText}>Delete My Account</Text>
              </Pressable>

              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.buttonPressed,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Sign Out from Account"
              >
                <LogOutIcon size={16} color="#FFFFFF" />
                <Text style={styles.signOutButtonText}>Sign Out from Account</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Dropdown Options Modal */}
      <Modal
        visible={pickerModalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalType(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerModalType(null)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss picker dialog"
        >
          <View style={styles.pickerDialog}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {pickerModalType === 'currency'
                  ? 'Select Currency'
                  : pickerModalType === 'timezone'
                  ? 'Select Timezone'
                  : 'Financial Month Start Day'}
              </Text>
              <Pressable
                onPress={() => setPickerModalType(null)}
                style={styles.modalCloseButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close picker dialog"
              >
                <CloseIcon size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.optionsList}>
              {pickerModalType === 'currency' &&
                CURRENCY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setCurrency(opt.value);
                      void updateSettingField({ currency: opt.value });
                      setPickerModalType(null);
                    }}
                    style={[
                      styles.optionRow,
                      currency === opt.value && styles.optionRowSelected,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currency === opt.value && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currency === opt.value && (
                      <CheckIcon size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}

              {pickerModalType === 'timezone' &&
                TIMEZONE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setTimezone(opt.value);
                      void updateSettingField({ timezone: opt.value });
                      setPickerModalType(null);
                    }}
                    style={[
                      styles.optionRow,
                      timezone === opt.value && styles.optionRowSelected,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        timezone === opt.value && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {timezone === opt.value && (
                      <CheckIcon size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}

              {pickerModalType === 'cycle' &&
                CYCLE_START_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setStartDay(opt.value);
                      void updateSettingField({
                        financialMonthStartDay: parseInt(opt.value, 10),
                      });
                      setPickerModalType(null);
                    }}
                    style={[
                      styles.optionRow,
                      startDay === opt.value && styles.optionRowSelected,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        startDay === opt.value && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {startDay === opt.value && (
                      <CheckIcon size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Reset Profile Modal */}
      <Modal
        visible={isResetModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsResetModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.actionModalCard}>
            <View style={styles.modalIconCircleWarning}>
              <AlertCircleIcon size={24} color={colors.warning} />
            </View>
            <Text style={styles.actionModalTitle}>{CONFIRM_DIALOGS.settings.resetTargets().title}</Text>
            <Text style={styles.actionModalText}>
              {CONFIRM_DIALOGS.settings.resetTargets().message}
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => setIsResetModalOpen(false)}
                style={styles.modalCancelButton}
                disabled={isProcessingAction}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel reset"
              >
                <Text style={styles.modalCancelButtonText}>{CONFIRM_DIALOGS.settings.resetTargets().cancelLabel}</Text>
              </Pressable>
              <Pressable
                onPress={handleResetProfile}
                style={styles.modalConfirmWarningButton}
                disabled={isProcessingAction}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reset Targets"
              >
                {isProcessingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>{CONFIRM_DIALOGS.settings.resetTargets().confirmLabel}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={isDeleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoid}
          >
            <View style={styles.actionModalCard}>
              <View style={styles.modalIconCircleDanger}>
                <AlertCircleIcon size={24} color={colors.danger} />
              </View>
              <Text style={styles.actionModalTitle}>{CONFIRM_DIALOGS.settings.deleteAccount().title}</Text>
              <Text style={styles.actionModalText}>
                {CONFIRM_DIALOGS.settings.deleteAccount().message}
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordInputBox}>
                  <LockIcon size={18} color={colors.textMuted} />
                  <TextInput
                    style={styles.passwordTextInput}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.modalButtonRow}>
                <Pressable
                  onPress={() => setIsDeleteModalOpen(false)}
                  style={styles.modalCancelButton}
                  disabled={isProcessingAction}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel delete account"
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteAccount}
                  style={styles.modalConfirmDangerButton}
                  disabled={isProcessingAction}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Delete Account Permanently"
                >
                  {isProcessingAction ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Delete Account</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
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
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },
  feedbackBanner: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.2)',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTextColumn: {
    flex: 1,
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rowValue: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  dangerSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: 0.8,
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    gap: 14,
  },
  dangerNoticeText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  dangerActionsList: {
    gap: 10,
  },
  dangerOutlineButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    minHeight: 44,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dangerOutlineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  signOutButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 58, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerDialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxHeight: '60%',
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalKeyboardAvoid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionRowSelected: {
    backgroundColor: colors.primarySoft,
  },
  optionLabel: {
    fontSize: 13,
    color: colors.text,
  },
  optionLabelSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  actionModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  modalIconCircleWarning: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconCircleDanger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  actionModalText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    gap: 6,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  passwordInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmWarningButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmDangerButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
