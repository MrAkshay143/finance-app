import { z } from 'zod';
import { RiskAppetiteSchema, InvestmentHorizonSchema } from './enums.js';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  mobileNumber: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
  onboardingCompleted: z.boolean(),
  kbaConfigured: z.boolean(),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const DateOfBirthSchema = z.string().or(z.date()).refine(
  (val) => {
    if (!val) return true;
    const d = new Date(val);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    // Cannot be in future
    if (d > now) return false;
    // Must be at least 16 years old
    const minAgeDate = new Date(now.getFullYear() - 16, now.getMonth(), now.getDate());
    return d <= minAgeDate;
  },
  {
    message: 'You must be at least 16 years old.',
  }
);

export const UpdateProfileInputSchema = z.object({
  fullName: z.string().min(2).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  mobileNumber: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  dateOfBirth: DateOfBirthSchema.optional(),
  address: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const UpdateBasicProfileInputSchema = UpdateProfileInputSchema;
export type UpdateBasicProfileInput = z.infer<typeof UpdateBasicProfileInputSchema>;

export const FinanceProfileSchema = z.object({
  userId: z.string().uuid(),
  monthlyIncome: z.number().nonnegative().optional(),
  monthlyIncomeTarget: z.number().nonnegative().optional(),
  monthlyExpenseBudget: z.number().nonnegative().optional(),
  monthlyInvestmentTarget: z.number().nonnegative().optional(),
  incomeRange: z.string().nullable().optional(),
  savingsTarget: z.number().nonnegative().nullable().optional(),
  savingsTargetPercentage: z.number().min(0).max(100).optional(),
  investmentExperience: z.string().nullable().optional(),
  riskAppetite: RiskAppetiteSchema.default('MEDIUM'),
  investmentHorizon: InvestmentHorizonSchema.default('MEDIUM'),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FinanceProfile = z.infer<typeof FinanceProfileSchema>;

export const UpdateFinanceProfileInputSchema = z.object({
  monthlyIncome: z.number().nonnegative().optional(),
  monthlyIncomeTarget: z.number().nonnegative().optional(),
  monthlyExpenseBudget: z.number().nonnegative().optional(),
  monthlyInvestmentTarget: z.number().nonnegative().optional(),
  incomeRange: z.string().optional(),
  savingsTarget: z.number().nonnegative().optional(),
  savingsTargetPercentage: z.number().min(0).max(100).optional(),
  investmentExperience: z.string().optional(),
  riskAppetite: RiskAppetiteSchema.optional(),
  investmentHorizon: InvestmentHorizonSchema.optional(),
});
export type UpdateFinanceProfileInput = z.infer<typeof UpdateFinanceProfileInputSchema>;

export const UserSettingsSchema = z.object({
  userId: z.string().uuid(),
  currency: z.string().length(3).default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  financialMonthStartDay: z.number().int().min(1).max(28).default(1),
  quickAddEnabled: z.boolean().default(true),
  quickAdd: z.boolean().optional(),
  donutVisualsEnabled: z.boolean().default(true),
  dashboardDonutsConfig: z.record(z.boolean()).optional(),
  dashboardDonuts: z.record(z.boolean()).optional(),
  featuresConfig: z.record(z.boolean()).optional(),
  features: z.record(z.boolean()).optional(),
  investmentsTrackingEnabled: z.boolean().default(true),
  recurringTrackingEnabled: z.boolean().default(true),
  reminderDaysBeforeDue: z.number().int().min(1).max(30).default(3),
  notificationsEnabled: z.boolean().default(true),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const UpdateUserSettingsInputSchema = UserSettingsSchema.omit({ userId: true }).partial();
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsInputSchema>;
