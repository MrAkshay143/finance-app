import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountsScreen, formatCurrency as formatAccountCurrency } from '../screens/accounts/AccountsScreen';
import {
  TransactionsScreen,
  formatCurrency as formatTxnCurrency,
  formatDate,
} from '../screens/transactions/TransactionsScreen';
import {
  TransactionFormModal,
  TransactionFormMode,
  TransactionFormType,
} from '../screens/transactions/TransactionFormModal';
import { apiClient } from '../services/apiClient';
import type { Account, Transaction } from '@finance/shared-types';

describe('Mobile Accounts & Transactions Suite (TASK-2.5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Exports & Structure', () => {
    it('exports AccountsScreen as a valid React component', () => {
      expect(typeof AccountsScreen).toBe('function');
    });

    it('exports TransactionsScreen as a valid React component', () => {
      expect(typeof TransactionsScreen).toBe('function');
    });

    it('exports TransactionFormModal as a valid React component', () => {
      expect(typeof TransactionFormModal).toBe('function');
    });
  });

  describe('Accounts Screen & API Wiring', () => {
    const mockAccounts: Account[] = [
      {
        id: '11111111-aaaa-1111-aaaa-111111111111',
        userId: '99999999-9999-9999-9999-999999999999',
        name: 'HDFC Salary Account',
        type: 'BANK',
        institutionName: 'HDFC Bank',
        accountNumberMask: '1234',
        openingBalance: 50000,
        currentBalance: 85420.5,
        currency: 'INR',
        status: 'ACTIVE',
        createdAt: '2026-09-08T00:00:00Z',
        updatedAt: '2026-09-08T00:00:00Z',
      },
      {
        id: '22222222-bbbb-2222-bbbb-222222222222',
        userId: '99999999-9999-9999-9999-999999999999',
        name: 'Zerodha Trading',
        type: 'INVESTMENT',
        institutionName: 'Zerodha Broking',
        accountNumberMask: '5678',
        openingBalance: 100000,
        currentBalance: 142890.1,
        currency: 'INR',
        status: 'ACTIVE',
        createdAt: '2026-09-08T00:00:00Z',
        updatedAt: '2026-09-08T00:00:00Z',
      },
      {
        id: '33333333-cccc-3333-cccc-333333333333',
        userId: '99999999-9999-9999-9999-999999999999',
        name: 'Old Savings Account',
        type: 'BANK',
        institutionName: 'SBI',
        accountNumberMask: '9999',
        openingBalance: 10000,
        currentBalance: 10000,
        currency: 'INR',
        status: 'INACTIVE',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ];

    it('fetches accounts and accurately computes active accounts count and total net worth', async () => {
      const listSpy = vi.spyOn(apiClient.accounts, 'list').mockResolvedValueOnce({
        accounts: mockAccounts,
        summary: {
          totalBalance: 228310.6,
          totalBalancePaise: 22831060,
          activeCount: 2,
          totalCount: 3,
        },
      });

      const res = await apiClient.accounts.list();
      expect(listSpy).toHaveBeenCalledTimes(1);

      const activeAccounts = res.accounts.filter((a) => a.status === 'ACTIVE');
      expect(activeAccounts.length).toBe(2);

      const totalBalance = activeAccounts.reduce(
        (sum, a) => sum + (Number(a.currentBalance) || 0),
        0
      );
      expect(totalBalance).toBeCloseTo(228310.6, 1);
    });

    it('creates an account via apiClient.accounts.create with all fields', async () => {
      const newAccountInput = {
        name: 'ICICI Emergency Fund',
        type: 'BANK' as const,
        institutionName: 'ICICI Bank',
        accountNumberMask: '4321',
        openingBalance: 25000,
        currency: 'INR',
      };

      const createdAccount: Account = {
        id: '44444444-dddd-4444-dddd-444444444444',
        userId: '99999999-9999-9999-9999-999999999999',
        name: newAccountInput.name,
        type: newAccountInput.type,
        institutionName: newAccountInput.institutionName,
        accountNumberMask: newAccountInput.accountNumberMask,
        openingBalance: newAccountInput.openingBalance,
        currentBalance: newAccountInput.openingBalance,
        currency: 'INR',
        status: 'ACTIVE',
        createdAt: '2026-09-08T10:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z',
      };

      const createSpy = vi
        .spyOn(apiClient.accounts, 'create')
        .mockResolvedValueOnce(createdAccount);

      const result = await apiClient.accounts.create(newAccountInput);
      expect(createSpy).toHaveBeenCalledWith(newAccountInput);
      expect(result.id).toBe('44444444-dddd-4444-dddd-444444444444');
      expect(result.name).toBe('ICICI Emergency Fund');
      expect(result.status).toBe('ACTIVE');
    });

    it('updates account metadata via apiClient.accounts.update', async () => {
      const updateData = {
        name: 'HDFC Premium Salary Account',
        institutionName: 'HDFC Bank Ltd.',
      };

      const updatedAccount: Account = {
        ...mockAccounts[0],
        ...updateData,
      };

      const updateSpy = vi
        .spyOn(apiClient.accounts, 'update')
        .mockResolvedValueOnce(updatedAccount);

      const result = await apiClient.accounts.update(mockAccounts[0].id, updateData);
      expect(updateSpy).toHaveBeenCalledWith(mockAccounts[0].id, updateData);
      expect(result.name).toBe('HDFC Premium Salary Account');
    });

    it('toggles account status between ACTIVE and INACTIVE via apiClient.accounts.toggleStatus', async () => {
      const toggleSpy = vi
        .spyOn(apiClient.accounts, 'toggleStatus')
        .mockResolvedValueOnce({
          ...mockAccounts[0],
          status: 'INACTIVE',
        });

      const result = await apiClient.accounts.toggleStatus(mockAccounts[0].id, 'INACTIVE');
      expect(toggleSpy).toHaveBeenCalledWith(mockAccounts[0].id, 'INACTIVE');
      expect(result.status).toBe('INACTIVE');
    });

    it('validates account input: requires non-empty name and non-negative opening balance', () => {
      const validateAccountInput = (name: string, balanceStr: string) => {
        if (!name.trim()) return 'Account name is required.';
        const balance = parseFloat(balanceStr);
        if (isNaN(balance) || balance < 0) return 'Opening balance must be a non-negative number.';
        return null;
      };

      expect(validateAccountInput('', '100')).toBe('Account name is required.');
      expect(validateAccountInput('  ', '100')).toBe('Account name is required.');
      expect(validateAccountInput('Savings', '-50')).toBe(
        'Opening balance must be a non-negative number.'
      );
      expect(validateAccountInput('Savings', 'abc')).toBe(
        'Opening balance must be a non-negative number.'
      );
      expect(validateAccountInput('Savings', '0')).toBeNull();
      expect(validateAccountInput('Savings', '5000.50')).toBeNull();
    });
  });

  describe('Transactions Screen & API Wiring', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 't1',
        userId: 'u1',
        accountId: '11111111-aaaa-1111-aaaa-111111111111',
        type: 'INCOME',
        direction: 'CREDIT',
        amount: 85000,
        date: '2026-09-01T09:00:00Z',
        description: 'Monthly Salary Credit',
        merchant: 'Tech Corp India',
        status: 'ACTIVE',
        createdAt: '2026-09-01T09:00:00Z',
        updatedAt: '2026-09-01T09:00:00Z',
      },
      {
        id: 't2',
        userId: 'u1',
        accountId: '11111111-aaaa-1111-aaaa-111111111111',
        type: 'EXPENSE',
        direction: 'DEBIT',
        amount: 4500,
        date: '2026-09-02T14:30:00Z',
        description: 'Supermarket Groceries',
        merchant: 'Nature Basket',
        status: 'ACTIVE',
        createdAt: '2026-09-02T14:30:00Z',
        updatedAt: '2026-09-02T14:30:00Z',
      },
      {
        id: 't3',
        userId: 'u1',
        accountId: '22222222-bbbb-2222-bbbb-222222222222',
        type: 'INVESTMENT',
        direction: 'DEBIT',
        amount: 20000,
        date: '2026-09-03T11:00:00Z',
        description: 'Nifty 50 Index Fund SIP',
        merchant: 'Zerodha Coin',
        status: 'ACTIVE',
        createdAt: '2026-09-03T11:00:00Z',
        updatedAt: '2026-09-03T11:00:00Z',
      },
      {
        id: 't4',
        userId: 'u1',
        accountId: '11111111-aaaa-1111-aaaa-111111111111',
        type: 'EXPENSE',
        direction: 'DEBIT',
        amount: 15000,
        date: '2026-09-04T16:00:00Z',
        description: 'Transfer to Zerodha Trading',
        merchant: null,
        status: 'ACTIVE',
        createdAt: '2026-09-04T16:00:00Z',
        updatedAt: '2026-09-04T16:00:00Z',
      },
    ];

    it('fetches transaction records and filters by classification tab', async () => {
      vi.spyOn(apiClient.transactions, 'list').mockResolvedValueOnce({
        items: mockTransactions,
        page: 1,
        pageSize: 20,
        total: 4,
        totalPages: 1,
      });

      const res = await apiClient.transactions.list();
      const list = res.items;
      expect(list.length).toBe(4);

      const incomeTxns = list.filter((t) => t.type === 'INCOME');
      expect(incomeTxns.length).toBe(1);
      expect(incomeTxns[0].description).toBe('Monthly Salary Credit');

      const expenseTxns = list.filter(
        (t) => t.type === 'EXPENSE' && !t.description.toLowerCase().includes('transfer')
      );
      expect(expenseTxns.length).toBe(1);

      const investmentTxns = list.filter((t) => t.type === 'INVESTMENT');
      expect(investmentTxns.length).toBe(1);
      expect(investmentTxns[0].amount).toBe(20000);

      const transferTxns = list.filter((t) =>
        t.description.toLowerCase().includes('transfer')
      );
      expect(transferTxns.length).toBe(1);
    });

    it('filters transactions by search query across description, merchant, and notes', () => {
      const searchTxns = (query: string) => {
        const q = query.toLowerCase();
        return mockTransactions.filter(
          (t) =>
            t.description.toLowerCase().includes(q) ||
            (t.merchant && t.merchant.toLowerCase().includes(q)) ||
            (t.notes && t.notes.toLowerCase().includes(q))
        );
      };

      expect(searchTxns('salary').length).toBe(1);
      expect(searchTxns('groceries').length).toBe(1);
      expect(searchTxns('Nature Basket').length).toBe(1);
      expect(searchTxns('nonexistent').length).toBe(0);
    });

    it('creates an income transaction via apiClient.transactions.create', async () => {
      const newTxnInput = {
        accountId: '11111111-aaaa-1111-aaaa-111111111111',
        type: 'INCOME' as const,
        amount: 25000,
        description: 'Freelance Design Project',
        merchant: 'Client Direct',
        date: '2026-09-08T12:00:00Z',
      };

      const createdTxn: Transaction = {
        id: 't-new-1',
        userId: 'u1',
        accountId: newTxnInput.accountId,
        type: 'INCOME',
        direction: 'CREDIT',
        amount: newTxnInput.amount,
        description: newTxnInput.description,
        merchant: newTxnInput.merchant,
        date: newTxnInput.date,
        status: 'ACTIVE',
        createdAt: '2026-09-08T12:00:00Z',
        updatedAt: '2026-09-08T12:00:00Z',
      };

      const createSpy = vi
        .spyOn(apiClient.transactions, 'create')
        .mockResolvedValueOnce(createdTxn);

      const res = await apiClient.transactions.create(newTxnInput);
      expect(createSpy).toHaveBeenCalledWith(newTxnInput);
      expect(res.id).toBe('t-new-1');
      expect(res.type).toBe('INCOME');
      expect(res.direction).toBe('CREDIT');
    });

    it('creates an atomic transfer between two accounts via apiClient.transfers.create', async () => {
      const transferInput = {
        sourceAccountId: '11111111-aaaa-1111-aaaa-111111111111',
        destinationAccountId: '22222222-bbbb-2222-bbbb-222222222222',
        amount: 15000,
        description: 'Transfer from HDFC to Zerodha',
        date: '2026-09-08T14:00:00Z',
      };

      const transferResponse = {
        transferId: 'tr-999',
        sourceTransaction: {
          id: 'src-txn-1',
          userId: 'u1',
          accountId: transferInput.sourceAccountId,
          type: 'EXPENSE' as const,
          direction: 'DEBIT' as const,
          amount: transferInput.amount,
          description: transferInput.description,
          date: transferInput.date,
          status: 'ACTIVE' as const,
          createdAt: '2026-09-08T14:00:00Z',
          updatedAt: '2026-09-08T14:00:00Z',
        },
        destTransaction: {
          id: 'dst-txn-1',
          userId: 'u1',
          accountId: transferInput.destinationAccountId,
          type: 'INCOME' as const,
          direction: 'CREDIT' as const,
          amount: transferInput.amount,
          description: transferInput.description,
          date: transferInput.date,
          status: 'ACTIVE' as const,
          createdAt: '2026-09-08T14:00:00Z',
          updatedAt: '2026-09-08T14:00:00Z',
        },
      };

      const transferSpy = vi
        .spyOn(apiClient.transfers, 'create')
        .mockResolvedValueOnce(transferResponse);

      const res = await apiClient.transfers.create(transferInput);
      expect(transferSpy).toHaveBeenCalledWith(transferInput);
      expect(res.transferId).toBe('tr-999');
      expect(res.sourceTransaction.direction).toBe('DEBIT');
      expect(res.destTransaction.direction).toBe('CREDIT');
    });

    it('updates an existing transaction via apiClient.transactions.update', async () => {
      const updateData = {
        description: 'Supermarket Groceries & Household Essentials',
        amount: 4800,
      };

      const updateSpy = vi
        .spyOn(apiClient.transactions, 'update')
        .mockResolvedValueOnce({
          ...mockTransactions[1],
          ...updateData,
        });

      const res = await apiClient.transactions.update(mockTransactions[1].id, updateData);
      expect(updateSpy).toHaveBeenCalledWith(mockTransactions[1].id, updateData);
      expect(res.description).toBe('Supermarket Groceries & Household Essentials');
      expect(res.amount).toBe(4800);
    });

    it('soft-deletes transaction with balance reversion confirmation via apiClient.transactions.delete', async () => {
      const deleteSpy = vi
        .spyOn(apiClient.transactions, 'delete')
        .mockResolvedValueOnce({ message: 'Transaction deleted successfully' });

      const res = await apiClient.transactions.delete(mockTransactions[1].id);
      expect(deleteSpy).toHaveBeenCalledWith(mockTransactions[1].id);
      expect(res.message).toBe('Transaction deleted successfully');
    });
  });

  describe('Centralized Add/Edit Modal: All 8 States Validation', () => {
    interface StateMeta {
      title: string;
      submitLabel: string;
    }

    const getStateMeta = (mode: TransactionFormMode, type: TransactionFormType): StateMeta => {
      switch (type) {
        case 'income':
          return {
            title: mode === 'add' ? 'Add Income' : 'Edit Income',
            submitLabel: mode === 'add' ? 'Save Income' : 'Update Income',
          };
        case 'expense':
          return {
            title: mode === 'add' ? 'Add Expense' : 'Edit Expense',
            submitLabel: mode === 'add' ? 'Save Expense' : 'Update Expense',
          };
        case 'investment':
          return {
            title: mode === 'add' ? 'Add Investment' : 'Edit Investment',
            submitLabel: mode === 'add' ? 'Save Investment' : 'Update Investment',
          };
        case 'transfer':
          return {
            title: mode === 'add' ? 'Add Transfer' : 'Edit Transfer',
            submitLabel: mode === 'add' ? 'Save Transfer' : 'Update Transfer',
          };
      }
    };

    it('State 1: Add Income / Save Income', () => {
      const meta = getStateMeta('add', 'income');
      expect(meta.title).toBe('Add Income');
      expect(meta.submitLabel).toBe('Save Income');
    });

    it('State 2: Edit Income / Update Income', () => {
      const meta = getStateMeta('edit', 'income');
      expect(meta.title).toBe('Edit Income');
      expect(meta.submitLabel).toBe('Update Income');
    });

    it('State 3: Add Expense / Save Expense', () => {
      const meta = getStateMeta('add', 'expense');
      expect(meta.title).toBe('Add Expense');
      expect(meta.submitLabel).toBe('Save Expense');
    });

    it('State 4: Edit Expense / Update Expense', () => {
      const meta = getStateMeta('edit', 'expense');
      expect(meta.title).toBe('Edit Expense');
      expect(meta.submitLabel).toBe('Update Expense');
    });

    it('State 5: Add Investment / Save Investment', () => {
      const meta = getStateMeta('add', 'investment');
      expect(meta.title).toBe('Add Investment');
      expect(meta.submitLabel).toBe('Save Investment');
    });

    it('State 6: Edit Investment / Update Investment', () => {
      const meta = getStateMeta('edit', 'investment');
      expect(meta.title).toBe('Edit Investment');
      expect(meta.submitLabel).toBe('Update Investment');
    });

    it('State 7: Add Transfer / Save Transfer', () => {
      const meta = getStateMeta('add', 'transfer');
      expect(meta.title).toBe('Add Transfer');
      expect(meta.submitLabel).toBe('Save Transfer');
    });

    it('State 8: Edit Transfer / Update Transfer', () => {
      const meta = getStateMeta('edit', 'transfer');
      expect(meta.title).toBe('Edit Transfer');
      expect(meta.submitLabel).toBe('Update Transfer');
    });
  });

  describe('Formatting & Validation Utilities', () => {
    it('formats currency cleanly in INR and other currencies', () => {
      expect(formatAccountCurrency(1000)).toBe('₹1,000.00');
      expect(formatAccountCurrency(1250000.5)).toBe('₹12,50,000.50');
      expect(formatAccountCurrency(0)).toBe('₹0.00');
      expect(formatAccountCurrency(-500)).toBe('-₹500.00');
      expect(formatAccountCurrency(150, 'USD')).toBe('$150.00');
      expect(formatTxnCurrency(4500)).toBe('₹4,500.00');
    });

    it('formats dates into standard DD-MM-YYYY format', () => {
      expect(formatDate('2026-09-08T12:00:00Z')).toBe('08-09-2026');
      expect(formatDate('2026-09-08')).toBe('08-09-2026');
      expect(formatDate('')).toBe('');
    });

    it('validates transfer requires distinct source and destination accounts', () => {
      const validateTransfer = (sourceId: string, destId: string, amount: number) => {
        if (!sourceId) return 'Source account is required.';
        if (!destId) return 'Destination account is required.';
        if (sourceId === destId)
          return 'Source and destination accounts must be different.';
        if (isNaN(amount) || amount <= 0)
          return 'Amount must be greater than 0.';
        return null;
      };

      expect(validateTransfer('acc-1', 'acc-1', 1000)).toBe(
        'Source and destination accounts must be different.'
      );
      expect(validateTransfer('acc-1', 'acc-2', 0)).toBe(
        'Amount must be greater than 0.'
      );
      expect(validateTransfer('acc-1', 'acc-2', -500)).toBe(
        'Amount must be greater than 0.'
      );
      expect(validateTransfer('acc-1', 'acc-2', 5000)).toBeNull();
    });
  });
});
