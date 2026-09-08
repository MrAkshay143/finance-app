import { z } from 'zod';

export const AnalyticsSpendingTrendSchema = z.object({
  month: z.string(), // 'YYYY-MM'
  monthLabel: z.string(), // e.g. 'Apr 2026'
  earned: z.number(),
  earnedPaise: z.number(),
  spent: z.number(),
  spentPaise: z.number(),
  invested: z.number(),
  investedPaise: z.number(),
  netSavings: z.number(),
  netSavingsPaise: z.number(),
  savingsRate: z.number(), // percentage (e.g. 25 for 25%)
});
export type AnalyticsSpendingTrend = z.infer<typeof AnalyticsSpendingTrendSchema>;

export const AnalyticsCategoryBreakdownSchema = z.object({
  categoryId: z.string().nullable(),
  categoryName: z.string(),
  totalAmount: z.number(),
  amountPaise: z.number(),
  percentage: z.number(),
  transactionCount: z.number(),
});
export type AnalyticsCategoryBreakdown = z.infer<typeof AnalyticsCategoryBreakdownSchema>;

export const AnalyticsComparisonSchema = z.object({
  earned: z.number(),
  earnedPaise: z.number(),
  spent: z.number(),
  spentPaise: z.number(),
  invested: z.number(),
  investedPaise: z.number(),
  netSavings: z.number(),
  netSavingsPaise: z.number(),
  savingsRate: z.number(),
});
export type AnalyticsComparison = z.infer<typeof AnalyticsComparisonSchema>;

export const AnalyticsOverviewSchema = z.object({
  period: z.object({
    month: z.string(),
    year: z.number(),
    monthNumber: z.number(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  summary: AnalyticsComparisonSchema,
  spendingTrends: z.array(AnalyticsSpendingTrendSchema),
  categoryBreakdown: z.array(AnalyticsCategoryBreakdownSchema),
  expenseCategoryBreakdown: z.array(AnalyticsCategoryBreakdownSchema).optional(),
  incomeCategoryBreakdown: z.array(AnalyticsCategoryBreakdownSchema).optional(),
  monthlyComparison: AnalyticsComparisonSchema,
});
export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

export const AnalyticsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  period: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
