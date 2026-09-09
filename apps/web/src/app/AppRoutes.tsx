import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.js';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.js';
import { lazyWithRetry } from '../utils/lazyWithRetry.js';
import { ROUTES } from './routes.js';

// FE-01: All page components are lazily imported with lazyWithRetry + Suspense
// Automatically retries network chunk fetch errors and refreshes gracefully on new deployments.

// Auth & Onboarding
const LoginPage = lazyWithRetry(() => import('../pages/auth/LoginPage.js').then(m => ({ default: m.LoginPage })));
const SignupPage = lazyWithRetry(() => import('../pages/auth/SignupPage.js').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazyWithRetry(() => import('../pages/auth/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const OnboardingWizard = lazyWithRetry(() => import('../pages/onboarding/OnboardingWizard.js').then(m => ({ default: m.OnboardingWizard })));

// 21 Production Screens
const DashboardPage = lazyWithRetry(() => import('../pages/DashboardPage.js').then(m => ({ default: m.DashboardPage })));
const TransactionsPage = lazyWithRetry(() => import('../pages/TransactionsPage.js').then(m => ({ default: m.TransactionsPage })));
const PlanningPage = lazyWithRetry(() => import('../pages/PlanningPage.js').then(m => ({ default: m.PlanningPage })));
const ReportsPage = lazyWithRetry(() => import('../pages/ReportsPage.js').then(m => ({ default: m.ReportsPage })));
const AnalyticsPage = lazyWithRetry(() => import('../pages/AnalyticsPage.js').then(m => ({ default: m.AnalyticsPage })));
const AccountsPage = lazyWithRetry(() => import('../pages/AccountsPage.js').then(m => ({ default: m.AccountsPage })));
const CategoriesPage = lazyWithRetry(() => import('../pages/CategoriesPage.js').then(m => ({ default: m.CategoriesPage })));
const InvestmentsPage = lazyWithRetry(() => import('../pages/InvestmentsPage.js').then(m => ({ default: m.InvestmentsPage })));
const RecurringTransactionsPage = lazyWithRetry(() => import('../pages/RecurringTransactionsPage.js').then(m => ({ default: m.RecurringTransactionsPage })));
const AuditLogPage = lazyWithRetry(() => import('../pages/AuditLogPage.js').then(m => ({ default: m.AuditLogPage })));
const MenuPage = lazyWithRetry(() => import('../pages/MenuPage.js').then(m => ({ default: m.MenuPage })));
const NotificationsPage = lazyWithRetry(() => import('../pages/NotificationsPage.js').then(m => ({ default: m.NotificationsPage })));
const SecurityQuestionsPage = lazyWithRetry(() => import('../pages/SecurityQuestionsPage.js').then(m => ({ default: m.SecurityQuestionsPage })));
const ProfilePage = lazyWithRetry(() => import('../pages/ProfilePage.js').then(m => ({ default: m.ProfilePage })));
const ProfileSettingsPage = lazyWithRetry(() => import('../pages/ProfileSettingsPage.js').then(m => ({ default: m.ProfileSettingsPage })));
const SettingsPage = lazyWithRetry(() => import('../pages/SettingsPage.js').then(m => ({ default: m.SettingsPage })));
const AdminDashboardPage = lazyWithRetry(() => import('../pages/AdminDashboardPage.js').then(m => ({ default: m.AdminDashboardPage })));
const AdminReportsPage = lazyWithRetry(() => import('../pages/AdminReportsPage.js').then(m => ({ default: m.AdminReportsPage })));
const ManageUserOverviewPage = lazyWithRetry(() => import('../pages/ManageUserOverviewPage.js').then(m => ({ default: m.ManageUserOverviewPage })));
const ManageUserDetailTabsPage = lazyWithRetry(() => import('../pages/ManageUserDetailTabsPage.js').then(m => ({ default: m.ManageUserDetailTabsPage })));
const AdminAppSettingsPage = lazyWithRetry(() => import('../pages/AdminAppSettingsPage.js').then(m => ({ default: m.AdminAppSettingsPage })));
const AdminCategoriesPage = lazyWithRetry(() => import('../pages/AdminCategoriesPage.js').then(m => ({ default: m.AdminCategoriesPage })));
const AdminAuditPage = lazyWithRetry(() => import('../pages/AdminAuditPage.js').then(m => ({ default: m.AdminAuditPage })));
const AdminProfilePage = lazyWithRetry(() => import('../pages/AdminProfilePage.js').then(m => ({ default: m.AdminProfilePage })));
const AiAnalysisPage = lazyWithRetry(() => import('../pages/AiAnalysisPage.js').then(m => ({ default: m.AiAnalysisPage })));
const AboutPage = lazyWithRetry(() => import('../pages/AboutPage.js').then(m => ({ default: m.AboutPage })));
const ImportPage = lazyWithRetry(() => import('../pages/ImportPage.js').then(m => ({ default: m.ImportPage })));
const ExportPage = lazyWithRetry(() => import('../pages/ExportPage.js').then(m => ({ default: m.ExportPage })));

// Shared loading fallback — minimal, matches app background
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-background" aria-label="Loading page">
    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
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

          {/* Admin Routes - Protected with ADMIN role */}
          <Route element={<ProtectedRoute requireOnboarding={true} requiredRole="ADMIN" />}>
            {/* 15. Admin Dashboard & Users */}
            <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN_USERS} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />

            {/* 16. Manage User Overview */}
            <Route path={ROUTES.ADMIN_USER_OVERVIEW} element={<ManageUserOverviewPage />} />

            {/* 17. Manage User (3 Tabs) */}
            <Route path={ROUTES.ADMIN_USER_MANAGE} element={<ManageUserDetailTabsPage />} />

            {/* 18. Admin App Settings */}
            <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminAppSettingsPage />} />

            {/* Admin System Categories */}
            <Route path={ROUTES.ADMIN_CATEGORIES} element={<AdminCategoriesPage />} />

            {/* 19. Admin Activity Audit */}
            <Route path={ROUTES.ADMIN_AUDIT} element={<AdminAuditPage />} />

            {/* Admin Profile */}
            <Route path={ROUTES.ADMIN_PROFILE} element={<AdminProfilePage />} />
          </Route>

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
    </Suspense>
  );
};
