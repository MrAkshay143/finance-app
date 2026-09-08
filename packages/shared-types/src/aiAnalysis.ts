import { z } from 'zod';

export const AiMonthlyAllocationSchema = z.object({
  earned: z.number(),
  earnedPaise: z.number(),
  spent: z.number(),
  spentPaise: z.number(),
  invested: z.number(),
  investedPaise: z.number(),
  netSavings: z.number(),
  netSavingsPaise: z.number(),
  needsRatio: z.number(), // percentage of earned spent
  investmentRatio: z.number(), // percentage of earned invested
  savingsRate: z.number(), // percentage of earned saved
  benchmarks: z.object({
    needsTarget: z.number(),
    wantsTarget: z.number(),
    savingsAndInvestmentTarget: z.number(),
  }),
});
export type AiMonthlyAllocation = z.infer<typeof AiMonthlyAllocationSchema>;

export const AiProjectionItemSchema = z.object({
  horizonMonths: z.number(),
  label: z.string(), // e.g. '3 Months', '6 Months', '12 Months'
  projectedSavings: z.number(),
  projectedSavingsPaise: z.number(),
  projectedWealth: z.number(),
  projectedWealthPaise: z.number(),
  assumedAnnualReturnRate: z.number(),
});
export type AiProjectionItem = z.infer<typeof AiProjectionItemSchema>;

export const AiSuggestionItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  title: z.string(),
  description: z.string(),
  potentialImpactPaise: z.number().optional(),
  actionType: z.string().optional(),
});
export type AiSuggestionItem = z.infer<typeof AiSuggestionItemSchema>;

export const AiAnalysisResponseSchema = z.object({
  month: z.string(),
  monthLabel: z.string(),
  analysisDate: z.string(),
  monthlyAnalysis: AiMonthlyAllocationSchema,
  forwardProjections: z.array(AiProjectionItemSchema),
  suggestions: z.array(AiSuggestionItemSchema),
  summaryNote: z.string(),
});
export type AiAnalysisResponse = z.infer<typeof AiAnalysisResponseSchema>;
