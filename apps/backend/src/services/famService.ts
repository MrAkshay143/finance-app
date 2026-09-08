import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export type GradeDisplay = 'A+' | 'B' | 'C' | '—';
export type FamGrade = 'A_PLUS' | 'B' | 'C' | 'NOT_AVAILABLE';
export type StatusLabel = 'Excellent' | 'Good' | 'Poor' | 'Not Available';

export interface FinancialMonthRange {
  start: Date;
  end: Date;
  month: number; // 1-12
  year: number;
}

export interface DimensionCalcResult {
  target: number;
  targetPaise: number;
  actual: number;
  actualPaise: number;
  percentage: number;
  grade: FamGrade;
  gradeDisplay: GradeDisplay;
  status: StatusLabel;
  statusLabel: StatusLabel;
}

export interface FamScoreResult {
  isAvailable: boolean;
  overallGrade: FamGrade;
  grade: GradeDisplay;
  gradeDisplay: string;
  statusLabel: StatusLabel;
  overallProgressPercentage: number;
  progress: number;
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  areas: {
    expense: DimensionCalcResult;
    investment: DimensionCalcResult;
    income: DimensionCalcResult;
  };
  expense: DimensionCalcResult;
  investment: DimensionCalcResult;
  income: DimensionCalcResult;
}

/**
 * Computes financial month boundaries based on financialMonthStartDay.
 * For example, if startDay = 1, period is 1st of month 00:00:00 to 1st of next month 00:00:00.
 * If startDay = 5 and refDate is Sept 8, period is Sept 5 to Oct 5.
 * If startDay = 5 and refDate is Sept 3, period is Aug 5 to Sept 5.
 */
export function getFinancialMonthRange(
  financialMonthStartDay = 1,
  refDate: Date = new Date()
): FinancialMonthRange {
  const S = Math.max(1, Math.min(31, financialMonthStartDay));
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed
  const day = refDate.getDate();

  let startYear: number;
  let startMonth: number;
  let endYear: number;
  let endMonth: number;
  let displayMonth: number;
  let displayYear: number;

  if (day >= S) {
    startYear = year;
    startMonth = month;
    endYear = month === 11 ? year + 1 : year;
    endMonth = (month + 1) % 12;
    displayMonth = month + 1;
    displayYear = year;
  } else {
    startYear = month === 0 ? year - 1 : year;
    startMonth = month === 0 ? 11 : month - 1;
    endYear = year;
    endMonth = month;
    displayMonth = month === 0 ? 12 : month;
    displayYear = month === 0 ? year - 1 : year;
  }

  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const effectiveStartDay = Math.min(S, daysInStartMonth);
  const start = new Date(startYear, startMonth, effectiveStartDay, 0, 0, 0, 0);

  const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
  const effectiveEndDay = Math.min(S, daysInEndMonth);
  const end = new Date(endYear, endMonth, effectiveEndDay, 0, 0, 0, 0);

  return {
    start,
    end,
    month: displayMonth,
    year: displayYear,
  };
}

/**
 * Pure calculation logic for FAM Score & Grades per Plan/prd.md §5.3.
 */
