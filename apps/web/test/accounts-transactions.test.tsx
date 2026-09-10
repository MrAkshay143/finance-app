import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountsPage } from '../src/pages/AccountsPage.js';
import { TransactionsPage } from '../src/pages/TransactionsPage.js';
import { TransactionFormModal } from '../src/components/finance/TransactionFormModal.js';
import { useUiStore } from '../src/store/uiStore.js';
import { formatIndianRupees } from '../src/utils/currency.js';
import type { Account, Transaction } from '@finance/shared-types';

const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    userId: 'usr_1',
    name: 'HDFC Salary Account',
    institutionName: 'HDFC Bank',
    accountNumberMask: '•••• 4291',
    type: 'BANK',
    openingBalance: 50000,
    currentBalance: 125000,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-08T00:00:00Z',
  },
  {
    id: 'acc_2',
    userId: 'usr_1',
    name: 'Zerodha Demat Portfolio',
    institutionName: 'Zerodha Broking',
    accountNumberMask: '•••• 8823',
    type: 'INVESTMENT',
    openingBalance: 100000,
    currentBalance: 450000,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-08T00:00:00Z',
  },
  {
    id: 'acc_3',
    userId: 'usr_1',
    name: 'Old Inactive Card',
    institutionName: 'ICICI Bank',
    accountNumberMask: '•••• 1044',
    type: 'CREDIT_CARD',
    openingBalance: 0,
    currentBalance: 0,
    currency: 'INR',
    status: 'INACTIVE',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-08T00:00:00Z',
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_1',
    userId: 'usr_1',
    accountId: 'acc_1',
    type: 'INCOME',
    direction: 'CREDIT',
    amount: 85000,
    date: '2026-09-01T10:00:00Z',
    description: 'Monthly Salary Credit',
    merchant: 'Acme Technologies',
    status: 'ACTIVE',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'txn_2',
    userId: 'usr_1',
    accountId: 'acc_1',
    type: 'EXPENSE',
    direction: 'DEBIT',
    amount: 3200,
    date: '2026-09-03T15:30:00Z',
    description: 'Weekly Organic Groceries',
    merchant: 'Nature Basket',
    status: 'ACTIVE',
    createdAt: '2026-09-03T15:30:00Z',
    updatedAt: '2026-09-03T15:30:00Z',
  },
  {
    id: 'txn_3',
    userId: 'usr_1',
    accountId: 'acc_2',
    type: 'INVESTMENT',
    direction: 'DEBIT',
    amount: 25000,
    date: '2026-09-05T09:15:00Z',
    description: 'Nifty 50 Index Fund SIP',
    merchant: 'Zerodha Coin',
    status: 'ACTIVE',
    createdAt: '2026-09-05T09:15:00Z',
    updatedAt: '2026-09-05T09:15:00Z',
  },
];

const MOCK_TRANSFERS = [
  {
    id: 'tr_1',
    userId: 'usr_1',
    sourceAccountId: 'acc_1',
    destinationAccountId: 'acc_2',
    amount: 15000,
    date: '2026-09-06T11:00:00Z',
    description: 'Investment Funding',
  },
];

function createConfiguredQueryClient(mode: 'empty' | 'populated' | 'loading' = 'empty') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  if (mode === 'empty') {
    queryClient.setQueryData(['accounts'], {
      accounts: [],
      summary: { totalBalance: 0, totalBalancePaise: 0, activeCount: 0, totalCount: 0 },
    });
    queryClient.setQueryData(['transactions', undefined, '', ''], {
      items: [],
      total: 0,
      page: 1,
      pageSize: 100,
    });
    queryClient.setQueryData(['transfers'], []);
  } else if (mode === 'populated') {
    queryClient.setQueryData(['accounts'], {
      accounts: MOCK_ACCOUNTS,
      summary: { totalBalance: 575000, totalBalancePaise: 57500000, activeCount: 2, totalCount: 3 },
    });
    queryClient.setQueryData(['transactions', undefined, '', ''], {
      items: MOCK_TRANSACTIONS,
      total: MOCK_TRANSACTIONS.length,
      page: 1,
      pageSize: 100,
    });
    queryClient.setQueryData(['transactions', undefined, 'acc_1', ''], {
      items: [MOCK_TRANSACTIONS[0]],
      total: 1,
      page: 1,
      pageSize: 100,
    });
    queryClient.setQueryData(['transfers'], MOCK_TRANSFERS);
  }

  return queryClient;
}

