import { z } from 'zod';
import { TxnTypeSchema } from './enums.js';

export const CategorySchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  name: z.string().min(1).max(100),
  type: TxnTypeSchema,
  isSystem: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().or(z.date()).optional(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  type: TxnTypeSchema,
  sortOrder: z.number().int().optional(),
});
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

export const UpdateCategoryInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: TxnTypeSchema.optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;

export const ReorderCategoriesInputSchema = z.object({
  categoryIds: z.array(z.string().min(1)).min(1, 'Please select at least one category.'),
});
export type ReorderCategoriesInput = z.infer<typeof ReorderCategoriesInputSchema>;
