import { RecordStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { logAuditEvent } from './auditService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { getFinancialMonthRange } from './famService.js';

export interface CreateBudgetData {
  categoryId: string;
  name?: string;
  targetAmount?: number | bigint;
  limitAmount?: number | bigint;
  period?: string;
  periodStart?: string | Date;
}

export interface UpdateBudgetData {
  categoryId?: string;
  name?: string;
  targetAmount?: number | bigint;
  limitAmount?: number | bigint;
  period?: string;
  periodStart?: string | Date;
}

export function formatBudget(budget: any, spentPaise: bigint = BigInt(0)) {
  const targetPaise = BigInt(budget.targetAmount || 0);
  const targetAmount = Number(targetPaise) / 100;
  const spent = Number(spentPaise) / 100;
  const remainingPaise = targetPaise > spentPaise ? targetPaise - spentPaise : BigInt(0);
  const remaining = Number(remainingPaise) / 100;
  const progress =
    targetPaise > BigInt(0)
      ? Math.round((Number(spentPaise) / Number(targetPaise)) * 100 * 10) / 10
      : 0;

  return {
    id: budget.id,
    userId: budget.userId,
    categoryId: budget.categoryId,
    category: budget.category
      ? {
          id: budget.category.id,
          name: budget.category.name,
          type: budget.category.type,
          isSystem: budget.category.isSystem,
        }
      : null,
    name: budget.name,
    targetAmount,
    targetAmountPaise: Number(targetPaise),
    spent,
    spentPaise: Number(spentPaise),
    remaining,
    remainingPaise: Number(remainingPaise),
    progress,
    percentage: progress,
    period: budget.period,
    periodStart: budget.periodStart,
    status: budget.status as RecordStatus,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

export class BudgetService {
  toPaise(val: number | bigint | undefined): bigint {
    if (val === undefined || val === null) {
      throw new ValidationError('Budget target amount is required');
    }
    if (typeof val === 'bigint') {
      if (val <= BigInt(0)) {
        throw new ValidationError('Target amount must be positive');
      }
      return val;
    }
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      throw new ValidationError('Target amount must be a positive number');
    }
    return BigInt(Math.round(num * 100));
  }

  /**
   * Returns all active budgets for a user with category, targetAmount,
   * live spent amount computed from active EXPENSE transactions matching category this period,
   * remaining amount, and progress percentage.
   */
  async listBudgets(userId: string, _period?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userSettings: true },
    });

    const startDay = user?.userSettings?.financialMonthStartDay ?? 1;
    const monthRange = getFinancialMonthRange(startDay);

    const [budgets, activeExpenses] = await Promise.all([
      prisma.budget.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          direction: 'DEBIT',
          type: 'EXPENSE',
          txnDate: { gte: monthRange.start, lt: monthRange.end },
        },
      }),
    ]);

    const spentByCat = new Map<string, bigint>();
    for (const txn of activeExpenses) {
      if (txn.categoryId) {
        const prev = spentByCat.get(txn.categoryId) || BigInt(0);
        spentByCat.set(txn.categoryId, prev + BigInt(txn.amount));
      }
    }

    return budgets.map((b) => formatBudget(b, spentByCat.get(b.categoryId) || BigInt(0)));
  }

  /**
   * Retrieves single budget with live spent calculations.
   */
  async getBudget(userId: string, id: string) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }
    if (budget.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this budget');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userSettings: true },
    });

    const startDay = user?.userSettings?.financialMonthStartDay ?? 1;
    const monthRange = getFinancialMonthRange(startDay);

    const expenseAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        categoryId: budget.categoryId,
        status: 'ACTIVE',
        direction: 'DEBIT',
        type: 'EXPENSE',
        txnDate: { gte: monthRange.start, lt: monthRange.end },
      },
    });

    const spentPaise = expenseAgg?._sum?.amount ?? BigInt(0);
    return formatBudget(budget, spentPaise);
  }

  /**
   * Creates a budget, validating category and storing targetAmount in BigInt paise.
   */
  async createBudget(userId: string, data: CreateBudgetData) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || (category.userId && category.userId !== userId)) {
      throw new NotFoundError('Category not found');
    }

    const targetAmountPaise = this.toPaise(data.targetAmount ?? data.limitAmount);
    const period = data.period || 'MONTHLY';
    const periodStart = data.periodStart ? new Date(data.periodStart) : new Date();
    const name = data.name?.trim() || `${category.name} Budget`;

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        name,
        targetAmount: targetAmountPaise,
        period,
        periodStart,
        status: 'ACTIVE',
      },
      include: {
        category: true,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'BUDGET_CREATE',
      details: {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        targetAmountPaise: targetAmountPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);

    return formatBudget(budget, BigInt(0));
  }

  /**
   * Updates an existing budget.
   */
  async updateBudget(userId: string, id: string, data: UpdateBudgetData) {
    const existing = await prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      throw new NotFoundError('Budget not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this budget');
    }
    if (existing.status === 'DELETED') {
      throw new ValidationError('Cannot update a deleted budget');
    }

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || (category.userId && category.userId !== userId)) {
        throw new NotFoundError('Category not found');
      }
    }

    const targetAmountPaise =
      data.targetAmount !== undefined || data.limitAmount !== undefined
        ? this.toPaise(data.targetAmount ?? data.limitAmount)
        : existing.targetAmount;

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        categoryId: data.categoryId || existing.categoryId,
        name: data.name !== undefined ? data.name.trim() : existing.name,
        targetAmount: targetAmountPaise,
        period: data.period || existing.period,
        periodStart: data.periodStart ? new Date(data.periodStart) : existing.periodStart,
      },
      include: {
        category: true,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'BUDGET_UPDATE',
      details: {
        budgetId: id,
        newTargetAmountPaise: targetAmountPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);

    return this.getBudget(userId, id);
  }

  /**
   * Soft deletes a budget by setting status = DELETED.
   */
  async deleteBudget(userId: string, id: string) {
    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Budget not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this budget');
    }
    if (existing.status === 'DELETED') {
      throw new ValidationError('Budget is already deleted');
    }

    await prisma.budget.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'BUDGET_DELETE',
      details: {
        budgetId: id,
      },
    });

    await invalidateDashboardCache(userId);

    return { message: 'Budget deleted successfully' };
  }
}

export const budgetService = new BudgetService();
export default budgetService;
