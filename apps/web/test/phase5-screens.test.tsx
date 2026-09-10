import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MenuPage } from '../src/pages/MenuPage.js';
import { AboutPage } from '../src/pages/AboutPage.js';
import { SettingsPage } from '../src/pages/SettingsPage.js';
import { AuditLogPage } from '../src/pages/AuditLogPage.js';
import { AdminDashboardPage } from '../src/pages/AdminDashboardPage.js';
import { ManageUserOverviewPage } from '../src/pages/ManageUserOverviewPage.js';
import { ManageUserDetailTabsPage } from '../src/pages/ManageUserDetailTabsPage.js';
import { AdminAppSettingsPage } from '../src/pages/AdminAppSettingsPage.js';
import { AdminAuditPage } from '../src/pages/AdminAuditPage.js';
import { ImportPage } from '../src/pages/ImportPage.js';
import { ExportPage } from '../src/pages/ExportPage.js';
import { useAuthStore } from '../src/store/authStore.js';

function createTestQueryClient(initialData?: Array<[any[], any]> | Record<string, any>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  if (Array.isArray(initialData)) {
    initialData.forEach(([key, value]) => {
      queryClient.setQueryData(key, value);
    });
  } else if (initialData) {
    Object.entries(initialData).forEach(([key, value]) => {
      queryClient.setQueryData([key], value);
    });
  }

  return queryClient;
}

