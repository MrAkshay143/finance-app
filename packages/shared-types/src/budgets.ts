import { z } from 'zod';
import { RecurringFrequencySchema, RecurringStatusSchema } from './enums.js';

export const MonthlyBudgetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  categoryId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  limitAmount: z.number().int().positive('Budget limit must be positive'),
  spentAmount: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MonthlyBudget = z.infer<typeof MonthlyBudgetSchema>;

export const CreateMonthlyBudgetInputSchema = z.object({
  categoryId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  limitAmount: z.number().int().positive('Budget limit in paise must be positive'),
});
export type CreateMonthlyBudgetInput = z.infer<typeof CreateMonthlyBudgetInputSchema>;

export const GoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  targetAmount: z.number().int().positive(),
  currentAmount: z.number().int().default(0),
  targetDate: z.string().datetime(),
  category: z.string().max(50).nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const CreateGoalInputSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().int().positive('Target amount must be positive'),
  currentAmount: z.number().int().default(0),
  targetDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  category: z.string().max(50).optional(),
});
export type CreateGoalInput = z.infer<typeof CreateGoalInputSchema>;

export const UpdateGoalInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive('Target amount must be positive').optional(),
  currentAmount: z.number().nonnegative('Current amount cannot be negative').optional(),
  targetDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
});
export type UpdateGoalInput = z.infer<typeof UpdateGoalInputSchema>;

export const CreateBudgetInputSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  period: z.string().default('MONTHLY').optional(),
  periodStart: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});
export type CreateBudgetInput = z.infer<typeof CreateBudgetInputSchema>;

export const UpdateBudgetInputSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive('Target amount must be positive').optional(),
  period: z.string().optional(),
  periodStart: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetInputSchema>;

export {
  RecurringTransactionSchema,
  type RecurringTransaction,
  CreateRecurringTransactionInputSchema,
  type CreateRecurringTransactionInput,
} from './recurring.js';
