import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { logAuditEvent } from './auditService.js';
import { emitDashboardRefresh } from '../sockets/socketGateway.js';
import { NotFoundError, UnauthorizedError } from '../utils/errors.js';

export class AccountActionsService {
  /**
   * Danger Zone: Reset Profile
   * Requires current password confirmation before wiping data (SEC-09).
   * Atomically deletes transactions, transfers, accounts, budgets, goals,
   * recurring transactions, reminders, notifications, and financeProfile records.
   * Preserves User account and SecurityQuestions.
   * Emits dashboard refresh and logs unalterable AuditLog ('ACCOUNT_RESET_PROFILE').
   */
  async resetProfile(userId: string, currentPassword: string, ipAddress?: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`);
    }

    // SEC-09: Require explicit password confirmation before irreversible data wipe
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw new UnauthorizedError('Password confirmation is required to reset profile data');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Incorrect password. Profile reset was not performed.');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete transfers first due to foreign key references to transactions
      await tx.transfer.deleteMany({
        where: { userId },
      });

      // 2. Delete transactions
      await tx.transaction.deleteMany({
        where: { userId },
      });

      // 3. Delete recurring transactions
      await tx.recurringTransaction.deleteMany({
        where: { userId },
      });

      // 4. Delete budgets
      await tx.budget.deleteMany({
        where: { userId },
      });

      // 5. Delete goals
      await tx.goal.deleteMany({
        where: { userId },
      });

      // 6. Delete reminders
      await tx.reminder.deleteMany({
        where: { userId },
      });

      // 7. Delete notifications
      await tx.notification.deleteMany({
        where: { userId },
      });

      // 8. Delete user-created merchants
      await tx.merchant.deleteMany({
        where: { userId },
      });

      // 9. Delete custom (non-system) categories
      await tx.category.deleteMany({
        where: { userId, isSystem: false },
      });

      // 10. Delete accounts
      await tx.account.deleteMany({
        where: { userId },
      });

      // 11. Delete financeProfile
      await tx.financeProfile.deleteMany({
        where: { userId },
      });
    });

    // Notify connected clients that data has been reset
    try {
      emitDashboardRefresh(userId, { reset: true, timestamp: new Date().toISOString() });
    } catch {
      // Sockets may not be available in all runtime environments
    }

    // Create unalterable AuditLog record
    await logAuditEvent({
      actorUserId: userId,
      action: 'ACCOUNT_RESET_PROFILE',
      targetUserId: userId,
      details: {
        operation: 'reset_profile',
        preserved: ['user', 'security_questions', 'user_settings'],
      },
      ipAddress,
    });

    return {
      success: true,
      message: 'Profile data has been completely reset. User account and security settings were preserved.',
    };
  }

  /**
   * Danger Zone: Delete Account
   * Verifies user password with bcrypt.
   * Marks User as DELETED (status = 'DELETED').
   * Revokes all active refresh tokens.
   * Creates unalterable AuditLog record ('ACCOUNT_DELETED').
   */
  async deleteAccount(
    userId: string,
    password: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`);
    }

    if (user.status === 'DELETED') {
      throw new UnauthorizedError('Account has already been deleted');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid password. Account deletion requires valid password verification.');
    }

    // Mark user as DELETED and revoke all sessions
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: 'DELETED',
          updatedAt: new Date(),
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    // Unalterable audit log record
    await logAuditEvent({
      actorUserId: userId,
      action: 'ACCOUNT_DELETED',
      targetUserId: userId,
      details: {
        operation: 'delete_account',
        status: 'DELETED',
      },
      ipAddress,
    });

    return {
      success: true,
      message: 'Account successfully deleted. All sessions have been revoked.',
    };
  }
}

export const accountActionsService = new AccountActionsService();
export default accountActionsService;
