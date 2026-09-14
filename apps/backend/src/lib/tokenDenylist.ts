import { getRedisClient } from './redis.js';
import { logger } from './logger.js';

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

