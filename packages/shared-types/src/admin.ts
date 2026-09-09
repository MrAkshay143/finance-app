import { z } from 'zod';
import { UserRoleSchema, UserStatusSchema } from './enums.js';
import { PaginationSchema } from './api.js';

export const AdminDashboardMetricsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  suspendedUsers: z.number().int().nonnegative(),
  adminUsers: z.number().int().nonnegative(),
  adminsCount: z.number().int().nonnegative().optional(),
});
export type AdminDashboardMetrics = z.infer<typeof AdminDashboardMetricsSchema>;

export const AdminUserItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  mobileNumber: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  failedLoginAttempts: z.number().int(),
  lockedUntil: z.string().datetime().nullable().optional(),
  lastLoginAt: z.string().datetime().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
  createdAt: z.string().datetime(),
});
export type AdminUserItem = z.infer<typeof AdminUserItemSchema>;

export const AdminUserListResponseSchema = z.object({
  users: z.array(AdminUserItemSchema),
  pagination: PaginationSchema,
});
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;

export const AdminUserDetailsSchema = z.object({
  user: AdminUserItemSchema,
  financeProfile: z.record(z.any()).nullable().optional(),
  userSettings: z.record(z.any()).nullable().optional(),
  securityQuestionsCount: z.number().int().nonnegative(),
  accountsSummary: z.object({
    count: z.number().int().nonnegative(),
    totalBalancePaise: z.number().int(),
  }),
  recentAuditLogs: z.array(z.record(z.any())),
});
export type AdminUserDetails = z.infer<typeof AdminUserDetailsSchema>;

export const AdminUpdateUserInputSchema = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  resetPassword: z.boolean().optional(),
  resetKba: z.boolean().optional(),
  unlockAccount: z.boolean().optional(),
});
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserInputSchema>;

export const AdminResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  temporaryPassword: z.string().optional(),
  message: z.string(),
});
export type AdminResetPasswordResponse = z.infer<typeof AdminResetPasswordResponseSchema>;

export const AppSettingsSchema = z.object({
  sessionTimeoutMinutes: z.number().int().min(1).max(1440).default(60),
  maxFailedLoginAttempts: z.number().int().min(1).max(20).default(5),
  maxFailedAttempts: z.number().int().min(1).max(20).optional().default(5),
  lockoutDurationMinutes: z.number().int().min(1).max(1440).default(15),
  requireKbaForSensitiveActions: z.boolean().default(true),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const UpdateAppSettingsInputSchema = AppSettingsSchema.partial();
export type UpdateAppSettingsInput = z.infer<typeof UpdateAppSettingsInputSchema>;

export const AuditLogItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  actorUserId: z.string().uuid().nullable().optional(),
  targetUserId: z.string().uuid().nullable().optional(),
  action: z.string(),
  category: z.string().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  details: z.record(z.any()).nullable().optional(),
  createdAt: z.string().datetime(),
});
export type AuditLogItem = z.infer<typeof AuditLogItemSchema>;

export const PlatformAnalyticsSchema = z.object({
  timeframe: z.string(),
  summary: z.object({
    totalUsers: z.number().int().nonnegative(),
    activeUsers: z.number().int().nonnegative(),
    suspendedUsers: z.number().int().nonnegative(),
    adminUsers: z.number().int().nonnegative(),
    onboardedUsers: z.number().int().nonnegative(),
    kbaConfiguredUsers: z.number().int().nonnegative(),
    fundedUsers: z.number().int().nonnegative(),
    totalTransactionsCount: z.number().int().nonnegative(),
    grossTransactionVolumePaise: z.number().nonnegative(),
    totalSystemBalancePaise: z.number(),
    avgTransactionsPerUser: z.number(),
  }),
  funnel: z.object({
    totalRegistered: z.number().int().nonnegative(),
    onboardedCount: z.number().int().nonnegative(),
    onboardedPercentage: z.number(),
    kbaConfiguredCount: z.number().int().nonnegative(),
    kbaPercentage: z.number(),
    accountsLinkedCount: z.number().int().nonnegative(),
    accountsLinkedPercentage: z.number(),
  }),
  growth: z.array(
    z.object({
      date: z.string(),
      signups: z.number().int().nonnegative(),
    })
  ),
});
export type PlatformAnalyticsData = z.infer<typeof PlatformAnalyticsSchema>;

export const SystemHealthSchema = z.object({
  status: z.enum(['HEALTHY', 'DEGRADED']),
  uptimeSeconds: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
  database: z.object({
    connected: z.boolean(),
    latencyMs: z.number(),
  }),
  memory: z.object({
    heapUsedMB: z.number(),
    heapTotalMB: z.number(),
    rssMB: z.number(),
  }),
  tableCounts: z.object({
    users: z.number().int().nonnegative(),
    accounts: z.number().int().nonnegative(),
    transactions: z.number().int().nonnegative(),
    auditLogs: z.number().int().nonnegative(),
  }),
});
export type SystemHealthData = z.infer<typeof SystemHealthSchema>;

export const UserSessionItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  userAgent: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  familyId: z.string(),
});
export type UserSessionItem = z.infer<typeof UserSessionItemSchema>;
