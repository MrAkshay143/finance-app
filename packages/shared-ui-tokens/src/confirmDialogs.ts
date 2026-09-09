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
      message: description
        ? `Delete "${description}"? Account balance will revert.`
        : 'Delete this transaction? Account balance will revert.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    deleteTransfer: (): ConfirmDialogDefinition => ({
      title: 'Delete Transfer',
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
      message: isCurrentlyActive
        ? `Deactivate "${name}"? Past records remain, but new entries will be disabled.`
        : `Reactivate "${name}" for new transactions?`,
      confirmLabel: isCurrentlyActive ? 'Deactivate' : 'Activate',
      cancelLabel: 'Cancel',
      severity: isCurrentlyActive ? 'danger' : 'primary',
      icon: 'power',
    }),
  },
  planning: {
    deleteBudget: (categoryName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Budget',
      message: categoryName
        ? `Delete budget for "${categoryName}"? Past records remain intact.`
        : 'Delete this budget? Past records remain intact.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    deleteGoal: (goalName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Goal',
      message: goalName
        ? `Delete savings goal "${goalName}"? Target progress will be removed.`
        : 'Delete this savings goal? Target progress will be removed.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  categories: {
    delete: (categoryName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Category',
      message: categoryName
        ? `Delete category "${categoryName}"? Existing transactions remain intact.`
        : 'Delete this category? Existing transactions remain intact.',
      confirmLabel: 'Delete Category',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  merchants: {
    delete: (merchantName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Merchant',
      message: merchantName
        ? `Delete merchant "${merchantName}"? Associated records remain intact.`
        : 'Delete this merchant? Associated records remain intact.',
      confirmLabel: 'Delete Merchant',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  recurring: {
    delete: (description?: string): ConfirmDialogDefinition => ({
      title: 'Delete Schedule',
      message: description
        ? `Delete schedule "${description}"? Past transactions remain intact.`
        : 'Delete this recurring schedule? Past transactions remain intact.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  settings: {
    resetTargets: (): ConfirmDialogDefinition => ({
      title: 'Reset Targets',
      message: 'Reset monthly budget and investment targets to defaults? Transactions remain safe.',
      confirmLabel: 'Reset Targets',
      cancelLabel: 'Cancel',
      severity: 'warning',
      icon: 'refresh',
    }),
    deleteAccount: (): ConfirmDialogDefinition => ({
      title: 'Delete Account',
      message: 'Delete your account and all associated financial data?',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    signOut: (): ConfirmDialogDefinition => ({
      title: 'Sign Out',
      message: 'Sign out of your account now?',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'power',
    }),
  },
  admin: {
    softDeleteUser: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Delete User',
      message: emailOrName
        ? `Revoke access and hide account for "${emailOrName}"? Can be restored anytime.`
        : 'Revoke access and hide account? Can be restored anytime.',
      confirmLabel: 'Delete User',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    resetPassword: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Reset Password',
      message: emailOrName
        ? `Generate temporary password for ${emailOrName} and revoke active sessions?`
        : 'Generate temporary password and revoke active sessions?',
      confirmLabel: 'Reset Password',
      cancelLabel: 'Cancel',
      severity: 'primary',
      icon: 'lock',
    }),
    resetKba: (userName?: string): ConfirmDialogDefinition => ({
      title: 'Reset Security Questions',
      message: userName
        ? `Clear security questions for ${userName}? They will re-enroll on next login.`
        : 'Clear security questions? User will re-enroll on next login.',
      confirmLabel: 'Reset Questions',
      cancelLabel: 'Cancel',
      severity: 'warning',
      icon: 'refresh',
    }),
    lockAccount: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Lock Account',
      message: emailOrName
        ? `Lock account for "${emailOrName}"? Login access will be suspended.`
        : 'Lock this account? Login access will be suspended.',
      confirmLabel: 'Lock Account',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'lock',
    }),
    unlockAccount: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Unlock Account',
      message: emailOrName
        ? `Unlock account for "${emailOrName}"? Login access will be restored.`
        : 'Unlock this account? Login access will be restored.',
      confirmLabel: 'Unlock Account',
      cancelLabel: 'Cancel',
      severity: 'primary',
      icon: 'lock',
    }),
    forceLogout: (emailOrName?: string): ConfirmDialogDefinition => ({
      title: 'Force Logout',
      message: emailOrName
        ? `Revoke active sessions for "${emailOrName}" across all devices?`
        : 'Revoke all active sessions across all devices?',
      confirmLabel: 'Force Logout',
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
