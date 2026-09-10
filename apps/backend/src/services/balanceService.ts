import { Prisma, TxnDirection } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export class BalanceService {
  // Recalculate and persist account balance invariant inside transaction
  async recalculateAccountBalance(
    tx: Prisma.TransactionClient,
    accountId: string
  ): Promise<bigint> {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      select: { id: true, openingBalance: true },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
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

  // Apply atomic incremental balance delta inside transaction
  async applyTransactionBalanceChange(
    tx: Prisma.TransactionClient,
    accountId: string,
    direction: TxnDirection,
    amount: bigint,
    isReversal = false
  ): Promise<bigint> {
    // Verify account exists
    const exists = await tx.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundError('Account not found');
    }

    // Determine direction of the atomic delta
    let isIncrement: boolean;
    if (isReversal) {
      isIncrement = direction === 'DEBIT'; // Reversal of a debit = add back
    } else {
      isIncrement = direction === 'CREDIT'; // Normal credit = add
    }

    // Atomic increment/decrement — no read-modify-write race condition (FIN-01)
    const updated = await tx.account.update({
      where: { id: accountId },
      data: {
        currentBalance: isIncrement
          ? { increment: amount }
          : { decrement: amount },
      },
      select: { currentBalance: true },
    });

    return updated.currentBalance;
  }
}

export const balanceService = new BalanceService();
export default balanceService;
