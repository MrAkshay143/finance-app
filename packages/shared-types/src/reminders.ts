import { z } from 'zod';

export const ReminderTypeSchema = z.enum([
  'RECURRING_EXPENSE',
  'RECURRING_INVESTMENT',
  'MONTH_END',
  'CUSTOM',
]);
export type ReminderType = z.infer<typeof ReminderTypeSchema>;

export const ReminderTimingConfigSchema = z.object({
  daysBefore: z.number().int().nonnegative().default(3),
  timeOfDay: z.string().optional(),
  recurringTransactionId: z.string().uuid().optional(),
}).passthrough();
export type ReminderTimingConfig = z.infer<typeof ReminderTimingConfigSchema>;

export const ReminderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  timingConfig: ReminderTimingConfigSchema,
  enabled: z.boolean(),
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
});
export type Reminder = z.infer<typeof ReminderSchema>;

export const CreateReminderInputSchema = z.object({
  type: z.string(),
  timingConfig: ReminderTimingConfigSchema,
  enabled: z.boolean().default(true).optional(),
});
export type CreateReminderInput = z.infer<typeof CreateReminderInputSchema>;

export const UpdateReminderInputSchema = z.object({
  type: z.string().optional(),
  timingConfig: ReminderTimingConfigSchema.optional(),
  enabled: z.boolean().optional(),
});
export type UpdateReminderInput = z.infer<typeof UpdateReminderInputSchema>;

export const PatchReminderStatusInputSchema = z.object({
  enabled: z.boolean(),
});
export type PatchReminderStatusInput = z.infer<typeof PatchReminderStatusInputSchema>;
