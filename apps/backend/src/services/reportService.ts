import { prisma } from '../lib/prisma.js';
import { famService, getFinancialMonthRange } from './famService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { getCurrencyByCode } from '@finance/shared-types';

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export class ReportService {
  /**
   * Generates comprehensive monthly financial report integrating FAM score,
   * Target vs Actual comparisons, callout cards, and category breakdowns.
   */
  async getMonthlyReport(userId: string, month: string) {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new ValidationError('Invalid month format. Expected YYYY-MM');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        financeProfile: true,
        userSettings: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const startDay = user.userSettings?.financialMonthStartDay ?? 1;
    const refDate = new Date(year, monthNum - 1, startDay);
    const period = getFinancialMonthRange(startDay, refDate);

    // 1. FAM score
    const famScore = await famService.getFamScore(userId, {
      month: monthNum,
      year,
      refDate,
    });

    // 2. Target vs Actual Metrics
    const fp = user.financeProfile;
    const incomeTargetPaise = fp ? Number(fp.monthlyIncome || 0) : 0;
    const expenseBudgetPaise = fp ? Number(fp.monthlyExpenseBudget || 0) : 0;
    const investmentTargetPaise = fp ? Number(fp.monthlyInvestmentTarget || 0) : 0;

    const earnedPaise = famScore.income.actualPaise;
    const spentPaise = famScore.expense.actualPaise;
    const investedPaise = famScore.investment.actualPaise;
    const netSavingsPaise = earnedPaise - spentPaise;

    const incomeDiffPaise = earnedPaise - incomeTargetPaise;
    const incomePercentage =
      incomeTargetPaise > 0 ? Math.round((earnedPaise / incomeTargetPaise) * 100) : 100;

    const expenseDiffPaise = expenseBudgetPaise - spentPaise;
    const expensePercentage =
      expenseBudgetPaise > 0 ? Math.round((spentPaise / expenseBudgetPaise) * 100) : 0;

    const investmentDiffPaise = investedPaise - investmentTargetPaise;
    const investmentPercentage =
      investmentTargetPaise > 0 ? Math.round((investedPaise / investmentTargetPaise) * 100) : 100;

    const savingsRate =
      earnedPaise > 0 ? Math.round((netSavingsPaise / earnedPaise) * 100) : 0;

    const targetVsActual = {
      income: {
        metric: 'income',
        label: 'Earned vs Income Target',
        target: incomeTargetPaise / 100,
        targetPaise: incomeTargetPaise,
        actual: earnedPaise / 100,
        actualPaise: earnedPaise,
        diff: incomeDiffPaise / 100,
        diffPaise: incomeDiffPaise,
        percentageAchieved: incomePercentage,
        status:
          incomePercentage >= 100 ? 'EXCELLENT' : incomePercentage >= 70 ? 'GOOD' : 'POOR',
      },
      expense: {
        metric: 'expense',
        label: 'Spent vs Expense Budget',
        target: expenseBudgetPaise / 100,
        targetPaise: expenseBudgetPaise,
        actual: spentPaise / 100,
        actualPaise: spentPaise,
        diff: expenseDiffPaise / 100,
        diffPaise: expenseDiffPaise,
        percentageAchieved: expensePercentage,
        status:
          expensePercentage <= 80 ? 'EXCELLENT' : expensePercentage <= 100 ? 'GOOD' : 'POOR',
      },
      investment: {
        metric: 'investment',
        label: 'Invested vs Investment Target',
        target: investmentTargetPaise / 100,
        targetPaise: investmentTargetPaise,
        actual: investedPaise / 100,
        actualPaise: investedPaise,
        diff: investmentDiffPaise / 100,
        diffPaise: investmentDiffPaise,
        percentageAchieved: investmentPercentage,
        status:
          investmentPercentage >= 100
            ? 'EXCELLENT'
            : investmentPercentage >= 70
            ? 'GOOD'
            : 'POOR',
      },
      netSavings: {
        actual: netSavingsPaise / 100,
        actualPaise: netSavingsPaise,
        savingsRate,
      },
    };

    // 3. Improvement Areas Callout Cards based on actual variances
    const callouts = [];
    const userCurrency = user.userSettings?.currency || 'INR';
    const currMeta = getCurrencyByCode(userCurrency);

    // Expense Variance Callout
    if (expenseBudgetPaise > 0 && spentPaise > expenseBudgetPaise) {
      const overspendAmount = ((spentPaise - expenseBudgetPaise) / 100).toLocaleString(currMeta.locale, {
        maximumFractionDigits: currMeta.decimalPlaces,
      });
      const budgetAmount = (expenseBudgetPaise / 100).toLocaleString(currMeta.locale, {
        maximumFractionDigits: currMeta.decimalPlaces,
      });
      callouts.push({
        id: 'callout-expense-overspend',
        area: 'EXPENSE',
        title: 'Expense Budget Exceeded',
        status: 'danger',
        message: `Total expenses exceeded your ${currMeta.symbol}${budgetAmount} budget by ${currMeta.symbol}${overspendAmount}. Review discretionary categories to bring outflows back within limits.`,
        diffPaise: spentPaise - expenseBudgetPaise,
      });
    } else if (expenseBudgetPaise > 0 && spentPaise <= expenseBudgetPaise * 0.8) {
      callouts.push({
        id: 'callout-expense-disciplined',
        area: 'EXPENSE',
        title: 'Disciplined Spending',
        status: 'success',
        message: `Excellent expense discipline. Spending remained under 80% of your allocated budget this month.`,
      });
    }

    // Investment Variance Callout
    if (investmentTargetPaise > 0 && investedPaise < investmentTargetPaise) {
      const shortfallAmount = ((investmentTargetPaise - investedPaise) / 100).toLocaleString(currMeta.locale, {
        maximumFractionDigits: currMeta.decimalPlaces,
      });
      callouts.push({
        id: 'callout-investment-shortfall',
        area: 'INVESTMENT',
        title: 'Investment Target Shortfall',
        status: 'warning',
        message: `Investments fell short of target by ${currMeta.symbol}${shortfallAmount} (${investmentPercentage}% achieved). Consider allocating unspent surplus into systematic investments.`,
        diffPaise: investmentTargetPaise - investedPaise,
      });
    } else if (investmentTargetPaise > 0 && investedPaise >= investmentTargetPaise) {
      callouts.push({
        id: 'callout-investment-achieved',
        area: 'INVESTMENT',
        title: 'Investment Target Fulfilled',
        status: 'success',
        message: `Target achieved. You successfully allocated 100% or more of your planned investment goal this month.`,
      });
    }

    // Income Variance Callout
    if (incomeTargetPaise > 0 && earnedPaise < incomeTargetPaise) {
      const incomeGap = ((incomeTargetPaise - earnedPaise) / 100).toLocaleString(currMeta.locale, {
        maximumFractionDigits: currMeta.decimalPlaces,
      });
      callouts.push({
        id: 'callout-income-gap',
        area: 'INCOME',
        title: 'Income Below Monthly Target',
        status: 'info',
        message: `Monthly income was ${currMeta.symbol}${incomeGap} lower than projected (${incomePercentage}% realized).`,
        diffPaise: incomeTargetPaise - earnedPaise,
      });
    }

    // Default encouragement card if no negative callouts exist
    if (callouts.length === 0) {
      callouts.push({
        id: 'callout-overall-healthy',
        area: 'SAVINGS',
        title: 'Consistent Financial Health',
        status: 'success',
        message: `Balanced month. Expenses and investments were well-managed relative to your target profiles.`,
      });
    }

    // 4. Category Summary Table
    const monthTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        txnDate: { gte: period.start, lt: period.end },
      },
      include: { category: true },
    });

    const categorySummaryMap = new Map<
      string,
      {
        categoryId: string | null;
        categoryName: string;
        type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
        amountPaise: number;
        count: number;
      }
    >();

    for (const t of monthTxns) {
      const amt = Number(t.amount);
      const key = `${t.type}:${t.categoryId || 'uncat'}`;
      const existing = categorySummaryMap.get(key);
      if (existing) {
        existing.amountPaise += amt;
        existing.count += 1;
      } else {
        categorySummaryMap.set(key, {
          categoryId: t.categoryId,
          categoryName: t.category?.name || 'Uncategorized',
          type: t.type as any,
          amountPaise: amt,
          count: 1,
        });
      }
    }

    const totalSpentPaise = spentPaise > 0 ? spentPaise : 1;
    const categorySummary = Array.from(categorySummaryMap.values()).map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      type: item.type,
      totalAmount: item.amountPaise / 100,
      amountPaise: item.amountPaise,
      percentage:
        item.type === 'EXPENSE'
          ? Math.round((item.amountPaise / totalSpentPaise) * 100 * 10) / 10
          : 0,
      transactionCount: item.count,
    }));

    const monthLabel = `${FULL_MONTH_NAMES[monthNum - 1]} ${year}`;

    return {
      month,
      monthLabel,
      year,
      periodStart: period.start.toISOString(),
      periodEnd: period.end.toISOString(),
      famScore,
      targetVsActual,
      callouts,
      categorySummary,
      totals: {
        earnedPaise,
        spentPaise,
        investedPaise,
        netSavingsPaise,
        transactionCount: monthTxns.length,
      },
    };
  }

  /**
   * Generates downloadable report export in JSON or CSV format.
   */
  async exportReport(userId: string, month: string, format: 'json' | 'csv' = 'json') {
    const report = await this.getMonthlyReport(userId, month);

    if (format === 'json') {
      return {
        format: 'json',
        filename: `finance-report-${month}.json`,
        mimeType: 'application/json',
        data: report,
      };
    }

    // CSV format generation
    const lines: string[] = [];
    lines.push(`Finance Tracker Monthly Report - ${report.monthLabel}`);
    lines.push(`Generated on,${new Date().toISOString()}`);
    lines.push('');

    // Target vs Actual Table
    lines.push('Target vs Actual Summary');
    lines.push('Metric,Target (INR),Actual (INR),Difference (INR),Percentage');
    lines.push(
      `Earned vs Income Target,${report.targetVsActual.income.target},${report.targetVsActual.income.actual},${report.targetVsActual.income.diff},${report.targetVsActual.income.percentageAchieved}%`
    );
    lines.push(
      `Spent vs Expense Budget,${report.targetVsActual.expense.target},${report.targetVsActual.expense.actual},${report.targetVsActual.expense.diff},${report.targetVsActual.expense.percentageAchieved}%`
    );
    lines.push(
      `Invested vs Investment Target,${report.targetVsActual.investment.target},${report.targetVsActual.investment.actual},${report.targetVsActual.investment.diff},${report.targetVsActual.investment.percentageAchieved}%`
    );
    lines.push(
      `Net Savings,-,${report.targetVsActual.netSavings.actual},-,Savings Rate: ${report.targetVsActual.netSavings.savingsRate}%`
    );
    lines.push('');

    // Category Summary
    lines.push('Category Breakdown');
    lines.push('Category,Type,Amount (INR),Percentage,Transactions');
    for (const c of report.categorySummary) {
      lines.push(
        `"${c.categoryName}",${c.type},${c.totalAmount},${c.percentage}%,${c.transactionCount}`
      );
    }

    const csvData = lines.join('\n');

    return {
      format: 'csv',
      filename: `finance-report-${month}.csv`,
      mimeType: 'text/csv',
      data: csvData,
    };
  }

  /**
   * Generates annual financial report aggregating months 1-12 for the specified year.
   */
  async getAnnualReport(userId: string, yearNum: number) {
    const year = isNaN(yearNum) ? new Date().getFullYear() : yearNum;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const yearTxns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        txnDate: { gte: startOfYear, lt: endOfYear },
      },
      include: { category: true },
    });

    let totalIncomePaise = 0;
    let totalExpensePaise = 0;
    let totalInvestedPaise = 0;

    // Monthly breakdown array (12 months)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: `${year}-${String(i + 1).padStart(2, '0')}`,
      monthName: FULL_MONTH_NAMES[i],
      income: 0,
      incomePaise: 0,
      expense: 0,
      expensePaise: 0,
      invested: 0,
      investedPaise: 0,
      netSavings: 0,
      netSavingsPaise: 0,
    }));

    const expenseCategoryMap = new Map<string, { categoryName: string; amountPaise: number }>();
    const incomeCategoryMap = new Map<string, { categoryName: string; amountPaise: number }>();

    for (const t of yearTxns) {
      const amt = Number(t.amount);
      const mIdx = new Date(t.txnDate).getMonth();

      if (t.type === 'INCOME') {
        totalIncomePaise += amt;
        monthlyData[mIdx].incomePaise += amt;
        const catName = t.category?.name || 'Uncategorized';
        const ex = incomeCategoryMap.get(catName);
        if (ex) ex.amountPaise += amt;
        else incomeCategoryMap.set(catName, { categoryName: catName, amountPaise: amt });
      } else if (t.type === 'EXPENSE') {
        totalExpensePaise += amt;
        monthlyData[mIdx].expensePaise += amt;
        const catName = t.category?.name || 'Uncategorized';
        const ex = expenseCategoryMap.get(catName);
        if (ex) ex.amountPaise += amt;
        else expenseCategoryMap.set(catName, { categoryName: catName, amountPaise: amt });
      } else if (t.type === 'INVESTMENT') {
        totalInvestedPaise += amt;
        monthlyData[mIdx].investedPaise += amt;
      }
    }

    for (const m of monthlyData) {
      m.income = m.incomePaise / 100;
      m.expense = m.expensePaise / 100;
      m.invested = m.investedPaise / 100;
      m.netSavingsPaise = m.incomePaise - m.expensePaise;
      m.netSavings = m.netSavingsPaise / 100;
    }

    const netSavingsPaise = totalIncomePaise - totalExpensePaise;
    const savingsRate = totalIncomePaise > 0 ? Math.round((netSavingsPaise / totalIncomePaise) * 100) : 0;

    const topExpenseCategories = Array.from(expenseCategoryMap.values())
      .map((c) => ({
        categoryName: c.categoryName,
        totalAmount: c.amountPaise / 100,
        amountPaise: c.amountPaise,
        percentage: totalExpensePaise > 0 ? Math.round((c.amountPaise / totalExpensePaise) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise)
      .slice(0, 6);

    const topIncomeCategories = Array.from(incomeCategoryMap.values())
      .map((c) => ({
        categoryName: c.categoryName,
        totalAmount: c.amountPaise / 100,
        amountPaise: c.amountPaise,
        percentage: totalIncomePaise > 0 ? Math.round((c.amountPaise / totalIncomePaise) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise)
      .slice(0, 6);

    // Find best savings month
    let bestMonth = monthlyData[0];
    let hasPositiveSavings = false;
    for (const m of monthlyData) {
      if (m.netSavingsPaise > 0) {
        hasPositiveSavings = true;
      }
      if (m.netSavingsPaise > bestMonth.netSavingsPaise) {
        bestMonth = m;
      }
    }

    const currentYear = new Date().getFullYear();
    const elapsedMonths =
      year === currentYear ? Math.max(1, Math.min(12, new Date().getMonth() + 1)) : 12;

    return {
      year,
      totals: {
        totalIncome: totalIncomePaise / 100,
        totalIncomePaise,
        totalExpense: totalExpensePaise / 100,
        totalExpensePaise,
        totalInvested: totalInvestedPaise / 100,
        totalInvestedPaise,
        netSavings: netSavingsPaise / 100,
        netSavingsPaise,
        savingsRate,
        transactionCount: yearTxns.length,
      },
      months: monthlyData,
      topExpenseCategories,
      topIncomeCategories,
      averageMonthlyIncome: Math.round(totalIncomePaise / elapsedMonths / 100),
      averageMonthlyExpense: Math.round(totalExpensePaise / elapsedMonths / 100),
      bestSavingsMonth: hasPositiveSavings ? bestMonth.monthName : '—',
    };
  }

  /**
   * Generates custom date range financial report between startDate and endDate.
   */
  async getCustomRangeReport(userId: string, startDateStr: string, endDateStr: string) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format for custom range report. Expected YYYY-MM-DD');
    }

    // Include the full end day
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new ValidationError('Start date must be before or equal to end date.');
    }

    const txns = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        txnDate: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { txnDate: 'asc' },
    });

    let totalIncomePaise = 0;
    let totalExpensePaise = 0;
    let totalInvestedPaise = 0;

    const categoryMap = new Map<string, {
      categoryName: string;
      type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
      amountPaise: number;
      count: number;
    }>();

    const dailyMap = new Map<string, { date: string; incomePaise: number; expensePaise: number }>();

    for (const t of txns) {
      const amt = Number(t.amount);
      const dateKey = new Date(t.txnDate).toISOString().slice(0, 10);

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, incomePaise: 0, expensePaise: 0 });
      }
      const dayItem = dailyMap.get(dateKey)!;

      if (t.type === 'INCOME') {
        totalIncomePaise += amt;
        dayItem.incomePaise += amt;
      } else if (t.type === 'EXPENSE') {
        totalExpensePaise += amt;
        dayItem.expensePaise += amt;
      } else if (t.type === 'INVESTMENT') {
        totalInvestedPaise += amt;
      }

      const catKey = `${t.type}:${t.category?.name || 'Uncategorized'}`;
      const ex = categoryMap.get(catKey);
      if (ex) {
        ex.amountPaise += amt;
        ex.count += 1;
      } else {
        categoryMap.set(catKey, {
          categoryName: t.category?.name || 'Uncategorized',
          type: t.type as any,
          amountPaise: amt,
          count: 1,
        });
      }
    }

    const netSavingsPaise = totalIncomePaise - totalExpensePaise;
    const savingsRate = totalIncomePaise > 0 ? Math.round((netSavingsPaise / totalIncomePaise) * 100) : 0;

    const categorySummary = Array.from(categoryMap.values()).map((c) => ({
      categoryName: c.categoryName,
      type: c.type,
      totalAmount: c.amountPaise / 100,
      amountPaise: c.amountPaise,
      percentage:
        c.type === 'EXPENSE' && totalExpensePaise > 0
          ? Math.round((c.amountPaise / totalExpensePaise) * 1000) / 10
          : c.type === 'INCOME' && totalIncomePaise > 0
          ? Math.round((c.amountPaise / totalIncomePaise) * 1000) / 10
          : 0,
      transactionCount: c.count,
    })).sort((a, b) => b.amountPaise - a.amountPaise);

    const dailyTrend = Array.from(dailyMap.values()).map((d) => ({
      date: d.date,
      income: d.incomePaise / 100,
      expense: d.expensePaise / 100,
    }));

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      totals: {
        totalIncome: totalIncomePaise / 100,
        totalIncomePaise,
        totalExpense: totalExpensePaise / 100,
        totalExpensePaise,
        totalInvested: totalInvestedPaise / 100,
        totalInvestedPaise,
        netSavings: netSavingsPaise / 100,
        netSavingsPaise,
        savingsRate,
        transactionCount: txns.length,
      },
      categorySummary,
      dailyTrend,
    };
  }
}

export const reportService = new ReportService();
export default reportService;
