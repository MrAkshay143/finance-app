import { z } from 'zod';

export const InvestmentCategoryBreakdownSchema = z.object({
  categoryId: z.string().nullable(),
  categoryName: z.string(),
  totalAmount: z.number(),
  amountPaise: z.number(),
  percentage: z.number(),
  transactionCount: z.number(),
});
export type InvestmentCategoryBreakdown = z.infer<typeof InvestmentCategoryBreakdownSchema>;

export const InvestmentTargetComparisonSchema = z.object({
  target: z.number(),
  targetPaise: z.number(),
  actual: z.number(),
  actualPaise: z.number(),
  diff: z.number(),
  diffPaise: z.number(),
  percentageAchieved: z.number(),
});
export type InvestmentTargetComparison = z.infer<typeof InvestmentTargetComparisonSchema>;

export const InvestmentsOverviewResponseSchema = z.object({
  totalInvested: z.number(),
  totalInvestedPaise: z.number(),
  monthlyInvested: z.number(),
  monthlyInvestedPaise: z.number(),
  targetComparison: InvestmentTargetComparisonSchema,
  categoryBreakdown: z.array(InvestmentCategoryBreakdownSchema),
  recentInvestments: z.array(z.any()),
  monthlyTrend: z.array(
    z.object({
      month: z.string(),
      monthLabel: z.string(),
      amount: z.number(),
      amountPaise: z.number(),
    })
  ),
});
export type InvestmentsOverviewResponse = z.infer<typeof InvestmentsOverviewResponseSchema>;
