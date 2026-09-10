import { prisma } from '../lib/prisma.js';
import { logAuditEvent } from './auditService.js';
import { NotFoundError } from '../utils/errors.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh } from '../sockets/socketGateway.js';

export interface UserSettingsResponse {
  id?: string;
  userId: string;
  currency: string;
  timezone: string;
  financialMonthStartDay: number;
  quickAdd: boolean;
  quickAddEnabled: boolean;
  dashboardDonuts: {
    income: boolean;
    expense: boolean;
    investment: boolean;
  };
  dashboardDonutsConfig: {
    income: boolean;
    expense: boolean;
    investment: boolean;
  };
  features: {
    investments: boolean;
    recurring: boolean;
  };
  featuresConfig: {
    investments: boolean;
    recurring: boolean;
  };
  donutVisualsEnabled?: boolean;
  investmentsTrackingEnabled?: boolean;
  recurringTrackingEnabled?: boolean;
  reminderDaysBeforeDue?: number;
  notificationsEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserSettingsDto {
  currency?: string;
  timezone?: string;
  financialMonthStartDay?: number;
  quickAdd?: boolean;
  quickAddEnabled?: boolean;
  dashboardDonuts?: {
    income?: boolean;
    expense?: boolean;
    investment?: boolean;
  };
  dashboardDonutsConfig?: {
    income?: boolean;
    expense?: boolean;
    investment?: boolean;
  };
  features?: {
    investments?: boolean;
    recurring?: boolean;
  };
  featuresConfig?: {
    investments?: boolean;
    recurring?: boolean;
  };
  donutVisualsEnabled?: boolean;
  investmentsTrackingEnabled?: boolean;
  recurringTrackingEnabled?: boolean;
  reminderDaysBeforeDue?: number;
  notificationsEnabled?: boolean;
}

function parseJsonConfig<T>(raw: any, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatSettingsResponse(settings: any, userId: string): UserSettingsResponse {
  const defaultDonuts = { income: true, expense: true, investment: true };
  const defaultFeatures = { investments: true, recurring: true };

  const rawDonuts = parseJsonConfig(settings?.dashboardDonutsConfig, defaultDonuts);
  const rawFeatures = parseJsonConfig(settings?.featuresConfig, defaultFeatures);

  const quickAddValue = settings?.quickAddEnabled ?? true;

  return {
    id: settings?.id,
    userId: settings?.userId || userId,
    currency: settings?.currency || 'INR',
    timezone: settings?.timezone || 'Asia/Kolkata',
    financialMonthStartDay: settings?.financialMonthStartDay ?? 1,
    quickAdd: quickAddValue,
    quickAddEnabled: quickAddValue,
    dashboardDonuts: {
      income: rawDonuts.income ?? true,
      expense: rawDonuts.expense ?? true,
      investment: rawDonuts.investment ?? true,
    },
    dashboardDonutsConfig: {
      income: rawDonuts.income ?? true,
      expense: rawDonuts.expense ?? true,
      investment: rawDonuts.investment ?? true,
    },
    features: {
      investments: rawFeatures.investments ?? true,
      recurring: rawFeatures.recurring ?? true,
    },
    featuresConfig: {
      investments: rawFeatures.investments ?? true,
      recurring: rawFeatures.recurring ?? true,
    },
    donutVisualsEnabled: Boolean(rawDonuts.income || rawDonuts.expense || rawDonuts.investment),
    investmentsTrackingEnabled: rawFeatures.investments ?? true,
    recurringTrackingEnabled: rawFeatures.recurring ?? true,
    reminderDaysBeforeDue: 3,
    notificationsEnabled: true,
    createdAt: settings?.createdAt ? new Date(settings.createdAt).toISOString() : undefined,
    updatedAt: settings?.updatedAt ? new Date(settings.updatedAt).toISOString() : undefined,
  };
}

export class UserSettingsService {
  async getUserSettings(userId: string): Promise<UserSettingsResponse> {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Check if user exists first
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      settings = await prisma.userSettings.create({
        data: {
          userId,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          financialMonthStartDay: 1,
          quickAddEnabled: true,
          dashboardDonutsConfig: { income: true, expense: true, investment: true },
          featuresConfig: { investments: true, recurring: true },
        },
      });
    }

    return formatSettingsResponse(settings, userId);
  }

  async updateUserSettings(
    userId: string,
    data: UpdateUserSettingsDto,
    ipAddress?: string
  ): Promise<UserSettingsResponse> {
    const existing = await prisma.userSettings.findUnique({
      where: { userId },
    });

    const currentDonuts = parseJsonConfig(existing?.dashboardDonutsConfig, {
      income: true,
      expense: true,
      investment: true,
    });
    const currentFeatures = parseJsonConfig(existing?.featuresConfig, {
      investments: true,
      recurring: true,
    });

    // Resolve quickAdd
    let quickAddVal = existing?.quickAddEnabled ?? true;
    if (data.quickAdd !== undefined) {
      quickAddVal = data.quickAdd;
    } else if (data.quickAddEnabled !== undefined) {
      quickAddVal = data.quickAddEnabled;
    }

    // Resolve dashboard donuts
    const incomingDonuts = data.dashboardDonutsConfig || data.dashboardDonuts;
    const mergedDonuts = incomingDonuts
      ? { ...currentDonuts, ...incomingDonuts }
      : currentDonuts;

    if (data.donutVisualsEnabled === false) {
      mergedDonuts.income = false;
      mergedDonuts.expense = false;
      mergedDonuts.investment = false;
    } else if (data.donutVisualsEnabled === true && !mergedDonuts.income && !mergedDonuts.expense && !mergedDonuts.investment) {
      mergedDonuts.income = true;
      mergedDonuts.expense = true;
      mergedDonuts.investment = true;
    }

    // Resolve features config
    const incomingFeatures = data.featuresConfig || data.features;
    let mergedFeatures = incomingFeatures
      ? { ...currentFeatures, ...incomingFeatures }
      : currentFeatures;

    if (data.investmentsTrackingEnabled !== undefined) {
      mergedFeatures = { ...mergedFeatures, investments: data.investmentsTrackingEnabled };
    }
    if (data.recurringTrackingEnabled !== undefined) {
      mergedFeatures = { ...mergedFeatures, recurring: data.recurringTrackingEnabled };
    }

    const updated = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        currency: data.currency || 'INR',
        timezone: data.timezone || 'Asia/Kolkata',
        financialMonthStartDay: data.financialMonthStartDay ?? 1,
        quickAddEnabled: quickAddVal,
        dashboardDonutsConfig: mergedDonuts,
        featuresConfig: mergedFeatures,
      },
      update: {
        currency: data.currency !== undefined ? data.currency : undefined,
        timezone: data.timezone !== undefined ? data.timezone : undefined,
        financialMonthStartDay:
          data.financialMonthStartDay !== undefined ? data.financialMonthStartDay : undefined,
        quickAddEnabled: quickAddVal,
        dashboardDonutsConfig: mergedDonuts,
        featuresConfig: mergedFeatures,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'USER_SETTINGS_UPDATE',
      targetUserId: userId,
      details: {
        currency: data.currency,
        timezone: data.timezone,
        financialMonthStartDay: data.financialMonthStartDay,
        quickAdd: quickAddVal,
        dashboardDonuts: mergedDonuts,
        features: mergedFeatures,
      },
      ipAddress,
    });

    await invalidateDashboardCache(userId);
    try {
      emitDashboardRefresh(userId);
    } catch {}

    return formatSettingsResponse(updated, userId);
  }
}

export const userSettingsService = new UserSettingsService();
export default userSettingsService;
