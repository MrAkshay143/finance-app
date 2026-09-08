import { Prisma, TxnDirection } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export class BalanceService {
  /**
   * Enforces the balance invariant:
   * account.currentBalance = account.openingBalance
   *   + sum(amount WHERE direction = CREDIT AND status = ACTIVE)
   *   - sum(amount WHERE direction = DEBIT AND status = ACTIVE)
   *
   * Recalculates and updates currentBalance for an account inside an existing Prisma transaction.
   */
  async recalculateAccountBalance(
    tx: Prisma.TransactionClient,
    accountId: string
  ): Promise<bigint> {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      select: { id: true, openingBalance: true },
    });

    if (!account) {
      throw new NotFoundError(`Account not found: ${accountId}`);
    }

    const creditsAgg = await tx.transaction.aggregate({
      where: {
        accountId,
        direction: 'CREDIT',
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });

    const debitsAgg = await tx.transaction.aggregate({
      where: {
        accountId,
        direction: 'DEBIT',
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });

    const credits = creditsAgg._sum.amount ?? BigInt(0);
    const debits = debitsAgg._sum.amount ?? BigInt(0);

    const calculatedBalance = account.openingBalance + credits - debits;

    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: calculatedBalance },
    });

    return calculatedBalance;
  }

  /**
   * Applies an incremental balance change on an account inside an existing Prisma transaction.
   *
   * If isReversal is false:
   *   - CREDIT: increases currentBalance by amount
   *   - DEBIT: decreases currentBalance by amount
   * If isReversal is true:
   *   - CREDIT: decreases currentBalance by amount
   *   - DEBIT: increases currentBalance by amount
   */
  async applyTransactionBalanceChange(
    tx: Prisma.TransactionClient,
    accountId: string,
    direction: TxnDirection,
    amount: bigint,
    isReversal = false
  ): Promise<bigint> {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      select: { id: true, currentBalance: true },
    });

    if (!account) {
      throw new NotFoundError(`Account not found: ${accountId}`);
    }

    let delta: bigint;
    if (isReversal) {
      delta = direction === 'CREDIT' ? -amount : amount;
    } else {
      delta = direction === 'CREDIT' ? amount : -amount;
    }

    const newBalance = account.currentBalance + delta;

    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: newBalance },
    });

    return newBalance;
  }
}

export const balanceService = new BalanceService();
export default balanceService;
