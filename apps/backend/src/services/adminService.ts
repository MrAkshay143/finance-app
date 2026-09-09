import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logAuditEvent, auditService, FormattedAuditLog } from './auditService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  adminsCount: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  role: UserRole;
  status: UserStatus;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AdminUserDetails {
  user: AdminUserListItem;
  financeProfile?: any;
  userSettings?: any;
  securityQuestionsCount: number;
  accountsSummary: {
    count: number;
    totalBalancePaise: number;
  };
  recentAuditLogs: FormattedAuditLog[];
}

export interface AppSettingsData {
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  requireKbaForSensitiveActions: boolean;
  [key: string]: any;
}

export class AdminService {
  /**
   * Retrieves high-level dashboard metrics for administrators:
   * Total Users, Active Users, Suspended Users, Admins count.
   */
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const [totalUsers, activeUsers, suspendedUsers, adminUsers] = await Promise.all([
      prisma.user.count({ where: { status: { not: 'DELETED' } } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { role: 'ADMIN', status: { not: 'DELETED' } } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      adminsCount: adminUsers,
    };
  }

  /**
   * Returns a paginated list of users with search and filter capabilities.
   */
  async listUsers(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: string;
  } = {}): Promise<{
    users: AdminUserListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (options.status) {
      where.status = options.status as UserStatus;
    }

    if (options.role) {
      where.role = options.role as UserRole;
    }

    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const users: AdminUserListItem[] = rawUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      firstName: u.firstName,
      lastName: u.lastName,
      mobileNumber: u.mobileNumber,
      role: u.role,
      status: u.status,
      failedLoginAttempts: u.failedLoginAttempts,
      lockedUntil: u.lockedUntil ? new Date(u.lockedUntil).toISOString() : null,
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
      onboardingCompleted: u.onboardingCompleted,
      createdAt: new Date(u.createdAt).toISOString(),
    }));

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves detailed user card, profile, accounts summary, and activity.
   */
  async getUserDetails(targetUserId: string): Promise<AdminUserDetails> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        financeProfile: true,
        userSettings: true,
        securityQuestions: { select: { id: true } },
        accounts: {
          select: { id: true, currentBalance: true, status: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(`User not found: ${targetUserId}`);
    }

    const allAccounts = user.accounts || [];
    const activeAccounts = allAccounts.filter((a) => a.status === 'ACTIVE');
    const totalBalancePaise = activeAccounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance || 0),
      0
    );

    // Fetch recent audit logs targeting or enacted by this user
    const auditLogsRes = await auditService.listUserAuditLogs(targetUserId, {
      page: 1,
      pageSize: 10,
    });

    const userItem: AdminUserListItem = {
      id: user.id,
      email: user.email,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil ? new Date(user.lockedUntil).toISOString() : null,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: new Date(user.createdAt).toISOString(),
    };

    return {
      user: userItem,
      financeProfile: user.financeProfile || null,
      userSettings: user.userSettings || null,
      securityQuestionsCount: (user.securityQuestions || []).length,
      accountsSummary: {
        count: allAccounts.length,
        totalBalancePaise,
      },
      recentAuditLogs: auditLogsRes.logs,
    };
  }

  /**
   * Updates user role, status (ACTIVE <-> SUSPENDED), or basic info.
   * Writes AuditLog ('ADMIN_USER_UPDATE').
   */
  async updateUser(
    adminId: string,
    targetUserId: string,
    data: {
      role?: UserRole;
      status?: UserStatus;
      firstName?: string;
      lastName?: string;
      unlockAccount?: boolean;
    },
    ipAddress?: string
  ): Promise<AdminUserListItem> {
    const existing = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!existing) {
      throw new NotFoundError(`User not found: ${targetUserId}`);
    }

    const updateData: any = {};
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.unlockAccount) {
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    // If account was suspended or deleted, revoke all active sessions immediately
    if (data.status === 'SUSPENDED' || data.status === 'DELETED') {
      await prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_USER_UPDATE',
      targetUserId,
      details: data,
      ipAddress,
    });

    return {
      id: updated.id,
      email: updated.email,
      fullName: `${updated.firstName || ''} ${updated.lastName || ''}`.trim(),
      firstName: updated.firstName,
      lastName: updated.lastName,
      mobileNumber: updated.mobileNumber,
      role: updated.role,
      status: updated.status,
      failedLoginAttempts: updated.failedLoginAttempts,
      lockedUntil: updated.lockedUntil ? new Date(updated.lockedUntil).toISOString() : null,
      lastLoginAt: updated.lastLoginAt ? new Date(updated.lastLoginAt).toISOString() : null,
      onboardingCompleted: updated.onboardingCompleted,
      createdAt: new Date(updated.createdAt).toISOString(),
    };
  }

  /**
   * Resets user password by generating a temporary password and revoking all sessions.
   * Writes AuditLog ('ADMIN_RESET_PASSWORD').
   */
  async resetUserPassword(
    adminId: string,
    targetUserId: string,
    ipAddress?: string
  ): Promise<{ success: boolean; temporaryPassword: string; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError(`User not found: ${targetUserId}`);
    }

    const temporaryPassword = `Temp#${crypto.randomBytes(4).toString('hex')}9A`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Revoke all active sessions
      await tx.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_RESET_PASSWORD',
      targetUserId,
      details: {
        operation: 'admin_reset_password',
      },
      ipAddress,
    });

    return {
      success: true,
      temporaryPassword,
      message: 'Temporary password generated successfully. All active sessions have been revoked.',
    };
  }

  /**
   * Resets user's Security Questions (KBA).
   * Writes AuditLog ('ADMIN_RESET_KBA').
   */
  async resetUserKba(
    adminId: string,
    targetUserId: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError(`User not found: ${targetUserId}`);
    }

    await prisma.securityQuestion.deleteMany({
      where: { userId: targetUserId },
    });

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_RESET_KBA',
      targetUserId,
      details: {
        operation: 'admin_reset_kba',
      },
      ipAddress,
    });

    return {
      success: true,
      message: 'Security questions have been cleared. User will be prompted to reconfigure them upon next sensitive action.',
    };
  }

  /**
   * Soft deletes a user (status = 'DELETED') and revokes sessions.
   * Writes AuditLog ('ADMIN_DELETE_USER').
   */
  async deleteUser(
    adminId: string,
    targetUserId: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError(`User not found: ${targetUserId}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: 'DELETED',
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_DELETE_USER',
      targetUserId,
      details: {
        operation: 'admin_delete_user',
      },
      ipAddress,
    });

    return {
      success: true,
      message: 'User has been deactivated and deleted from active system directories.',
    };
  }

  /**
   * Reads AppSetting rows from the database and returns structured application settings.
   */
  async getAppSettings(): Promise<AppSettingsData> {
    const rows = await prisma.appSetting.findMany();
    const settingsMap = new Map<string, any>();
    for (const row of rows) {
      settingsMap.set(row.key, row.value);
    }

    const sessionTimeout = Number(settingsMap.get('session_timeout_minutes') ?? 60);
    const maxFailed = Number(settingsMap.get('max_failed_attempts') ?? 5);
    const lockoutDuration = Number(settingsMap.get('lockout_duration_minutes') ?? 15);
    const requireKba = Boolean(settingsMap.get('require_kba_for_sensitive_actions') ?? true);

    return {
      sessionTimeoutMinutes: sessionTimeout,
      maxFailedLoginAttempts: maxFailed,
      maxFailedAttempts: maxFailed,
      lockoutDurationMinutes: lockoutDuration,
      requireKbaForSensitiveActions: requireKba,
      ...Object.fromEntries(settingsMap.entries()),
    };
  }

  /**
   * Updates AppSetting entries and writes AuditLog ('ADMIN_APP_SETTINGS_UPDATE').
   */
  async updateAppSettings(
    adminId: string,
    data: Record<string, any>,
    ipAddress?: string
  ): Promise<AppSettingsData> {
    const keyMap: Record<string, string> = {
      sessionTimeoutMinutes: 'session_timeout_minutes',
      maxFailedLoginAttempts: 'max_failed_attempts',
      maxFailedAttempts: 'max_failed_attempts',
      lockoutDurationMinutes: 'lockout_duration_minutes',
      requireKbaForSensitiveActions: 'require_kba_for_sensitive_actions',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbKey = keyMap[key] || key;
      await prisma.appSetting.upsert({
        where: { key: dbKey },
        create: {
          key: dbKey,
          value: value as any,
          updatedBy: adminId,
        },
        update: {
          value: value as any,
          updatedBy: adminId,
        },
      });
    }

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_APP_SETTINGS_UPDATE',
      details: data,
      ipAddress,
    });

    return this.getAppSettings();
  }

  /**
   * System-wide audit logs query.
   */
  async listSystemAuditLogs(options: any = {}) {
    return auditService.listSystemAuditLogs(options);
  }

  /**
   * Aggregates platform analytics, onboarding funnels, and user growth.
   */
  async getPlatformAnalytics(timeframe = '30d') {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      onboardedUsers,
      usersWithKba,
      usersWithAccounts,
      totalTxnsCount,
      allTxns,
      allAccounts,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { status: { not: 'DELETED' } } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { role: 'ADMIN', status: { not: 'DELETED' } } }),
      prisma.user.count({ where: { onboardingCompleted: true, status: { not: 'DELETED' } } }),
      prisma.user.count({
        where: {
          status: { not: 'DELETED' },
          securityQuestions: { some: {} },
        },
      }),
      prisma.user.count({
        where: {
          status: { not: 'DELETED' },
          accounts: { some: { status: 'ACTIVE' } },
        },
      }),
      prisma.transaction.count({ where: { status: 'ACTIVE' } }),
      prisma.transaction.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
      }),
      prisma.account.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { currentBalance: true },
      }),
      prisma.user.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'DELETED' },
        },
        select: { createdAt: true },
      }),
    ]);

    // Build 30-day daily growth buckets
    const growthMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      growthMap[key] = 0;
    }

    recentUsers.forEach((u) => {
      const key = u.createdAt.toISOString().split('T')[0];
      if (growthMap[key] !== undefined) {
        growthMap[key]++;
      }
    });

    const growth = Object.entries(growthMap).map(([date, signups]) => ({
      date,
      signups,
    }));

    const grossTransactionVolumePaise = Number(allTxns._sum.amount || 0);
    const totalSystemBalancePaise = Number(allAccounts._sum.currentBalance || 0);
    const avgTransactionsPerUser =
      totalUsers > 0 ? Math.round((totalTxnsCount / totalUsers) * 10) / 10 : 0;

    return {
      timeframe,
      summary: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        adminUsers,
        onboardedUsers,
        kbaConfiguredUsers: usersWithKba,
        fundedUsers: usersWithAccounts,
        totalTransactionsCount: totalTxnsCount,
        grossTransactionVolumePaise,
        totalSystemBalancePaise,
        avgTransactionsPerUser,
      },
      funnel: {
        totalRegistered: totalUsers,
        onboardedCount: onboardedUsers,
        onboardedPercentage: totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0,
        kbaConfiguredCount: usersWithKba,
        kbaPercentage: totalUsers > 0 ? Math.round((usersWithKba / totalUsers) * 100) : 0,
        accountsLinkedCount: usersWithAccounts,
        accountsLinkedPercentage:
          totalUsers > 0 ? Math.round((usersWithAccounts / totalUsers) * 100) : 0,
      },
      growth,
    };
  }

  /**
   * Generates institutional CSV data for all non-deleted platform users.
   */
  async exportUsersCsv(): Promise<string> {
    const users = await prisma.user.findMany({
      where: { status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      include: {
        accounts: {
          where: { status: 'ACTIVE' },
          select: { currentBalance: true },
        },
        securityQuestions: {
          select: { id: true },
        },
      },
    });

    const headers = [
      'User ID',
      'Full Name',
      'Email',
      'Mobile Number',
      'Role',
      'Status',
      'Onboarding Completed',
      'KBA Configured',
      'Failed Logins',
      'Created At',
      'Last Login At',
      'Active Accounts Count',
      'Total Balance (INR)',
    ];

    const escapeCsv = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = users.map((u) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Not Set';
      const totalBalanceINR = (
        u.accounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0) / 100
      ).toFixed(2);

      return [
        escapeCsv(u.id),
        escapeCsv(fullName),
        escapeCsv(u.email),
        escapeCsv(u.mobileNumber || 'Not Set'),
        escapeCsv(u.role),
        escapeCsv(u.status),
        escapeCsv(u.onboardingCompleted ? 'Yes' : 'No'),
        escapeCsv(u.securityQuestions.length >= 3 ? 'Yes' : 'No'),
        escapeCsv(u.failedLoginAttempts),
        escapeCsv(u.createdAt.toISOString()),
        escapeCsv(u.lastLoginAt ? u.lastLoginAt.toISOString() : 'Never'),
        escapeCsv(u.accounts.length),
        escapeCsv(totalBalanceINR),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Evaluates live system health, latency, uptime, and row counts.
   */
  async getSystemHealth() {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);

    const mem = process.memoryUsage();
    const [userCount, accountCount, txnCount, auditCount] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.transaction.count(),
      prisma.auditLog.count(),
    ]);

    return {
      status: 'HEALTHY' as const,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs,
      },
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotalMB: Math.round(mem.heapTotal / (1024 * 1024)),
        rssMB: Math.round(mem.rss / (1024 * 1024)),
      },
      tableCounts: {
        users: userCount,
        accounts: accountCount,
        transactions: txnCount,
        auditLogs: auditCount,
      },
    };
  }

  /**
   * Retrieves active sessions for a given user.
   */
  async getUserSessions(userId: string) {
    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      userAgent: s.userAgent || 'Not Set',
      ipAddress: s.ipAddress || 'Not Set',
      familyId: s.familyId,
    }));
  }

  /**
   * Revokes all active refresh tokens for a user.
   */
  async revokeAllUserSessions(userId: string, adminId: string, ipAddress?: string) {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorUserId: adminId,
      targetUserId: userId,
      action: 'ADMIN_REVOKE_USER_SESSIONS',
      details: { revokedSessionsCount: result.count },
      ipAddress,
    });

    return { revokedCount: result.count };
  }
}

export const adminService = new AdminService();
export default adminService;
