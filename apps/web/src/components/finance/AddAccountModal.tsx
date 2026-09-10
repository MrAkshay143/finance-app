import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Landmark, Building2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { CurrencySelector } from '../ui/CurrencySelector.js';
import { apiClient, getFriendlyErrorMessage } from '../../services/apiClient.js';
import { syncOnAccountMutation } from '../../services/dataSync.js';
import { useSafeQueryClient } from '../../hooks/useSafeQueryClient.js';
import { useUserCurrency } from '../../hooks/useUserCurrency.js';
import { getCurrencySymbol } from '../../utils/currency.js';
import { toast } from '../../store/toastStore.js';
import type { CreateAccountInput } from '@finance/shared-types';

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'BANK', label: 'Savings & Checking' },
  { value: 'CURRENT', label: 'Current Account' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'INVESTMENT', label: 'Investment Portfolio' },
  { value: 'WALLET', label: 'Digital Wallet' },
  { value: 'CASH', label: 'Cash in Hand' },
];

export interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCurrency?: string;
  onAccountCreated?: (account: any) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  initialCurrency,
  onAccountCreated,
}) => {
  const queryClient = useSafeQueryClient();
  const { currency: userCurrency } = useUserCurrency();

  const [name, setName] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [accountType, setAccountType] = useState<string>('BANK');
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [currency, setCurrency] = useState<string>(initialCurrency || userCurrency || 'INR');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setInstitution('');
      setAccountType('BANK');
      setOpeningBalance('');
      setCurrency(initialCurrency || userCurrency || 'INR');
      setError('');
    }
  }, [isOpen, initialCurrency, userCurrency]);

  const createMutation = useMutation(
    {
      mutationFn: async (input: CreateAccountInput) => {
        return await apiClient.accounts.create(input);
      },
      onSuccess: (res: any) => {
        syncOnAccountMutation(queryClient);
        toast.success('Account created successfully');
        onAccountCreated?.(res?.account || res?.data || res);
        onClose();
      },
      onError: (err: any) => {
        const msg = getFriendlyErrorMessage(err, 'Failed to create account. Please try again.');
        setError(msg);
        toast.error(msg);
      },
    },
    queryClient
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required.');
      return;
    }
    const balNum = openingBalance ? parseFloat(openingBalance) : 0;
    if (isNaN(balNum) || balNum < 0) {
      setError('Please enter a valid opening balance (0 or greater).');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      institution: institution.trim() || undefined,
      institutionName: institution.trim() || undefined,
      accountType,
      openingBalance: balNum,
      currency,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Account"
      subtitle="Connect a new bank account or investment portfolio"
      icon={<Landmark className="w-5 h-5 stroke-[2.2]" />}
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-account-modal-form"
            variant="primary"
            size="sm"
            isLoading={createMutation.isPending}
            className="px-3.5 py-1.5 text-xs font-bold shadow-xs"
          >
            Save Account
          </Button>
        </div>
      }
    >
      <form id="add-account-modal-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-semantic-danger-bg text-semantic-danger text-xs font-semibold rounded-xl border border-semantic-danger/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Input
            label="Account Name"
            type="text"
            required
            placeholder="e.g. HDFC Salary Account, Zerodha Demat"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            icon={<Building2 className="w-4 h-4" />}
          />
        </div>

        <div>
          <Input
            label="Institution / Bank"
            type="text"
            placeholder="e.g. HDFC Bank, ICICI Bank, SBI, Zerodha"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            icon={<Landmark className="w-4 h-4" />}
          />
        </div>

        <div>
          <Select
            label="Account Type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            options={ACCOUNT_TYPE_OPTIONS}
          />
        </div>

        <div>
          <CurrencySelector
            label="Currency"
            value={currency}
            onChange={setCurrency}
          />
        </div>

        <div>
          <Input
            label={`Opening Balance (${getCurrencySymbol(currency)})`}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={openingBalance}
            onChange={(e) => {
              setOpeningBalance(e.target.value);
              if (error) setError('');
            }}
            icon={<span className="text-xs font-bold text-textMuted">{getCurrencySymbol(currency)}</span>}
            helperText="Initial balance when connecting this account"
          />
        </div>
      </form>
    </Modal>
  );
};
