export type DialogSeverity = 'danger' | 'warning' | 'primary';

export interface ConfirmDialogDefinition {
  title: string;
  subtitle?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  severity: DialogSeverity;
  icon?: 'trash' | 'alert' | 'power' | 'refresh' | 'lock';
}

export const CONFIRM_DIALOGS = {
  transactions: {
    delete: (description?: string): ConfirmDialogDefinition => ({
      title: 'Delete Transaction',
      subtitle: 'Confirm deletion',
      message: description
        ? `Delete "${description}"? Associated account balance will revert.`
        : 'Delete this transaction? Associated account balance will revert.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    deleteTransfer: (): ConfirmDialogDefinition => ({
      title: 'Delete Transfer',
      subtitle: 'Confirm deletion',
      message: 'Delete this transfer? Both account balances will revert.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  accounts: {
    toggleStatus: (name: string, isCurrentlyActive: boolean): ConfirmDialogDefinition => ({
      title: isCurrentlyActive ? 'Deactivate Account' : 'Activate Account',
      subtitle: 'Confirm account status change',
      message: isCurrentlyActive
        ? `Deactivate "${name}"? Existing history is retained, but new transactions cannot be added.`
        : `Reactivate "${name}"? It will be available for new transactions immediately.`,
      confirmLabel: isCurrentlyActive ? 'Deactivate Account' : 'Activate Account',
      cancelLabel: 'Cancel',
      severity: isCurrentlyActive ? 'danger' : 'primary',
      icon: 'power',
    }),
  },
  planning: {
    deleteBudget: (categoryName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Budget',
      subtitle: 'This action cannot be undone',
      message: categoryName
        ? `Permanently delete budget for "${categoryName}"? History will not be affected.`
        : 'Permanently delete this budget? History will not be affected.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    deleteGoal: (goalName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Goal',
      subtitle: 'This action cannot be undone',
      message: goalName
        ? `Permanently delete savings goal "${goalName}"? Target history will be removed.`
        : 'Permanently delete this savings goal? Target history will be removed.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  categories: {
    delete: (categoryName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Category',
      subtitle: 'Confirm category removal',
      message: categoryName
        ? `Permanently delete category "${categoryName}"? Existing transactions remain intact.`
        : 'Permanently delete this category? Existing transactions remain intact.',
      confirmLabel: 'Delete Category',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  recurring: {
    delete: (description?: string): ConfirmDialogDefinition => ({
      title: 'Delete Recurring Schedule',
      subtitle: 'Confirm schedule removal',
      message: description
        ? `Stop and delete schedule "${description}"? Historical transactions remain intact.`
        : 'Stop and delete this recurring schedule? Historical transactions remain intact.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  settings: {
    resetTargets: (): ConfirmDialogDefinition => ({
      title: 'Reset Targets?',
      subtitle: 'Restore defaults',
      message: 'This clears monthly budget and investment targets. Transactions and login remain safe.',
      confirmLabel: 'Reset Targets',
      cancelLabel: 'Cancel',
      severity: 'warning',
      icon: 'refresh',
    }),
    deleteAccount: (): ConfirmDialogDefinition => ({
      title: 'Delete Account',
      subtitle: 'Permanent deletion of account and data',
      message: 'Permanently delete your account and all financial data? This action cannot be undone.',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    signOut: (): ConfirmDialogDefinition => ({
      title: 'Sign Out',
      subtitle: 'End current session',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'power',
    }),
  },
  admin: {
    softDeleteUser: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Deactivate & Delete User',
      subtitle: 'Soft delete account',
      message: emailOrName
        ? `Access will be revoked and account for "${emailOrName}" hidden. An admin can restore it anytime.`
        : 'Access will be revoked and account hidden. An admin can restore it anytime.',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    resetPassword: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Reset Password',
      subtitle: 'Temporary password generated',
      message: emailOrName
        ? `A temporary password has been generated for ${emailOrName}. User must update it on login.`
        : 'A temporary password has been generated.',
      confirmLabel: 'Done',
      cancelLabel: 'Close',
      severity: 'primary',
      icon: 'lock',
    }),
    resetKba: (userName?: string): ConfirmDialogDefinition => ({
      title: 'Reset Security Questions',
      subtitle: 'Force KBA re-enrollment',
      message: userName
        ? `Clear security questions for ${userName}? They must set up new questions on next login.`
        : 'Clear security questions? User must set up new questions on next login.',
      confirmLabel: 'Reset Questions',
      cancelLabel: 'Cancel',
      severity: 'warning',
      icon: 'refresh',
    }),
    lockAccount: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Lock User Account',
      subtitle: 'Suspend account access',
      message: emailOrName
        ? `Lock account for "${emailOrName}"? They will be immediately prevented from logging in.`
        : 'Lock this account? The user will be immediately prevented from logging in.',
      confirmLabel: 'Lock Account',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'lock',
    }),
    unlockAccount: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Unlock User Account',
      subtitle: 'Restore account access',
      message: emailOrName
        ? `Unlock account for "${emailOrName}"? They will regain access to log in.`
        : 'Unlock this account? The user will regain access to log in.',
      confirmLabel: 'Unlock Account',
      cancelLabel: 'Cancel',
      severity: 'primary',
      icon: 'lock',
    }),
    forceLogout: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Force Logout',
      subtitle: 'Revoke all active sessions',
      message: emailOrName
        ? `Revoke all active sessions for "${emailOrName}"? They will be signed out on all devices.`
        : 'Revoke all active sessions? The user will be signed out on all devices.',
      confirmLabel: 'Revoke Sessions',
      cancelLabel: 'Cancel',
      severity: 'warning',
      icon: 'power',
    }),
  },
} as const;

export interface MobileAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Helper to convert a ConfirmDialogDefinition into arguments for React Native's Alert.alert
 */
export function toMobileAlertArgs(
  def: ConfirmDialogDefinition,
  onConfirm: () => void
): [string, string, MobileAlertButton[]] {
  return [
    def.title,
    def.message,
    [
      { text: def.cancelLabel, style: 'cancel' },
      {
        text: def.confirmLabel,
        style: def.severity === 'danger' ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ],
  ];
}