describe('Phase 5 Screens Test Suite (TASK-5.4, 5.5, 5.6, 5.7)', () => {
  /* ======================================================================
   * 1. TASK-5.4: MenuPage & AboutPage
   * ====================================================================== */
  describe('1. TASK-5.4: Menu / More Dashboard & About Screen', () => {
    it('renders MenuPage with user profile card, 5 grouped sections, and membership badge', () => {
      useAuthStore.setState({
        user: {
          id: 'usr_test_1',
          email: 'contact@imakshay.in',
          fullName: 'Akshay Contact',
          role: 'USER',
          status: 'ACTIVE',
        },
        isAuthenticated: true,
      });

      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <MenuPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Navy Header
      expect(html).toContain('Finance Tracker');
      expect(html).toContain('Welcome back, Akshay Contact');

      // User profile card
      expect(html).toContain('Akshay Contact');
      expect(html).toContain('contact@imakshay.in');
      expect(html).toContain('Standard Member');
      expect(html).toContain('Edit Profile');

      // 5 grouped sections
      expect(html).toContain('ACCOUNT');
      expect(html).toContain('INSIGHTS &amp; ANALYTICS');
      expect(html).toContain('FINANCE');
      expect(html).toContain('DATA &amp; IMPORT');
      expect(html).toContain('SUPPORT');

      // Core items
      expect(html).toContain('Profile');
      expect(html).toContain('Settings');
      expect(html).toContain('Reports');
      expect(html).toContain('Audit Log');
      expect(html).toContain('AI Analysis');
      expect(html).toContain('Insights');
      expect(html).toContain('Accounts');
      expect(html).toContain('Categories');
      expect(html).toContain('Merchants');
      expect(html).toContain('Investments');
      expect(html).toContain('Recurring');
      expect(html).toContain('Import CSV');
      expect(html).toContain('Export Data');
      expect(html).toContain('About');

      // Admin section should NOT be present for standard USER
      expect(html).not.toContain('ADMINISTRATION');
    });

    it('renders MenuPage ADMINISTRATION section when user has role ADMIN', () => {
      useAuthStore.setState({
        user: {
          id: 'admin_usr_1',
          email: 'admin@finance.org',
          fullName: 'Chief Admin',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        isAuthenticated: true,
      });

      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <MenuPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('ADMINISTRATION');
      expect(html).toContain('Admin Dashboard');
      expect(html).toContain('Manage Users');
      expect(html).toContain('App Settings');
      expect(html).toContain('System Audit');
    });

    it('renders AboutPage with hero block, 3 trust badges, 6-step guide, and FAM calculation rules', () => {
      const qc = createTestQueryClient();
      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AboutPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Hero block
      expect(html).toContain('Finance Tracker');
      expect(html).toContain('Version 1.0');
      expect(html).toContain('Track Today. Build a Brighter Tomorrow.');

      // 3 Trust badges
      expect(html).toContain('Your Data Your Control');
      expect(html).toContain('Secure &amp; Private');
      expect(html).toContain('Plan a Better Financial Future');

      // Description
      expect(html).toContain('About the application');
      expect(html).toContain('Financial Allocation Meter (FAM)');

      // 6-step guide
      expect(html).toContain('How to use Finance Tracker');
      expect(html).toContain('Set up your basic profile');
      expect(html).toContain('Set your monthly budget &amp; targets');
      expect(html).toContain('Tell the app your regular money items');
      expect(html).toContain('Record your transactions');
      expect(html).toContain('Check your FAM score');
      expect(html).toContain('Plan ahead &amp; review reports');

      // Active deliverables list
      expect(html).toContain('All Features Available in V1');
      expect(html).toContain('AI Analysis &amp; Forward Projections');
      expect(html).toContain('Multi-Account Balance Tracking');
      expect(html).toContain('CSV Transaction Import');
      expect(html).toContain('Universal Data Export');
    });
  });

  /* ======================================================================
   * 2. TASK-5.5: SettingsPage & AuditLogPage
   * ====================================================================== */
  describe('2. TASK-5.5: Settings Screen & User Audit Log', () => {
    it('renders SettingsPage with preferences, toggles, and danger zone', () => {
      const qc = createTestQueryClient({
        'user-settings': {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          financialMonthStartDay: 1,
          quickAddEnabled: true,
          donutVisualsEnabled: true,
          investmentsTrackingEnabled: true,
          recurringTrackingEnabled: true,
        },
      });

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <SettingsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Navy Header & Subheader
      expect(html).toContain('Settings');
      expect(html).toContain('Customize your experience');
      expect(html).toContain('Make it yours');
      expect(html).toContain('Simple. Secure. Personal.');

      // Preferences
      expect(html).toContain('Preferences');
      expect(html).toContain('Currency');
      expect(html).toContain('Timezone');
      expect(html).toContain('Financial Month Start');

      // Notifications & Quick Actions
      expect(html).toContain('Notifications');
      expect(html).toContain('Quick Actions');
      expect(html).toContain('Quick-add button');

      // Donuts
      expect(html).toContain('Dashboard Donuts');
      expect(html).toContain('Income donut');
      expect(html).toContain('Expense donut');
      expect(html).toContain('Investment donut');

      // Features & Security
      expect(html).toContain('Features');
      expect(html).toContain('Investments');
      expect(html).toContain('Recurring transactions');
      expect(html).toContain('Security');
      expect(html).toContain('Change password');
      expect(html).toContain('Security Questions');

      // Danger Zone
      expect(html).toContain('Danger Zone');
      expect(html).toContain('Reset Profile');
      expect(html).toContain('Delete My Account');
      expect(html).toContain('Log Out');
    });

    it('renders AuditLogPage with search, filter pills, and empty state', () => {
      const qc = createTestQueryClient([
        [
          ['user-audit-logs', 'All', ''],
          {
            logs: [],
            pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
          },
        ],
      ]);

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AuditLogPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Audit Log');
      expect(html).toContain('A record of key actions on your account');
      expect(html).toContain('Search actions, type, details...');
      expect(html).toContain('All');
      expect(html).toContain('Login');
      expect(html).toContain('Transactions');
      expect(html).toContain('Profile');
      expect(html).toContain('Security');
      expect(html).toContain('all for now');
    });
  });

  /* ======================================================================
   * 3. TASK-5.6: Admin Management Suite Screens
   * ====================================================================== */
  describe('3. TASK-5.6: Admin Suite Screens', () => {
    it('renders AdminDashboardPage with 4 metrics cards and search filters', () => {
      const qc = createTestQueryClient([
        [
          ['admin-dashboard-metrics'],
          {
            totalUsers: 142,
            activeUsers: 135,
            suspendedUsers: 7,
            adminUsers: 3,
          },
        ],
        [
          ['admin-users', 'ALL', '', 'name'],
          [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'rajibs.finance@gmail.com',
              fullName: 'Rajib Finance',
              role: 'USER',
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
          ],
        ],
      ]);

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminDashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Admin');
      expect(html).toContain('Manage users and permissions');
      expect(html).toContain('Total Users');
      expect(html).toContain('Active');
      expect(html).toContain('Suspended');
      expect(html).toContain('Admins');
      expect(html).toContain('Search name or email...');
      expect(html).toContain('Users');
      expect(html).toContain('Rajib Finance');
      expect(html).toContain('rajibs.finance@gmail.com');
      expect(html).toContain('All users are here!');
    });

    it('renders ManageUserOverviewPage with details, 2x2 actions, and soft delete', () => {
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';
      const qc = createTestQueryClient([
        [
          ['admin-user-details', testUserId],
          {
            user: {
              id: testUserId,
              email: 'rajibs.finance@gmail.com',
              fullName: 'rajibs.finance',
              role: 'USER',
              status: 'ACTIVE',
              onboardingCompleted: true,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
          },
        ],
      ]);

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={[`/admin/users/${testUserId}`]}>
            <Routes>
              <Route path="/admin/users/:id" element={<ManageUserOverviewPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Manage User');
      expect(html).toContain('rajibs.finance');
      expect(html).toContain('rajibs.finance@gmail.com');
      expect(html).toContain('Email Address');
      expect(html).toContain('Joined');
      expect(html).toContain('Last Login');
      expect(html).toContain('Onboarding');
      expect(html).toContain('User ID');
      expect(html).toContain('Account Actions');
      expect(html).toContain('Disable User');
      expect(html).toContain('Make Admin');
      expect(html).toContain('Reset Password');
      expect(html).toContain('Reset Security Questions');
      expect(html).toContain('Danger Zone');
      expect(html).toContain('Delete Account');
      expect(html).toContain('Soft delete');
    });

    it('renders ManageUserDetailTabsPage with 3 tabs (Overview, Permissions, Security)', () => {
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';
      const qc = createTestQueryClient([
        [
          ['admin-user-details', testUserId],
          {
            user: {
              id: testUserId,
              email: 'rajibs.finance@gmail.com',
              fullName: 'rajibs.finance',
              role: 'USER',
              status: 'ACTIVE',
              failedLoginAttempts: 0,
              onboardingCompleted: true,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
          },
        ],
      ]);

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={[`/admin/users/${testUserId}/manage`]}>
            <Routes>
              <Route path="/admin/users/:id/manage" element={<ManageUserDetailTabsPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Overview');
      expect(html).toContain('Permissions');
      expect(html).toContain('Security');
      expect(html).toContain('Account Details');
    });

    it('renders AdminAppSettingsPage with session timeout and max failed attempts steppers', () => {
      const qc = createTestQueryClient({
        'admin-app-settings': {
          sessionTimeoutMinutes: 120,
          maxFailedLoginAttempts: 5,
        },
      });

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminAppSettingsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('App Settings');
      expect(html).toContain('Configure security settings for all users.');
      expect(html).toContain('Session timeout');
      expect(html).toContain('Max failed attempts');
      expect(html).toContain('These settings apply to all users in the system.');
      expect(html).toContain('Cancel');
      expect(html).toContain('Save');
    });

    it('renders AdminAuditPage with search, filter pills, and activity stream', () => {
      const qc = createTestQueryClient([
        [
          ['admin-audit-logs', 'All', ''],
          {
            logs: [
              {
                id: 'log_1',
                action: 'LOGIN_SUCCESS',
                category: 'Login',
                actorEmail: 'admin@finance.org',
                ipAddress: '192.168.1.1',
                createdAt: new Date().toISOString(),
                details: { userAgent: 'Chrome on Windows' },
              },
            ],
            pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
          },
        ],
      ]);

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminAuditPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Activity Audit');
      expect(html).toContain('Track all important account activities');
      expect(html).toContain('Search email, action or details...');
      expect(html).toContain('All');
      expect(html).toContain('Login');
      expect(html).toContain('Profile');
      expect(html).toContain('Settings');
      expect(html).toContain('Security');
      expect(html).toContain('Admin');
      expect(html).toContain('Activity');
      expect(html).toContain('LOGIN_SUCCESS');
      expect(html).toContain('by admin@finance.org');
      expect(html).toContain('Success');
    });
  });

  /* ======================================================================
   * 4. TASK-5.7: ImportPage & ExportPage
   * ====================================================================== */
  describe('4. TASK-5.7: CSV Import & Data Export Interfaces', () => {
    it('renders ImportPage with account picker, dropzone, and column format guide', () => {
      const qc = createTestQueryClient({
        accounts: [
          {
            id: 'acc_1',
            name: 'HDFC Salary Account',
            type: 'BANK',
            currentBalance: 8500000,
          },
        ],
      });

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ImportPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Import Transactions');
      expect(html).toContain('Target Account');
      expect(html).toContain('HDFC Salary Account');
      expect(html).toContain('Tap to browse or drop CSV file here');
      expect(html).toContain('Expected CSV Column Format');
      expect(html).toContain('Sample CSV');
    });

    it('renders ExportPage with CSV/JSON options and inclusion scopes', () => {
      const qc = createTestQueryClient();

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <ExportPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(html).toContain('Data Export');
      expect(html).toContain('Select File Format');
      expect(html).toContain('CSV Spreadsheet');
      expect(html).toContain('JSON Format');
      expect(html).toContain('Export Inclusions');
      expect(html).toContain('Transactions History');
      expect(html).toContain('Accounts &amp; Balances');
      expect(html).toContain('Budgets &amp; Targets');
      expect(html).toContain('Financial Goals');
      expect(html).toContain('Download');
      expect(html).toContain('Export');
    });
  });

  /* ======================================================================
   * 5. Zero Banned Phrases and Emojis across all Phase 5 Screens
   * ====================================================================== */
  describe('5. Zero Banned Placeholders & Zero Emojis in Phase 5 Screens', () => {
    const screens = [
      { name: 'MenuPage', component: <MenuPage /> },
      { name: 'AboutPage', component: <AboutPage /> },
      { name: 'SettingsPage', component: <SettingsPage /> },
      { name: 'AuditLogPage', component: <AuditLogPage /> },
      { name: 'AdminDashboardPage', component: <AdminDashboardPage /> },
      { name: 'ManageUserOverviewPage', component: <ManageUserOverviewPage /> },
      { name: 'ManageUserDetailTabsPage', component: <ManageUserDetailTabsPage /> },
      { name: 'AdminAppSettingsPage', component: <AdminAppSettingsPage /> },
      { name: 'AdminAuditPage', component: <AdminAuditPage /> },
      { name: 'ImportPage', component: <ImportPage /> },
      { name: 'ExportPage', component: <ExportPage /> },
    ];

    const bannedPatterns = [
      /coming\s+soon/i,
      /coming\s+in\s+v2/i,
      /beta\s*\(v2\)/i,
      /lorem\s+ipsum/i,
      /sample\s+data/i,
      /demo\s+data/i,
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    screens.forEach(({ name, component }) => {
      it(`${name} contains zero banned placeholder phrases and zero emojis`, () => {
        const qc = createTestQueryClient();
        const html = renderToString(
          <QueryClientProvider client={qc}>
            <MemoryRouter>{component}</MemoryRouter>
          </QueryClientProvider>
        );

        bannedPatterns.forEach((pattern) => {
          expect(html).not.toMatch(pattern);
        });

        expect(html).not.toMatch(emojiRegex);
      });
    });
  });
});
