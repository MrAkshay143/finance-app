import { z } from 'zod';
import { PaginationSchema } from './api.js';

export const AuditCategorySchema = z.enum([
  'Login',
  'Transactions',
  'Profile',
  'Settings',
  'Security',
  'Admin',
]);
export type AuditCategory = z.infer<typeof AuditCategorySchema>;

export const AuditLogRecordSchema = z.object({
  id: z.string(),
  actorUserId: z.string().nullable().optional(),
  targetUserId: z.string().nullable().optional(),
  action: z.string(),
  category: z.string().optional(),
  actorEmail: z.string().nullable().optional(),
  actorName: z.string().nullable().optional(),
  targetEmail: z.string().nullable().optional(),
  targetName: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  details: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
});
export type AuditLogRecord = z.infer<typeof AuditLogRecordSchema>;

export const ListAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>;

export const ListAuditLogsResponseSchema = z.object({
  logs: z.array(AuditLogRecordSchema),
  pagination: PaginationSchema,
});
export type ListAuditLogsResponse = z.infer<typeof ListAuditLogsResponseSchema>;
