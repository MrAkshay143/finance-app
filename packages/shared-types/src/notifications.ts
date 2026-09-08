import { z } from 'zod';
import { NotificationTypeSchema } from './enums.js';

export const NotificationItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  read: z.boolean(),
  createdAt: z.string().datetime().or(z.string()),
});
export type NotificationItem = z.infer<typeof NotificationItemSchema>;

export const ListNotificationsResponseSchema = z.object({
  items: z.array(NotificationItemSchema),
  unreadCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;

export const NotificationFilterQuerySchema = z.object({
  filter: z.enum(['all', 'unread', 'read']).default('all').optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  pageSize: z.coerce.number().int().positive().max(100).default(20).optional(),
});
export type NotificationFilterQuery = z.infer<typeof NotificationFilterQuerySchema>;
