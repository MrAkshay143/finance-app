import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  formatAuditAction,
  formatAuditActionLabel,
  getAuditCategoryBadge,
} from '../src/utils/auditFormatters.js';
import { Pagination } from '../src/components/ui/Pagination.js';

describe('Audit Log Professional Labels & Centralized Pagination Test Suite', () => {
  describe('1. formatAuditAction mappings', () => {
    const testCases: Array<{ action: string; expectedTitle: string; expectedBadgeColor: string }> = [
      { action: 'AUTH_LOGIN', expectedTitle: 'User Sign In', expectedBadgeColor: 'emerald' },
      { action: 'AUTH_LOGOUT', expectedTitle: 'User Sign Out', expectedBadgeColor: 'slate' },
      { action: 'AUTH_SIGNUP', expectedTitle: 'Account Registered', expectedBadgeColor: 'blue' },
      { action: 'AUTH_TOKEN_ROTATED', expectedTitle: 'Session Renewed', expectedBadgeColor: 'teal' },
      { action: 'AUTH_TOKEN_THEFT_DETECTED', expectedTitle: 'Security Alert', expectedBadgeColor: 'rose' },
      { action: 'AUTH_ACCOUNT_LOCKED', expectedTitle: 'Account Temporarily Locked', expectedBadgeColor: 'rose' },
      { action: 'AUTH_PASSWORD_CHANGE', expectedTitle: 'Password Changed', expectedBadgeColor: 'amber' },
      { action: 'AUTH_SESSIONS_REVOKED_OTHERS', expectedTitle: 'Other Sessions Revoked', expectedBadgeColor: 'amber' },
      { action: 'AUTH_FORGOT_PASSWORD_VERIFIED', expectedTitle: 'Recovery Questions Verified', expectedBadgeColor: 'blue' },
      { action: 'AUTH_PASSWORD_RESET_SUCCESS', expectedTitle: 'Password Reset Completed', expectedBadgeColor: 'emerald' },
      { action: 'SECURITY_QUESTIONS_CONFIGURED', expectedTitle: 'Security Questions Set Up', expectedBadgeColor: 'blue' },
      { action: 'SECURITY_QUESTIONS_VERIFIED', expectedTitle: 'Security Questions Verified', expectedBadgeColor: 'emerald' },
      { action: 'SECURITY_QUESTIONS_VERIFY_FAILED', expectedTitle: 'Verification Attempt Failed', expectedBadgeColor: 'rose' },
      { action: 'SECURITY_QUESTIONS_LOCKED', expectedTitle: 'Questions Temporarily Locked', expectedBadgeColor: 'rose' },
      { action: 'PROFILE_AVATAR_UPDATE', expectedTitle: 'Profile Photo Updated', expectedBadgeColor: 'blue' },
      { action: 'PROFILE_AVATAR_DELETE', expectedTitle: 'Profile Photo Removed', expectedBadgeColor: 'slate' },
      { action: 'PROFILE_FINANCE_UPDATE', expectedTitle: 'Finance Profile Updated', expectedBadgeColor: 'blue' },
      { action: 'USER_SETTINGS_UPDATE', expectedTitle: 'Preferences Updated', expectedBadgeColor: 'slate' },
      { action: 'ACCOUNT_CREATE', expectedTitle: 'Financial Account Added', expectedBadgeColor: 'emerald' },
      { action: 'ACCOUNT_UPDATE', expectedTitle: 'Account Details Updated', expectedBadgeColor: 'blue' },
      { action: 'ACCOUNT_STATUS_CHANGE', expectedTitle: 'Account Status Changed', expectedBadgeColor: 'amber' },
      { action: 'ACCOUNT_RESET_PROFILE', expectedTitle: 'Financial Profile Reset', expectedBadgeColor: 'rose' },
      { action: 'ACCOUNT_DELETED', expectedTitle: 'Account Closed', expectedBadgeColor: 'rose' },
      { action: 'TRANSACTION_CREATE', expectedTitle: 'Transaction Recorded', expectedBadgeColor: 'blue' },
      { action: 'TRANSACTION_UPDATE', expectedTitle: 'Transaction Updated', expectedBadgeColor: 'blue' },
      { action: 'TRANSACTION_DELETE', expectedTitle: 'Transaction Removed', expectedBadgeColor: 'rose' },
      { action: 'TRANSFER_CREATE', expectedTitle: 'Transfer Completed', expectedBadgeColor: 'blue' },
      { action: 'TRANSFER_DELETE', expectedTitle: 'Transfer Removed', expectedBadgeColor: 'rose' },
      { action: 'CATEGORY_CREATE', expectedTitle: 'Category Created', expectedBadgeColor: 'blue' },
      { action: 'CATEGORY_UPDATE', expectedTitle: 'Category Updated', expectedBadgeColor: 'blue' },
      { action: 'CATEGORY_DELETE', expectedTitle: 'Category Removed', expectedBadgeColor: 'rose' },
      { action: 'CATEGORY_REORDER', expectedTitle: 'Categories Reordered', expectedBadgeColor: 'slate' },
      { action: 'MERCHANT_CREATE', expectedTitle: 'Merchant Added', expectedBadgeColor: 'blue' },
      { action: 'MERCHANT_UPDATE', expectedTitle: 'Merchant Updated', expectedBadgeColor: 'blue' },
      { action: 'MERCHANT_DELETE', expectedTitle: 'Merchant Removed', expectedBadgeColor: 'rose' },
      { action: 'BUDGET_CREATE', expectedTitle: 'Budget Established', expectedBadgeColor: 'emerald' },
      { action: 'BUDGET_UPDATE', expectedTitle: 'Budget Modified', expectedBadgeColor: 'blue' },
      { action: 'BUDGET_DELETE', expectedTitle: 'Budget Removed', expectedBadgeColor: 'rose' },
      { action: 'GOAL_CREATE', expectedTitle: 'Savings Goal Created', expectedBadgeColor: 'emerald' },
      { action: 'GOAL_UPDATE', expectedTitle: 'Savings Goal Updated', expectedBadgeColor: 'blue' },
      { action: 'GOAL_DELETE', expectedTitle: 'Savings Goal Removed', expectedBadgeColor: 'rose' },
      { action: 'RECURRING_TRANSACTION_CREATE', expectedTitle: 'Recurring Schedule Added', expectedBadgeColor: 'blue' },
      { action: 'RECURRING_TRANSACTION_MATERIALIZE', expectedTitle: 'Scheduled Transaction Posted', expectedBadgeColor: 'emerald' },
      { action: 'ADMIN_USER_UPDATE', expectedTitle: 'User Details Updated', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_RESET_PASSWORD', expectedTitle: 'Password Reset', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_RESET_KBA', expectedTitle: 'Security Questions Reset', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_DELETE_USER', expectedTitle: 'Account Deleted', expectedBadgeColor: 'rose' },
      { action: 'ADMIN_REVOKE_USER_SESSIONS', expectedTitle: 'Sessions Terminated', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_APP_SETTINGS_UPDATE', expectedTitle: 'System Settings Updated', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_CATEGORY_CREATE', expectedTitle: 'Default Category Created', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_CATEGORY_UPDATE', expectedTitle: 'Default Category Updated', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_CATEGORY_DELETE', expectedTitle: 'Default Category Removed', expectedBadgeColor: 'rose' },
      { action: 'ADMIN_CACHE_CLEAR', expectedTitle: 'Cache Cleared', expectedBadgeColor: 'slate' },
      { action: 'ADMIN_RUN_RECURRING', expectedTitle: 'Scheduled Tasks Run', expectedBadgeColor: 'purple' },
      { action: 'ADMIN_AUDIT_LOG_PURGE', expectedTitle: 'Audit Logs Cleared', expectedBadgeColor: 'rose' },
      { action: 'DATA_EXPORT', expectedTitle: 'Data Archive Exported', expectedBadgeColor: 'teal' },
      { action: 'DATA_IMPORT_CSV', expectedTitle: 'Bank Statement Imported', expectedBadgeColor: 'teal' },
    ];

    testCases.forEach(({ action, expectedTitle, expectedBadgeColor }) => {
      it(`correctly maps action "${action}" to "${expectedTitle}" (${expectedBadgeColor})`, () => {
        const res = formatAuditAction(action);
        expect(res.title).toBe(expectedTitle);
        expect(res.badgeColor).toBe(expectedBadgeColor);
        expect(formatAuditActionLabel(action)).toBe(expectedTitle);
      });
    });

    it('falls back to Title Case conversion for unknown action strings', () => {
      const res = formatAuditAction('CUSTOM_NOTIFICATION_DISPATCH');
      expect(res.title).toBe('Custom Notification Dispatch');
      expect(res.badgeColor).toBe('slate');
      expect(res.category).toBe('General');
    });

    it('returns valid badge classes for audit categories', () => {
      expect(getAuditCategoryBadge('Login').label).toBe('Security');
      expect(getAuditCategoryBadge('Security').className).toContain('text-blue-700');
      expect(getAuditCategoryBadge('Admin').className).toContain('text-purple-700');
      expect(getAuditCategoryBadge('Settings').className).toContain('text-amber-700');
      expect(getAuditCategoryBadge('Finance').className).toContain('text-emerald-700');
    });
  });

  describe('2. Pagination component behavior', () => {
    it('returns null (auto-hides) when totalPages is 0 or 1', () => {
      const htmlZero = renderToString(
        <Pagination currentPage={1} totalPages={0} onPageChange={() => {}} />
      );
      expect(htmlZero).toBe('');

      const htmlOne = renderToString(
        <Pagination currentPage={1} totalPages={1} totalItems={10} pageSize={15} onPageChange={() => {}} />
      );
      expect(htmlOne).toBe('');
    });

    it('returns null when totalItems is 0', () => {
      const html = renderToString(
        <Pagination currentPage={1} totalPages={1} totalItems={0} pageSize={15} onPageChange={() => {}} />
      );
      expect(html).toBe('');
    });

    it('renders pagination controls when totalPages > 1', () => {
      const html = renderToString(
        <Pagination
          currentPage={2}
          totalPages={5}
          totalItems={75}
          pageSize={15}
          onPageChange={() => {}}
          itemLabel="transactions"
        />
      );

      expect(html).toContain('Showing');
      expect(html).toContain('16–30');
      expect(html).toContain('75');
      expect(html).toContain('transactions');
      expect(html).toContain('Prev');
      expect(html).toContain('Next');
      expect(html).toContain('2 / 5');
    });
  });
});
