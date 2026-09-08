import { z } from 'zod';
import { FamGradeSchema } from './enums.js';

export const FamDimensionScoreSchema = z.object({
  target: z.number().int().nonnegative(),
  actual: z.number().int().nonnegative(),
  percentage: z.number(),
  grade: FamGradeSchema,
  statusLabel: z.string(), // "Excellent", "Good", "Poor", or "Not Available"
});
export type FamDimensionScore = z.infer<typeof FamDimensionScoreSchema>;

export const FamScoreResponseSchema = z.object({
  isAvailable: z.boolean(),
  overallGrade: FamGradeSchema,
  overallProgressPercentage: z.number().min(0).max(100),
  expense: FamDimensionScoreSchema,
  investment: FamDimensionScoreSchema,
  income: FamDimensionScoreSchema,
  month: z.number().int(),
  year: z.number().int(),
});
export type FamScoreResponse = z.infer<typeof FamScoreResponseSchema>;
