import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { toPaise } from '../utils/currency.js';
import { balanceService } from './balanceService.js';
import { logAuditEvent } from './auditService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh } from '../sockets/socketGateway.js';

export interface CreateTransferData {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number | bigint;
  date?: string | Date;
  txnDate?: string | Date;
  description?: string;
  notes?: string | null;
}

export function formatTransfer(transfer: any) {
  const amountPaise =
    typeof transfer.amount === 'bigint' ? transfer.amount : BigInt(transfer.amount || 0);
  return {
    id: transfer.id,
    userId: transfer.userId,
    sourceAccountId: transfer.sourceAccountId,
    destinationAccountId: transfer.destinationAccountId,
    amount: Number(amountPaise) / 100,
    amountPaise: Number(amountPaise),
    txnDate: transfer.txnDate,
    date: transfer.txnDate,
    description: transfer.description,
    debitTransactionId: transfer.debitTransactionId,
    creditTransactionId: transfer.creditTransactionId,
    createdAt: transfer.createdAt,
  };
}

export class TransferService {

  // Execute atomic dual-leg account transfer and update balances
  async createTransfer(userId: string, data: CreateTransferData) {
    if (data.sourceAccountId === data.destinationAccountId) {
      throw new ValidationError('Please choose two different accounts.');
    }

    // Validate account ownership
    const [sourceAccount, destinationAccount] = await Promise.all([
      prisma.account.findUnique({ where: { id: data.sourceAccountId } }),
      prisma.account.findUnique({ where: { id: data.destinationAccountId } }),
    ]);

    if (!sourceAccount) {
      throw new NotFoundError('Source account not found');
    }
    if (sourceAccount.userId !== userId) {
      throw new ForbiddenError('Access forbidden to source account');
    }
    if (sourceAccount.status === 'INACTIVE') {
      throw new ValidationError('Source account is inactive');
    }

    if (!destinationAccount) {
      throw new NotFoundError('Destination account not found');
    }
    if (destinationAccount.userId !== userId) {
      throw new ForbiddenError('Access forbidden to destination account');
    }
    if (destinationAccount.status === 'INACTIVE') {
      throw new ValidationError('Destination account is inactive');
    }

    const amountPaise = toPaise(data.amount);
    const txnDate = data.txnDate
      ? new Date(data.txnDate)
      : data.date
      ? new Date(data.date)
      : new Date();
    const description = data.description?.trim() || 'Transfer between accounts';

    // Execute atomic dual-leg transfer inside Prisma $transaction
    const transfer = await prisma.$transaction(async (tx) => {
      // 1. Debit leg on source account
      const debitTxn = await tx.transaction.create({
        data: {
          userId,
          accountId: data.sourceAccountId,
          type: 'EXPENSE',
          direction: 'DEBIT',
          amount: amountPaise,
          description: `${description} (Transfer to ${destinationAccount.name})`,
          txnDate,
          status: 'ACTIVE',
        },
      });

      // 2. Credit leg on destination account
      const creditTxn = await tx.transaction.create({
        data: {
          userId,
          accountId: data.destinationAccountId,
          type: 'INCOME',
          direction: 'CREDIT',
          amount: amountPaise,
          description: `${description} (Transfer from ${sourceAccount.name})`,
          txnDate,
          status: 'ACTIVE',
        },
      });

      // 3. Transfer linking row
      const newTransfer = await tx.transfer.create({
        data: {
          userId,
          sourceAccountId: data.sourceAccountId,
          destinationAccountId: data.destinationAccountId,
          amount: amountPaise,
          txnDate,
          description,
          debitTransactionId: debitTxn.id,
          creditTransactionId: creditTxn.id,
        },
      });

      // 4. Update both accounts' balances via balanceService
      await balanceService.applyTransactionBalanceChange(
        tx,
        data.sourceAccountId,
        'DEBIT',
        amountPaise,
        false
      );

      await balanceService.applyTransactionBalanceChange(
        tx,
        data.destinationAccountId,
        'CREDIT',
        amountPaise,
        false
      );

      return newTransfer;
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'TRANSFER_CREATE',
      details: {
        transferId: transfer.id,
        sourceAccountId: data.sourceAccountId,
        destinationAccountId: data.destinationAccountId,
        amountPaise: amountPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);
    emitDashboardRefresh(userId);

    return formatTransfer(transfer);
  }

  /**
   * Retrieves a transfer by ID.
   */
  async getTransfer(userId: string, id: string) {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        debitTransaction: true,
        creditTransaction: true,
      },
    });

    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }
    if (transfer.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this transfer');
    }

    return formatTransfer(transfer);
  }

  /**
   * Soft deletes both debit & credit transactions, removes transfer link, and reverts both account balances.
   */
  async deleteTransfer(userId: string, id: string) {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }
    if (transfer.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this transfer');
    }

    await prisma.$transaction(async (tx) => {
      // Mark debit and credit transactions as DELETED
      await tx.transaction.updateMany({
        where: {
          id: { in: [transfer.debitTransactionId, transfer.creditTransactionId] },
        },
        data: { status: 'DELETED' },
      });

      // Delete the transfer link row
      await tx.transfer.delete({
        where: { id },
      });

      // Revert balances on both accounts
      await balanceService.applyTransactionBalanceChange(
        tx,
        transfer.sourceAccountId,
        'DEBIT',
        transfer.amount,
        true // reversal of DEBIT increases balance
      );

      await balanceService.applyTransactionBalanceChange(
        tx,
        transfer.destinationAccountId,
        'CREDIT',
        transfer.amount,
        true // reversal of CREDIT decreases balance
      );
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'TRANSFER_DELETE',
      details: {
        transferId: id,
        sourceAccountId: transfer.sourceAccountId,
        destinationAccountId: transfer.destinationAccountId,
        amountPaise: transfer.amount.toString(),
      },
    });

    await invalidateDashboardCache(userId);
    emitDashboardRefresh(userId);

    return { message: 'Transfer deleted successfully' };
  }

  /**
   * Lists transfers for a user.
   */
  async listTransfers(userId: string) {
    const transfers = await prisma.transfer.findMany({
      where: { userId },
      orderBy: { txnDate: 'desc' },
    });

    return transfers.map(formatTransfer);
  }
}

export const transferService = new TransferService();
export default transferService;
