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
        ? `Delete "${description}"? Your balance will update automatically.`
        : 'Delete this transaction? Your balance will update automatically.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    deleteTransfer: (): ConfirmDialogDefinition => ({
      title: 'Delete Transfer',
      message: 'Delete this transfer? Both account balances will update.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  accounts: {
    delete: (name?: string): ConfirmDialogDefinition => ({
      title: 'Delete Account',
      message: name
        ? `Delete "${name}" and its transaction history?`
        : 'Delete this account and its transaction history?',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    toggleStatus: (name: string, isCurrentlyActive: boolean): ConfirmDialogDefinition => ({
      title: isCurrentlyActive ? 'Deactivate Account' : 'Activate Account',
      message: isCurrentlyActive
        ? `Deactivate "${name}"? Past records remain, but new entries will pause.`
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
        ? `Delete the "${categoryName}" budget? Spending history will be preserved.`
        : 'Delete this budget? Spending history will be preserved.',
      confirmLabel: 'Delete Budget',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    deleteGoal: (goalName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Savings Goal',
      message: goalName
        ? `Delete savings goal "${goalName}"? Allocated funds will remain in your accounts.`
        : 'Delete this goal? Allocated funds will remain in your accounts.',
      confirmLabel: 'Delete Goal',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
  },
  categories: {
    delete: (categoryName?: string): ConfirmDialogDefinition => ({
      title: 'Delete Category',
      message: categoryName
        ? `Delete category "${categoryName}"? Transactions will move to Uncategorized.`
        : 'Delete this category? Transactions will move to Uncategorized.',
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
      title: 'Delete Recurring Schedule',
      message: description
        ? `Delete schedule "${description}"? Past transactions will be preserved.`
        : 'Delete this schedule? Past transactions will be preserved.',
      confirmLabel: 'Delete Schedule',
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
    resetFinancialProfile: (): ConfirmDialogDefinition => ({
      title: 'Reset Financial Profile',
      subtitle: 'Your login and security questions will remain.',
      message: 'Delete all transactions, accounts, budgets, and goals? Your login and security questions will remain.',
      confirmLabel: 'Reset All Data',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'refresh',
    }),
    resetAllData: (): ConfirmDialogDefinition => ({
      title: 'Reset All Data',
      subtitle: 'Your login and security questions will remain.',
      message: 'Delete all transactions, accounts, budgets, and goals?',
      confirmLabel: 'Reset All Data',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'refresh',
    }),
    deleteAccount: (): ConfirmDialogDefinition => ({
      title: 'Delete Account',
      message: 'Delete this account and its transaction history?',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      severity: 'danger',
      icon: 'trash',
    }),
    signOut: (): ConfirmDialogDefinition => ({
      title: 'Log Out',
      message: 'Log out of your account on this device?',
      confirmLabel: 'Log Out',
      cancelLabel: 'Stay Logged In',
      severity: 'danger',
      icon: 'power',
    }),
  },
  auth: {
    logout: (): ConfirmDialogDefinition => ({
      title: 'Log Out',
      message: 'Log out of your account on this device?',
      confirmLabel: 'Log Out',
      cancelLabel: 'Stay Logged In',
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
      title: 'Sign out all devices',
      message: emailOrName
        ? `Sign out all devices for "${emailOrName}"?`
        : 'Sign out all devices?',
      confirmLabel: 'Sign out all devices',
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

// Convert ConfirmDialogDefinition to React Native Alert.alert arguments
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
