import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import { Button } from '../src/components/ui/Button.js';
import { Input } from '../src/components/ui/Input.js';
import { Select } from '../src/components/ui/Select.js';
import { Modal } from '../src/components/ui/Modal.js';
import { SegmentedControl } from '../src/components/ui/SegmentedControl.js';
import { Card } from '../src/components/ui/Card.js';
import { AppHeader } from '../src/components/layout/AppHeader.js';
import { BottomNav } from '../src/components/layout/BottomNav.js';
import { AppLayout } from '../src/components/layout/AppLayout.js';
import { AddTransactionPickerModal } from '../src/components/finance/AddTransactionPickerModal.js';

// Pages
import { TransactionsPage } from '../src/pages/TransactionsPage.js';
import { CategoriesPage } from '../src/pages/CategoriesPage.js';
import { PlanningPage } from '../src/pages/PlanningPage.js';
import { RecurringTransactionsPage } from '../src/pages/RecurringTransactionsPage.js';
import { ReportsPage } from '../src/pages/ReportsPage.js';
import { AiAnalysisPage } from '../src/pages/AiAnalysisPage.js';
import { LoginPage } from '../src/pages/auth/LoginPage.js';
import { ImportPage } from '../src/pages/ImportPage.js';
import { AdminAppSettingsPage } from '../src/pages/AdminAppSettingsPage.js';
import { AboutPage } from '../src/pages/AboutPage.js';
import { useAuthStore } from '../src/store/authStore.js';
import { useUiStore } from '../src/store/uiStore.js';

function createTestQueryClient(initialData?: Array<[any[], any]>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  if (initialData) {
    initialData.forEach(([key, value]) => {
      queryClient.setQueryData(key, value);
    });
  }

  return queryClient;
}

