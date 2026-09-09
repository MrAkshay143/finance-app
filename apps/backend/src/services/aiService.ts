import { prisma } from '../lib/prisma.js';
import { getFinancialMonthRange } from './famService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { getCurrencyByCode } from '@finance/shared-types';

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export class AiService {
  /**
   * Generates comprehensive AI financial intelligence analysis for a requested financial month:
   * - Monthly allocation ratios vs standard 50/30/20 guidelines
   * - Forward wealth projections across 3, 6, and 12-month horizons with compound growth
   * - Actionable, personalized suggestions based on actual spending and investment ratios
   */
  async getAiAnalysis(userId: string, monthStr?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        financeProfile: true,
        userSettings: true,
        goals: { where: { status: 'ACTIVE' } },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const startDay = user.userSettings?.financialMonthStartDay ?? 1;

    let targetDate = new Date();
    if (monthStr) {
      const [y, m] = monthStr.split('-').map(Number);
      if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
        throw new ValidationError('Invalid month format. Expected YYYY-MM');
      }
      targetDate = new Date(y, m - 1, startDay);
    }

    const period = getFinancialMonthRange(startDay, targetDate);
    const resolvedMonth = `${period.year}-${String(period.month).padStart(2, '0')}`;
    const monthLabel = `${FULL_MONTH_NAMES[period.month - 1]} ${period.year}`;

    // 1. Compute month's actual transaction totals
    const [earnedAgg, spentAgg, investedAgg, topExpenseCategories] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          status: 'ACTIVE',
          direction: 'CREDIT',
          type: 'INCOME',
          txnDate: { gte: period.start, lt: period.end },
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
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          direction: 'DEBIT',
          type: 'EXPENSE',
          txnDate: { gte: period.start, lt: period.end },
        },
        include: { category: true },
      }),
    ]);

    const earnedPaise = Number(earnedAgg._sum?.amount || BigInt(0));
    const spentPaise = Number(spentAgg._sum?.amount || BigInt(0));
    const investedPaise = Number(investedAgg._sum?.amount || BigInt(0));
    const netSavingsPaise = earnedPaise - spentPaise;

    const expectedIncomePaise = user.financeProfile?.monthlyIncome
      ? Number(user.financeProfile.monthlyIncome)
      : 0;
    const baseEarned = earnedPaise > 0 ? earnedPaise : expectedIncomePaise;
    const needsRatio = baseEarned > 0 ? Math.round((spentPaise / baseEarned) * 100) : 0;
    const investmentRatio = baseEarned > 0 ? Math.round((investedPaise / baseEarned) * 100) : 0;
    const savingsRate = baseEarned > 0 ? Math.round((netSavingsPaise / baseEarned) * 100) : 0;

    const monthlyAnalysis = {
      earned: earnedPaise / 100,
      earnedPaise,
      spent: spentPaise / 100,
      spentPaise,
      invested: investedPaise / 100,
      investedPaise,
      netSavings: netSavingsPaise / 100,
      netSavingsPaise,
      needsRatio,
      investmentRatio,
      savingsRate,
      benchmarks: {
        needsTarget: 50,
        wantsTarget: 30,
        savingsAndInvestmentTarget: 20,
      },
    };

    // 2. Compute Forward Projections
    // Annual return rate based on user's risk appetite: CONSERVATIVE (6%), AGGRESSIVE (12%), MODERATE/default (8%)
    const riskAppetite = (user.financeProfile?.riskAppetite || '').toUpperCase();
    const annualReturnRate =
      riskAppetite === 'CONSERVATIVE' || riskAppetite === 'LOW'
        ? 0.06
        : riskAppetite === 'AGGRESSIVE' || riskAppetite === 'HIGH'
        ? 0.12
        : 0.08;
    const monthlyReturnRate = annualReturnRate / 12;
    const currentSurplusPaise = Math.max(0, netSavingsPaise);
    const monthlyInvestmentBasePaise =
      investedPaise > 0 ? investedPaise : Math.round(currentSurplusPaise * 0.4);

    const horizons = [
      { months: 3, label: '3 Months' },
      { months: 6, label: '6 Months' },
      { months: 12, label: '12 Months' },
    ];

    const forwardProjections = horizons.map(({ months, label }) => {
      // Linear savings accumulation
      const projectedSavingsPaise = currentSurplusPaise * months;

      // Future value of an ordinary annuity: FV = P * [((1 + r)^n - 1) / r]
      let fvFactor = months;
      if (monthlyReturnRate > 0) {
        fvFactor = (Math.pow(1 + monthlyReturnRate, months) - 1) / monthlyReturnRate;
      }
      const projectedWealthPaise = Math.round(monthlyInvestmentBasePaise * fvFactor);

      return {
        horizonMonths: months,
        label,
        projectedSavings: projectedSavingsPaise / 100,
        projectedSavingsPaise,
        projectedWealth: projectedWealthPaise / 100,
        projectedWealthPaise,
        assumedAnnualReturnRate: annualReturnRate,
      };
    });

    // 3. Smart Suggestions tailored to user's real numbers
    const suggestions = [];

    // Find highest expense category
    const catMap = new Map<string, { name: string; amountPaise: number }>();
    for (const t of topExpenseCategories) {
      const name = t.category?.name || 'Discretionary Expenses';
      const prev = catMap.get(name) || { name, amountPaise: 0 };
      prev.amountPaise += Number(t.amount);
      catMap.set(name, prev);
    }
    const sortedCats = Array.from(catMap.values()).sort((a, b) => b.amountPaise - a.amountPaise);
    const topCat = sortedCats[0];

    const userCurrency = user.userSettings?.currency || 'INR';
    const currMeta = getCurrencyByCode(userCurrency);
    const formatMoney = (paise: number) =>
      `${currMeta.symbol}${(paise / 100).toLocaleString(currMeta.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: currMeta.decimalPlaces,
      })}`;

    // High expenses rule
    if (needsRatio > 55 && topCat) {
      const potentialCutPaise = Math.round(topCat.amountPaise * 0.15);
      suggestions.push({
        id: 'sug-curb-top-category',
        category: 'EXPENSE_OPTIMIZATION',
        priority: 'HIGH' as const,
        title: `Optimize spending in ${topCat.name}`,
        description: `${topCat.name} accounted for ${formatMoney(topCat.amountPaise)}. Trimming 15% would liberate ${formatMoney(potentialCutPaise)} towards your monthly investments.`,
        potentialImpactPaise: potentialCutPaise,
        actionType: 'BUDGET_ADJUSTMENT',
      });
    }

    // Low investment allocation rule
    if (investmentRatio < 20) {
      const suggestedSipPaise = Math.round(baseEarned * 0.2) - investedPaise;
      suggestions.push({
        id: 'sug-increase-investments',
        category: 'INVESTMENT_GROWTH',
        priority: 'HIGH' as const,
        title: 'Establish a 20% Systematic Investment Allocation',
        description: `Your investment allocation currently sits at ${investmentRatio}%. Increasing monthly systematic investments by ${formatMoney(Math.max(suggestedSipPaise, 100000))} will keep your long-term wealth trajectory on track.`,
        potentialImpactPaise: suggestedSipPaise,
        actionType: 'CREATE_RECURRING_INVESTMENT',
      });
    } else {
      suggestions.push({
        id: 'sug-maintain-investments',
        category: 'INVESTMENT_GROWTH',
        priority: 'LOW' as const,
        title: 'Solid Investment Trajectory',
        description: `You are investing ${investmentRatio}% of monthly income, outperforming the conventional 20% target. Continue reinvesting periodic capital gains.`,
        actionType: 'PORTFOLIO_REVIEW',
      });
    }

    // High liquid cash with low investment rule
    if (savingsRate > 35 && investmentRatio < 25) {
      const deployablePaise = Math.round(netSavingsPaise * 0.5);
      suggestions.push({
        id: 'sug-deploy-idle-cash',
        category: 'CAPITAL_ALLOCATION',
        priority: 'MEDIUM' as const,
        title: 'Deploy Idle Savings to Low-Volatility Assets',
        description: `Your net savings rate is ${savingsRate}%. Transferring ${formatMoney(deployablePaise)} of excess liquid cash into fixed income or liquid funds will protect purchasing power against inflation.`,
        potentialImpactPaise: deployablePaise,
        actionType: 'TRANSFER_TO_INVESTMENTS',
      });
    }

    // Goals acceleration check
    if (user.goals && user.goals.length > 0) {
      const goal = user.goals[0];
      const remainingPaise = Number(goal.targetAmount) - Number(goal.currentAmount);
      if (remainingPaise > 0 && currentSurplusPaise > 0) {
        const monthsToGoal = Math.ceil(remainingPaise / currentSurplusPaise);
        suggestions.push({
          id: 'sug-goal-acceleration',
          category: 'GOAL_ACCELERATION',
          priority: 'MEDIUM' as const,
          title: `Accelerate ${goal.name}`,
          description: `At your current monthly surplus of ${formatMoney(currentSurplusPaise)}, you are on course to fulfill this goal within ${monthsToGoal} month(s).`,
          potentialImpactPaise: remainingPaise,
          actionType: 'ALLOCATE_TO_GOAL',
        });
      }
    }

    // Baseline fallback suggestion if list is sparse
    if (suggestions.length < 2) {
      suggestions.push({
        id: 'sug-emergency-fund',
        category: 'FINANCIAL_SECURITY',
        priority: 'LOW' as const,
        title: 'Maintain 6-Month Emergency Liquidity',
        description: 'Ensure an emergency reserve equal to 6 months of baseline living expenses is maintained in high-liquidity accounts before deploying capital into long-horizon instruments.',
        actionType: 'EMERGENCY_RESERVE',
      });
    }

    const summaryNote = `Analysis for ${monthLabel}: Income realized at ${formatMoney(earnedPaise)} with ${formatMoney(spentPaise)} in expenses and ${formatMoney(investedPaise)} deployed into investments. Net monthly savings rate is ${savingsRate}%.`;

    return {
      month: resolvedMonth,
      monthLabel,
      analysisDate: new Date().toISOString(),
      monthlyAnalysis,
      forwardProjections,
      suggestions,
      summaryNote,
    };
  }
}

export const aiService = new AiService();
export default aiService;
