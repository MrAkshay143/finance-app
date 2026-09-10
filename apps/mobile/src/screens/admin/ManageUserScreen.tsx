import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, CONFIRM_DIALOGS, toMobileAlertArgs } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  ShieldIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  TrashIcon,
  AlertCircleIcon,
  ChevronRightIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { formatDate, formatDateTime } from '../../utils/date';
import type { AdminUserDetails } from '@finance/shared-types';
import type { RootStackParamList } from '../../navigation/types';

type ManageUserRouteProp = RouteProp<RootStackParamList, 'ManageUser'>;

export const ManageUserScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute<ManageUserRouteProp>();
  const userId = route.params?.userId || '';

  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'security'>('overview');
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isActive, setIsActive] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const fetchUserDetails = useCallback(async () => {
    if (!userId) {
      setErrorMessage('User ID is missing or not provided.');
      setIsLoading(false);
      return;
    }
    try {
      setErrorMessage(null);
      const data = await apiClient.admin.getUserDetails(userId);
      if (data) {
        setUserDetails(data);
        setIsActive(data.user.status === 'ACTIVE');
        setIsAdmin(data.user.role === 'ADMIN');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to load user details.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setIsLoading(true);
    void fetchUserDetails();
  }, [fetchUserDetails]);

  const handleToggleStatus = async () => {
    const nextStatus = isActive ? 'SUSPENDED' : 'ACTIVE';
    setIsProcessing(true);
    try {
      await apiClient.admin.updateUser(userId, { status: nextStatus });
      setIsActive(!isActive);
      triggerFeedback(`User account ${nextStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to update user status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAdmin = async () => {
    const nextRole = isAdmin ? 'USER' : 'ADMIN';
    setIsProcessing(true);
    try {
      await apiClient.admin.updateUser(userId, { role: nextRole });
      setIsAdmin(!isAdmin);
      triggerFeedback(
        nextRole === 'ADMIN' ? 'Admin privileges granted.' : 'Admin privileges revoked.'
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to update role privileges.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = () => {
    const dialogDef = CONFIRM_DIALOGS.admin.resetPassword(userName);
    const [title, message, buttons] = toMobileAlertArgs(dialogDef, async () => {
      setIsProcessing(true);
      try {
        await apiClient.admin.resetUserPassword(userId);
        triggerFeedback('Password reset link sent to user email.');
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to trigger password reset.');
      } finally {
        setIsProcessing(false);
      }
    });
    Alert.alert(title, message, buttons);
  };

  const handleResetKba = () => {
    const dialogDef = CONFIRM_DIALOGS.admin.resetKba(userName);
    const [title, message, buttons] = toMobileAlertArgs(dialogDef, async () => {
      setIsProcessing(true);
      try {
        await apiClient.admin.resetUserKba(userId);
        triggerFeedback('Security questions reset. User must reconfigure on next login.');
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to reset security questions.');
      } finally {
        setIsProcessing(false);
      }
    });
    Alert.alert(title, message, buttons);
  };

  const handleDeleteUser = async () => {
    setIsProcessing(true);
    try {
      await apiClient.admin.deleteUser(userId);
      setIsDeleteModalOpen(false);
      Alert.alert('User Deleted', 'The user account has been permanently removed.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Deletion Failed', err?.response?.data?.error?.message || 'Failed to delete user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const userName = userDetails?.user?.fullName || userDetails?.user?.email?.split('@')[0] || 'User';
  const userEmail = userDetails?.user?.email || 'Not Set';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Manage User"
        subtitle={`Account ID: ${userId.slice(0, 8)}...`}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userHeroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <Text style={styles.userNameText}>{userName}</Text>
          <Text style={styles.userEmailText}>{userEmail}</Text>

          <View style={styles.badgesRow}>
            <View
              style={[
                styles.roleBadge,
                isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextUser,
                ]}
              >
                {isAdmin ? 'ADMIN ROLE' : 'STANDARD USER'}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isActive ? styles.statusBadgeActive : styles.statusBadgeSuspended,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextSuspended,
                ]}
              >
                {isActive ? 'ACCOUNT ACTIVE' : 'ACCOUNT SUSPENDED'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3-Tab Segmented Control */}
        <View style={styles.tabBar}>
          {(['overview', 'permissions', 'security'] as const).map((tab) => {
            const isTabSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessible={true}
                style={[styles.tabButton, isTabSelected && styles.tabButtonActive]}
                accessibilityRole="button"
                accessibilityLabel={`${tab} tab`}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isTabSelected && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {feedback && (
          <View style={styles.feedbackBanner}>
            <CheckIcon size={16} color={colors.success} />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={[styles.feedbackBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <AlertCircleIcon size={16} color={colors.danger} />
            <Text style={[styles.feedbackText, { color: colors.danger }]}>{errorMessage}</Text>
          </View>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={[styles.infoRow, styles.rowBorder]}>
                <View style={styles.infoRowLeft}>
                  <CalendarIcon size={16} color={colors.textMuted} />
                  <Text style={styles.infoLabel}>Joined Date</Text>
                </View>
                <Text style={styles.infoValue}>
                  {userDetails?.user?.createdAt
                    ? formatDate(userDetails.user.createdAt)
                    : 'N/A'}
                </Text>
              </View>

              <View style={[styles.infoRow, styles.rowBorder]}>
                <View style={styles.infoRowLeft}>
                  <ClockIcon size={16} color={colors.textMuted} />
                  <Text style={styles.infoLabel}>Last Active Login</Text>
                </View>
                <Text style={styles.infoValue}>
                  {userDetails?.user?.lastLoginAt
                    ? formatDateTime(userDetails.user.lastLoginAt)
                    : 'Never'}
                </Text>
              </View>

              <View style={[styles.infoRow, styles.rowBorder]}>
                <View style={styles.infoRowLeft}>
                  <CheckIcon size={16} color={userDetails?.user?.onboardingCompleted ? colors.success : colors.warning} />
                  <Text style={styles.infoLabel}>Onboarding Status</Text>
                </View>
                <Text style={userDetails?.user?.onboardingCompleted ? styles.infoValueSuccess : styles.infoValue}>
                  {userDetails?.user?.onboardingCompleted ? 'Fully Completed' : 'Pending'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <ShieldIcon size={16} color={colors.textMuted} />
                  <Text style={styles.infoLabel}>Account Access State</Text>
                </View>
                <Pressable
                  onPress={handleToggleStatus}
                  disabled={isProcessing}
                  accessible={true}
                  style={[
                    styles.statusToggleButton,
                    isActive
                      ? styles.statusToggleButtonActive
                      : styles.statusToggleButtonSuspended,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isActive ? 'Disable User' : 'Enable User'}
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      isActive
                        ? styles.statusToggleTextActive
                        : styles.statusToggleTextSuspended,
                    ]}
                  >
                    {isActive ? 'Enabled' : 'Disabled'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Permissions */}
        {activeTab === 'permissions' && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextColumn}>
                  <Text style={styles.toggleTitle}>Admin Privilege Access</Text>
                  <Text style={styles.toggleDesc}>
                    Grants access to manage users, settings, and audit logs.
                  </Text>
                </View>
                <Switch
                  value={isAdmin}
                  onValueChange={handleToggleAdmin}
                  disabled={isProcessing}
                  trackColor={{ false: '#E4E7EC', true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Security */}
        {activeTab === 'security' && (
          <View style={styles.securityColumn}>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>CREDENTIAL & RECOVERY ACTIONS</Text>

              <Pressable
                onPress={handleResetPassword}
                disabled={isProcessing}
                accessible={true}
                style={({ pressed }) => [
                  styles.actionRow,
                  styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Send Password Reset Link"
              >
                <View style={styles.actionRowLeft}>
                  <View style={styles.actionIconCircle}>
                    <RefreshCwIcon size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.actionRowTitle}>Send Password Reset Link</Text>
                    <Text style={styles.actionRowSub}>
                      Dispatches recovery email to user address
                    </Text>
                  </View>
                </View>
                <ChevronRightIcon size={16} color="#98A2B3" />
              </Pressable>

              <Pressable
                onPress={handleResetKba}
                disabled={isProcessing}
                accessible={true}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Reset Security Questions"
              >
                <View style={styles.actionRowLeft}>
                  <View style={styles.actionIconCircle}>
                    <KeyRoundIcon size={18} color={colors.warning} />
                  </View>
                  <View>
                    <Text style={styles.actionRowTitle}>Reset Security Questions</Text>
                    <Text style={styles.actionRowSub}>
                      Requires reconfiguration on next user sign-in
                    </Text>
                  </View>
                </View>
                <ChevronRightIcon size={16} color="#98A2B3" />
              </Pressable>
            </View>

            {/* Permanent Destruction */}
            <View style={styles.dangerCard}>
              <View style={styles.dangerHeaderRow}>
                <AlertCircleIcon size={16} color={colors.danger} />
                <Text style={styles.dangerTitle}>ACCOUNT STATUS & DELETION</Text>
              </View>
              <Text style={styles.dangerText}>
                Deactivating this user will revoke system access and soft-delete their account record.
              </Text>
              <Pressable
                onPress={() => setIsDeleteModalOpen(true)}
                accessible={true}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Delete User Account"
              >
                <TrashIcon size={16} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Deactivate User Account</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Delete User Confirmation Modal */}
      <Modal
        visible={isDeleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.actionModalCard}>
            <View style={styles.modalIconCircleDanger}>
              <AlertCircleIcon size={24} color={colors.danger} />
            </View>
            <Text style={styles.actionModalTitle}>{CONFIRM_DIALOGS.admin.softDeleteUser(userName).title}</Text>
            <Text style={styles.actionModalText}>
              {CONFIRM_DIALOGS.admin.softDeleteUser(userName).message}
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => setIsDeleteModalOpen(false)}
                style={styles.modalCancelButton}
                disabled={isProcessing}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalCancelButtonText}>{CONFIRM_DIALOGS.admin.softDeleteUser(userName).cancelLabel}</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteUser}
                style={styles.modalConfirmDangerButton}
                disabled={isProcessing}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Confirm Delete"
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>{CONFIRM_DIALOGS.admin.softDeleteUser(userName).confirmLabel}</Text>
                )}
              </Pressable>
            </View>
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
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  userHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  userEmailText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.investmentBg,
  },
  roleBadgeUser: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleBadgeTextAdmin: {
    color: colors.investment,
  },
  roleBadgeTextUser: {
    color: colors.textMuted,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedbackBanner: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  sectionContainer: {
    gap: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  infoValueSuccess: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  statusToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusToggleButtonActive: {
    backgroundColor: colors.successBg,
  },
  statusToggleButtonSuspended: {
    backgroundColor: colors.dangerBg,
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusToggleTextActive: {
    color: colors.success,
  },
  statusToggleTextSuspended: {
    color: colors.danger,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  toggleTextColumn: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  securityColumn: {
    gap: 14,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  actionRowSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    gap: 10,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dangerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: 0.8,
  },
  dangerText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  deleteButtonText: {
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
  actionModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
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
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmDangerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
