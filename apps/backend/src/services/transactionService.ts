import { TxnType, TxnDirection, RecordStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { toPaise } from '../utils/currency.js';
import { balanceService } from './balanceService.js';
import { logAuditEvent } from './auditService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh, emitSyncEvent } from '../sockets/socketGateway.js';
// Lazy import to avoid circular dependency — resolved at call time
let _transferService: typeof import('./transferService.js').transferService | null = null;
async function getTransferService() {
  if (!_transferService) {
    const mod = await import('./transferService.js');
    _transferService = mod.transferService;
  }
  return _transferService;
}

export interface CreateTransactionData {
  accountId: string;
  categoryId?: string | null;
  type: TxnType;
  direction?: TxnDirection;
  amount: number | bigint;
  date?: string | Date;
  txnDate?: string | Date;
  description: string;
  merchant?: string | null;
  merchantId?: string | null;
  notes?: string | null;
}

export interface UpdateTransactionData {
  accountId?: string;
  categoryId?: string | null;
  type?: TxnType;
  direction?: TxnDirection;
  amount?: number | bigint;
  date?: string | Date;
  txnDate?: string | Date;
  description?: string;
  merchant?: string | null;
  merchantId?: string | null;
  notes?: string | null;
}

export interface ListTransactionsFilters {
  page?: number;
  pageSize?: number;
  type?: TxnType;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: RecordStatus;
}

export function formatTransaction(txn: any) {
  const amountPaise = typeof txn.amount === 'bigint' ? txn.amount : BigInt(txn.amount || 0);
  return {
    id: txn.id,
    userId: txn.userId,
    accountId: txn.accountId,
    account: txn.account
      ? {
          id: txn.account.id,
          name: txn.account.name,
          accountType: txn.account.accountType,
          institution: txn.account.institution,
          currentBalance: Number(txn.account.currentBalance) / 100,
          currentBalancePaise: Number(txn.account.currentBalance),
        }
      : undefined,
    categoryId: txn.categoryId || null,
    category: txn.category
      ? {
          id: txn.category.id,
          name: txn.category.name,
          type: txn.category.type,
          isSystem: txn.category.isSystem,
        }
      : null,
    merchantId: txn.merchantId || null,
    merchant: txn.merchant ? txn.merchant.name : null,
    type: txn.type,
    direction: txn.direction,
    amount: Number(amountPaise) / 100,
    amountPaise: Number(amountPaise),
    description: txn.description,
    txnDate: txn.txnDate,
    date: txn.txnDate,
    status: txn.status,
    createdAt: txn.createdAt,
    updatedAt: txn.updatedAt,
  };
}

export class TransactionService {
  // Map transaction type to default cash flow direction
  mapTypeToDirection(type: TxnType): TxnDirection {
    switch (type) {
      case 'INCOME':
        return 'CREDIT';
      case 'EXPENSE':
      case 'INVESTMENT':
        return 'DEBIT';
      default:
        return 'DEBIT';
    }
  }

  // Create transaction, validate account ownership, and atomically update balance
  async createTransaction(userId: string, data: CreateTransactionData) {
    // 1. Validate account ownership
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    });
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    if (account.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this account');
    }
    if (account.status === 'INACTIVE') {
      throw new ValidationError('Cannot add transaction to an inactive account');
    }

    // 2. Map type to direction
    const direction = data.direction || this.mapTypeToDirection(data.type);

    // 3. Convert rupee amount to BigInt paise
    const amountPaise = toPaise(data.amount);

    // 4. Validate category if provided
    let categoryId = data.categoryId || null;
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category || (category.userId && category.userId !== userId)) {
        throw new NotFoundError('Category not found');
      }
    }

    // 5. Merchant resolution
    let merchantId = data.merchantId || null;
    if (data.merchant && !merchantId) {
      const trimmed = data.merchant.trim();
      if (trimmed) {
        let existingMerchant = await prisma.merchant.findFirst({
          where: { userId, name: trimmed },
        });
        if (!existingMerchant) {
          existingMerchant = await prisma.merchant.create({
            data: { userId, name: trimmed },
          });
        }
        merchantId = existingMerchant.id;
      }
    }

    // 6. Date resolution
    const txnDate = data.txnDate
      ? new Date(data.txnDate)
      : data.date
      ? new Date(data.date)
      : new Date();

    // 7. Atomic transaction insertion & balance update inside $transaction
    const txn = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          categoryId,
          merchantId,
          type: data.type,
          direction,
          amount: amountPaise,
          description: data.description.trim(),
          txnDate,
          status: 'ACTIVE',
        },
        include: {
          account: true,
          category: true,
          merchant: true,
        },
      });

      await balanceService.applyTransactionBalanceChange(
        tx,
        data.accountId,
        direction,
        amountPaise,
        false
      );

      return created;
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'TRANSACTION_CREATE',
      details: {
        transactionId: txn.id,
        accountId: data.accountId,
        type: data.type,
        direction,
        amountPaise: amountPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'TRANSACTION', action: 'CREATE', entityId: txn.id, affectedAccountIds: [data.accountId] });

    return formatTransaction(txn);
  }

  /**
   * Retrieves single transaction by ID after verifying user ownership.
   */
  async getTransaction(userId: string, id: string) {
    const txn = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
        merchant: true,
      },
    });

    if (!txn) {
      throw new NotFoundError('Transaction not found');
    }
    if (txn.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this transaction');
    }

    return formatTransaction(txn);
  }

  /**
   * Updates transaction and recalculates account balances inside a single Prisma transaction.
   */
  async updateTransaction(userId: string, id: string, data: UpdateTransactionData) {
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: {
        transferAsDebit: true,
        transferAsCredit: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this transaction');
    }
    if (existing.status === 'DELETED') {
      throw new ValidationError('Cannot update a deleted transaction');
    }
    if (existing.transferAsDebit || existing.transferAsCredit) {
      throw new ValidationError('Transfer transactions cannot be modified directly. Please delete and recreate the transfer.');
    }

    // Validate new account ownership if changed
    const targetAccountId = data.accountId || existing.accountId;
    if (data.accountId && data.accountId !== existing.accountId) {
      const newAccount = await prisma.account.findUnique({
        where: { id: data.accountId },
      });
      if (!newAccount) {
        throw new NotFoundError('Account not found');
      }
      if (newAccount.userId !== userId) {
        throw new ForbiddenError('Access forbidden to this account');
      }
      if (newAccount.status === 'INACTIVE') {
        throw new ValidationError('Cannot transfer transaction to an inactive account');
      }
    }

    const newType = data.type || existing.type;
    const newDirection = data.direction || (data.type ? this.mapTypeToDirection(data.type) : existing.direction);
    const newAmountPaise = data.amount !== undefined ? toPaise(data.amount) : existing.amount;

    // Validate category if provided
    let categoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category || (category.userId && category.userId !== userId)) {
        throw new NotFoundError('Category not found');
      }
    }

    // Merchant resolution
    let merchantId = data.merchantId !== undefined ? data.merchantId : existing.merchantId;
    if (data.merchant) {
      const trimmed = data.merchant.trim();
      if (trimmed) {
        let existingMerchant = await prisma.merchant.findFirst({
          where: { userId, name: trimmed },
        });
        if (!existingMerchant) {
          existingMerchant = await prisma.merchant.create({
            data: { userId, name: trimmed },
          });
        }
        merchantId = existingMerchant.id;
      }
    }

    const txnDate = data.txnDate
      ? new Date(data.txnDate)
      : data.date
      ? new Date(data.date)
      : undefined;

    // Atomic update and balance recalculation inside $transaction
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.transaction.update({
        where: { id },
        data: {
          accountId: targetAccountId,
          categoryId,
          merchantId,
          type: newType,
          direction: newDirection,
          amount: newAmountPaise,
          description: data.description !== undefined ? data.description.trim() : undefined,
          txnDate,
        },
        include: {
          account: true,
          category: true,
          merchant: true,
        },
      });

      // Recalculate affected accounts
      if (targetAccountId !== existing.accountId) {
        await balanceService.recalculateAccountBalance(tx, existing.accountId);
        await balanceService.recalculateAccountBalance(tx, targetAccountId);
      } else if (
        newAmountPaise !== existing.amount ||
        newDirection !== existing.direction
      ) {
        await balanceService.recalculateAccountBalance(tx, existing.accountId);
      }

      return res;
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'TRANSACTION_UPDATE',
      details: {
        transactionId: id,
        accountId: targetAccountId,
        oldAmountPaise: existing.amount.toString(),
        newAmountPaise: newAmountPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);
    const affectedAcctIds = targetAccountId !== existing.accountId
      ? [existing.accountId, targetAccountId]
      : [targetAccountId];
    emitSyncEvent(userId, { entity: 'TRANSACTION', action: 'UPDATE', entityId: id, affectedAccountIds: affectedAcctIds });

    return formatTransaction(updated);
  }

  /**
   * Soft deletes transaction by setting status = DELETED and reverting account balance inside $transaction.
   * If the transaction is part of a transfer, delegates to transferService.deleteTransfer() to
   * atomically delete both transfer legs (FIN-02).
   */
  async deleteTransaction(userId: string, id: string) {
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: {
        transferAsDebit: true,
        transferAsCredit: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this transaction');
    }
    if (existing.status === 'DELETED') {
      throw new ValidationError('Transaction is already deleted');
    }

    // FIN-02: If this transaction is a leg of a transfer, cascade deletion through transferService
    // to ensure both legs (debit + credit) are removed atomically.
    const transferId = existing.transferAsDebit?.id || existing.transferAsCredit?.id;
    if (transferId) {
      const ts = await getTransferService();
      return ts.deleteTransfer(userId, transferId);
    }

    // Atomic soft-delete and balance reversion inside $transaction
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: { status: 'DELETED' },
      });

      await balanceService.applyTransactionBalanceChange(
        tx,
        existing.accountId,
        existing.direction,
        existing.amount,
        true // isReversal = true
      );
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'TRANSACTION_DELETE',
      details: {
        transactionId: id,
        accountId: existing.accountId,
        amountPaise: existing.amount.toString(),
        direction: existing.direction,
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'TRANSACTION', action: 'DELETE', entityId: id, affectedAccountIds: [existing.accountId] });

    return { message: 'Transaction deleted successfully' };
  }

  /**
   * Lists transactions with filtering, search, pagination, and clean response formatting.
   */
  async listTransactions(userId: string, filters: ListTransactionsFilters = {}) {
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize || 20)));
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: any = {
      userId,
      status: filters.status || 'ACTIVE',
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.startDate || filters.endDate) {
      where.txnDate = {};
      if (filters.startDate) {
        where.txnDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.txnDate.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      const term = filters.search.trim();
      if (term) {
        where.OR = [
          { description: { contains: term } },
          { merchant: { name: { contains: term } } },
          { category: { name: { contains: term } } },
        ];
      }
    }

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: [{ txnDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          account: true,
          category: true,
          merchant: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: items.map(formatTransaction),
      total,
      totalPages,
      page,
      pageSize,
    };
  }
}

export const transactionService = new TransactionService();
export default transactionService;
