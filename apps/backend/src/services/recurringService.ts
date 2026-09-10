import { TxnType, RecurringStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { toPaise } from '../utils/currency.js';
import { balanceService } from './balanceService.js';
import { logAuditEvent } from './auditService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh, emitSyncEvent } from '../sockets/socketGateway.js';

export interface CreateRecurringData {
  accountId: string;
  categoryId?: string | null;
  type: TxnType;
  amount: number | bigint;
  description?: string | null;
  scheduleFreq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | string;
  scheduleInterval?: number;
  startDate?: string | Date;
  nextOccurrence?: string | Date;
}

export interface UpdateRecurringData {
  accountId?: string;
  categoryId?: string | null;
  type?: TxnType;
  amount?: number | bigint;
  description?: string | null;
  scheduleFreq?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | string;
  scheduleInterval?: number;
  nextOccurrence?: string | Date;
  status?: RecurringStatus;
}

export function formatRecurringTransaction(rec: any) {
  const amountPaise = typeof rec.amount === 'bigint' ? rec.amount : BigInt(rec.amount || 0);
  return {
    id: rec.id,
    userId: rec.userId,
    accountId: rec.accountId,
    categoryId: rec.categoryId,
    type: rec.type,
    amount: Number(amountPaise) / 100,
    amountPaise: Number(amountPaise),
    description: rec.description,
    scheduleFreq: rec.scheduleFreq,
    scheduleInterval: rec.scheduleInterval || 1,
    nextOccurrence: rec.nextOccurrence instanceof Date ? rec.nextOccurrence.toISOString() : rec.nextOccurrence,
    status: rec.status,
    createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : rec.createdAt,
    updatedAt: rec.updatedAt instanceof Date ? rec.updatedAt.toISOString() : rec.updatedAt,
    account: rec.account
      ? {
          id: rec.account.id,
          name: rec.account.name,
          accountType: rec.account.accountType,
        }
      : undefined,
    category: rec.category
      ? {
          id: rec.category.id,
          name: rec.category.name,
        }
      : null,
  };
}

/**
 * Calculates next occurrence date based on frequency and interval.
 */
export function calculateNextOccurrence(
  baseDate: Date,
  freq: string,
  interval = 1
): Date {
  const next = new Date(baseDate.getTime());
  const upperFreq = freq.toUpperCase();

  switch (upperFreq) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + interval * 7);
      break;
    case 'MONTHLY': {
      const currentDay = next.getDate();
      next.setMonth(next.getMonth() + interval);
      // If month rolled over beyond desired day (e.g. 31st to 28th/30th), clamp to last day
      if (next.getDate() !== currentDay) {
        next.setDate(0);
      }
      break;
    }
    case 'QUARTERLY': {
      const currentDay = next.getDate();
      next.setMonth(next.getMonth() + interval * 3);
      if (next.getDate() !== currentDay) {
        next.setDate(0);
      }
      break;
    }
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      next.setMonth(next.getMonth() + interval);
  }

  return next;
}

export class RecurringService {
  // Return all recurring transaction schedules for user
  async listRecurring(
    userId: string,
    filters?: { status?: RecurringStatus; type?: TxnType }
  ) {
    const where: any = { userId };
    if (filters?.status) {
      where.status = filters.status;
    } else {
      where.status = { not: 'DELETED' };
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    const items = await prisma.recurringTransaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { nextOccurrence: 'asc' },
    });

