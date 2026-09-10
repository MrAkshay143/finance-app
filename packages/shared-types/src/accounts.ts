import { z } from 'zod';
import { AccountStatusSchema, AccountTypeSchema } from './enums.js';

export const AccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: AccountTypeSchema,
  institutionName: z.string().max(100).nullable().optional(),
  accountNumberMask: z.string().max(8).nullable().optional(),
  openingBalance: z.number(),
  currentBalance: z.number(),
  currency: z.string().length(3).default('INR'),
  status: AccountStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Account = z.infer<typeof AccountSchema>;

export const CreateAccountInputSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  type: AccountTypeSchema.optional(),
  accountType: z.string().optional(),
  institutionName: z.string().max(100).optional().nullable(),
  institution: z.string().max(100).optional().nullable(),
  accountNumberMask: z.string().max(20).optional().nullable(),
  accountIdentifier: z.string().max(20).optional().nullable(),
  openingBalance: z.number().default(0),
  currency: z.string().length(3).default('INR'),
});
export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>;

export const UpdateAccountInputSchema = CreateAccountInputSchema.partial();
export type UpdateAccountInput = z.infer<typeof UpdateAccountInputSchema>;

export const ToggleAccountStatusSchema = z.object({
  status: AccountStatusSchema.optional(),
});
export type ToggleAccountStatusInput = z.infer<typeof ToggleAccountStatusSchema>;

