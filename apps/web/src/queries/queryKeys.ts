/**
 * Canonical Query Key Factory
 * Centralizes all TanStack Query cache keys to eliminate typos, duplicate keys,
 * and inconsistent cache entries across pages, components, and socket handlers.
 */

export const queryKeys = {
  dashboard: ['dashboard'] as const,

  accounts: {
    all: ['accounts'] as const,
    detail: (id: string) => ['accounts', id] as const,
  },

  transactions: {
    all: ['transactions'] as const,
    list: (type?: string, accountId?: string, search?: string) =>
      ['transactions', type || 'ALL', accountId || 'ALL', search || ''] as const,
  },

  transfers: ['transfers'] as const,

  categories: {
    all: ['categories'] as const,
    byType: (type?: string) => ['categories', type || 'ALL'] as const,
  },

  merchants: ['merchants'] as const,

  budgets: ['budgets'] as const,

  goals: ['goals'] as const,

  analytics: (month: string, accountId?: string) =>
    ['analytics', month, accountId || 'all'] as const,

  reports: {
    monthly: (month: string) => ['reports', 'monthly', month] as const,
    annual: (year: string) => ['reports', 'annual', year] as const,
    custom: (start: string, end: string) => ['reports', 'custom', start, end] as const,
  },

  investments: ['investments'] as const,

  recurring: ['recurring-transactions'] as const,

  auditLogs: (category?: string, search?: string) =>
    ['user-audit-logs', category || 'ALL', search || ''] as const,

  notifications: (filter?: string) => ['notifications', filter || 'ALL'] as const,

  reminders: ['reminders'] as const,

  userSettings: ['userSettings'] as const,

  activeSessions: ['user-active-sessions'] as const,

  aiAnalysis: (month: string) => ['ai-analysis', month] as const,

  admin: {
    metrics: ['admin-dashboard-metrics'] as const,
    users: (filter?: string, search?: string, sortBy?: string) =>
      ['admin-users', filter || 'ALL', search || '', sortBy || ''] as const,
    userDetails: (id: string) => ['admin-user-details', id] as const,
    analytics: (timeframe?: string) => ['admin-platform-analytics', timeframe || '30d'] as const,
    health: ['admin-system-health'] as const,
    settings: ['admin-app-settings'] as const,
    categories: ['admin-system-categories'] as const,
    auditLogs: (category?: string, search?: string) =>
      ['admin-audit-logs', category || 'ALL', search || ''] as const,
  },
};