    return items.map(formatRecurringTransaction);
  }

  /**
   * Retrieves single recurring transaction with ownership check.
   */
  async getRecurring(userId: string, id: string) {
    const rec = await prisma.recurringTransaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
      },
    });

    if (!rec || rec.userId !== userId) {
      throw new NotFoundError('Recurring transaction not found');
    }

    return formatRecurringTransaction(rec);
  }

  /**
   * Creates a new recurring transaction schedule.
   */
  async createRecurring(userId: string, data: CreateRecurringData) {
    // 1. Verify account ownership
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }
    if (account.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this account');
    }

    // 2. Verify category if provided
    let categoryId = data.categoryId || null;
    if (categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!cat || (cat.userId && cat.userId !== userId)) {
        throw new NotFoundError('Category not found');
      }
    }

    // 3. Amount parsing
    const amountPaise = toPaise(data.amount);

    // 4. Initial nextOccurrence
    let nextOccurrence: Date;
    if (data.nextOccurrence) {
      nextOccurrence = new Date(data.nextOccurrence);
    } else if (data.startDate) {
      nextOccurrence = new Date(data.startDate);
    } else {
      nextOccurrence = calculateNextOccurrence(new Date(), data.scheduleFreq, data.scheduleInterval || 1);
    }

    const created = await prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId,
        type: data.type,
        amount: amountPaise,
        description: data.description ? data.description.trim() : null,
        scheduleFreq: data.scheduleFreq.toUpperCase(),
        scheduleInterval: data.scheduleInterval || 1,
        nextOccurrence,
        status: 'ACTIVE',
      },
      include: {
        account: true,
        category: true,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'RECURRING_TRANSACTION_CREATE',
      details: {
        recurringTransactionId: created.id,
        accountId: data.accountId,
        amountPaise: amountPaise.toString(),
        scheduleFreq: data.scheduleFreq,
      },
    });

    emitSyncEvent(userId, { entity: 'RECURRING', action: 'CREATE', entityId: created.id });
    return formatRecurringTransaction(created);
  }

  /**
   * Updates recurring transaction properties.
   */
  async updateRecurring(userId: string, id: string, data: UpdateRecurringData) {
    const existing = await prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Recurring transaction not found');
    }

    if (data.accountId && data.accountId !== existing.accountId) {
      const account = await prisma.account.findUnique({
        where: { id: data.accountId },
      });
      if (!account || account.userId !== userId) {
        throw new ForbiddenError('Access forbidden to this account');
      }
    }

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!cat || (cat.userId && cat.userId !== userId)) {
        throw new NotFoundError('Category not found');
      }
    }

    const amountPaise =
      data.amount !== undefined
        ? toPaise(data.amount)
        : existing.amount;

    const nextOccurrence =
      data.nextOccurrence !== undefined
        ? new Date(data.nextOccurrence)
        : existing.nextOccurrence;

    const updated = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        accountId: data.accountId || existing.accountId,
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        type: data.type || existing.type,
        amount: amountPaise,
        description: data.description !== undefined ? (data.description ? data.description.trim() : null) : existing.description,
        scheduleFreq: data.scheduleFreq ? data.scheduleFreq.toUpperCase() : existing.scheduleFreq,
        scheduleInterval: data.scheduleInterval !== undefined ? data.scheduleInterval : existing.scheduleInterval,
        nextOccurrence,
        status: data.status || existing.status,
      },
      include: {
        account: true,
        category: true,
      },
    });

    emitSyncEvent(userId, { entity: 'RECURRING', action: 'UPDATE', entityId: id });
    return formatRecurringTransaction(updated);
  }

  /**
   * Soft-deletes recurring transaction.
   */
  async deleteRecurring(userId: string, id: string) {
    const existing = await prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Recurring transaction not found');
    }

    await prisma.recurringTransaction.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    emitSyncEvent(userId, { entity: 'RECURRING', action: 'DELETE', entityId: id });
    return { message: 'Recurring transaction deleted' };
  }

  /**
   * Toggles recurring status between ACTIVE and PAUSED.
   */
  async toggleStatus(userId: string, id: string, status?: RecurringStatus) {
    const existing = await prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Recurring transaction not found');
    }

    const nextStatus: RecurringStatus =
      status || (existing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');

    const updated = await prisma.recurringTransaction.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        account: true,
        category: true,
      },
    });

    return formatRecurringTransaction(updated);
  }

  // Materialize due recurring schedules into active transactions
  async materializeDueTransactions(asOfDate: Date = new Date()) {
    const dueRecurring = await prisma.recurringTransaction.findMany({
      where: {
        status: 'ACTIVE',
        nextOccurrence: { lte: asOfDate },
      },
      include: {
        account: true,
        category: true,
      },
    });

    const materializedTransactions: any[] = [];
    const affectedUserIds = new Set<string>();

    for (const rec of dueRecurring) {
      const direction = rec.type === 'INCOME' ? 'CREDIT' : 'DEBIT';
      const nextDate = calculateNextOccurrence(
        new Date(rec.nextOccurrence),
        rec.scheduleFreq,
        rec.scheduleInterval || 1
      );

      const createdTxn = await prisma.$transaction(async (tx) => {
        // Concurrency guard: verify nextOccurrence hasn't already been advanced by a parallel process
        const current = await tx.recurringTransaction.findUnique({
          where: { id: rec.id },
          select: { nextOccurrence: true, status: true },
        });

        if (!current || current.status !== 'ACTIVE' || new Date(current.nextOccurrence).getTime() > asOfDate.getTime()) {
          return null;
        }

        // 1. Create real transaction
        const txn = await tx.transaction.create({
          data: {
            userId: rec.userId,
            accountId: rec.accountId,
            categoryId: rec.categoryId,
            type: rec.type,
            direction,
            amount: rec.amount,
            description: rec.description || `Recurring ${rec.type.toLowerCase()}`,
            txnDate: current.nextOccurrence,
            status: 'ACTIVE',
          },
        });

        // 2. Mutate account balance atomically via balanceService
        await balanceService.applyTransactionBalanceChange(
          tx,
          rec.accountId,
          direction,
          rec.amount,
          false
        );

        // 3. Advance nextOccurrence
        await tx.recurringTransaction.update({
          where: { id: rec.id },
          data: {
            nextOccurrence: nextDate,
          },
        });

        return txn;
      });

      if (!createdTxn) {
        continue;
      }

      await logAuditEvent({
        actorUserId: rec.userId,
        action: 'RECURRING_TRANSACTION_MATERIALIZE',
        details: {
          recurringTransactionId: rec.id,
          transactionId: createdTxn.id,
          amountPaise: rec.amount.toString(),
          nextOccurrence: nextDate.toISOString(),
        },
      });

      affectedUserIds.add(rec.userId);
      materializedTransactions.push(createdTxn);
    }

    // Refresh dashboards and notify affected users
    for (const uId of affectedUserIds) {
      await invalidateDashboardCache(uId);
      emitSyncEvent(uId, { entity: 'RECURRING', action: 'MATERIALIZE' });
    }

    return {
      materializedCount: materializedTransactions.length,
      materializedTransactions,
    };
  }
}

export const recurringService = new RecurringService();
export default recurringService;
