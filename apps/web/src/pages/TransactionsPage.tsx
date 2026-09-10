import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Receipt,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { Pagination } from '../components/ui/Pagination.js';
import { SegmentedControl } from '../components/ui/SegmentedControl.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { TransactionItemSkeleton } from '../components/ui/Skeleton.js';
import { useUiStore, TransactionType } from '../store/uiStore.js';
import { formatCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { syncOnTransactionMutation } from '../services/dataSync.js';
import { formatDate } from '../utils/date.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import type { Transaction, TxnType } from '@finance/shared-types';
import { toast } from '../store/toastStore.js';

export interface DisplayItem {
  id: string;
  isTransfer: boolean;
  type: TransactionType;
  title: string;
  merchant?: string;
  categoryName?: string;
  accountName: string;
  accountId: string;
  toAccountName?: string;
  toAccountId?: string;
  amount: number;
  date: string;
  description: string;
}

export const TransactionsPage: React.FC = () => {
  const queryClient = useSafeQueryClient();
  const { currency: userCurrency } = useUserCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountIdParam = searchParams.get('accountId') || '';

  const openPicker = useUiStore((state) => state.openPicker);
  const openAddModal = useUiStore((state) => state.openAddModal);
  const openEditModal = useUiStore((state) => state.openEditModal);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const TAB_EMPTY_CONFIG: Record<string, { label: string; actionType: TransactionType }> = {
    all: { label: 'Add Transaction', actionType: 'expense' },
    expense: { label: 'Add Expense', actionType: 'expense' },
    income: { label: 'Add Income', actionType: 'income' },
    investment: { label: 'Add Investment', actionType: 'investment' },
    transfer: { label: 'Add Transfer', actionType: 'transfer' },
  };

  // Delete confirmation modal state
  const [deletingItem, setDeletingItem] = useState<DisplayItem | null>(null);

  // Expanded card state — only one at a time
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Accounts to resolve names
  const { data: accountsData } = useQuery(
    {
      queryKey: ['accounts'],
      queryFn: async () => {
        return await apiClient.accounts.list();
      },
    },
    queryClient
  );

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    if (accountsData?.accounts) {
      for (const acc of accountsData.accounts) {
        map.set(acc.id, acc.name);
      }
    }
    return map;
  }, [accountsData]);

  // Fetch Transactions via TanStack Query
  const txnTypeQuery =
    activeFilter === 'income' || activeFilter === 'expense' || activeFilter === 'investment'
      ? (activeFilter.toUpperCase() as TxnType)
      : undefined;

  const {
    data: txnsData,
    isLoading: isLoadingTxns,
    isError: isTxnError,
    error: txnError,
  } = useQuery(
    {
      queryKey: ['transactions', txnTypeQuery, accountIdParam, debouncedSearch],
      queryFn: async () => {
        const res = await apiClient.transactions.list({
          page: 1,
          pageSize: 100,
          type: txnTypeQuery,
          accountId: accountIdParam || undefined,
          search: debouncedSearch.trim() || undefined,
        });
        return res;
      },
    },
    queryClient
  );

  // Fetch Transfers if "all" or "transfer" is active
  const shouldFetchTransfers = activeFilter === 'all' || activeFilter === 'transfer';
  const {
    data: transfersData,
    isLoading: isLoadingTransfers,
  } = useQuery(
    {
      queryKey: ['transfers'],
      queryFn: async () => {
        return await apiClient.transfers.list();
      },
      enabled: shouldFetchTransfers,
    },
    queryClient
  );

  // Soft Delete Mutations
  const deleteTxnMutation = useMutation(
    {
      mutationFn: async (id: string) => {
        return await apiClient.transactions.delete(id);
      },
      onSuccess: () => {
        syncOnTransactionMutation(queryClient);
        setDeletingItem(null);
        toast.success('Transaction deleted successfully');
      },
      onError: (err: any) => {
        toast.error(getFriendlyErrorMessage(err, 'Failed to delete transaction'));
      },
    },
    queryClient
  );

  const deleteTransferMutation = useMutation(
    {
      mutationFn: async (id: string) => {
        return await apiClient.transfers.delete(id);
      },
      onSuccess: () => {
        syncOnTransactionMutation(queryClient);
        setDeletingItem(null);
        toast.success('Transfer deleted successfully');
      },
      onError: (err: any) => {
        toast.error(getFriendlyErrorMessage(err, 'Failed to delete transfer'));
      },
    },
    queryClient
  );

  // Unify and filter items
  const displayItems = useMemo<DisplayItem[]>(() => {
    const items: DisplayItem[] = [];

    // Map regular transactions
    const rawTxns = txnsData?.items || [];
    for (const t of rawTxns) {
      const tType = (t.type?.toLowerCase() || 'expense') as TransactionType;
      const joinedCategory = (t as any).category?.name || '';
      const title = t.merchant || joinedCategory || t.description || 'Transaction';
      const accName = (t as any).account?.name || accountMap.get(t.accountId) || 'Account';

      // If active filter is "transfer", skip regular transactions unless marked as transfer
      if (activeFilter === 'transfer') continue;

      items.push({
        id: t.id,
        isTransfer: false,
        type: tType,
        title,
        merchant: t.merchant || undefined,
        categoryName: (t as any).category?.name || undefined,
        accountName: accName,
        accountId: t.accountId,
        amount: t.amount,
        date: t.date || (t as any).txnDate || t.createdAt,
        description: t.description,
      });
    }

    // Map transfers
    if (shouldFetchTransfers && transfersData && Array.isArray(transfersData)) {
      for (const tr of transfersData) {
        // If filtered by accountId, ensure it matches either source or dest
        if (accountIdParam && tr.sourceAccountId !== accountIdParam && tr.destinationAccountId !== accountIdParam) {
          continue;
        }

        const sourceName = accountMap.get(tr.sourceAccountId) || 'Source Account';
        const destName = accountMap.get(tr.destinationAccountId) || 'Destination Account';
        const searchMatches =
          !debouncedSearch ||
          tr.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          sourceName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          destName.toLowerCase().includes(debouncedSearch.toLowerCase());

        if (searchMatches) {
          items.push({
            id: tr.id,
            isTransfer: true,
            type: 'transfer',
            title: tr.description || `Transfer: ${sourceName} → ${destName}`,
            accountName: `${sourceName} → ${destName}`,
            accountId: tr.sourceAccountId,
            toAccountId: tr.destinationAccountId,
            amount: tr.amount,
            date: tr.txnDate || tr.date || tr.createdAt,
            description: tr.description || 'Account Transfer',
          });
        }
      }
    }

    // Sort by date descending
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [txnsData, transfersData, activeFilter, shouldFetchTransfers, accountIdParam, debouncedSearch, accountMap]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;

  // Reset currentPage to 1 whenever activeFilter, debouncedSearch, or accountIdParam changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedSearch, accountIdParam]);

  const totalPages = Math.max(1, Math.ceil(displayItems.length / PAGE_SIZE));

  // Clamp current page if items shrink
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    return displayItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [displayItems, currentPage]);

  const isLoading = isLoadingTxns || (shouldFetchTransfers && isLoadingTransfers);
  const totalRecordsCount = displayItems.length;

  const filterOptions = [
    { value: 'all', label: 'All', badge: totalRecordsCount },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'investment', label: 'Investment' },
    { value: 'transfer', label: 'Transfer' },
  ];

  const handleEditClick = (item: DisplayItem) => {
    openEditModal(item.type, {
      id: item.id,
      amount: item.amount,
      type: item.type,
      accountId: item.accountId,
      toAccountId: item.toAccountId,
      merchant: item.merchant,
      description: item.description,
      date: item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingItem) return;
    if (deletingItem.isTransfer) {
      deleteTransferMutation.mutate(deletingItem.id);
    } else {
      deleteTxnMutation.mutate(deletingItem.id);
    }
  };

  const getSemanticChip = (type: TransactionType, amount: number) => {
    switch (type) {
      case 'income':
        return (
          <Badge variant="success" size="sm">
            {`+${formatCurrency(amount, userCurrency)}`}
          </Badge>
        );
      case 'expense':
        return (
          <Badge variant="danger" size="sm">
            {`-${formatCurrency(amount, userCurrency)}`}
          </Badge>
        );
      case 'investment':
        return (
          <Badge variant="investment" size="sm">
            {formatCurrency(amount, userCurrency)}
          </Badge>
        );
      case 'transfer':
        return (
          <Badge variant="transfer" size="sm">
            {`⇄ ${formatCurrency(amount, userCurrency)}`}
          </Badge>
        );
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return (
          <div className="w-10 h-10 rounded-xl bg-semantic-success-bg text-semantic-success flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'expense':
        return (
          <div className="w-10 h-10 rounded-xl bg-semantic-danger-bg text-semantic-danger flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'investment':
        return (
          <div className="w-10 h-10 rounded-xl bg-semantic-investment-bg text-semantic-investment flex items-center justify-center shrink-0 border border-purple-100">
            <PiggyBank className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'transfer':
        return (
          <div className="w-10 h-10 rounded-xl bg-semantic-transfer-bg text-semantic-transfer flex items-center justify-center shrink-0 border border-blue-100">
            <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Branded Dark Navy Header with Total Count */}
      <AppHeader
        variant="nested"
        title="Transactions"
        subtitle={`${totalRecordsCount} Transactions`}
        rightAction={
          <Button
            variant="primary"
            size="sm"
            onClick={openPicker}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Add
          </Button>
        }
      />

      <div className="p-4 space-y-3.5">
        {/* Debounced Search Bar */}
        <div>
          <Input
            placeholder="Search merchant, category, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            rightElement={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-textDefault p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Account Filter Chip if accountIdParam is present */}
        {accountIdParam && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-brand-primary">
            <span className="font-semibold truncate">
              Filtered by: {accountMap.get(accountIdParam) || 'Selected Account'}
            </span>
            <button
              type="button"
              onClick={() => {
                searchParams.delete('accountId');
                setSearchParams(searchParams);
              }}
              className="ml-2 hover:bg-blue-100 p-0.5 rounded text-brand-primary shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Clear account filter"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Pill Filter Tabs */}
        <div>
          <SegmentedControl
            options={filterOptions}
            value={activeFilter}
            onChange={setActiveFilter}
            size="sm"
            aria-label="Transaction type filter"
          />
        </div>

        {/* Error Notice if Query Failed */}
        {isTxnError && (
          <div className="p-3.5 bg-semantic-danger-bg text-semantic-danger text-xs rounded-xl border border-semantic-danger/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{txnError instanceof Error ? txnError.message : 'Unable to load transactions.'}</span>
          </div>
        )}

        {/* Transactions List or Skeletons or Empty State */}
        <section aria-label="Transactions list" className="pt-1">
          {isLoading ? (
            <div className="space-y-2.5">
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
            </div>
          ) : displayItems.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-7 h-7 stroke-[1.8]" aria-hidden="true" />}
              title="No transactions found"
              description={
                searchQuery
                  ? `No transactions match "${searchQuery}". Try another search.`
                  : 'No transactions recorded yet. Tap below to add one.'
              }
              actionLabel={TAB_EMPTY_CONFIG[activeFilter]?.label || 'Add Transaction'}
              onAction={() => openAddModal(TAB_EMPTY_CONFIG[activeFilter]?.actionType || 'expense')}
            />
          ) : (
            <div className="space-y-2.5">
              {paginatedItems.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <article
                    key={item.id}
                    className="bg-surface rounded-2xl border border-borderDefault shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Card Row — click to toggle expand */}
                    <div
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                      onClick={() => toggleExpanded(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpanded(item.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} transaction ${item.title}`}
                    >
                      {/* Left: Icon and Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getTransactionIcon(item.type)}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-textDefault leading-tight truncate">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-textMuted mt-1 truncate">
                            <span>{formatDate(item.date)}</span>
                            <span>&bull;</span>
                            <span className="truncate">{item.isTransfer ? `${accountMap.get(item.accountId) || item.accountName.split(' → ')[0]} → ${accountMap.get(item.toAccountId ?? '') || item.accountName.split(' → ')[1] || ''}` : item.accountName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount Chip & Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right flex flex-col items-end">
                          {getSemanticChip(item.type, item.amount)}
                          <span className="text-[10px] text-textMuted mt-0.5 capitalize truncate max-w-[90px]">
                            {item.categoryName || item.type}
                          </span>
                        </div>
                        <div className="text-textMuted">
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
                            : <ChevronDown className="w-4 h-4" aria-hidden="true" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    <div
                      className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}
                    >
                      <div className="px-3.5 pb-3.5 pt-0">
                        <div className="border-t border-borderDefault pt-3 space-y-1.5">
                          {/* Description */}
                          {item.description && item.description !== 'Account Transfer' && (
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-textMuted w-20 shrink-0">Note</span>
                              <span className="text-textDefault font-medium">{item.description}</span>
                            </div>
                          )}
                          {/* Category */}
                          {item.categoryName && (
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-textMuted w-20 shrink-0">Category</span>
                              <span className="text-textDefault font-medium">{item.categoryName}</span>
                            </div>
                          )}
                          {/* Merchant */}
                          {item.merchant && (
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-textMuted w-20 shrink-0">Merchant</span>
                              <span className="text-textDefault font-medium">{item.merchant}</span>
                            </div>
                          )}
                          {/* Transfer accounts */}
                          {item.isTransfer ? (
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-textMuted w-20 shrink-0">Transfer</span>
                              <span className="text-textDefault font-medium">
                                {accountMap.get(item.accountId) || 'Source'} → {accountMap.get(item.toAccountId ?? '') || 'Destination'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-textMuted w-20 shrink-0">Account</span>
                              <span className="text-textDefault font-medium">{item.accountName}</span>
                            </div>
                          )}
                          {/* Date */}
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-textMuted w-20 shrink-0">Date</span>
                            <span className="text-textDefault font-medium">{formatDate(item.date)}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-brand-primary hover:bg-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                              aria-label="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeletingItem(item); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-semantic-danger hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger"
                              aria-label="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={displayItems.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="transactions"
              />
            </div>
          )}
        </section>
      </div>

      {/* Soft Delete Confirmation Dialog */}
      {(() => {
        const dialogDef = deletingItem?.isTransfer
          ? CONFIRM_DIALOGS.transactions.deleteTransfer()
          : CONFIRM_DIALOGS.transactions.delete(deletingItem?.title);
        return (
          <Modal
            isOpen={deletingItem !== null}
            onClose={() => setDeletingItem(null)}
            compact
            title={dialogDef.title}
            icon={<Trash2 className="w-4 h-4 text-semantic-danger" />}
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingItem(null)}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={deleteTxnMutation.isPending || deleteTransferMutation.isPending}
                  onClick={handleDeleteConfirm}
                >
                  {dialogDef.confirmLabel}
                </Button>
              </>
            }
          >
            <div className="space-y-2 text-xs text-textMuted leading-relaxed">
              <p>{dialogDef.message}</p>
              {deletingItem && (
                <p className="font-semibold text-textDefault">
                  Amount: {formatCurrency(deletingItem.amount, userCurrency)}
                </p>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};

export default TransactionsPage;
