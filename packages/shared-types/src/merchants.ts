import { z } from 'zod';

export const MerchantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  transactionCount: z.number().int().nonnegative().optional(),
  totalSpent: z.number().nonnegative().optional(),
  totalSpentPaise: z.number().nonnegative().optional(),
  createdAt: z.string().or(z.date()).optional(),
});
export type Merchant = z.infer<typeof MerchantSchema>;

export const CreateMerchantInputSchema = z.object({
  name: z.string().min(1, 'Merchant name is required').max(100),
});
export type CreateMerchantInput = z.infer<typeof CreateMerchantInputSchema>;

export const UpdateMerchantInputSchema = z.object({
  name: z.string().min(1, 'Merchant name is required').max(100),
});
export type UpdateMerchantInput = z.infer<typeof UpdateMerchantInputSchema>;
