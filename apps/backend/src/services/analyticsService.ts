import { prisma } from '../lib/prisma.js';
import { getFinancialMonthRange } from './famService.js';

export interface AnalyticsOptions {
  month?: string; // 'YYYY-MM'
  period?: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export class AnalyticsService {
  /**
   * Aggregates spending analytics for a user:
   * - 6-month historical spending trends: earned, spent, invested, net savings, savings rate
   * - Category spending breakdown: categoryId, categoryName, totalAmount, amountPaise, percentage, transactionCount
   * - Income vs Expense comparison
   * - Dynamic accountId filtering when specified
   */
  async getAnalytics(userId: string, options?: AnalyticsOptions) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userSettings: true },
    });

    const startDay = user?.userSettings?.financialMonthStartDay ?? 1;
    const accountFilter = options?.accountId ? { accountId: options.accountId } : {};

    let accountInfo = null;
    if (options?.accountId) {
      const acc = await prisma.account.findFirst({
        where: { id: options.accountId, userId },
        select: { id: true, name: true, institution: true, accountType: true, currentBalance: true },
      });
      if (acc) {
        accountInfo = {
          id: acc.id,
          name: acc.name,
          institution: acc.institution,
          accountType: acc.accountType,
          currentBalance: Number(acc.currentBalance) / 100,
        };
      }
    }

    // Parse target date for primary month
    let targetDate = new Date();
    if (options?.month) {
      const [y, m] = options.month.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        targetDate = new Date(y, m - 1, startDay);
      }
    }

    const currentPeriod = getFinancialMonthRange(startDay, targetDate);
    const monthStr = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}`;

    // 1. Build 6-Month Historical Trends
    // Generate dates for the 6 months ending at currentPeriod
    const spendingTrends = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, Math.min(startDay, 28));
      const period = getFinancialMonthRange(startDay, ref);
      const mStr = `${period.year}-${String(period.month).padStart(2, '0')}`;
      const mLabel = `${MONTH_NAMES[period.month - 1]} ${period.year}`;

      const [earnedAgg, spentAgg, investedAgg] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            status: 'ACTIVE',
            direction: 'CREDIT',
            type: 'INCOME',
            txnDate: { gte: period.start, lt: period.end },
            ...accountFilter,
          },
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            status: 'ACTIVE',
            direction: 'DEBIT',
            type: 'EXPENSE',
            txnDate: { gte: period.start, lt: period.end },
            ...accountFilter,
          },
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            status: 'ACTIVE',
            direction: 'DEBIT',
            type: 'INVESTMENT',
            txnDate: { gte: period.start, lt: period.end },
            ...accountFilter,
          },
        }),
      ]);

      const earnedPaise = Number(earnedAgg._sum?.amount || BigInt(0));
      const spentPaise = Number(spentAgg._sum?.amount || BigInt(0));
      const investedPaise = Number(investedAgg._sum?.amount || BigInt(0));
      const netSavingsPaise = earnedPaise - spentPaise;
      const savingsRate =
        earnedPaise > 0 ? Math.round((netSavingsPaise / earnedPaise) * 100) : 0;

      spendingTrends.push({
        month: mStr,
        monthLabel: mLabel,
        label: mLabel,
        earned: earnedPaise / 100,
        earnedPaise,
        spent: spentPaise / 100,
        spentPaise,
        invested: investedPaise / 100,
        investedPaise,
        netSavings: netSavingsPaise / 100,
        netSavingsPaise,
        savingsRate,
      });
    }

    // 2. Category Spending Breakdown for current period or custom range
    const breakdownStart = options?.startDate ? new Date(options.startDate) : currentPeriod.start;
    const breakdownEnd = options?.endDate ? new Date(options.endDate) : currentPeriod.end;

    const expenseTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        direction: 'DEBIT',
        type: 'EXPENSE',
        txnDate: { gte: breakdownStart, lt: breakdownEnd },
        ...accountFilter,
      },
      include: {
        category: true,
      },
    });

    let totalExpensePaise = 0;
    const catMap = new Map<
      string,
      { categoryId: string | null; categoryName: string; amountPaise: number; count: number }
    >();

    for (const t of expenseTxns) {
      const amt = Number(t.amount);
      totalExpensePaise += amt;
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Uncategorized';

      const existing = catMap.get(catId);
      if (existing) {
        existing.amountPaise += amt;
        existing.count += 1;
      } else {
        catMap.set(catId, {
          categoryId: t.categoryId,
          categoryName: catName,
          amountPaise: amt,
          count: 1,
        });
      }
    }

    const expenseCategoryBreakdown = Array.from(catMap.values())
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: item.amountPaise / 100,
        amountPaise: item.amountPaise,
        percentage:
          totalExpensePaise > 0
            ? Math.round((item.amountPaise / totalExpensePaise) * 100 * 10) / 10
            : 0,
        transactionCount: item.count,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // Income Category Breakdown
    const incomeTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        direction: 'CREDIT',
        type: 'INCOME',
        txnDate: { gte: currentPeriod.start, lt: currentPeriod.end },
        ...accountFilter,
      },
      include: {
        category: true,
      },
    });

    let totalIncomePaise = 0;
    const incomeCatMap = new Map<
      string,
      { categoryId: string | null; categoryName: string; amountPaise: number; count: number }
    >();

    for (const t of incomeTxns) {
      const amt = Number(t.amount);
      totalIncomePaise += amt;
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Uncategorized';

      const existing = incomeCatMap.get(catId);
      if (existing) {
        existing.amountPaise += amt;
        existing.count += 1;
      } else {
        incomeCatMap.set(catId, {
          categoryId: t.categoryId,
          categoryName: catName,
          amountPaise: amt,
          count: 1,
        });
      }
    }

    const incomeCategoryBreakdown = Array.from(incomeCatMap.values())
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: item.amountPaise / 100,
        amountPaise: item.amountPaise,
        percentage:
          totalIncomePaise > 0
            ? Math.round((item.amountPaise / totalIncomePaise) * 100 * 10) / 10
            : 0,
        transactionCount: item.count,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // Investment Category Breakdown
    const investmentTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        direction: 'DEBIT',
        type: 'INVESTMENT',
        txnDate: { gte: currentPeriod.start, lt: currentPeriod.end },
        ...accountFilter,
      },
      include: {
        category: true,
      },
    });

    let totalInvestmentPaise = 0;
    const investmentCatMap = new Map<
      string,
      { categoryId: string | null; categoryName: string; amountPaise: number; count: number }
    >();

    for (const t of investmentTxns) {
      const amt = Number(t.amount);
      totalInvestmentPaise += amt;
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Other Investments';

      const existing = investmentCatMap.get(catId);
      if (existing) {
        existing.amountPaise += amt;
        existing.count += 1;
      } else {
        investmentCatMap.set(catId, {
          categoryId: t.categoryId,
          categoryName: catName,
          amountPaise: amt,
          count: 1,
        });
      }
    }

    const investmentCategoryBreakdown = Array.from(investmentCatMap.values())
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: item.amountPaise / 100,
        amountPaise: item.amountPaise,
        percentage:
          totalInvestmentPaise > 0
            ? Math.round((item.amountPaise / totalInvestmentPaise) * 100 * 10) / 10
            : 0,
        transactionCount: item.count,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // 3. Current Month Summary & Comparison
    const currentTrend = spendingTrends[spendingTrends.length - 1];
    const monthlyComparison = {
      earned: currentTrend.earned,
      earnedPaise: currentTrend.earnedPaise,
      spent: currentTrend.spent,
      spentPaise: currentTrend.spentPaise,
      invested: currentTrend.invested,
      investedPaise: currentTrend.investedPaise,
      netSavings: currentTrend.netSavings,
      netSavingsPaise: currentTrend.netSavingsPaise,
      savingsRate: currentTrend.savingsRate,
    };

    const startStr = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}-${String(currentPeriod.start.getDate()).padStart(2, '0')}`;
    const inclusiveEndDate = new Date(currentPeriod.end.getTime() - 1);
    const endStr = `${inclusiveEndDate.getFullYear()}-${String(inclusiveEndDate.getMonth() + 1).padStart(2, '0')}-${String(inclusiveEndDate.getDate()).padStart(2, '0')}`;

    return {
      period: {
        month: monthStr,
        year: currentPeriod.year,
        monthNumber: currentPeriod.month,
        startDate: startStr,
        endDate: endStr,
      },
      account: accountInfo,
      summary: monthlyComparison,
      spendingTrends,
      categoryBreakdown: expenseCategoryBreakdown,
      expenseCategoryBreakdown,
      incomeCategoryBreakdown,
      investmentCategoryBreakdown,
      monthlyComparison,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
