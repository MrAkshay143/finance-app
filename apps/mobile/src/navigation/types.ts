import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  AddPlaceholder: undefined;
  Reports: undefined;
  More: undefined;
};

export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Signup: undefined;

  // Onboarding Stack
  Onboarding: undefined;

  // Main 5-item App Shell
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;

  // Accounts, Planning & Detail Screens
  Accounts: undefined;
  Planning: undefined;
  Categories: undefined;
  Profile: undefined;
  BasicProfile: undefined;
  FinanceProfile: undefined;
  SecurityQuestions: undefined;

  // Phase 4 Analytics, Reports, Investments, Recurring & AI Screens
  Reports: undefined;
  Analytics: undefined;
  Notifications: undefined;
  Investments: undefined;
  Recurring: undefined;
  AiAnalysis: undefined;

  // Phase 5 Settings, Admin, Audit, About & Import/Export Screens
  Menu: undefined;
  About: undefined;
  Settings: undefined;
  AuditLog: undefined;
  AdminDashboard: undefined;
  ManageUser: { userId: string };
  AdminSettings: undefined;
  AdminAudit: undefined;
  Import: undefined;
  Export: undefined;

  // Modals & Overlays
  AddTransactionModal:
    | {
        defaultType?: 'income' | 'expense' | 'investment' | 'transfer';
      }
    | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
