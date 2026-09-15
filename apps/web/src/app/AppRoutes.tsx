import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.js';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.js';
import { lazyWithRetry } from '../utils/lazyWithRetry.js';
import { ROUTES } from './routes.js';

// Lazily imported page components with chunk retry and auto-refresh.

const LoginPage = lazyWithRetry(() => import('../pages/auth/LoginPage.js').then(m => ({ default: m.LoginPage })));
const SignupPage = lazyWithRetry(() => import('../pages/auth/SignupPage.js').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazyWithRetry(() => import('../pages/auth/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const OnboardingWizard = lazyWithRetry(() => import('../pages/onboarding/OnboardingWizard.js').then(m => ({ default: m.OnboardingWizard })));

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

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-background" aria-label="Loading page">
    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
        <Route
          path={ROUTES.ONBOARDING}
          element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingWizard />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute requireOnboarding={true}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.HOME} element={<DashboardPage />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />
          <Route path={ROUTES.PLANNING} element={<PlanningPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.INVESTMENTS} element={<InvestmentsPage />} />
          <Route path={ROUTES.RECURRING} element={<RecurringTransactionsPage />} />
          <Route path={ROUTES.AUDIT} element={<AuditLogPage />} />
          <Route path={ROUTES.MORE} element={<MenuPage />} />
          <Route path={ROUTES.MENU} element={<MenuPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.SECURITY_QUESTIONS} element={<SecurityQuestionsPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.PROFILE_SETTINGS} element={<ProfileSettingsPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route element={<ProtectedRoute requireOnboarding={true} requiredRole="ADMIN" />}>
            <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN_USERS} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />
            <Route path={ROUTES.ADMIN_USER_OVERVIEW} element={<ManageUserOverviewPage />} />
            <Route path={ROUTES.ADMIN_USER_MANAGE} element={<ManageUserDetailTabsPage />} />
            <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminAppSettingsPage />} />
            <Route path={ROUTES.ADMIN_CATEGORIES} element={<AdminCategoriesPage />} />
            <Route path={ROUTES.ADMIN_AUDIT} element={<AdminAuditPage />} />
            <Route path={ROUTES.ADMIN_PROFILE} element={<AdminProfilePage />} />
          </Route>
          <Route path={ROUTES.AI_ANALYSIS} element={<AiAnalysisPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.IMPORT} element={<ImportPage />} />
          <Route path={ROUTES.EXPORT} element={<ExportPage />} />
          <Route path={ROUTES.MERCHANTS} element={<CategoriesPage />} />
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
