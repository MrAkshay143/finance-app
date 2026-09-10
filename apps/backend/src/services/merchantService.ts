import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { logAuditEvent } from './auditService.js';

export interface CreateMerchantData {
  name: string;
}

export interface UpdateMerchantData {
  name: string;
}

export class MerchantService {
  // Return merchants with transaction counts and total spent
  async listMerchants(userId: string) {
    const merchants = await prisma.merchant.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const txns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        merchantId: { not: null },
      },
    });

    const counts = new Map<string, number>();
    const spentPaise = new Map<string, bigint>();

    for (const txn of txns) {
      if (txn.merchantId) {
        counts.set(txn.merchantId, (counts.get(txn.merchantId) || 0) + 1);
        if (txn.type === 'EXPENSE' && txn.direction === 'DEBIT') {
          const prev = spentPaise.get(txn.merchantId) || BigInt(0);
          spentPaise.set(txn.merchantId, prev + BigInt(txn.amount));
        }
      }
    }

    return merchants.map((m) => {
      const totalPaise = spentPaise.get(m.id) || BigInt(0);
      return {
        id: m.id,
        userId: m.userId,
        name: m.name,
        transactionCount: counts.get(m.id) || 0,
        totalSpent: Number(totalPaise) / 100,
        totalSpentPaise: Number(totalPaise),
        createdAt: m.createdAt,
      };
    });
  }

  /**
   * Retrieves single merchant by ID.
   */
  async getMerchant(userId: string, id: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }
    if (merchant.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this merchant');
    }

    const txns = await prisma.transaction.findMany({
      where: {
        userId,
        merchantId: id,
        status: 'ACTIVE',
      },
    });

    let totalPaise = BigInt(0);
    for (const txn of txns) {
      if (txn.type === 'EXPENSE' && txn.direction === 'DEBIT') {
        totalPaise += BigInt(txn.amount);
      }
    }

    return {
      id: merchant.id,
      userId: merchant.userId,
      name: merchant.name,
      transactionCount: txns.length,
      totalSpent: Number(totalPaise) / 100,
      totalSpentPaise: Number(totalPaise),
      createdAt: merchant.createdAt,
    };
  }

  /**
   * Creates a merchant for the user. If a merchant with the same name exists, returns it.
   */
  async createMerchant(userId: string, data: CreateMerchantData) {
    const name = data.name?.trim();
    if (!name) {
      throw new ValidationError('Merchant name is required');
    }

    const userMerchants = await prisma.merchant.findMany({
      where: { userId },
      select: { id: true, userId: true, name: true, createdAt: true },
    });

    const existing = userMerchants.find(
      (m) => m.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        name: existing.name,
        transactionCount: 0,
        totalSpent: 0,
        totalSpentPaise: 0,
        createdAt: existing.createdAt,
      };
    }

    const merchant = await prisma.merchant.create({
      data: {
        userId,
        name,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'MERCHANT_CREATE',
      details: {
        merchantId: merchant.id,
        name: merchant.name,
      },
    });

    return {
      id: merchant.id,
      userId: merchant.userId,
      name: merchant.name,
      transactionCount: 0,
      totalSpent: 0,
      totalSpentPaise: 0,
      createdAt: merchant.createdAt,
    };
  }

  /**
   * Updates a merchant name.
   */
  async updateMerchant(userId: string, id: string, data: UpdateMerchantData) {
    const existing = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Merchant not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this merchant');
    }

    const name = data.name?.trim();
    if (!name) {
      throw new ValidationError('Merchant name is required');
    }

    const updated = await prisma.merchant.update({
      where: { id },
      data: { name },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'MERCHANT_UPDATE',
      details: {
        merchantId: id,
        name: updated.name,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Deletes a merchant if not linked to any transactions.
   */
  async deleteMerchant(userId: string, id: string) {
    const existing = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Merchant not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this merchant');
    }

    const txCount = await prisma.transaction.count({
      where: { merchantId: id },
    });

    if (txCount > 0) {
      throw new ValidationError('Cannot delete merchant that is linked to transactions');
    }

    await prisma.merchant.delete({
      where: { id },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'MERCHANT_DELETE',
      details: {
        merchantId: id,
        name: existing.name,
      },
    });

    return { message: 'Merchant deleted successfully' };
  }
}

export const merchantService = new MerchantService();
export default merchantService;
