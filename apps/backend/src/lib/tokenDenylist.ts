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

/**
 * Adds a revoked access token's jti or token hash to the denylist with a TTL.
 */
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

/**
 * Checks if a token's jti or token hash is currently denylisted.
 */
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

/**
 * Clears the in-memory denylist (primarily for test isolation).
 */
export function clearMemoryDenylist(): void {
  memoryDenylist.clear();
}
