import { prisma } from '../lib/prisma.js';
import { getFinancialMonthRange } from './famService.js';
import { formatTransaction } from './transactionService.js';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export class InvestmentService {
  // Return investment metrics, target comparison, breakdowns, and historical trend
  async getInvestmentsOverview(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        financeProfile: true,
        userSettings: true,
      },
    });

    const startDay = user?.userSettings?.financialMonthStartDay ?? 1;
    const now = new Date();
    const currentPeriod = getFinancialMonthRange(startDay, now);

    // 1. All-time active investment transactions
    const allInvestments = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        type: 'INVESTMENT',
      },
      include: {
        account: true,
        category: true,
        merchant: true,
      },
      orderBy: { txnDate: 'desc' },
    });

    let totalInvestedPaise = 0;
    let monthlyInvestedPaise = 0;

    const catMap = new Map<
      string,
      { categoryId: string | null; categoryName: string; amountPaise: number; count: number }
    >();

    for (const t of allInvestments) {
      const amt = Number(t.amount);
      totalInvestedPaise += amt;

      // Check if within current financial month
      const tDate = new Date(t.txnDate);
      if (tDate >= currentPeriod.start && tDate < currentPeriod.end) {
        monthlyInvestedPaise += amt;
      }

      // Group by category
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Other Investments';
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

    // 2. Target vs Actual comparison
    const targetPaise = user?.financeProfile?.monthlyInvestmentTarget
      ? Number(user.financeProfile.monthlyInvestmentTarget)
      : 0;
    const diffPaise = monthlyInvestedPaise - targetPaise;
    const percentageAchieved =
      targetPaise > 0
        ? Math.round((monthlyInvestedPaise / targetPaise) * 100)
        : monthlyInvestedPaise > 0
        ? 100
        : 0;

    const targetComparison = {
      target: targetPaise / 100,
      targetPaise,
      actual: monthlyInvestedPaise / 100,
      actualPaise: monthlyInvestedPaise,
      diff: diffPaise / 100,
      diffPaise,
      percentageAchieved,
    };

    // 3. Category Breakdown
    const totalForPercent = totalInvestedPaise > 0 ? totalInvestedPaise : 1;
    const categoryBreakdown = Array.from(catMap.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        totalAmount: c.amountPaise / 100,
        amountPaise: c.amountPaise,
        percentage: Math.round((c.amountPaise / totalForPercent) * 100 * 10) / 10,
        transactionCount: c.count,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // 4. Recent Investments (top 10)
    const recentInvestments = allInvestments.slice(0, 10).map(formatTransaction);

    // 5. 6-Month Historical Investment Trend
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, startDay);
      const p = getFinancialMonthRange(startDay, ref);
      const mStr = `${p.year}-${String(p.month).padStart(2, '0')}`;
      const mLabel = `${MONTH_NAMES[p.month - 1]} ${p.year}`;

      let mTotalPaise = 0;
      for (const t of allInvestments) {
        const d = new Date(t.txnDate);
        if (d >= p.start && d < p.end) {
          mTotalPaise += Number(t.amount);
        }
      }

      monthlyTrend.push({
        month: mStr,
        monthLabel: mLabel,
        amount: mTotalPaise / 100,
        amountPaise: mTotalPaise,
      });
    }

    return {
      totalInvested: totalInvestedPaise / 100,
      totalInvestedPaise,
      monthlyInvested: monthlyInvestedPaise / 100,
      monthlyInvestedPaise,
      targetComparison,
      categoryBreakdown,
      recentInvestments,
      monthlyTrend,
    };
  }
}

export const investmentService = new InvestmentService();
export default investmentService;
