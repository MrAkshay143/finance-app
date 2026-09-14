import { z } from 'zod';
import { CurrencyCodeSchema } from './currencies.js';

export const APP_SETTINGS_KEYS = {
  SESSION_TIMEOUT_MINUTES: 'session_timeout_minutes',
  MAX_FAILED_ATTEMPTS: 'max_failed_attempts',
  LOCKOUT_DURATION_MINUTES: 'lockout_duration_minutes',
  REQUIRE_KBA_FOR_SENSITIVE_ACTIONS: 'require_kba_for_sensitive_actions',
  PASSWORD_MIN_LENGTH: 'password_min_length',
  PASSWORD_REQUIRE_UPPERCASE: 'password_require_uppercase',
  PASSWORD_REQUIRE_LOWERCASE: 'password_require_lowercase',
  PASSWORD_REQUIRE_DIGIT: 'password_require_digit',
  PASSWORD_REQUIRE_SPECIAL: 'password_require_special',
  PASSWORD_MAX_AGE_DAYS: 'password_max_age_days',
  PLATFORM_NAME: 'platform_name',
  SUPPORT_EMAIL: 'support_email',
  ALLOW_USER_REGISTRATION: 'allow_user_registration',
  PWA_INSTALL_ENABLED: 'pwa_install_enabled',
  MAINTENANCE_MODE: 'maintenance_mode',
  MAINTENANCE_MESSAGE: 'maintenance_message',
  DEFAULT_COUNTRY: 'default_country',
  DEFAULT_BASE_CURRENCY: 'default_base_currency',
  DEFAULT_BUDGET_PERIOD: 'default_budget_period',
  FAM_EXPENSE_THRESHOLD_PERCENT: 'fam_expense_threshold_percent',
  FAM_INVESTMENT_THRESHOLD_PERCENT: 'fam_investment_threshold_percent',
  FAM_INCOME_THRESHOLD_PERCENT: 'fam_income_threshold_percent',
  SMTP_ENABLED: 'smtp_enabled',
  SMTP_HOST: 'smtp_host',
  SMTP_PORT: 'smtp_port',
  SMTP_SECURITY: 'smtp_security',
  SMTP_SECURE: 'smtp_secure',
  SMTP_USERNAME: 'smtp_username',
  SMTP_PASSWORD: 'smtp_password',
  SMTP_SENDER_EMAIL: 'smtp_sender_email',
  SMTP_SENDER_NAME: 'smtp_sender_name',
  SMTP_FROM_ADDRESS: 'smtp_from_address',
  SMTP_FROM_NAME: 'smtp_from_name',
  OTP_EXPIRY_MINUTES: 'otp_expiry_minutes',
  OTP_MAX_ATTEMPTS: 'otp_max_attempts',
  OTP_RESEND_COOLDOWN_SECONDS: 'otp_resend_cooldown_seconds',
  OTP_MAX_RESENDS_PER_HOUR: 'otp_max_resends_per_hour',
  REGISTRATION_REQUIRE_EMAIL_VERIFICATION: 'registration_require_email_verification',
} as const;

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

export const DateFormatSchema = z.enum(['DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']);
export type DateFormat = z.infer<typeof DateFormatSchema>;
export type DateFormatType = DateFormat;

export const TimeFormatSchema = z.enum(['12h', '24h']);
export type TimeFormat = z.infer<typeof TimeFormatSchema>;
export type TimeFormatType = TimeFormat;

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', description: 'e.g. 10-09-2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: 'e.g. 10/09/2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: 'e.g. 09/10/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: 'e.g. 2026-09-10' },
] as const;

export const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour (AM/PM)', description: 'e.g. 09:30 PM' },
  { value: '24h', label: '24-hour', description: 'e.g. 21:30' },
] as const;

export const UserSettingsDataSchema = z.object({
  userId: z.string().uuid().optional(),
  currency: CurrencyCodeSchema.default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  financialMonthStartDay: z.number().int().min(1).max(28).default(1),
  dateFormat: DateFormatSchema.default('DD-MM-YYYY'),
  timeFormat: TimeFormatSchema.default('12h'),
  quickAdd: z.boolean().default(false),
  quickAddEnabled: z.boolean().default(false),
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
  dateFormat: DateFormatSchema.optional(),
  timeFormat: TimeFormatSchema.optional(),
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
