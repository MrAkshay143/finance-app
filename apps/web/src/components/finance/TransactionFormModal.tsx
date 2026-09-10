import React, { useState, useEffect } from 'react';
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

  // Fetch real accounts via TanStack Query
  const { data: accountsData } = useQuery(
    {
      queryKey: ['accounts'],
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
      queryKey: ['categories'],
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
      queryKey: ['userSettings'],
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

  // Populate or reset form fields on open / data change
  useEffect(() => {
    if (isOpen) {
      setAmount(initialData?.amount !== undefined ? initialData.amount.toString() : '');
      // Only pre-select a category if it's a real UUID from the API
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
    }
  }, [isOpen, mode, type, initialData, accountsData, categoriesData]);


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
        <div className="flex items-center gap-2.5 w-full justify-end">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="transaction-form"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
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
          {accountOptions.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              No accounts found. Please add an account before recording transactions.
            </div>
          ) : (
            <Select
              label={type === 'transfer' ? 'From Source Account' : 'Account'}
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
            <Select
              label="To Destination Account"
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
            {!categoriesLoaded ? (
              <div className="p-3 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textMuted font-medium">
                Loading categories…
              </div>
            ) : categoryOptions.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textMuted font-medium">
                No categories available for this type.
              </div>
            ) : (
              <Select
                label="Category"
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
    </Modal>
  );
};

export default TransactionFormModal;
