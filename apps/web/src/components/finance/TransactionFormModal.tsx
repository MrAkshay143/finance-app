import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowLeftRight,
  Calendar,
  Building,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { useUiStore, TransactionType, TransactionModalMode, TransactionFormData } from '../../store/uiStore.js';
import { apiClient } from '../../services/apiClient.js';
import { useSafeQueryClient } from '../../hooks/useSafeQueryClient.js';
import { getCurrencySymbol } from '../../utils/currency.js';
import type { TxnType } from '@finance/shared-types';
import { validateAmount } from '../../utils/validation.js';
import { toast } from '../../store/toastStore.js';
import { MerchantAutoSuggest } from './MerchantAutoSuggest.js';
import { syncOnTransactionMutation } from '../../services/dataSync.js';
import { queryKeys } from '../../queries/queryKeys.js';
import { AddAccountModal } from './AddAccountModal.js';
import { AddCategoryModal } from './AddCategoryModal.js';

// NO hardcoded category or account fallbacks: all values must come from the real API.

export interface TransactionFormModalProps {
  isOpen?: boolean;
  mode?: TransactionModalMode;
  type?: TransactionType;
  onClose?: () => void;
  initialData?: Partial<TransactionFormData>;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = (props) => {
  const queryClient = useSafeQueryClient();
  const storeModal = useUiStore((state) => state.transactionModal);
  const closeTransactionModal = useUiStore((state) => state.closeTransactionModal);

  const isOpen = props.isOpen !== undefined ? props.isOpen : storeModal.isOpen;
  const mode = props.mode || storeModal.mode;
  const type = props.type || storeModal.type;
  const initialData = props.initialData || storeModal.initialData;
  const handleClose = props.onClose || closeTransactionModal;

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);

  // Fetch real accounts via TanStack Query
  const { data: accountsData } = useQuery(
    {
      queryKey: queryKeys.accounts.all,
      queryFn: async () => {
        return await apiClient.accounts.list();
      },
      enabled: isOpen,
    },
    queryClient
  );

  const rawAccounts = accountsData?.accounts || [];
  const activeAccounts = rawAccounts.filter((acc) => acc.status === 'ACTIVE');

  // Fetch real categories via TanStack Query
  const { data: categoriesData } = useQuery(
    {
      queryKey: queryKeys.categories.all,
      queryFn: async () => {
        return await apiClient.categories.list();
      },
      enabled: isOpen,
    },
    queryClient
  );

  // Fetch user settings for currency symbol
  const { data: userSettings } = useQuery(
    {
      queryKey: queryKeys.userSettings,
      queryFn: async () => apiClient.settings.get(),
      enabled: isOpen,
    },
    queryClient
  );
  const currencySymbol = getCurrencySymbol(userSettings?.currency);

  const realCategories = (categoriesData || []).filter(
    (c) => c.type === type.toUpperCase()
  );

  // Only use real UUID-based category options: never fall back to fake slugs
  const categoryOptions = realCategories.map((c) => ({ value: c.id, label: c.name }));
  const categoriesLoaded = Array.isArray(categoriesData);

  // Build account select options: only real accounts, never fake defaults
  const accountOptions =
    activeAccounts.length > 0
      ? activeAccounts.map((acc) => {
          const inst = acc.institutionName || (acc as any).institution;
          return {
            value: acc.id,
            label: `${acc.name}${inst ? ` (${inst})` : ''}`,
          };
        })
      : [];

  // Track initialization state with refs to prevent background query refetches
  // from ever wiping out user-typed inputs (amount, merchant, description, date).
  const prevIsOpenRef = useRef(false);
  const prevInitialDataIdRef = useRef<string | undefined>(undefined);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const initialDataChanged = initialData?.id !== prevInitialDataIdRef.current;

