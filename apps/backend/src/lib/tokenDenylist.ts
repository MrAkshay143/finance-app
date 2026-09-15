import { getRedisClient } from './redis.js';
import { logger } from './logger.js';
import { prisma } from './prisma.js';
import { UnauthorizedError } from '../utils/errors.js';

// In-memory fallback map: key -> expiration timestamp (epoch ms)
const memoryDenylist = new Map<string, number>();

// Periodic cleanup of expired in-memory items every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, exp] of memoryDenylist.entries()) {
    if (exp <= now) {
      memoryDenylist.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

// User revocation maps for immediate user-wide session invalidation (e.g. on suspension or role change)
const memoryUserRevocations = new Map<string, { revokedAt: number; expiresAt: number }>();

// Add revoked token identifier to Redis with in-memory TTL fallback
export async function addToDenylist(key: string, ttlSeconds = 900): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(`denylist:${key}`, '1', { EX: Math.max(ttlSeconds, 1) });
      return;
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Redis denylist write failed, falling back to memory');
    }
  }

  // Memory fallback
  const exp = Date.now() + Math.max(ttlSeconds, 1) * 1000;
  memoryDenylist.set(key, exp);
}

// Check if token identifier exists in Redis or in-memory denylist
export async function isDenylisted(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const exists = await redis.get(`denylist:${key}`);
      return exists !== null;
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Redis denylist read failed, checking memory fallback');
    }
  }

  const exp = memoryDenylist.get(key);
  if (!exp) {
    return false;
  }
  if (exp <= Date.now()) {
    memoryDenylist.delete(key);
    return false;
  }
  return true;
}

// Immediately revoke all tokens for a user (e.g. on suspension, role change, or session revocation)
export async function revokeUserTokens(userId: string, ttlSeconds = 86400): Promise<void> {
  const now = Date.now();
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(`user_revoked:${userId}`, String(now), { EX: Math.max(ttlSeconds, 1) });
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Redis user revocation write failed, falling back to memory');
    }
  }

  // Memory fallback
  memoryUserRevocations.set(userId, {
    revokedAt: now,
    expiresAt: now + Math.max(ttlSeconds, 1) * 1000,
  });
}

// Check if a user's tokens issued at tokenIatSeconds have been revoked
export async function isUserRevoked(userId: string, tokenIatSeconds?: number): Promise<boolean> {
  const redis = getRedisClient();
  let revokedAt: number | null = null;
  if (redis) {
    try {
      const val = await redis.get(`user_revoked:${userId}`);
      if (val) {
        revokedAt = Number(val);
      }
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Redis user revocation read failed, checking memory fallback');
    }
  }

  if (revokedAt === null) {
    const mem = memoryUserRevocations.get(userId);
    if (mem) {
      if (mem.expiresAt <= Date.now()) {
        memoryUserRevocations.delete(userId);
      } else {
        revokedAt = mem.revokedAt;
      }
    }
  }

  if (revokedAt !== null) {
    if (tokenIatSeconds !== undefined) {
      // If token was issued before the revocation timestamp, reject it
      return tokenIatSeconds * 1000 <= revokedAt;
    }
    return true;
  }
  return false;
}

// Clear in-memory token denylist for test isolation
export function clearMemoryDenylist(): void {
  memoryDenylist.clear();
  memoryUserRevocations.clear();
}

// Atomically consumes registration token via Redis SET NX EX, DB fallback, or fails closed
export async function consumeRegistrationToken(jti: string, ttlSeconds = 900): Promise<boolean> {
  const redis = getRedisClient();
  if (redis && redis.isOpen) {
    try {
      const res = await redis.set(`reg_token_consumed:${jti}`, '1', {
        NX: true,
        EX: Math.max(ttlSeconds, 1),
      });
      return res === 'OK';
    } catch (err: any) {
      logger.warn({ err: err?.message, jti }, 'Redis atomic token consumption failed, falling back to database');
    }
  }

  // Database-backed distributed atomic lock (works across multiple Node instances, clusters, restarts)
  try {
    const key = `reg_token:${jti}`;
    // Atomic insert into app_settings table (zero-DDL, key is PRIMARY KEY)
    await prisma.appSetting.create({
      data: {
        key,
        value: { consumedAt: new Date().toISOString(), ttl: ttlSeconds },
      },
    });
    return true;
  } catch (err: any) {
    // Unique constraint violation means token was already consumed!
    if (
      err?.code === 'P2002' ||
      err?.message?.includes('Unique constraint') ||
      err?.message?.includes('Duplicate entry') ||
      err?.message?.includes('ER_DUP_ENTRY')
    ) {
      return false; // Replay detected!
    }

    // If in test environment without full DB, fall back to memory
    if (process.env.NODE_ENV === 'test') {
      const exp = memoryDenylist.get(jti);
      if (exp && exp > Date.now()) {
        return false;
      }
      memoryDenylist.set(jti, Date.now() + Math.max(ttlSeconds, 1) * 1000);
      return true;
    }

    // In production: Distributed state is completely unavailable -> MUST FAIL CLOSED
    logger.error({ err: err?.message, jti }, 'Failed to atomically consume registration token; failing closed');
    throw new UnauthorizedError('Registration state validation unavailable. Please try again.');
  }
}

