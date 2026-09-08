import { prisma } from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { notificationService } from './notificationService.js';
import { getFinancialMonthRange } from './famService.js';
import { getCurrencyByCode } from '@finance/shared-types';

export interface CreateReminderData {
  type: string;
  timingConfig: {
    daysBefore?: number;
    timeOfDay?: string;
    recurringTransactionId?: string;
    [key: string]: any;
  };
  enabled?: boolean;
}

export interface UpdateReminderData {
  type?: string;
  timingConfig?: any;
  enabled?: boolean;
}

export function formatReminder(reminder: any) {
  return {
    id: reminder.id,
    userId: reminder.userId,
    type: reminder.type,
    timingConfig: typeof reminder.timingConfig === 'string' ? JSON.parse(reminder.timingConfig) : reminder.timingConfig,
    enabled: reminder.enabled,
    createdAt: reminder.createdAt instanceof Date ? reminder.createdAt.toISOString() : reminder.createdAt,
    updatedAt: reminder.updatedAt instanceof Date ? reminder.updatedAt.toISOString() : reminder.updatedAt,
  };
}

export class ReminderService {
  /**
   * Lists all reminders for a user.
   */
  async listReminders(userId: string) {
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return reminders.map(formatReminder);
  }

  /**
   * Retrieves a single reminder by ID with ownership verification.
   */
  async getReminder(userId: string, id: string) {
    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder || reminder.userId !== userId) {
      throw new NotFoundError('Reminder not found');
    }

    return formatReminder(reminder);
  }

  /**
   * Creates a new reminder configuration.
   */
  async createReminder(userId: string, data: CreateReminderData) {
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        type: data.type,
        timingConfig: data.timingConfig || { daysBefore: 3 },
        enabled: data.enabled !== undefined ? data.enabled : true,
      },
    });

    return formatReminder(reminder);
  }

  /**
   * Updates an existing reminder configuration.
   */
  async updateReminder(userId: string, id: string, data: UpdateReminderData) {
    const existing = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Reminder not found');
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.timingConfig !== undefined ? { timingConfig: data.timingConfig } : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      },
    });

    return formatReminder(updated);
  }

  /**
   * Deletes a reminder.
   */
  async deleteReminder(userId: string, id: string) {
    const existing = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Reminder not found');
    }

    await prisma.reminder.delete({
      where: { id },
    });

    return { message: 'Reminder deleted successfully' };
  }

  /**
   * Toggles reminder enabled state.
   */
  async toggleStatus(userId: string, id: string, enabled?: boolean) {
    const existing = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Reminder not found');
    }

    const nextEnabled = enabled !== undefined ? enabled : !existing.enabled;

    const updated = await prisma.reminder.update({
      where: { id },
      data: { enabled: nextEnabled },
    });

    return formatReminder(updated);
  }

  /**
   * Due-date check logic that inspects upcoming recurring transactions and month-end dates,
   * creating Notifications when due.
   */
  async checkDueReminders(asOfDate: Date = new Date()) {
    const activeReminders = await prisma.reminder.findMany({
      where: { enabled: true },
      include: { user: { include: { userSettings: true } } },
    });

    const generatedNotifications: any[] = [];
    const todayStart = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate(), 23, 59, 59, 999);

    for (const reminder of activeReminders) {
      const config = typeof reminder.timingConfig === 'string' ? JSON.parse(reminder.timingConfig) : reminder.timingConfig;
      const daysBefore = typeof config?.daysBefore === 'number' ? config.daysBefore : 3;

      if (reminder.type === 'RECURRING_EXPENSE' || reminder.type === 'RECURRING_INVESTMENT' || reminder.type === 'CUSTOM') {
        const typeFilter = reminder.type === 'RECURRING_EXPENSE' ? 'EXPENSE' : reminder.type === 'RECURRING_INVESTMENT' ? 'INVESTMENT' : undefined;

        // Find active recurring transactions where nextOccurrence falls within [asOfDate, asOfDate + daysBefore days]
        const windowEnd = new Date(asOfDate.getTime() + (daysBefore + 1) * 24 * 60 * 60 * 1000);
        const recurringList = await prisma.recurringTransaction.findMany({
          where: {
            userId: reminder.userId,
            status: 'ACTIVE',
            ...(typeFilter ? { type: typeFilter as any } : {}),
            ...(config?.recurringTransactionId ? { id: config.recurringTransactionId } : {}),
            nextOccurrence: {
              gte: asOfDate,
              lte: windowEnd,
            },
          },
        });

        const userCurrency = reminder.user?.userSettings?.currency || 'INR';
        const currMeta = getCurrencyByCode(userCurrency);

        for (const rec of recurringList) {
          const daysUntil = Math.max(0, Math.ceil((new Date(rec.nextOccurrence).getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24)));
          const amountFormatted = (Number(rec.amount) / 100).toLocaleString(currMeta.locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: currMeta.decimalPlaces,
          });
          const title = `Upcoming Payment: ${rec.description || rec.type}`;
          const message = `Your recurring ${rec.type.toLowerCase()} of ${currMeta.symbol}${amountFormatted} is due in ${daysUntil} day(s).`;

          // Deduplication: check if notification with same title was sent to user today
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: reminder.userId,
              title,
              createdAt: { gte: todayStart, lte: todayEnd },
            },
          });

          if (!existingNotif) {
            const notif = await notificationService.createNotification(reminder.userId, {
              title,
              message,
              type: 'DUE_DATE',
            });
            generatedNotifications.push(notif);
          }
        }
      } else if (reminder.type === 'MONTH_END') {
        const startDay = reminder.user?.userSettings?.financialMonthStartDay ?? 1;
        const period = getFinancialMonthRange(startDay, asOfDate);
        const daysUntilMonthEnd = Math.max(0, Math.ceil((period.end.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24)));

        if (daysUntilMonthEnd <= daysBefore) {
          const title = 'Financial Month-End Approaching';
          const message = `Your financial month closes in ${daysUntilMonthEnd} day(s). Review your budget and report targets.`;

          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: reminder.userId,
              title,
              createdAt: { gte: todayStart, lte: todayEnd },
            },
          });

          if (!existingNotif) {
            const notif = await notificationService.createNotification(reminder.userId, {
              title,
              message,
              type: 'REMINDER',
            });
            generatedNotifications.push(notif);
          }
        }
      }
    }

    return generatedNotifications;
  }
}

export const reminderService = new ReminderService();
export default reminderService;
