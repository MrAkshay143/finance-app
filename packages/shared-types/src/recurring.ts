import { z } from 'zod';
import { RecurringFrequencySchema, RecurringStatusSchema, TxnTypeSchema } from './enums.js';

export const RecurringTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: TxnTypeSchema,
  amount: z.number(), // in rupees
  amountPaise: z.number(), // in paise
  description: z.string().nullable().optional(),
  scheduleFreq: RecurringFrequencySchema,
  scheduleInterval: z.number().int().positive().default(1),
  nextOccurrence: z.string().datetime().or(z.string()),
  status: RecurringStatusSchema,
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
  account: z.object({
    id: z.string(),
    name: z.string(),
    accountType: z.string(),
  }).optional(),
  category: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().optional(),
});
export type RecurringTransaction = z.infer<typeof RecurringTransactionSchema>;

export const CreateRecurringTransactionInputSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().optional().nullable(),
  type: TxnTypeSchema,
  amount: z.number().positive(),
  description: z.string().max(255).optional().nullable(),
  scheduleFreq: RecurringFrequencySchema,
  scheduleInterval: z.number().int().positive().default(1).optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  nextOccurrence: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});
export type CreateRecurringTransactionInput = z.infer<typeof CreateRecurringTransactionInputSchema>;

export const UpdateRecurringTransactionInputSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  type: TxnTypeSchema.optional(),
  amount: z.number().positive().optional(),
  description: z.string().max(255).optional().nullable(),
  scheduleFreq: RecurringFrequencySchema.optional(),
  scheduleInterval: z.number().int().positive().optional(),
  nextOccurrence: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  status: RecurringStatusSchema.optional(),
});
export type UpdateRecurringTransactionInput = z.infer<typeof UpdateRecurringTransactionInputSchema>;

export const PatchRecurringStatusInputSchema = z.object({
  status: RecurringStatusSchema,
});
export type PatchRecurringStatusInput = z.infer<typeof PatchRecurringStatusInputSchema>;

export const MaterializeInputSchema = z.object({
  asOfDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});
export type MaterializeInput = z.infer<typeof MaterializeInputSchema>;
