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
   * Uses DB-level skip/take pagination — no in-memory slicing (SEC-16).
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
            { action: { contains: q } },
            { ipAddress: { contains: q } },
          ],
        },
      ];
    }

    // Category filter maps to action prefix in the DB
    if (options.category && options.category.trim()) {
      const cat = options.category.trim().toLowerCase();
      const actionPrefixMap: Record<string, string[]> = {
        login: ['AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_SIGNUP', 'AUTH_REFRESH'],
        transactions: ['TXN_', 'TRANSFER_', 'DATA_IMPORT', 'DATA_EXPORT', 'TRANSACTION'],
        profile: ['PROFILE', 'ACCOUNT_RESET', 'ACCOUNT_DELETED', 'FINANCE_PROFILE'],
        settings: ['SETTINGS'],
        security: ['SECURITY', 'PASSWORD', 'KBA', 'LOCK'],
        admin: ['ADMIN_'],
      };
      const prefixes = actionPrefixMap[cat] || [];
      if (prefixes.length > 0) {
        where.AND = [
          ...(where.AND || []),
          { OR: prefixes.map(p => ({ action: { startsWith: p } })) },
        ];
      }
    }

    const [allLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
          target: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    const logs = allLogs.map((log) => {
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

    return { logs, pagination: { page, pageSize, total, totalPages } };
  }

  /**
   * System-wide audit log query for administrators.
   * Uses DB-level skip/take pagination — no in-memory slicing (SEC-16).
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
      where.action = { contains: options.action };
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
        { action: { contains: q } },
        { ipAddress: { contains: q } },
        { actor: { email: { contains: q } } },
        { target: { email: { contains: q } } },
      ];
    }

    // Category filter maps to action prefix in the DB
    if (options.category && options.category.trim()) {
      const cat = options.category.trim().toLowerCase();
      const actionPrefixMap: Record<string, string[]> = {
        login: ['AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_SIGNUP', 'AUTH_REFRESH'],
        transactions: ['TXN_', 'TRANSFER_', 'DATA_IMPORT', 'DATA_EXPORT', 'TRANSACTION'],
        profile: ['PROFILE', 'ACCOUNT_RESET', 'ACCOUNT_DELETED', 'FINANCE_PROFILE'],
        settings: ['SETTINGS'],
        security: ['SECURITY', 'PASSWORD', 'KBA', 'LOCK'],
        admin: ['ADMIN_'],
      };
      const prefixes = actionPrefixMap[cat] || [];
      if (prefixes.length > 0) {
        where.AND = [
          ...(where.AND || []),
          { OR: prefixes.map((p: string) => ({ action: { startsWith: p } })) },
        ];
      }
    }

    const [allLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
          target: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    const logs = allLogs.map((log) => {
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

    return { logs, pagination: { page, pageSize, total, totalPages } };
  }
}

export const auditService = new AuditService();
export default auditService;
