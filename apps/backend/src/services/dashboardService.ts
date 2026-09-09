import { prisma } from '../lib/prisma.js';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { famService, getFinancialMonthRange } from './famService.js';
import { formatTransaction } from './transactionService.js';

interface InMemoryCacheEntry {
  payload: any;
  expiresAt: number;
}

// In-memory fallback cache for when Redis is disconnected or during local testing
const inMemoryDashboardCache = new Map<string, InMemoryCacheEntry>();

export function clearInMemoryDashboardCache(): void {
  inMemoryDashboardCache.clear();
}

/**
 * Invalidates cached dashboard summaries for a user across all periods.
 * Removes keys from Redis (if connected) and from the in-memory fallback cache.
 */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  // 1. In-memory cache invalidation
  const inMemoryKeysToDelete: string[] = [];
  for (const key of inMemoryDashboardCache.keys()) {
    if (key.startsWith(`dashboard:${userId}:`)) {
      inMemoryKeysToDelete.push(key);
    }
  }
  for (const key of inMemoryKeysToDelete) {
    inMemoryDashboardCache.delete(key);
  }

  // 2. Redis cache invalidation
  try {
    const redis = getRedisClient();
    if (redis) {
      const keys = await redis.keys(`dashboard:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    }
  } catch (err: any) {
    logger.warn({ err: err?.message, userId }, 'Failed to invalidate Redis dashboard cache');
  }
}

export class DashboardService {
  /**
   * Builds or returns cached Dashboard Summary aggregate:
   * - fam: grade, progress, areas with targets, actuals, percentages, statuses
   * - targets: overview cards data for Income, Expense, Investment (target, actual, remaining, percent)
   * - securityBanner: showSecurityReminder (boolean, true if KBA is NOT configured)
   * - expenseBreakdown: array of category expenses with amount and percentage of total expenses
   * - accountSummary: totalBalance, activeCount
   * - recentTransactions: top 5 recent active transactions with category, account, amount
   */
  async getDashboardSummary(userId: string, refDate: Date = new Date()) {
    // 1. Determine user settings & financial month period
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: true,
      },
    });

    const startDay = user?.userSettings?.financialMonthStartDay ?? 1;
    const periodRange = getFinancialMonthRange(startDay, refDate);
    const periodKey = `${periodRange.year}-${String(periodRange.month).padStart(2, '0')}`;
    const cacheKey = `dashboard:${userId}:${periodKey}`;

    // 2. Check Redis Cache
    try {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return {
            ...JSON.parse(cached),
            _cached: true,
          };
        }
      }
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Redis get error; checking fallback cache');
    }

    // Check In-Memory fallback cache
    const memoryEntry = inMemoryDashboardCache.get(cacheKey);
    if (memoryEntry) {
      if (Date.now() < memoryEntry.expiresAt) {
        return {
          ...memoryEntry.payload,
          _cached: true,
        };
      } else {
        inMemoryDashboardCache.delete(cacheKey);
      }
    }

    // 3. Compute Aggregates Live

    // A. FAM Score
    const fam = await famService.getFamScore(userId, { refDate });

    // B. Targets Overview Cards
    const targets = {
      income: {
        target: fam.areas.income.target,
        targetPaise: fam.areas.income.targetPaise,
        actual: fam.areas.income.actual,
        actualPaise: fam.areas.income.actualPaise,
        remaining: Math.max(0, fam.areas.income.target - fam.areas.income.actual),
        remainingPaise: Math.max(0, fam.areas.income.targetPaise - fam.areas.income.actualPaise),
        percent: fam.areas.income.percentage,
      },
      expense: {
        target: fam.areas.expense.target,
        targetPaise: fam.areas.expense.targetPaise,
        actual: fam.areas.expense.actual,
        actualPaise: fam.areas.expense.actualPaise,
        remaining: Math.max(0, fam.areas.expense.target - fam.areas.expense.actual),
        remainingPaise: Math.max(0, fam.areas.expense.targetPaise - fam.areas.expense.actualPaise),
        percent: fam.areas.expense.percentage,
      },
      investment: {
        target: fam.areas.investment.target,
        targetPaise: fam.areas.investment.targetPaise,
        actual: fam.areas.investment.actual,
        actualPaise: fam.areas.investment.actualPaise,
        remaining: Math.max(0, fam.areas.investment.target - fam.areas.investment.actual),
        remainingPaise: Math.max(0, fam.areas.investment.targetPaise - fam.areas.investment.actualPaise),
        percent: fam.areas.investment.percentage,
      },
    };

    // C. Security Banner: check KBA questions count
    const kbaCount = await prisma.securityQuestion.count({
      where: { userId },
    });
    const securityBanner = {
      showSecurityReminder: kbaCount < 3,
      configuredQuestionsCount: kbaCount,
    };

    // D. Expense Breakdown by Category
    const expenseTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        direction: 'DEBIT',
        type: 'EXPENSE',
        txnDate: { gte: periodRange.start, lt: periodRange.end },
      },
      include: {
        category: true,
      },
    });

    let totalExpensePaise = BigInt(0);
    const categoryTotals = new Map<
      string,
      { categoryId: string | null; categoryName: string; amountPaise: bigint }
    >();

    for (const txn of expenseTxns) {
      const amt = BigInt(txn.amount);
      totalExpensePaise += amt;
      const catId = txn.categoryId || 'uncategorized';
      const catName = txn.category?.name || 'Uncategorized';

      const existing = categoryTotals.get(catId);
      if (existing) {
        existing.amountPaise += amt;
      } else {
        categoryTotals.set(catId, {
          categoryId: txn.categoryId,
          categoryName: catName,
          amountPaise: amt,
        });
      }
    }

    const totalExpenseNumber = Number(totalExpensePaise) / 100;
    const expenseBreakdown = Array.from(categoryTotals.values())
      .map((item) => {
        const amount = Number(item.amountPaise) / 100;
        const percentage =
          totalExpenseNumber > 0
            ? Math.round((amount / totalExpenseNumber) * 100 * 10) / 10
            : 0;
        return {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          amount,
          amountPaise: Number(item.amountPaise),
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // D2. Income Breakdown by Category (mirrors Expense Breakdown)
    const incomeTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        direction: 'CREDIT',
        type: 'INCOME',
        txnDate: { gte: periodRange.start, lt: periodRange.end },
      },
      include: {
        category: true,
      },
    });

    let totalIncomePaise = BigInt(0);
    const incomeCategoryTotals = new Map<
      string,
      { categoryId: string | null; categoryName: string; amountPaise: bigint }
    >();

    for (const txn of incomeTxns) {
      const amt = BigInt(txn.amount);
      totalIncomePaise += amt;
      const catId = txn.categoryId || 'uncategorized';
      const catName = txn.category?.name || 'Uncategorized';

      const existing = incomeCategoryTotals.get(catId);
      if (existing) {
        existing.amountPaise += amt;
      } else {
        incomeCategoryTotals.set(catId, {
          categoryId: txn.categoryId,
          categoryName: catName,
          amountPaise: amt,
        });
      }
    }

    const totalIncomeNumber = Number(totalIncomePaise) / 100;
    const incomeBreakdown = Array.from(incomeCategoryTotals.values())
      .map((item) => {
        const amount = Number(item.amountPaise) / 100;
        const percentage =
          totalIncomeNumber > 0
            ? Math.round((amount / totalIncomeNumber) * 100 * 10) / 10
            : 0;
        return {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          amount,
          amountPaise: Number(item.amountPaise),
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // E. Account Summary
    const activeAccounts = await prisma.account.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    let totalBalancePaise = BigInt(0);
    for (const acc of activeAccounts) {
      totalBalancePaise += BigInt(acc.currentBalance);
    }

    const accountSummary = {
      totalBalance: Number(totalBalancePaise) / 100,
      totalBalancePaise: Number(totalBalancePaise),
      activeCount: activeAccounts.length,
      accounts: activeAccounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        accountType: acc.accountType,
        balance: Number(acc.currentBalance) / 100,
      })),
    };

    // F. Top 5 Recent Active Transactions
    const recentTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: [{ txnDate: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        account: true,
        category: true,
        merchant: true,
      },
    });

    const recentTransactions = recentTxns.map(formatTransaction);

    const payload = {
      period: {
        month: periodRange.month,
        year: periodRange.year,
        periodStart: periodRange.start,
        periodEnd: periodRange.end,
      },
      fam,
      targets,
      securityBanner,
      expenseBreakdown,
      incomeBreakdown,
      accountSummary,
      recentTransactions,
    };

    // 4. Save to Caches (5-minute TTL = 300 seconds)
    const TTL_SECONDS = 300;

    inMemoryDashboardCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + TTL_SECONDS * 1000,
    });

    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(payload), { EX: TTL_SECONDS });
      }
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Failed to set Redis dashboard cache');
    }

    return payload;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
