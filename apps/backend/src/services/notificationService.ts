import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { emitNotification, emitUnreadCount } from '../sockets/socketGateway.js';

export interface CreateNotificationData {
  title: string;
  message: string;
  type: string;
}

export function formatNotification(notification: any) {
  return {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    createdAt: notification.createdAt instanceof Date ? notification.createdAt.toISOString() : notification.createdAt,
  };
}

export class NotificationService {
  // Return paginated user notifications filtered by read status
  async listNotifications(
    userId: string,
    filter: 'all' | 'unread' | 'read' = 'all',
    page = 1,
    pageSize = 20
  ) {
    const where: any = { userId };
    if (filter === 'unread') {
      where.read = false;
    } else if (filter === 'read') {
      where.read = true;
    }

    const [total, unreadCount, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(formatNotification),
      unreadCount,
      page,
      pageSize,
      total,
    };
  }

  /**
   * Returns current count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Marks a single notification as read and updates connected socket clients.
   */
  async markAsRead(userId: string, id: string) {
    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    const unreadCount = await this.getUnreadCount(userId);
    emitUnreadCount(userId, unreadCount);

    return formatNotification(updated);
  }

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    emitUnreadCount(userId, 0);

    return { message: 'All notifications marked as read' };
  }

  // Create notification record and broadcast realtime socket event
  async createNotification(userId: string, data: CreateNotificationData) {
    const created = await prisma.notification.create({
      data: {
        userId,
        title: data.title.trim(),
        message: data.message.trim(),
        type: data.type,
        read: false,
      },
    });

    const unreadCount = await this.getUnreadCount(userId);
    const formatted = formatNotification(created);

    emitNotification(userId, formatted);
    emitUnreadCount(userId, unreadCount);

    return formatted;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
