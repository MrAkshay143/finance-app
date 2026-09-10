import type { QueryClient } from '@tanstack/react-query';

/**
 * Centralized Data Synchronization Service
 * 
 * Ensures all dependent views (Dashboard totals, account balances, FAM score,
 * category donut breakdowns, monthly budgets, analytics, and reports) are
 * immediately invalidated and refetched whenever any data mutation occurs.
 */

export async function syncOnTransactionMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['transfers'] }),
    queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['goals'] }),
    queryClient.invalidateQueries({ queryKey: ['investments'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncOnAccountMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['investments'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncOnCategoryMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['categories'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncOnMerchantMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['merchants'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncOnBudgetMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncOnGoalMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['goals'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncOnProfileMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['profile'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncOnSettingsMutation(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['userSettings'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}

export async function syncAllFinanceData(queryClient?: QueryClient): Promise<void> {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['transfers'] }),
    queryClient.invalidateQueries({ queryKey: ['categories'] }),
    queryClient.invalidateQueries({ queryKey: ['merchants'] }),
    queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['goals'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['investments'] }),
    queryClient.invalidateQueries({ queryKey: ['profile'] }),
    queryClient.invalidateQueries({ queryKey: ['userSettings'] }),
    queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['user-audit-logs'] }),
  ]);
}
