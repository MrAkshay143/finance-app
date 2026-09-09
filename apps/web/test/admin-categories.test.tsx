import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminCategoriesPage } from '../src/pages/AdminCategoriesPage.js';
import { Button } from '../src/components/ui/Button.js';
import { BottomNav } from '../src/components/layout/BottomNav.js';

// Helper to create a pre-populated QueryClient
function createTestQueryClient(queries: [unknown[], unknown][]) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
  for (const [key, data] of queries) {
    qc.setQueryData(key, data);
  }
  return qc;
}

describe('Admin Categories & Centralized UI Test Suite', () => {
  const mockSystemCategories = [
    { id: 'cat-1', name: 'Food & Dining', type: 'EXPENSE', sortOrder: 1 },
    { id: 'cat-2', name: 'Salary', type: 'INCOME', sortOrder: 2 },
    { id: 'cat-3', name: 'Mutual Funds', type: 'INVESTMENT', sortOrder: 3 },
  ];

  it('renders AdminCategoriesPage with AppHeader, metrics, and list', () => {
    const qc = createTestQueryClient([
      [['admin-system-categories'], mockSystemCategories],
    ]);

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/admin/categories']}>
          <AdminCategoriesPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // AppHeader verification
    expect(html).toContain('System Categories');
    expect(html).toContain('Default platform taxonomy');

    // KPI Metrics verification
    expect(html).toContain('Total');
    expect(html).toContain('Expense');
    expect(html).toContain('Income');
    expect(html).toContain('Investment');

    // Filter pills verification
    expect(html).toContain('All Types');

    // System categories list items
    expect(html).toContain('Food &amp; Dining');
    expect(html).toContain('Salary');
    expect(html).toContain('Mutual Funds');

    // Add category button
    expect(html).toContain('Add Category');
  });

  it('ensures Button renders with whitespace-nowrap and prevents line breaks', () => {
    const html = renderToString(
      <Button variant="primary" size="sm">
        Sign Out
      </Button>
    );

    expect(html).toContain('whitespace-nowrap');
    expect(html).toContain('Sign Out');
  });

  it('renders BottomNav with dedicated Categories tab for admin', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/admin/categories']}>
        <BottomNav />
      </MemoryRouter>
    );

    // Admin bottom nav items
    expect(html).toContain('Users');
    expect(html).toContain('Categories');
    expect(html).toContain('Reports');
    expect(html).toContain('Audit');
    expect(html).toContain('Settings');
    expect(html).toContain('href="/admin/categories"');
  });
});