    if (justOpened || (isOpen && initialDataChanged)) {
      setAmount(initialData?.amount !== undefined ? initialData.amount.toString() : '');
      const initialCatId = initialData?.categoryId || '';
      const firstRealCat = realCategories[0]?.id || '';
      setCategoryId(initialCatId || firstRealCat);
      const firstAccId = activeAccounts[0]?.id || '';
      setAccountId(initialData?.accountId || firstAccId);
      const secondAccId = activeAccounts[1]?.id || firstAccId;
      setToAccountId(initialData?.toAccountId || (secondAccId !== firstAccId ? secondAccId : ''));
      setMerchant(initialData?.merchant || '');
      setDate(initialData?.date ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setDescription(initialData?.description || '');
      setError('');
      isInitializedRef.current = true;
    }

    if (!isOpen) {
      isInitializedRef.current = false;
    }

    prevIsOpenRef.current = isOpen;
    prevInitialDataIdRef.current = initialData?.id;
  }, [
    isOpen,
    mode,
    type,
    initialData?.id,
    initialData?.amount,
    initialData?.categoryId,
    initialData?.accountId,
    initialData?.toAccountId,
    initialData?.merchant,
    initialData?.date,
    initialData?.description,
  ]);

  // Non-destructive fallback for category and account selection when options load after open
  useEffect(() => {
    if (isOpen && isInitializedRef.current) {
      if (!categoryId && realCategories[0]?.id) {
        setCategoryId(realCategories[0].id);
      }
      if (!accountId && activeAccounts[0]?.id) {
        setAccountId(activeAccounts[0].id);
      }
    }
  }, [isOpen, realCategories.length, activeAccounts.length]);


  // Mutations
  const createTxnMutation = useMutation(
    {
      mutationFn: async (payload: {
        accountId: string;
        type: TxnType;
        amount: number;
        description: string;
        merchant?: string;
        date?: string;
        categoryId?: string | null;
      }) => {
        return await apiClient.transactions.create(payload);
      },
      onSuccess: () => {
        syncOnTransactionMutation(queryClient);
        handleClose();
        toast.success('Transaction recorded successfully');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to save transaction.';
        setError(msg);
        toast.error(msg);
      },
    },
    queryClient
  );

  const createTransferMutation = useMutation(
    {
      mutationFn: async (payload: {
        sourceAccountId: string;
        destinationAccountId: string;
        amount: number;
        description: string;
        date?: string;
      }) => {
        return await apiClient.transfers.create(payload);
      },
      onSuccess: () => {
        syncOnTransactionMutation(queryClient);
        handleClose();
        toast.success('Transfer recorded successfully');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to save transfer.';
        setError(msg);
        toast.error(msg);
      },
    },
    queryClient
  );

  const updateTxnMutation = useMutation(
    {
      mutationFn: async ({
        id,
        payload,
      }: {
        id: string;
        payload: {
          accountId?: string;
          type?: TxnType;
          amount?: number;
          description?: string;
          merchant?: string;
          date?: string;
          categoryId?: string | null;
        };
      }) => {
        return await apiClient.transactions.update(id, payload);
      },
      onSuccess: () => {
        syncOnTransactionMutation(queryClient);
        handleClose();
        toast.success('Transaction updated successfully');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to update transaction.';
        setError(msg);
        toast.error(msg);
      },
    },
    queryClient
  );


  if (!isOpen) return null;

  // 8 DISTINCT MODAL STATES per Plan/frontend.md §4:
  // Add Income -> Save Income
  // Edit Income -> Update Income
  // Add Expense -> Save Expense
  // Edit Expense -> Update Expense
  // Add Investment -> Save Investment
  // Edit Investment -> Update Investment
  // Add Transfer -> Save Transfer
  // Edit Transfer -> Update Transfer
  const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
  const title = mode === 'add' ? `Add ${typeCapitalized}` : `Edit ${typeCapitalized}`;
  const submitButtonLabel = mode === 'add' ? `Save ${typeCapitalized}` : `Update ${typeCapitalized}`;

  const getSubtitle = () => {
    switch (type) {
      case 'income':
        return mode === 'add'
          ? 'Record a new income transaction into your accounts'
          : 'Modify the existing income transaction details';
      case 'expense':
        return mode === 'add'
          ? 'Record a new expense transaction from your accounts'
          : 'Modify the existing expense transaction details';
      case 'investment':
        return mode === 'add'
          ? 'Record a new investment allocation into your portfolio'
          : 'Modify the existing investment transaction details';
      case 'transfer':
        return mode === 'add'
          ? 'Move funds between two of your connected accounts'
          : 'Modify the existing transfer transaction details';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-5 h-5 stroke-[2.2] text-semantic-success" />;
      case 'expense':
        return <TrendingDown className="w-5 h-5 stroke-[2.2] text-semantic-danger" />;
      case 'investment':
        return <PiggyBank className="w-5 h-5 stroke-[2.2] text-semantic-investment" />;
      case 'transfer':
        return <ArrowLeftRight className="w-5 h-5 stroke-[2.2] text-semantic-transfer" />;
    }
  };

  const isSubmitting =
    createTxnMutation.isPending ||
    createTransferMutation.isPending ||
    updateTxnMutation.isPending;

  const userCurr = userSettings?.currency || 'INR';
  const amountResult = amount ? validateAmount(amount, userCurr, false) : null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isFutureDate = Boolean(date && date > todayStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (type === 'transfer') {
      if (!accountId) {
        setError('Please select a source account.');
        return;
      }
      if (!toAccountId) {
        setError('Please select a destination account.');
        return;
      }
      if (accountId === toAccountId) {
        setError('Source and destination accounts must be different.');
        return;
      }
    } else {
      if (!accountId) {
        setError('Please select an account.');
        return;
      }
    }

    // Future date prevention
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date && date > todayStr) {
      setError('Transaction date cannot be in the future.');
      return;
    }

    // Default description if empty
    const resolvedDescription = description.trim() || `${typeCapitalized} record`;

    // categoryId is always a real UUID from the API or empty: pass directly
    const resolvedCategoryId = categoryId || undefined;


    if (mode === 'add') {
      if (type === 'transfer') {
        createTransferMutation.mutate({
          sourceAccountId: accountId,
          destinationAccountId: toAccountId,
          amount: numAmount,
          description: resolvedDescription,
          date,
        });
      } else {
        createTxnMutation.mutate({
          accountId,
          type: type.toUpperCase() as TxnType,
          amount: numAmount,
          description: resolvedDescription,
          merchant: merchant.trim() || undefined,
          date,
          categoryId: resolvedCategoryId,
        });
      }
    } else {
      // Edit mode
      if (initialData?.id) {
        updateTxnMutation.mutate({
          id: initialData.id,
          payload: {
            accountId,
            type: type.toUpperCase() as TxnType,
            amount: numAmount,
            description: resolvedDescription,
            merchant: merchant.trim() || undefined,
            date,
            categoryId: resolvedCategoryId,
          },
        });
      } else {
        // Standalone or test invocation without an ID
        handleClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={getSubtitle()}
      icon={getIcon()}
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="px-3.5 py-1.5 text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="transaction-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-bold shadow-xs"
          >
            {submitButtonLabel}
          </Button>
        </div>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-semantic-danger-bg text-semantic-danger text-xs font-semibold rounded-xl border border-semantic-danger/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <Input
            label={`Amount (${currencySymbol})`}
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError('');
            }}
            status={amountResult ? (amountResult.isValid ? 'valid' : 'invalid') : 'idle'}
            validMessage={amountResult?.formattedDisplay}
            icon={<span className="text-xs font-bold text-textMuted">{currencySymbol}</span>}
          />
        </div>

        {/* Account Selector (From Account for Transfer) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-textDefault">
              {type === 'transfer' ? 'From Source Account' : 'Account'}{' '}
              <span className="text-semantic-danger">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddAccountOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Add Account</span>
            </button>
          </div>

          {accountOptions.length === 0 ? (
            <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <p className="font-medium text-amber-800">Please add an account before recording.</p>
            </div>
          ) : (
            <Select
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                if (error) setError('');
              }}
              options={accountOptions}
            />
          )}
        </div>


        {/* Destination Account for Transfers */}
        {type === 'transfer' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-textDefault">
                To Destination Account <span className="text-semantic-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Account</span>
              </button>
            </div>
            <Select
              value={toAccountId}
              onChange={(e) => {
                setToAccountId(e.target.value);
                if (error) setError('');
              }}
              options={accountOptions.filter((opt) => opt.value !== accountId)}
            />
          </div>
        )}

        {/* Category Selector (hidden for transfers) */}
        {type !== 'transfer' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-textDefault">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Category</span>
              </button>
            </div>

            {!categoriesLoaded ? (
              <div className="p-3 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textMuted font-medium">
                Loading categories…
              </div>
            ) : categoryOptions.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textMuted flex items-center justify-between gap-3">
                <span>No categories available for this type.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddCategoryOpen(true)}
                  iconLeft={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Category
                </Button>
              </div>
            ) : (
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={categoryOptions}
              />
            )}
          </div>
        )}

        {/* Merchant / Payee (for non-transfers) with dynamic auto-suggest */}
        {type !== 'transfer' && (
          <div>
            <MerchantAutoSuggest
              value={merchant}
              onChange={(val) => setMerchant(val)}
            />
          </div>
        )}

        {/* Date Input */}
        <div>
          <Input
            label="Date"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (error) setError('');
            }}
            status={date ? (isFutureDate ? 'invalid' : 'valid') : 'idle'}
            validMessage={date && !isFutureDate ? 'Valid transaction date' : undefined}
            error={isFutureDate ? 'Transaction date cannot be in the future' : undefined}
            icon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* Description Textarea */}
        <div>
          <Input
            label="Description & Notes"
            type="text"
            placeholder="e.g. Monthly salary, Grocery run, Portfolio SIP"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<FileText className="w-4 h-4" />}
          />
        </div>
      </form>

      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountCreated={(newAcc) => {
          if (newAcc?.id) {
            setAccountId(newAcc.id);
          }
        }}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        initialType={type.toUpperCase() as TxnType}
        onCategoryCreated={(newCat) => {
          if (newCat?.id) {
            setCategoryId(newCat.id);
          }
        }}
      />
    </Modal>
  );
};

export default TransactionFormModal;