describe('TASK-6.1: Web Accessibility & Polish Pass Test Suite', () => {
  /* ======================================================================
   * 1. UI Primitives Accessibility & Focus Rings
   * ====================================================================== */
  describe('1. UI Primitives: ARIA attributes and focus-visible rings', () => {
    it('Button renders accessible focus-visible rings and aria-busy when loading', () => {
      const normalHtml = renderToString(
        <Button variant="primary" size="md">
          Submit Payment
        </Button>
      );
      expect(normalHtml).toContain('focus-visible:outline-none');
      expect(normalHtml).toContain('focus-visible:ring-2');
      expect(normalHtml).toContain('focus-visible:ring-brand-primary');
      expect(normalHtml).toContain('focus-visible:ring-offset-2');

      const loadingHtml = renderToString(
        <Button variant="primary" size="md" isLoading>
          Saving...
        </Button>
      );
      expect(loadingHtml).toContain('aria-busy="true"');
      expect(loadingHtml).toContain('disabled=""');

      const dangerHtml = renderToString(
        <Button variant="danger" size="md">
          Delete Item
        </Button>
      );
      expect(dangerHtml).toContain('focus-visible:ring-semantic-danger');
    });

    it('Input renders aria-invalid, aria-describedby, and role="alert" when an error is present', () => {
      const inputHtml = renderToString(
        <Input
          id="test-email"
          label="Email Address"
          error="Please enter a valid email address"
          helperText="We will never share your email."
        />
      );
      expect(inputHtml).toContain('aria-invalid="true"');
      expect(inputHtml).toContain('aria-describedby="test-email-error"');
      expect(inputHtml).toContain('role="alert"');
      expect(inputHtml).toContain('Please enter a valid email address');
      expect(inputHtml).toContain('focus-visible:outline-none');
      expect(inputHtml).toContain('focus-visible:ring-2');
    });

    it('Select renders aria-invalid, aria-describedby, and aria-hidden on decorative chevron', () => {
      const selectHtml = renderToString(
        <Select
          id="account-type"
          label="Account Type"
          error="Account type is required"
          options={[
            { value: 'CHECKING', label: 'Checking Account' },
            { value: 'SAVINGS', label: 'Savings Account' },
          ]}
        />
      );
      expect(selectHtml).toContain('aria-invalid="true"');
      expect(selectHtml).toContain('aria-describedby="account-type-error"');
      expect(selectHtml).toContain('role="alert"');
      expect(selectHtml).toContain('aria-hidden="true"');
      expect(selectHtml).toContain('focus-visible:outline-none');
      expect(selectHtml).toContain('focus-visible:ring-2');
    });

    it('Modal renders role="dialog", aria-modal="true", labelledby/describedby, and accessible close button', () => {
      const modalHtml = renderToString(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Confirm Delete"
          description="Are you sure you want to delete this record?"
        >
          <div>Modal Body Content</div>
        </Modal>
      );
      expect(modalHtml).toContain('role="dialog"');
      expect(modalHtml).toContain('aria-modal="true"');
      expect(modalHtml).toContain('aria-labelledby="modal-title-confirm-delete"');
      expect(modalHtml).toContain('aria-describedby="modal-description-confirm-delete"');
      expect(modalHtml).toContain('aria-label="Close modal"');
      expect(modalHtml).toContain('focus-visible:ring-brand-primary');
    });

    it('SegmentedControl renders role="tablist", role="tab", aria-selected, and focus rings', () => {
      const segmentedHtml = renderToString(
        <SegmentedControl
          ariaLabel="Transaction types"
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Income', value: 'INCOME' },
            { label: 'Expense', value: 'EXPENSE' },
          ]}
          value="INCOME"
          onChange={() => {}}
        />
      );
      expect(segmentedHtml).toContain('role="tablist"');
      expect(segmentedHtml).toContain('aria-label="Transaction types"');
      expect(segmentedHtml).toContain('role="tab"');
      expect(segmentedHtml).toContain('aria-selected="true"');
      expect(segmentedHtml).toContain('aria-selected="false"');
      expect(segmentedHtml).toContain('focus-visible:ring-brand-primary');
    });

    it('Card supports semantic article and section elements and keyboard-accessible button roles', () => {
      const sectionHtml = renderToString(
        <Card as="section" aria-label="Summary overview">
          <p>Summary Content</p>
        </Card>
      );
      expect(sectionHtml).toContain('<section');
      expect(sectionHtml).toContain('aria-label="Summary overview"');

      const clickableCardHtml = renderToString(
        <Card onClick={() => {}} aria-label="Account Card">
          <p>Account Balance</p>
        </Card>
      );
      expect(clickableCardHtml).toContain('role="button"');
      expect(clickableCardHtml).toContain('tabindex="0"');
      expect(clickableCardHtml).toContain('focus-visible:ring-2');
    });
  });

  /* ======================================================================
   * 2. Semantic Landmarks & Shell Navigation
   * ====================================================================== */
  describe('2. Semantic Landmarks & Shell Navigation', () => {
    it('AppLayout wraps application content in <main id="main-content" role="main">', () => {
      const layoutHtml = renderToString(
        <MemoryRouter>
          <AppLayout>
            <div id="test-child">Child Screen</div>
          </AppLayout>
        </MemoryRouter>
      );
      expect(layoutHtml).toContain('<main id="main-content" role="main"');
      expect(layoutHtml).toContain('Child Screen');
    });

    it('AppHeader renders <header> landmark, dark navy gradient, accessible home/back navigation, and notification bell', () => {
      useUiStore.setState({ unreadCount: 3 });
      const headerHtml = renderToString(
        <MemoryRouter>
          <AppHeader
            variant="root"
            title="Finance Tracker"
            subtitle="Personal Wealth"
          />
        </MemoryRouter>
      );
      expect(headerHtml).toContain('<header');
      expect(headerHtml).toContain('Finance Tracker');
      expect(headerHtml).toContain('aria-label="Finance Tracker Home"');
      expect(headerHtml).toContain('aria-label="Notifications, 3 unread"');
      expect(headerHtml).toContain('aria-hidden="true"');
      expect(headerHtml).toContain('focus-visible:ring-white');
    });

    it('BottomNav renders <nav aria-label="Bottom Navigation"> and explicit aria-labels on all 5 items', () => {
      const navHtml = renderToString(
        <MemoryRouter>
          <BottomNav />
        </MemoryRouter>
      );
      expect(navHtml).toContain('<nav aria-label="Bottom Navigation"');
      expect(navHtml).toContain('aria-label="Home"');
      expect(navHtml).toContain('aria-label="Transactions"');
      expect(navHtml).toContain('aria-label="Add transaction"');
      expect(navHtml).toContain('aria-label="Reports"');
      expect(navHtml).toContain('aria-label="More"');
      expect(navHtml).toContain('focus-visible:ring-brand-primary');
    });
  });

  /* ======================================================================
   * 3. Screen Polish & Icon-Only Button ARIA Labels
   * ====================================================================== */
  describe('3. Screen Polish & Icon-Only Button ARIA Labels', () => {
    it('AddTransactionPickerModal renders dialog landmark, accessible close button, and focusable option buttons', () => {
      const pickerHtml = renderToString(
        <AddTransactionPickerModal
          isOpen={true}
          onClose={() => {}}
          onSelectType={() => {}}
        />
      );
      expect(pickerHtml).toContain('role="dialog"');
      expect(pickerHtml).toContain('aria-modal="true"');
      expect(pickerHtml).toContain('aria-labelledby="add-transaction-picker-title"');
      expect(pickerHtml).toContain('aria-label="Close modal"');
      expect(pickerHtml).toContain('focus-visible:ring-brand-primary');
      expect(pickerHtml).toContain('Add Income');
      expect(pickerHtml).toContain('Add Expense');
    });

    it('TransactionsPage provides semantic list, explicit edit/delete ARIA labels, and focus rings', () => {
      const qc = createTestQueryClient([
        [
          ['transactions', undefined, '', ''],
          {
            items: [
              {
                id: 'tx-1',
                type: 'INCOME',
                amount: 75000,
                description: 'Monthly Salary Deposit',
                date: '2026-09-01T10:00:00Z',
              },
            ],
            total: 1,
          },
        ],
        [['transfers'], []],
        [['accounts'], { accounts: [{ id: 'acc-1', name: 'Primary HDFC Checking' }] }],
      ]);

      const txHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <TransactionsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(txHtml).toContain('aria-label="Transactions list"');
      expect(txHtml).toContain('aria-label="Edit transaction"');
      expect(txHtml).toContain('aria-label="Delete transaction"');
      expect(txHtml).toContain('focus-visible:ring-brand-primary');
      expect(txHtml).toContain('focus-visible:ring-semantic-danger');
    });

    it('CategoriesPage provides accessible tablist, category reorder buttons, and edit/delete ARIA labels', () => {
      const qc = createTestQueryClient([
        [
          ['categories'],
          [
            {
              id: 'cat-groceries',
              name: 'Groceries & Provisions',
              type: 'EXPENSE',
              displayOrder: 1,
              isSystem: false,
            },
          ],
        ],
        [['merchants'], []],
      ]);

      const catHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <CategoriesPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(catHtml).toContain('role="tablist"');
      expect(catHtml).toContain('role="tab"');
      expect(catHtml).toContain('aria-label="Move Groceries &amp; Provisions up"');
      expect(catHtml).toContain('aria-label="Move Groceries &amp; Provisions down"');
      expect(catHtml).toContain('aria-label="Edit Groceries &amp; Provisions"');
      expect(catHtml).toContain('aria-label="Delete Groceries &amp; Provisions"');
    });

    it('PlanningPage renders budget edit and delete buttons with explicit localized ARIA labels', () => {
      const qc = createTestQueryClient([
        [
          ['budgets'],
          [
            {
              id: 'bgt-1',
              name: 'Dining & Takeout',
              categoryId: 'cat-dining',
              targetAmount: 12000,
              currentSpent: 8400,
              progress: 70,
              percentage: 70,
            },
          ],
        ],
        [['goals'], []],
        [['categories', 'EXPENSE'], []],
      ]);

      const planHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <PlanningPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(planHtml).toContain('aria-label="Edit Dining &amp; Takeout budget"');
      expect(planHtml).toContain('aria-label="Delete Dining &amp; Takeout budget"');
      expect(planHtml).toContain('focus-visible:ring-brand-primary');
    });

    it('RecurringTransactionsPage provides localized edit and delete ARIA labels', () => {
      const qc = createTestQueryClient([
        [
          ['recurring-transactions'],
          [
            {
              id: 'rec-1',
              description: 'Broadband Fiber Internet',
              type: 'EXPENSE',
              amount: 1499,
              frequency: 'MONTHLY',
              category: 'Utilities',
              startDate: '2026-01-01',
              status: 'ACTIVE',
            },
          ],
        ],
        [['accounts'], { accounts: [] }],
        [['categories'], []],
      ]);

      const recHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <RecurringTransactionsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(recHtml).toContain('aria-label="Edit Broadband Fiber Internet"');
      expect(recHtml).toContain('aria-label="Delete Broadband Fiber Internet"');
    });

    it('ReportsPage provides accessible go back, export button, and tablist navigation', () => {
      const qc = createTestQueryClient();
      const reportsHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ReportsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(reportsHtml).toContain('aria-label="Go back"');
      expect(reportsHtml).toContain('aria-label="Export report as JSON"');
      expect(reportsHtml).toContain('role="tablist"');
      expect(reportsHtml).toContain('role="tab"');
      expect(reportsHtml).toContain('focus-visible:ring-brand-primary');
    });


    it('AiAnalysisPage provides accessible recommendation items with keyboard handling', () => {
      const qc = createTestQueryClient([
        [
          ['ai-analysis', '2026-09'],
          {
            monthlyAnalysis: {
              earned: 48500,
              spent: 32400,
              invested: 8200,
              netSavings: 16100,
              needsRatio: 42,
              investmentRatio: 17,
              savingsRate: 33,
            },
            suggestions: [
              {
                id: 'sug-1',
                title: 'Review Streaming Subscriptions',
                description: 'Trim inactive subscriptions to allocate towards index funds.',
                priority: 'HIGH',
                actionType: 'BUDGET_ADJUSTMENT',
              },
            ],
          },
        ],
      ]);

      const aiHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AiAnalysisPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(aiHtml).toContain('role="button"');
      expect(aiHtml).toContain('aria-label="View recommendation: Review Streaming Subscriptions"');
      expect(aiHtml).toContain('tabindex="0"');
      expect(aiHtml).toContain('focus-visible:ring-brand-primary');
    });

    it('LoginPage provides accessible password toggle, checkbox focus ring, and role="alert"', () => {
      useAuthStore.setState({
        error: 'Invalid credentials. Please try again.',
        lockoutUntil: null,
      });

      const loginHtml = renderToString(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(loginHtml).toContain('aria-label="Show password"');
      expect(loginHtml).toContain('role="alert"');
      expect(loginHtml).toContain('Invalid credentials. Please try again.');
      expect(loginHtml).toContain('focus-visible:ring-brand-primary');
    });

    it('ImportPage provides keyboard-accessible dropzone with role="button", tabIndex, and alerts', () => {
      const qc = createTestQueryClient([[['accounts'], [{ id: 'acc-1', name: 'Primary Checking', type: 'CHECKING', currentBalance: 5000000 }]]]);

      const importHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ImportPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(importHtml).toContain('role="button"');
      expect(importHtml).toContain('tabindex="0"');
      expect(importHtml).toContain('aria-label="Upload CSV file. Browse or drag and drop statement file."');
      expect(importHtml).toContain('focus-visible:ring-brand-primary');
    });

    it('AdminAppSettingsPage provides accessible close button and stepper buttons', () => {
      const qc = createTestQueryClient([
        [
          ['admin-app-settings'],
          {
            sessionTimeoutMinutes: 120,
            maxFailedLoginAttempts: 5,
            maxFailedAttempts: 5,
          },
        ],
      ]);
      const settingsHtml = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminAppSettingsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(settingsHtml).toContain('aria-label="Close app settings"');
      expect(settingsHtml).toContain('aria-label="Decrease max attempts"');
      expect(settingsHtml).toContain('aria-label="Increase max attempts"');
    });

    it('AboutPage provides accordion items with aria-expanded, aria-controls, and focus rings', () => {
      const aboutHtml = renderToString(
        <MemoryRouter>
          <AboutPage />
        </MemoryRouter>
      );

      expect(aboutHtml).toContain('aria-expanded="false"');
      expect(aboutHtml).toContain('aria-controls="step-content-');
      expect(aboutHtml).toContain('focus-visible:ring-brand-primary');
    });
  });
});
