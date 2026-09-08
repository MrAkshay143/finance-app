import { TxnType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { logAuditEvent } from './auditService.js';

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

export class CategoryService {
  /**
   * Returns system categories (userId = null or isSystem = true) plus user custom categories,
   * sorted by sortOrder asc.
   */
  async listCategories(userId: string, type?: TxnType) {
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
        ...(type ? { type } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories;
  }

  /**
   * Retrieves single category by ID.
   */
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

    return category;
  }

  /**
   * Creates a custom category with isSystem = false.
   */
  async createCategory(userId: string, data: CreateCategoryData) {
    const trimmedName = data.name?.trim();
    if (!trimmedName) {
      throw new ValidationError('Category name is required');
    }

    // Check duplicate name for same type
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        type: data.type,
        OR: [{ isSystem: true }, { userId }],
      },
    });

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

    return category;
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

    await prisma.category.delete({
      where: { id },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'CATEGORY_DELETE',
      details: {
        categoryId: id,
        name: existing.name,
      },
    });

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

    return { message: 'Categories reordered successfully' };
  }
}

export const categoryService = new CategoryService();
export default categoryService;