function renderWithProviders(
  ui: React.ReactElement,
  initialPath = '/',
  mode: 'empty' | 'populated' | 'loading' = 'empty'
) {
  const queryClient = createConfiguredQueryClient(mode);

  return renderToString(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Accounts Dashboard & Centralized Transaction System Test Suite (TASK-2.3 & TASK-2.4)', () => {
  beforeEach(() => {
    useUiStore.getState().closeTransactionModal();
    useUiStore.getState().closePicker();
  });

  // =========================================================================
  // 1. ALL 8 DISTINCT MODAL STATES IN TRANSACTION FORM MODAL
  // =========================================================================
  describe('1. 8 Distinct Modal States (Strictly Separate Add vs. Edit)', () => {
    it('State 1: Add Income renders title "Add Income" and submit button "Save Income"', () => {
      const html = renderWithProviders(
        <TransactionFormModal isOpen={true} mode="add" type="income" />
      );
      expect(html).toContain('Add Income');
      expect(html).toContain('Save Income');
      expect(html).toContain('Record a new income transaction');
      expect(html).not.toContain('Edit Income');
      expect(html).not.toContain('Update Income');
    });

    it('State 2: Edit Income renders title "Edit Income" and submit button "Update Income"', () => {
      const html = renderWithProviders(
        <TransactionFormModal
          isOpen={true}
          mode="edit"
          type="income"
          initialData={{ id: 'inc_1', amount: 85000, description: 'Consulting fee' }}
        />
      );
      expect(html).toContain('Edit Income');
      expect(html).toContain('Update Income');
      expect(html).toContain('Modify the existing income transaction');
      expect(html).not.toContain('Add Income');
      expect(html).not.toContain('Save Income');
    });

    it('State 3: Add Expense renders title "Add Expense" and submit button "Save Expense"', () => {
      const html = renderWithProviders(
        <TransactionFormModal isOpen={true} mode="add" type="expense" />
      );
      expect(html).toContain('Add Expense');
      expect(html).toContain('Save Expense');
      expect(html).toContain('Record a new expense transaction');
      expect(html).not.toContain('Edit Expense');
      expect(html).not.toContain('Update Expense');
    });

    it('State 4: Edit Expense renders title "Edit Expense" and submit button "Update Expense"', () => {
      const html = renderWithProviders(
        <TransactionFormModal
          isOpen={true}
          mode="edit"
          type="expense"
          initialData={{ id: 'exp_1', amount: 3200, description: 'Supermarket Grocery' }}
        />
      );
      expect(html).toContain('Edit Expense');
      expect(html).toContain('Update Expense');
      expect(html).toContain('Modify the existing expense transaction');
      expect(html).not.toContain('Add Expense');
      expect(html).not.toContain('Save Expense');
    });

    it('State 5: Add Investment renders title "Add Investment" and submit button "Save Investment"', () => {
      const html = renderWithProviders(
        <TransactionFormModal isOpen={true} mode="add" type="investment" />
      );
      expect(html).toContain('Add Investment');
      expect(html).toContain('Save Investment');
      expect(html).toContain('Record a new investment allocation');
      expect(html).not.toContain('Edit Investment');
      expect(html).not.toContain('Update Investment');
    });

    it('State 6: Edit Investment renders title "Edit Investment" and submit button "Update Investment"', () => {
      const html = renderWithProviders(
        <TransactionFormModal
          isOpen={true}
          mode="edit"
          type="investment"
          initialData={{ id: 'inv_1', amount: 25000, description: 'Index Fund SIP' }}
        />
      );
      expect(html).toContain('Edit Investment');
      expect(html).toContain('Update Investment');
      expect(html).toContain('Modify the existing investment transaction');
      expect(html).not.toContain('Add Investment');
      expect(html).not.toContain('Save Investment');
    });

    it('State 7: Add Transfer renders title "Add Transfer", submit button "Save Transfer", and dual account selectors', () => {
      // Provide mock accounts so the Select elements render (instead of "No accounts found")
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
      qc.setQueryData(['accounts'], { accounts: MOCK_ACCOUNTS });
      qc.setQueryData(['categories'], []);
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <TransactionFormModal isOpen={true} mode="add" type="transfer" />
          </MemoryRouter>
        </QueryClientProvider>
      );
      expect(html).toContain('Add Transfer');
      expect(html).toContain('Save Transfer');
      expect(html).toContain('Move funds between two of your connected accounts');
      expect(html).toContain('From Source Account');
      expect(html).toContain('To Destination Account');
      expect(html).not.toContain('Edit Transfer');
      expect(html).not.toContain('Update Transfer');
    });


    it('State 8: Edit Transfer renders title "Edit Transfer" and submit button "Update Transfer"', () => {
      const html = renderWithProviders(
        <TransactionFormModal
          isOpen={true}
          mode="edit"
          type="transfer"
          initialData={{ id: 'tr_1', amount: 15000, description: 'Savings deposit' }}
        />
      );
      expect(html).toContain('Edit Transfer');
      expect(html).toContain('Update Transfer');
      expect(html).toContain('Modify the existing transfer transaction');
      expect(html).not.toContain('Add Transfer');
      expect(html).not.toContain('Save Transfer');
    });

    it('validates form fields: includes Amount in rupees, date picker, category, and description', () => {
      // Pre-load categories so the Category select renders (not "Loading categories…")
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
      qc.setQueryData(['accounts'], { accounts: MOCK_ACCOUNTS });
      qc.setQueryData(['categories'], [
        { id: 'cat-uuid-1', name: 'General Expense', type: 'EXPENSE', displayOrder: 1 },
      ]);
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <TransactionFormModal isOpen={true} mode="add" type="expense" />
          </MemoryRouter>
        </QueryClientProvider>
      );
      expect(html).toContain('Amount (₹)');
      expect(html).toContain('Category');
      expect(html).toContain('Date');
      expect(html).toContain('Description &amp; Notes');
    });

  });

  // =========================================================================
  // 2. ACCOUNTS DASHBOARD SCREEN (TASK-2.3)
  // =========================================================================
  describe('2. Accounts Dashboard Screen (TASK-2.3)', () => {
    it('renders branded dark navy header with title "Accounts" and subtitle', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'populated');
      expect(html).toContain('Accounts');
      expect(html).toContain('Connected banks &amp; portfolios');
      expect(html).toContain('#0B1B3A');
      expect(html).toContain('#132A5C');
    });

    it('renders hero card with Total Net Balance in Indian Rupees and Active Accounts count', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'populated');
      expect(html).toContain('2 Active Accounts');
      expect(html).toContain('₹5,75,000');
      expect(html).toContain('Aggregated across all connected balances');
    });

    it('renders individual account cards with type badges, formatted balances, and status badges', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'populated');
      expect(html).toContain('HDFC Salary Account');
      expect(html).toContain('Zerodha Demat Portfolio');
      expect(html).toContain('Old Inactive Card');
      expect(html).toContain('Savings');
      expect(html).toContain('Investment');
      expect(html).toContain('Credit Card');
      expect(html).toContain('Active');
      expect(html).toContain('Inactive');
      expect(html).toContain('₹1,25,000');
      expect(html).toContain('₹4,50,000');
    });

    it('renders per-card quick action row: Transactions, Analytics, Settings', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'populated');
      expect(html).toContain('Transactions');
      expect(html).toContain('Analytics');
      expect(html).toContain('Settings');
    });

    it('renders "Add Account" launcher button', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'populated');
      expect(html).toContain('Add Account');
    });

    it('renders empty state when accounts list has zero accounts', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'empty');
      expect(html).toContain('No accounts yet');
      expect(html).toContain('Add your first bank, card, or cash wallet to get started.');
    });

    it('renders loading skeletons when query is loading', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'loading');
      expect(html).toContain('animate-pulse');
    });
  });

  // =========================================================================
  // 3. TRANSACTIONS LIST SCREEN (TASK-2.4)
  // =========================================================================
  describe('3. Transactions List Screen (TASK-2.4)', () => {
    it('renders header with total transactions count indicator', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'populated');
      expect(html).toContain('Transactions');
      expect(html).toContain('4 Transactions'); // 3 txns + 1 transfer
    });

    it('renders pill filter tabs: All, Income, Expense, Investment, Transfer', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'populated');
      expect(html).toContain('All');
      expect(html).toContain('Income');
      expect(html).toContain('Expense');
      expect(html).toContain('Investment');
      expect(html).toContain('Transfer');
    });

    it('renders debounced search bar', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'populated');
      expect(html).toContain('Search merchant, category, note...');
    });

    it('renders transaction cards with semantic chips and rupee amounts', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'populated');
      // Income chip: +₹85,000
      expect(html).toContain('+₹85,000');
      // Expense chip: -₹3,200
      expect(html).toContain('-₹3,200');
      // Investment chip: ₹25,000
      expect(html).toContain('₹25,000');
      // Transfer chip: ⇄ ₹15,000
      expect(html).toContain('₹15,000');
      // Merchants & Titles
      expect(html).toContain('Acme Technologies');
      expect(html).toContain('Nature Basket');
      expect(html).toContain('Zerodha Coin');
    });

    it('renders edit and delete action buttons on transaction items', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'populated');
      expect(html).toContain('aria-label="Edit transaction"');
      expect(html).toContain('aria-label="Delete transaction"');
    });

    it('renders empty state when no transactions exist under current filter', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'empty');
      expect(html).toContain('No transactions found');
      expect(html).toContain('Add Transaction');
    });

    it('renders loading skeletons when transactions query is in flight', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'loading');
      expect(html).toContain('animate-pulse');
    });

    it('supports accountId URL parameter filtering and displays filter chip', () => {
      const html = renderWithProviders(
        <TransactionsPage />,
        '/transactions?accountId=acc_1',
        'populated'
      );
      expect(html).toContain('Filtered by:');
      expect(html).toContain('HDFC Salary Account');
    });
  });

  // =========================================================================
  // 4. INDIAN CURRENCY & NUMBERING FORMATTING IN THE UI
  // =========================================================================
  describe('4. Indian Currency Numbering Display', () => {
    it('formats rupee values correctly for balances and amounts', () => {
      expect(formatIndianRupees(150000)).toBe('₹1,50,000');
      expect(formatIndianRupees(2500000)).toBe('₹25,00,000');
      expect(formatIndianRupees(750)).toBe('₹750');
      expect(formatIndianRupees(0)).toBe('₹0');
    });
  });

  // =========================================================================
  // 5. ZERO BANNED PLACEHOLDERS & ZERO EMOJIS IN RENDERED MARKUP
  // =========================================================================
  describe('5. Zero Placeholders & Zero Emojis in Rendered Output', () => {
    const bannedPhrases = [
      ['coming', 'soon'].join(' '),
      ['coming', 'in', 'v2'].join(' '),
      ['beta', '(v2)'].join(' '),
      ['pre', 'view'].join(''),
      ['to', 'do'].join(''),
      ['sample', 'data'].join(' '),
      ['demo', 'data'].join(' '),
      ['lorem', 'ipsum'].join(' '),
    ];

    it('AccountsPage contains zero banned placeholder phrases in populated mode', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'populated').toLowerCase();
      bannedPhrases.forEach((phrase) => {
        expect(html).not.toContain(phrase);
      });
    });

    it('AccountsPage contains zero banned placeholder phrases in empty mode', () => {
      const html = renderWithProviders(<AccountsPage />, '/', 'empty').toLowerCase();
      bannedPhrases.forEach((phrase) => {
        expect(html).not.toContain(phrase);
      });
    });

    it('TransactionsPage contains zero banned placeholder phrases in populated mode', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'populated').toLowerCase();
      bannedPhrases.forEach((phrase) => {
        expect(html).not.toContain(phrase);
      });
    });

    it('TransactionsPage contains zero banned placeholder phrases in empty mode', () => {
      const html = renderWithProviders(<TransactionsPage />, '/', 'empty').toLowerCase();
      bannedPhrases.forEach((phrase) => {
        expect(html).not.toContain(phrase);
      });
    });

    it('TransactionFormModal in all modes contains zero banned placeholder phrases', () => {
      const types = ['income', 'expense', 'investment', 'transfer'] as const;
      const modes = ['add', 'edit'] as const;

      for (const m of modes) {
        for (const t of types) {
          const html = renderWithProviders(
            <TransactionFormModal isOpen={true} mode={m} type={t} />,
            '/',
            'populated'
          ).toLowerCase();
          bannedPhrases.forEach((phrase) => {
            expect(html).not.toContain(phrase);
          });
        }
      }
    });
  });
});