export function calculateFamScore({
  expenseTargetPaise,
  investmentTargetPaise,
  incomeTargetPaise,
  spentPaise,
  investedPaise,
  earnedPaise,
  totalTxnCount,
  onboardingCompleted,
  hasFinanceProfile,
  month,
  year,
  periodStart,
  periodEnd,
}: {
  expenseTargetPaise: bigint;
  investmentTargetPaise: bigint;
  incomeTargetPaise: bigint;
  spentPaise: bigint;
  investedPaise: bigint;
  earnedPaise: bigint;
  totalTxnCount: number;
  onboardingCompleted: boolean;
  hasFinanceProfile: boolean;
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
}): FamScoreResult {
  const expenseTarget = Number(expenseTargetPaise) / 100;
  const investmentTarget = Number(investmentTargetPaise) / 100;
  const incomeTarget = Number(incomeTargetPaise) / 100;
  const spent = Number(spentPaise) / 100;
  const invested = Number(investedPaise) / 100;
  const earned = Number(earnedPaise) / 100;

  // Not Available check:
  // 1. Basic profile incomplete
  // 2. Targets are 0 / unset
  // 3. 0 transactions exist this month
  const targetsSet =
    expenseTargetPaise > BigInt(0) &&
    investmentTargetPaise > BigInt(0) &&
    incomeTargetPaise > BigInt(0);

  const isAvailable =
    onboardingCompleted &&
    hasFinanceProfile &&
    targetsSet &&
    totalTxnCount > 0;

  if (!isAvailable) {
    const naDim = (targetPaise: bigint, actualPaise: bigint): DimensionCalcResult => ({
      target: Number(targetPaise) / 100,
      targetPaise: Number(targetPaise),
      actual: Number(actualPaise) / 100,
      actualPaise: Number(actualPaise),
      percentage: 0,
      grade: 'NOT_AVAILABLE',
      gradeDisplay: '—',
      status: 'Not Available',
      statusLabel: 'Not Available',
    });

    const areas = {
      expense: naDim(expenseTargetPaise, spentPaise),
      investment: naDim(investmentTargetPaise, investedPaise),
      income: naDim(incomeTargetPaise, earnedPaise),
    };

    return {
      isAvailable: false,
      overallGrade: 'NOT_AVAILABLE',
      grade: '—',
      gradeDisplay: 'NA',
      statusLabel: 'Not Available',
      overallProgressPercentage: 0,
      progress: 0,
      month,
      year,
      periodStart,
      periodEnd,
      areas,
      expense: areas.expense,
      investment: areas.investment,
      income: areas.income,
    };
  }

  // 1. Expense dimension (lower is better: spent / target)
  // <= 80% -> A+ (Excellent), 81-100% -> B (Good), > 100% -> C (Poor)
  const expenseRatio = Number(spentPaise) / Number(expenseTargetPaise);
  const expensePercentage = Math.round(expenseRatio * 100 * 10) / 10;
  let expenseGrade: FamGrade = 'A_PLUS';
  let expenseGradeDisplay: GradeDisplay = 'A+';
  let expenseStatus: StatusLabel = 'Excellent';

  if (expensePercentage <= 80) {
    expenseGrade = 'A_PLUS';
    expenseGradeDisplay = 'A+';
    expenseStatus = 'Excellent';
  } else if (expensePercentage <= 100) {
    expenseGrade = 'B';
    expenseGradeDisplay = 'B';
    expenseStatus = 'Good';
  } else {
    expenseGrade = 'C';
    expenseGradeDisplay = 'C';
    expenseStatus = 'Poor';
  }

  // 2. Investment dimension (higher is better: invested / target)
  // >= 100% -> A+ (Excellent), 70-99% -> B (Good), < 70% -> C (Poor)
  const investmentRatio = Number(investedPaise) / Number(investmentTargetPaise);
  const investmentPercentage = Math.round(investmentRatio * 100 * 10) / 10;
  let investmentGrade: FamGrade = 'A_PLUS';
  let investmentGradeDisplay: GradeDisplay = 'A+';
  let investmentStatus: StatusLabel = 'Excellent';

  if (investmentPercentage >= 100) {
    investmentGrade = 'A_PLUS';
    investmentGradeDisplay = 'A+';
    investmentStatus = 'Excellent';
  } else if (investmentPercentage >= 70) {
    investmentGrade = 'B';
    investmentGradeDisplay = 'B';
    investmentStatus = 'Good';
  } else {
    investmentGrade = 'C';
    investmentGradeDisplay = 'C';
    investmentStatus = 'Poor';
  }

  // 3. Income dimension (higher is better: earned / target)
  // >= 100% -> A+ (Excellent), 70-99% -> B (Good), < 70% -> C (Poor)
  const incomeRatio = Number(earnedPaise) / Number(incomeTargetPaise);
  const incomePercentage = Math.round(incomeRatio * 100 * 10) / 10;
  let incomeGrade: FamGrade = 'A_PLUS';
  let incomeGradeDisplay: GradeDisplay = 'A+';
  let incomeStatus: StatusLabel = 'Excellent';

  if (incomePercentage >= 100) {
    incomeGrade = 'A_PLUS';
    incomeGradeDisplay = 'A+';
    incomeStatus = 'Excellent';
  } else if (incomePercentage >= 70) {
    incomeGrade = 'B';
    incomeGradeDisplay = 'B';
    incomeStatus = 'Good';
  } else {
    incomeGrade = 'C';
    incomeGradeDisplay = 'C';
    incomeStatus = 'Poor';
  }

  // Overall Grade: Worst of the three areas (if any is C -> C; else if any is B -> B; else A+)
  let overallGrade: FamGrade = 'A_PLUS';
  let grade: GradeDisplay = 'A+';
  let statusLabel: StatusLabel = 'Excellent';

  if (
    expenseGrade === 'C' ||
    investmentGrade === 'C' ||
    incomeGrade === 'C'
  ) {
    overallGrade = 'C';
    grade = 'C';
    statusLabel = 'Poor';
  } else if (
    expenseGrade === 'B' ||
    investmentGrade === 'B' ||
    incomeGrade === 'B'
  ) {
    overallGrade = 'B';
    grade = 'B';
    statusLabel = 'Good';
  } else {
    overallGrade = 'A_PLUS';
    grade = 'A+';
    statusLabel = 'Excellent';
  }

  // Progress Ring: Average of the three areas with each area capped at 100%
  const cappedExpense = Math.min(expensePercentage, 100);
  const cappedInvestment = Math.min(investmentPercentage, 100);
  const cappedIncome = Math.min(incomePercentage, 100);
  const overallProgressPercentage =
    Math.round(((cappedExpense + cappedInvestment + cappedIncome) / 3) * 10) / 10;

  const areas = {
    expense: {
      target: expenseTarget,
      targetPaise: Number(expenseTargetPaise),
      actual: spent,
      actualPaise: Number(spentPaise),
      percentage: expensePercentage,
      grade: expenseGrade,
      gradeDisplay: expenseGradeDisplay,
      status: expenseStatus,
      statusLabel: expenseStatus,
    },
    investment: {
      target: investmentTarget,
      targetPaise: Number(investmentTargetPaise),
      actual: invested,
      actualPaise: Number(investedPaise),
      percentage: investmentPercentage,
      grade: investmentGrade,
      gradeDisplay: investmentGradeDisplay,
      status: investmentStatus,
      statusLabel: investmentStatus,
    },
    income: {
      target: incomeTarget,
      targetPaise: Number(incomeTargetPaise),
      actual: earned,
      actualPaise: Number(earnedPaise),
      percentage: incomePercentage,
      grade: incomeGrade,
      gradeDisplay: incomeGradeDisplay,
      status: incomeStatus,
      statusLabel: incomeStatus,
    },
  };

  return {
    isAvailable: true,
    overallGrade,
    grade,
    gradeDisplay: grade,
    statusLabel,
    overallProgressPercentage,
    progress: overallProgressPercentage,
    month,
    year,
    periodStart,
    periodEnd,
    areas,
    expense: areas.expense,
    investment: areas.investment,
    income: areas.income,
  };
}

