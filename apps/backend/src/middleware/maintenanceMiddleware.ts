import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

let maintenanceCached: boolean | null = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 3000; // 3 second cache

export async function isMaintenanceModeActive(): Promise<boolean> {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  const now = Date.now();
  if (maintenanceCached !== null && (now - lastCheckTime) < CACHE_TTL_MS) {
    return maintenanceCached;
  }
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'maintenance_mode' },
    });
    maintenanceCached = setting ? Boolean(setting.value) : false;
    lastCheckTime = now;
  } catch {
    maintenanceCached = false;
  }
  return maintenanceCached;
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

  const isMaintenance = await isMaintenanceModeActive();
  if (!isMaintenance) {
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
      message: 'Platform is currently undergoing scheduled maintenance. Please try again shortly.',
    },
  });
}
