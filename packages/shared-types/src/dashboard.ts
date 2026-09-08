import { Transaction } from './transactions.js';

export interface DashboardFamArea {
  target: number;
  targetPaise?: number;
  actual: number;
  actualPaise?: number;
  percentage: number;
  gradeDisplay?: string;
  status?: string;
  statusLabel?: string;
}

export interface DashboardTargetItem {
  target: number;
  targetPaise?: number;
  actual: number;
  actualPaise?: number;
  remaining: number;
  remainingPaise?: number;
  percent: number;
}

export interface DashboardExpenseCategory {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  amountPaise?: number;
  percentage: number;
}

export interface DashboardAccountSummary {
  totalBalance: number;
  totalBalancePaise?: number;
  activeCount: number;
}

export interface DashboardSummary {
  period: {
    month: number;
    year: number;
    periodStart: string | Date;
    periodEnd: string | Date;
  };
  fam: {
    isAvailable: boolean;
    overallGrade: string;
    grade: string;
    gradeDisplay: string;
    statusLabel: string;
    overallProgressPercentage: number;
    progress: number;
    month: number;
    year: number;
    areas: {
      income: DashboardFamArea;
      expense: DashboardFamArea;
      investment: DashboardFamArea;
    };
  };
  targets: {
    income: DashboardTargetItem;
    expense: DashboardTargetItem;
    investment: DashboardTargetItem;
  };
  securityBanner: {
    showSecurityReminder: boolean;
    configuredQuestionsCount: number;
  };
  expenseBreakdown: DashboardExpenseCategory[];
  accountSummary: DashboardAccountSummary;
  recentTransactions: Transaction[];
}
