import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export interface AuditLogParams {
  actorUserId?: string | null;
  action: string;
  targetUserId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

export function deriveAuditCategory(action: string): string {
  const upper = action.toUpperCase();
  if (
    upper.startsWith('AUTH_LOGIN') ||
    upper.startsWith('AUTH_LOGOUT') ||
    upper.startsWith('AUTH_SIGNUP') ||
    upper.startsWith('AUTH_REFRESH') ||
    upper.includes('LOGIN')
  ) {
    return 'Login';
  }
  if (
    upper.startsWith('TXN_') ||
    upper.startsWith('TRANSFER_') ||
    upper.startsWith('DATA_IMPORT') ||
    upper.startsWith('DATA_EXPORT') ||
    upper.includes('TRANSACTION')
  ) {
    return 'Transactions';
  }
  if (
    upper.includes('PROFILE') ||
    upper.includes('ACCOUNT_RESET') ||
    upper.includes('ACCOUNT_DELETED') ||
    upper.includes('FINANCE_PROFILE')
  ) {
    return 'Profile';
  }
  if (upper.includes('SETTINGS')) {
    return 'Settings';
  }
  if (
    upper.includes('SECURITY') ||
    upper.includes('PASSWORD') ||
    upper.includes('KBA') ||
    upper.includes('LOCK')
  ) {
    return 'Security';
  }
  if (upper.startsWith('ADMIN_')) {
    return 'Admin';
  }
  return 'General';
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        targetUserId: params.targetUserId || null,
        details: params.details ? (params.details as any) : undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err: any) {
    logger.warn({ err: err?.message, action: params.action }, 'Failed to persist audit log entry');
  }
}

export interface ListUserAuditLogsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}

export interface ListSystemAuditLogsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface FormattedAuditLog {
  id: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: string;
  category: string;
  actorEmail?: string | null;
  actorName?: string | null;
  targetEmail?: string | null;
  targetName?: string | null;
  ipAddress?: string | null;
  details?: Record<string, any> | null;
  createdAt: string;
}

export class AuditService {
  async logAuditEvent(params: AuditLogParams): Promise<void> {
    return logAuditEvent(params);
  }

  /**
   * Lists user-scoped audit logs filtered by actorUserId or targetUserId.
   * Supports search, category filtering (Login, Transactions, Profile, Settings, Security),
   * and pagination.
   */
  async listUserAuditLogs(
    userId: string,
    options: ListUserAuditLogsOptions = {}
  ): Promise<{
    logs: FormattedAuditLog[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {
      OR: [{ actorUserId: userId }, { targetUserId: userId }],
    };

    if (options.search) {
      const q = options.search.trim();
      where.AND = [
        {
          OR: [
            { action: { contains: q, mode: 'insensitive' } },
            { ipAddress: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const allLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, firstName: true, lastName: true } },
        target: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Map each log with its derived category
    let mapped = allLogs.map((log) => {
      const category = deriveAuditCategory(log.action);
      const actorName = log.actor
        ? `${log.actor.firstName || ''} ${log.actor.lastName || ''}`.trim()
        : null;
      const targetName = log.target
        ? `${log.target.firstName || ''} ${log.target.lastName || ''}`.trim()
        : null;

      return {
        id: log.id,
        actorUserId: log.actorUserId,
        targetUserId: log.targetUserId,
        action: log.action,
        category,
        actorEmail: log.actor?.email || null,
        actorName,
        targetEmail: log.target?.email || null,
        targetName,
        ipAddress: log.ipAddress || null,
        details: (log.details as any) || null,
        createdAt: new Date(log.createdAt).toISOString(),
      };
    });

    // Filter by category if requested
    if (options.category && options.category.trim()) {
      const requestedCategory = options.category.trim().toLowerCase();
      mapped = mapped.filter(
        (log) =>
          log.category.toLowerCase() === requestedCategory ||
          log.action.toLowerCase().includes(requestedCategory)
      );
    }

    const total = mapped.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginatedLogs = mapped.slice(skip, skip + pageSize);

    return {
      logs: paginatedLogs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * System-wide audit log query for administrators.
   */
  async listSystemAuditLogs(options: ListSystemAuditLogsOptions = {}): Promise<{
    logs: FormattedAuditLog[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (options.action) {
      where.action = { contains: options.action, mode: 'insensitive' };
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.createdAt.lte = new Date(options.endDate);
      }
    }

    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
        { actor: { email: { contains: q, mode: 'insensitive' } } },
        { target: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const allLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, firstName: true, lastName: true } },
        target: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    let mapped = allLogs.map((log) => {
      const category = deriveAuditCategory(log.action);
      const actorName = log.actor
        ? `${log.actor.firstName || ''} ${log.actor.lastName || ''}`.trim()
        : null;
      const targetName = log.target
        ? `${log.target.firstName || ''} ${log.target.lastName || ''}`.trim()
        : null;

      return {
        id: log.id,
        actorUserId: log.actorUserId,
        targetUserId: log.targetUserId,
        action: log.action,
        category,
        actorEmail: log.actor?.email || null,
        actorName,
        targetEmail: log.target?.email || null,
        targetName,
        ipAddress: log.ipAddress || null,
        details: (log.details as any) || null,
        createdAt: new Date(log.createdAt).toISOString(),
      };
    });

    if (options.category && options.category.trim()) {
      const requestedCategory = options.category.trim().toLowerCase();
      mapped = mapped.filter(
        (log) =>
          log.category.toLowerCase() === requestedCategory ||
          log.action.toLowerCase().includes(requestedCategory)
      );
    }

    const total = mapped.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginatedLogs = mapped.slice(skip, skip + pageSize);

    return {
      logs: paginatedLogs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }
}

export const auditService = new AuditService();
export default auditService;