export class FamService {
  /**
   * Fetches user profile, settings, and actual transaction totals for current financial month,
   * then computes the complete FAM score.
   */
  async getFamScore(
    userId: string,
    options?: { month?: number; year?: number; refDate?: Date }
  ): Promise<FamScoreResult> {
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

    let refDate = options?.refDate || new Date();
    if (options?.month && options?.year) {
      refDate = new Date(options.year, options.month - 1, startDay);
    }

    const period = getFinancialMonthRange(startDay, refDate);

    // Fetch monthly targets from FinanceProfile
    const fp = user.financeProfile;
    const expenseTargetPaise = fp ? BigInt(fp.monthlyExpenseBudget || 0) : BigInt(0);
    const investmentTargetPaise = fp ? BigInt(fp.monthlyInvestmentTarget || 0) : BigInt(0);
    const incomeTargetPaise = fp ? BigInt(fp.monthlyIncome || 0) : BigInt(0);

    // Fetch actual transaction sums this financial month:
    // spent: sum of active DEBIT transactions where type === EXPENSE
    // invested: sum of active DEBIT transactions where type === INVESTMENT
    // earned: sum of active CREDIT transactions where type === INCOME
    const [spentAgg, investedAgg, earnedAgg, totalTxnCount] = await Promise.all([
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
      prisma.transaction.count({
        where: {
          userId,
          status: 'ACTIVE',
          txnDate: { gte: period.start, lt: period.end },
        },
      }),
    ]);

    const spentPaise = spentAgg?._sum?.amount ?? BigInt(0);
    const investedPaise = investedAgg?._sum?.amount ?? BigInt(0);
    const earnedPaise = earnedAgg?._sum?.amount ?? BigInt(0);

    return calculateFamScore({
      expenseTargetPaise,
      investmentTargetPaise,
      incomeTargetPaise,
      spentPaise,
      investedPaise,
      earnedPaise,
      totalTxnCount,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      hasFinanceProfile: Boolean(fp),
      month: period.month,
      year: period.year,
      periodStart: period.start,
      periodEnd: period.end,
    });
  }
}

export const famService = new FamService();
export default famService;
