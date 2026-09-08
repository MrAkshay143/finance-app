import { z } from 'zod';
import { TxnTypeSchema, TxnDirectionSchema, RecordStatusSchema } from './enums.js';

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: TxnTypeSchema,
  direction: TxnDirectionSchema,
  amount: z.number().int().positive('Amount in paise must be positive'),
  date: z.string().datetime(),
  description: z.string().max(255),
  merchant: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: RecordStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const PastOrPresentDateSchema = z
  .string()
  .datetime()
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
  .refine(
    (val) => {
      if (!val) return true;
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      // Allow current day (until end of today)
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return d <= endOfToday;
    },
    {
      message: 'Transaction date cannot be in the future',
    }
  );

export const CreateTransactionInputSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().optional().nullable(),
  type: TxnTypeSchema,
  direction: TxnDirectionSchema.optional(),
  amount: z.number().positive('Amount must be a positive number'),
  date: PastOrPresentDateSchema.optional(),
  txnDate: PastOrPresentDateSchema.optional(),
  description: z.string().min(1).max(255),
  merchant: z.string().max(100).optional().nullable(),
  merchantId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;

export const UpdateTransactionInputSchema = CreateTransactionInputSchema.partial();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInputSchema>;

export const CreateTransferInputSchema = z.object({
  sourceAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid(),
  amount: z.number().positive('Amount must be a positive number'),
  date: PastOrPresentDateSchema.optional(),
  txnDate: PastOrPresentDateSchema.optional(),
  description: z.string().min(1).max(255).default('Transfer between accounts'),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateTransferInput = z.infer<typeof CreateTransferInputSchema>;

export const TransactionFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: TxnTypeSchema.optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  status: RecordStatusSchema.optional(),
});
export type TransactionFilterQuery = z.infer<typeof TransactionFilterQuerySchema>;
