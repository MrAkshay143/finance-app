import { z } from 'zod';

export const ReportTargetVsActualItemSchema = z.object({
  metric: z.string(),
  label: z.string(),
  target: z.number(),
  targetPaise: z.number(),
  actual: z.number(),
  actualPaise: z.number(),
  diff: z.number(),
  diffPaise: z.number(),
  percentageAchieved: z.number(),
  status: z.enum(['EXCELLENT', 'GOOD', 'POOR', 'ON_TRACK', 'ATTENTION']),
});
export type ReportTargetVsActualItem = z.infer<typeof ReportTargetVsActualItemSchema>;

export const ReportCalloutCardSchema = z.object({
  id: z.string(),
  area: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT', 'SAVINGS']),
  title: z.string(),
  status: z.enum(['success', 'warning', 'danger', 'info']),
  message: z.string(),
  diffPaise: z.number().optional(),
});
export type ReportCalloutCard = z.infer<typeof ReportCalloutCardSchema>;

export const ReportCategorySummarySchema = z.object({
  categoryId: z.string().nullable(),
  categoryName: z.string(),
  type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']),
  totalAmount: z.number(),
  amountPaise: z.number(),
  percentage: z.number(),
  transactionCount: z.number(),
});
export type ReportCategorySummary = z.infer<typeof ReportCategorySummarySchema>;

export const MonthlyReportResponseSchema = z.object({
  month: z.string(), // 'YYYY-MM'
  monthLabel: z.string(), // e.g. 'September 2026'
  year: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
  famScore: z.any(),
  targetVsActual: z.object({
    income: ReportTargetVsActualItemSchema,
    expense: ReportTargetVsActualItemSchema,
    investment: ReportTargetVsActualItemSchema,
    netSavings: z.object({
      actual: z.number(),
      actualPaise: z.number(),
      savingsRate: z.number(),
    }),
  }),
  callouts: z.array(ReportCalloutCardSchema),
  categorySummary: z.array(ReportCategorySummarySchema),
  totals: z.object({
    earnedPaise: z.number(),
    spentPaise: z.number(),
    investedPaise: z.number(),
    netSavingsPaise: z.number(),
    transactionCount: z.number(),
  }),
});
export type MonthlyReportResponse = z.infer<typeof MonthlyReportResponseSchema>;

export const ExportReportInputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  format: z.enum(['json', 'csv']),
});
export type ExportReportInput = z.infer<typeof ExportReportInputSchema>;

export const ExportReportResponseSchema = z.object({
  format: z.enum(['json', 'csv']),
  filename: z.string(),
  mimeType: z.string(),
  data: z.union([z.string(), z.record(z.any())]),
});
export type ExportReportResponse = z.infer<typeof ExportReportResponseSchema>;
