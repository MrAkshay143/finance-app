import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.js';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.js';
import { ROUTES } from './routes.js';

// Auth & Onboarding
import { LoginPage } from '../pages/auth/LoginPage.js';
import { SignupPage } from '../pages/auth/SignupPage.js';
import { OnboardingWizard } from '../pages/onboarding/OnboardingWizard.js';

// 21 Production Screens
import { DashboardPage } from '../pages/DashboardPage.js';
import { TransactionsPage } from '../pages/TransactionsPage.js';
import { PlanningPage } from '../pages/PlanningPage.js';
import { ReportsPage } from '../pages/ReportsPage.js';
import { AnalyticsPage } from '../pages/AnalyticsPage.js';
import { AccountsPage } from '../pages/AccountsPage.js';
import { CategoriesPage } from '../pages/CategoriesPage.js';
import { InvestmentsPage } from '../pages/InvestmentsPage.js';
import { RecurringTransactionsPage } from '../pages/RecurringTransactionsPage.js';
import { AuditLogPage } from '../pages/AuditLogPage.js';
import { MenuPage } from '../pages/MenuPage.js';
import { NotificationsPage } from '../pages/NotificationsPage.js';
import { SecurityQuestionsPage } from '../pages/SecurityQuestionsPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage.js';
import { SettingsPage } from '../pages/SettingsPage.js';
import { AdminDashboardPage } from '../pages/AdminDashboardPage.js';
import { ManageUserOverviewPage } from '../pages/ManageUserOverviewPage.js';
import { ManageUserDetailTabsPage } from '../pages/ManageUserDetailTabsPage.js';
import { AdminAppSettingsPage } from '../pages/AdminAppSettingsPage.js';
import { AdminAuditPage } from '../pages/AdminAuditPage.js';
import { AiAnalysisPage } from '../pages/AiAnalysisPage.js';
import { AboutPage } from '../pages/AboutPage.js';
import { ImportPage } from '../pages/ImportPage.js';
import { ExportPage } from '../pages/ExportPage.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

      {/* Onboarding Wizard (Requires Auth, but onboarding not yet completed) */}
      <Route
        path={ROUTES.ONBOARDING}
        element={
          <ProtectedRoute requireOnboarding={false}>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />

      {/* Protected Main App Layout & Screens */}
      <Route
        element={
          <ProtectedRoute requireOnboarding={true}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* 1. Dashboard / Home */}
        <Route path={ROUTES.HOME} element={<DashboardPage />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

        {/* 2. Transactions */}
        <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />

        {/* 3. Planning (Budgets & Goals) */}
        <Route path={ROUTES.PLANNING} element={<PlanningPage />} />

        {/* 4. Reports */}
        <Route path={ROUTES.REPORTS} element={<ReportsPage />} />

        {/* 5. Analytics */}
        <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />

        {/* 6. Accounts */}
        <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />

        {/* 7. Categories */}
        <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />

        {/* Investments & Recurring Transactions */}
        <Route path={ROUTES.INVESTMENTS} element={<InvestmentsPage />} />
        <Route path={ROUTES.RECURRING} element={<RecurringTransactionsPage />} />

        {/* 8. User Audit Log */}
        <Route path={ROUTES.AUDIT} element={<AuditLogPage />} />

        {/* 9. Menu / More */}
        <Route path={ROUTES.MORE} element={<MenuPage />} />
        <Route path={ROUTES.MENU} element={<MenuPage />} />

        {/* 10. Notifications & Reminders */}
        <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />

        {/* 11. Security Questions (KBA) */}
        <Route path={ROUTES.SECURITY_QUESTIONS} element={<SecurityQuestionsPage />} />

        {/* 12. Profile */}
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

        {/* 13. Profile Settings (Finance Profile) */}
        <Route path={ROUTES.PROFILE_SETTINGS} element={<ProfileSettingsPage />} />

        {/* 14. App Settings */}
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />

        {/* 15. Admin Dashboard & Users */}
        <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
        <Route path={ROUTES.ADMIN_USERS} element={<AdminDashboardPage />} />

        {/* 16. Manage User Overview */}
        <Route path={ROUTES.ADMIN_USER_OVERVIEW} element={<ManageUserOverviewPage />} />

        {/* 17. Manage User (3 Tabs) */}
        <Route path={ROUTES.ADMIN_USER_MANAGE} element={<ManageUserDetailTabsPage />} />

        {/* 18. Admin App Settings */}
        <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminAppSettingsPage />} />

        {/* 19. Admin Activity Audit */}
        <Route path={ROUTES.ADMIN_AUDIT} element={<AdminAuditPage />} />

        {/* 20. AI Analysis Dashboard */}
        <Route path={ROUTES.AI_ANALYSIS} element={<AiAnalysisPage />} />

        {/* 21. About & Support */}
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />

        {/* 22. CSV Import */}
        <Route path={ROUTES.IMPORT} element={<ImportPage />} />

        {/* 23. Universal Data Export */}
        <Route path={ROUTES.EXPORT} element={<ExportPage />} />

        {/* Merchants view */}
        <Route path={ROUTES.MERCHANTS} element={<CategoriesPage />} />

        {/* Catch-all route redirects to dashboard */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>
    </Routes>
  );
};
