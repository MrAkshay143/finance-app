import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../lib/redis.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
}

interface MemoryStoreEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, MemoryStoreEntry>();

if (env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 300000).unref();
}

function updateMemoryStore(key: string, windowMs: number): number {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message = options.message || 'Too many attempts. Please try again shortly.';
  const defaultKeyGen = (req: Request) => {
    const ip =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown';
    return `${req.baseUrl || ''}:${ip}`;
  };
  const keyGenerator = options.keyGenerator || defaultKeyGen;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (options.skip && options.skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const redisClient = getRedisClient();

    let currentCount = 0;
    let resetTime = Date.now() + windowMs;

    if (redisClient && redisClient.isOpen) {
      try {
        const redisKey = `ratelimit:${key}`;
        const count = await redisClient.incr(redisKey);
        if (count === 1) {
          await redisClient.pExpire(redisKey, windowMs);
        }
        const ttl = await redisClient.pTTL(redisKey);
        resetTime = Date.now() + (ttl > 0 ? ttl : windowMs);
        currentCount = count;
      } catch (err: any) {
        logger.warn(
          { err: err?.message },
          'Redis rate limiter query failed, falling back to memory store'
        );
        currentCount = updateMemoryStore(key, windowMs);
        resetTime = memoryStore.get(key)!.resetTime;
      }
    } else {
      currentCount = updateMemoryStore(key, windowMs);
      resetTime = memoryStore.get(key)!.resetTime;
    }

    const remaining = Math.max(0, max - currentCount);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (currentCount > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message,
        },
      });
      return;
    }

    next();
  };
}

export const rateLimiter = createRateLimiter();
export default rateLimiter;
