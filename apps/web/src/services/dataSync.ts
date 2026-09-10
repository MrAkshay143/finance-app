import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys.js';

// Realtime Socket.IO synchronization service for active web sessions
// Using { refetchType: 'active' } guarantees silent background sync:
// only active components currently on screen refetch immediately,
// while inactive caches are marked stale and revalidate silently upon navigation.

const activeOnly = { refetchType: 'active' as const };

export async function syncOnTransactionMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transfers, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['reports'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.goals, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.investments, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.merchants, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['ai-analysis'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function syncOnAccountMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['reports'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.investments, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function syncOnCategoryMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['reports'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function syncOnMerchantMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.merchants, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function syncOnBudgetMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function syncOnGoalMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.goals, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function syncOnProfileMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.userSettings, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['reports'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function syncOnSettingsMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.userSettings, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['reports'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

export async function handleSilentSyncEvent(queryClient?: QueryClient, event?: any): Promise<void> {
  if (!queryClient) return;
  if (!event || typeof event !== 'object') {
    return syncAllFinanceData(queryClient);
  }

  const entity = event.entity;
  switch (entity) {
    case 'TRANSACTION':
    case 'TRANSFER':
      return syncOnTransactionMutation(queryClient);
    case 'ACCOUNT':
      return syncOnAccountMutation(queryClient);
    case 'CATEGORY':
      return syncOnCategoryMutation(queryClient);
    case 'MERCHANT':
      return syncOnMerchantMutation(queryClient);
    case 'BUDGET':
      return syncOnBudgetMutation(queryClient);
    case 'GOAL':
      return syncOnGoalMutation(queryClient);
    case 'RECURRING':
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.recurring, ...activeOnly }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all, ...activeOnly }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all, ...activeOnly }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
      ]);
      return;
    case 'PROFILE':
      return syncOnProfileMutation(queryClient);
    case 'SETTINGS':
      return syncOnSettingsMutation(queryClient);
    case 'ADMIN_USER':
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.users(), ...activeOnly }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.metrics, ...activeOnly }),
      ]);
      return;
    case 'ADMIN_CATEGORY':
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories, ...activeOnly }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all, ...activeOnly }),
      ]);
      return;
    default:
      return syncAllFinanceData(queryClient);
  }
}

export async function syncAllFinanceData(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transfers, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.merchants, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.goals, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['analytics'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['reports'], ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.investments, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.userSettings, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: queryKeys.recurring, ...activeOnly }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'], ...activeOnly }),
  ]);
}

