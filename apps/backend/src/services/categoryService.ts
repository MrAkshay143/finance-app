import { TxnType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { logAuditEvent } from './auditService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh, emitSyncEvent } from '../sockets/socketGateway.js';

export interface CreateCategoryData {
  name: string;
  type: TxnType;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  type?: TxnType;
  sortOrder?: number;
}

export interface SystemCategorySeed {
  name: string;
  type: TxnType;
  sortOrder: number;
}

export const SYSTEM_CATEGORIES: SystemCategorySeed[] = [
  // Expense categories
  { name: 'Food & Dining', type: TxnType.EXPENSE, sortOrder: 1 },
  { name: 'Groceries', type: TxnType.EXPENSE, sortOrder: 2 },
  { name: 'Fuel', type: TxnType.EXPENSE, sortOrder: 3 },
  { name: 'Rent', type: TxnType.EXPENSE, sortOrder: 4 },
  { name: 'Utilities', type: TxnType.EXPENSE, sortOrder: 5 },
  { name: 'Shopping', type: TxnType.EXPENSE, sortOrder: 6 },
  { name: 'Health & Medical', type: TxnType.EXPENSE, sortOrder: 7 },
  { name: 'Entertainment', type: TxnType.EXPENSE, sortOrder: 8 },
  { name: 'Travel & Transit', type: TxnType.EXPENSE, sortOrder: 9 },

  // Income categories
  { name: 'Salary', type: TxnType.INCOME, sortOrder: 10 },
  { name: 'Freelance', type: TxnType.INCOME, sortOrder: 11 },
  { name: 'Investment Return', type: TxnType.INCOME, sortOrder: 12 },

  // Investment categories
  { name: 'Bonds', type: TxnType.INVESTMENT, sortOrder: 13 },
  { name: 'Fixed Deposit', type: TxnType.INVESTMENT, sortOrder: 14 },
  { name: 'Gold', type: TxnType.INVESTMENT, sortOrder: 15 },
  { name: 'Mutual Funds', type: TxnType.INVESTMENT, sortOrder: 16 },
  { name: 'Real Estate', type: TxnType.INVESTMENT, sortOrder: 17 },
];

export class CategoryService {
  // Seed default system categories idempotently
  async ensureSystemCategories(): Promise<void> {
    try {
      for (const cat of SYSTEM_CATEGORIES) {
        const existing = await prisma.category.findFirst({
          where: {
            name: cat.name,
            isSystem: true,
          },
        });
        if (!existing) {
          await prisma.category.create({
            data: {
              name: cat.name,
              type: cat.type,
              sortOrder: cat.sortOrder,
              isSystem: true,
              userId: null,
            },
          });
        }
      }
    } catch (err) {
      console.warn('ensureSystemCategories warning:', err);
    }
  }

  /**
   * Returns system categories (userId = null or isSystem = true) plus user custom categories,
   * sorted by sortOrder asc. Automatically provisions system categories if none exist.
   */
  async listCategories(userId: string, type?: TxnType) {
    let categories = await prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
        ...(type ? { type } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    if (categories.length === 0) {
      await this.ensureSystemCategories();
      categories = await prisma.category.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
          ...(type ? { type } : {}),
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    }

    // Query active transactions for user to aggregate per-category metrics
    const txns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        categoryId: true,
        amount: true,
        type: true,
        direction: true,
      },
    });

    const counts = new Map<string, number>();
    const spentPaise = new Map<string, bigint>();
    const incomePaise = new Map<string, bigint>();
    const expensePaise = new Map<string, bigint>();
    const investPaise = new Map<string, bigint>();

    for (const txn of txns) {
      if (txn.categoryId) {
        counts.set(txn.categoryId, (counts.get(txn.categoryId) || 0) + 1);
        const amount = BigInt(txn.amount);

        if (txn.type === 'INCOME') {
          incomePaise.set(txn.categoryId, (incomePaise.get(txn.categoryId) || BigInt(0)) + amount);
        } else if (txn.type === 'INVESTMENT') {
          investPaise.set(txn.categoryId, (investPaise.get(txn.categoryId) || BigInt(0)) + amount);
        } else {
          expensePaise.set(txn.categoryId, (expensePaise.get(txn.categoryId) || BigInt(0)) + amount);
        }

        if (txn.type === 'EXPENSE' && txn.direction === 'DEBIT') {
          const prev = spentPaise.get(txn.categoryId) || BigInt(0);
          spentPaise.set(txn.categoryId, prev + amount);
        }
      }
    }

    return categories.map((cat) => {
      const total = spentPaise.get(cat.id) || BigInt(0);
      const inc = incomePaise.get(cat.id) || BigInt(0);
      const exp = expensePaise.get(cat.id) || BigInt(0);
      const inv = investPaise.get(cat.id) || BigInt(0);

      return {
        id: cat.id,
        userId: cat.userId,
        name: cat.name,
        type: cat.type,
        isSystem: cat.isSystem,
        sortOrder: cat.sortOrder,
        createdAt: cat.createdAt,
        transactionCount: counts.get(cat.id) || 0,
        totalSpent: Number(total) / 100,
        totalSpentPaise: Number(total),
        totalIncome: Number(inc) / 100,
        totalExpense: Number(exp) / 100,
        totalInvest: Number(inv) / 100,
      };
    });
  }

  // Retrieve single category by ID with financial metrics
  async getCategory(userId: string, id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }
    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this category');
    }

    const txns = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: id,
        status: 'ACTIVE',
      },
    });

    let totalPaise = BigInt(0);
    let incPaise = BigInt(0);
    let expPaise = BigInt(0);
    let invPaise = BigInt(0);

    for (const txn of txns) {
      const amount = BigInt(txn.amount);
      if (txn.type === 'INCOME') {
        incPaise += amount;
      } else if (txn.type === 'INVESTMENT') {
        invPaise += amount;
      } else {
        expPaise += amount;
      }

      if (txn.type === 'EXPENSE' && txn.direction === 'DEBIT') {
        totalPaise += amount;
      }
    }

    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      type: category.type,
      isSystem: category.isSystem,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      transactionCount: txns.length,
      totalSpent: Number(totalPaise) / 100,
      totalSpentPaise: Number(totalPaise),
      totalIncome: Number(incPaise) / 100,
      totalExpense: Number(expPaise) / 100,
      totalInvest: Number(invPaise) / 100,
    };
  }

  /**
   * Creates a custom category with isSystem = false.
   */
  async createCategory(userId: string, data: CreateCategoryData) {
    const trimmedName = data.name?.trim();
    if (!trimmedName) {
      throw new ValidationError('Category name is required');
    }

    // Check duplicate name for same type (database-agnostic case-insensitive check)
    const candidateCategories = await prisma.category.findMany({
      where: {
        type: data.type,
        OR: [{ isSystem: true }, { userId }],
      },
      select: { id: true, name: true },
    });

    const existing = candidateCategories.find(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      throw new ValidationError('A category with this name and type already exists');
    }

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const allCategories = await prisma.category.findMany({
        where: { OR: [{ isSystem: true }, { userId }] },
        select: { sortOrder: true },
      });
      const maxSort = allCategories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
      sortOrder = maxSort + 1;
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name: trimmedName,
        type: data.type,
        isSystem: false,
        sortOrder,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'CATEGORY_CREATE',
      details: {
        categoryId: category.id,
        name: category.name,
        type: category.type,
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'CATEGORY', action: 'CREATE', entityId: category.id });

    return {
      ...category,
      transactionCount: 0,
      totalSpent: 0,
      totalSpentPaise: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalInvest: 0,
    };
  }

  /**
   * Updates custom category.
   * If category isSystem === true, throws 403 ForbiddenError! System categories are immutable!
   */
  async updateCategory(userId: string, id: string, data: UpdateCategoryData) {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('System categories are immutable and cannot be modified');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this category');
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : existing.name,
        type: data.type || existing.type,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'CATEGORY_UPDATE',
      details: {
        categoryId: id,
        name: updated.name,
        type: updated.type,
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'CATEGORY', action: 'UPDATE', entityId: id });

    return updated;
  }

  /**
   * Deletes custom category.
   * If category isSystem === true, throws 403 ForbiddenError! System categories cannot be deleted!
   */
  async deleteCategory(userId: string, id: string) {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('System categories cannot be deleted');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this category');
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
      await tx.recurringTransaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
      await tx.budget.deleteMany({
        where: { categoryId: id },
      });
      await tx.category.delete({
        where: { id },
      });
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'CATEGORY_DELETE',
      details: {
        categoryId: id,
        name: existing.name,
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'CATEGORY', action: 'DELETE', entityId: id });

    return { message: 'Category deleted successfully' };
  }

  /**
   * Reorders categories by updating sortOrder in a single transaction.
   */
  async reorderCategories(userId: string, categoryIds: string[]) {
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new ValidationError('categoryIds must be a non-empty array of category IDs');
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < categoryIds.length; i++) {
        const catId = categoryIds[i];
        await tx.category.update({
          where: { id: catId },
          data: { sortOrder: i + 1 },
        });
      }
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'CATEGORY_REORDER',
      details: {
        count: categoryIds.length,
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'CATEGORY', action: 'REORDER' });

    return { message: 'Categories reordered successfully' };
  }

  /**
   * Admin: Queries all system/default categories (isSystem: true, userId: null),
   * ordered by type asc, sortOrder asc, name asc.
   */
  async adminListSystemCategories() {
    return prisma.category.findMany({
      where: { isSystem: true, userId: null },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Admin: Creates a system category with isSystem = true and userId = null.
   * Logs ADMIN_CATEGORY_CREATE.
   */
  async adminCreateSystemCategory(
    adminId: string,
    data: { name: string; type: TxnType; sortOrder?: number }
  ) {
    const trimmedName = data.name?.trim();
    if (!trimmedName) {
      throw new ValidationError('Category name is required');
    }

    if (!data.type) {
      throw new ValidationError('Category type is required');
    }

    // Check duplicate name for same type among system categories
    const candidateCategories = await prisma.category.findMany({
      where: {
        isSystem: true,
        type: data.type,
      },
      select: { id: true, name: true },
    });

    const existing = candidateCategories.find(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      throw new ValidationError('A system category with this name and type already exists');
    }

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const allSystem = await prisma.category.findMany({
        where: { isSystem: true },
        select: { sortOrder: true },
      });
      const maxSort = allSystem.reduce((max, c) => Math.max(max, c.sortOrder), 0);
      sortOrder = maxSort + 1;
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        type: data.type,
        sortOrder,
        isSystem: true,
        userId: null,
      },
    });

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_CATEGORY_CREATE',
      details: {
        categoryId: category.id,
        name: category.name,
        type: category.type,
        sortOrder: category.sortOrder,
      },
    });
    emitSyncEvent(adminId, { entity: 'ADMIN_CATEGORY', action: 'CREATE', entityId: category.id });

    return category;
  }


  /**
   * Admin: Updates an existing system category if isSystem is true.
   * Logs ADMIN_CATEGORY_UPDATE.
   */
  async adminUpdateSystemCategory(
    adminId: string,
    id: string,
    data: { name?: string; type?: TxnType; sortOrder?: number }
  ) {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    if (!existing.isSystem) {
      throw new ForbiddenError('Category is not a system category');
    }

    const trimmedName = data.name !== undefined ? data.name.trim() : existing.name;
    if (!trimmedName) {
      throw new ValidationError('Category name cannot be empty');
    }

    const targetType = data.type || existing.type;

    // Check duplicate if name or type changed
    if (
      trimmedName.toLowerCase() !== existing.name.toLowerCase() ||
      (data.type && data.type !== existing.type)
    ) {
      const candidateCategories = await prisma.category.findMany({
        where: {
          isSystem: true,
          type: targetType,
          id: { not: id },
        },
        select: { id: true, name: true },
      });

      const duplicate = candidateCategories.find(
        (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (duplicate) {
        throw new ValidationError('A system category with this name and type already exists');
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        type: targetType,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      },
    });

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_CATEGORY_UPDATE',
      details: {
        categoryId: id,
        name: updated.name,
        type: updated.type,
        sortOrder: updated.sortOrder,
      },
    });
    emitSyncEvent(adminId, { entity: 'ADMIN_CATEGORY', action: 'UPDATE', entityId: id });

    return updated;
  }


  /**
   * Admin: Deletes a system category, safely unlinking transactions (categoryId: null)
   * and recurringTxns, and deleting associated budgets.
   * Logs ADMIN_CATEGORY_DELETE.
   */
  async adminDeleteSystemCategory(adminId: string, id: string) {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    if (!existing.isSystem) {
      throw new ForbiddenError('Category is not a system category');
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
      await tx.recurringTransaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
      await tx.budget.deleteMany({
        where: { categoryId: id },
      });
      await tx.category.delete({
        where: { id },
      });
    });

    await logAuditEvent({
      actorUserId: adminId,
      action: 'ADMIN_CATEGORY_DELETE',
      details: {
        categoryId: id,
        name: existing.name,
        type: existing.type,
      },
    });
    emitSyncEvent(adminId, { entity: 'ADMIN_CATEGORY', action: 'DELETE', entityId: id });

    return { success: true, message: 'System category deleted successfully' };
  }

}

export const categoryService = new CategoryService();
export default categoryService;
