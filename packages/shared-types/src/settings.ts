import { z } from 'zod';
import { CurrencyCodeSchema } from './currencies.js';

export const DashboardDonutsConfigSchema = z.object({
  income: z.boolean().default(true),
  expense: z.boolean().default(true),
  investment: z.boolean().default(true),
});
export type DashboardDonutsConfig = z.infer<typeof DashboardDonutsConfigSchema>;

export const FeaturesConfigSchema = z.object({
  investments: z.boolean().default(true),
  recurring: z.boolean().default(true),
});
export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>;

export const UserSettingsDataSchema = z.object({
  userId: z.string().uuid().optional(),
  currency: CurrencyCodeSchema.default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  financialMonthStartDay: z.number().int().min(1).max(28).default(1),
  quickAdd: z.boolean().default(true),
  quickAddEnabled: z.boolean().default(true),
  dashboardDonuts: DashboardDonutsConfigSchema.default({
    income: true,
    expense: true,
    investment: true,
  }),
  dashboardDonutsConfig: DashboardDonutsConfigSchema.default({
    income: true,
    expense: true,
    investment: true,
  }),
  features: FeaturesConfigSchema.default({
    investments: true,
    recurring: true,
  }),
  featuresConfig: FeaturesConfigSchema.default({
    investments: true,
    recurring: true,
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type UserSettingsData = z.infer<typeof UserSettingsDataSchema>;

export const UpdateUserSettingsSchema = z.object({
  currency: CurrencyCodeSchema.optional(),
  timezone: z.string().min(1).optional(),
  financialMonthStartDay: z.number().int().min(1).max(28).optional(),
  quickAdd: z.boolean().optional(),
  quickAddEnabled: z.boolean().optional(),
  dashboardDonuts: DashboardDonutsConfigSchema.partial().optional(),
  dashboardDonutsConfig: DashboardDonutsConfigSchema.partial().optional(),
  features: FeaturesConfigSchema.partial().optional(),
  featuresConfig: FeaturesConfigSchema.partial().optional(),
  donutVisualsEnabled: z.boolean().optional(),
  investmentsTrackingEnabled: z.boolean().optional(),
  recurringTrackingEnabled: z.boolean().optional(),
  reminderDaysBeforeDue: z.number().int().min(1).max(30).optional(),
  notificationsEnabled: z.boolean().optional(),
});
export type UpdateUserSettings = z.infer<typeof UpdateUserSettingsSchema>;

export const ResetProfileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ResetProfileResponse = z.infer<typeof ResetProfileResponseSchema>;

export const DeleteAccountInputSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm account deletion'),
});
export type DeleteAccountInput = z.infer<typeof DeleteAccountInputSchema>;
