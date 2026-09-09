import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

interface MaintenanceState {
  active: boolean;
  message: string;
}

let maintenanceCached: MaintenanceState | null = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 3000; // 3 second cache
export const DEFAULT_MAINTENANCE_MESSAGE =
  'Platform is currently undergoing scheduled maintenance. Please try again shortly.';

export async function getMaintenanceInfo(): Promise<MaintenanceState> {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_MAINTENANCE) {
    return { active: false, message: DEFAULT_MAINTENANCE_MESSAGE };
  }
  const now = Date.now();
  if (maintenanceCached !== null && (now - lastCheckTime) < CACHE_TTL_MS) {
    return maintenanceCached;
  }
  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: { in: ['maintenance_mode', 'maintenance_message'] },
      },
    });
    const modeSetting = settings.find((s) => s.key === 'maintenance_mode');
    const msgSetting = settings.find((s) => s.key === 'maintenance_message');
    const active = modeSetting ? Boolean(modeSetting.value) : false;
    const rawMsg = msgSetting?.value;
    const message =
      typeof rawMsg === 'string' && rawMsg.trim().length > 0
        ? rawMsg
        : DEFAULT_MAINTENANCE_MESSAGE;

    maintenanceCached = { active, message };
    lastCheckTime = now;
  } catch {
    maintenanceCached = {
      active: false,
      message: DEFAULT_MAINTENANCE_MESSAGE,
    };
  }
  return maintenanceCached;
}

export async function isMaintenanceModeActive(): Promise<boolean> {
  const info = await getMaintenanceInfo();
  return info.active;
}

export function invalidateMaintenanceCache(): void {
  maintenanceCached = null;
  lastCheckTime = 0;
}

export async function maintenanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Allow health checks, auth routes, and admin routes always
  const path = req.path;
  if (
    path.startsWith('/auth') ||
    path.startsWith('/admin') ||
    path.startsWith('/healthz') ||
    path.startsWith('/readyz') ||
    path.startsWith('/metrics')
  ) {
    return next();
  }

  const { active, message } = await getMaintenanceInfo();
  if (!active) {
    return next();
  }

  // If user is already authenticated as ADMIN, allow access
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  res.status(503).json({
    success: false,
    error: {
      code: 'MAINTENANCE_MODE',
      message: message || DEFAULT_MAINTENANCE_MESSAGE,
    },
  });
}
