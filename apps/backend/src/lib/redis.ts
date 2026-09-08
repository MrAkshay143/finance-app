import { createClient, RedisClientType } from 'redis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let redisClient: RedisClientType | null = null;
let isConnecting = false;

export function getRedisClient(): RedisClientType | null {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  return null;
}

export async function initRedis(): Promise<RedisClientType | null> {
  if (redisClient?.isOpen) {
    return redisClient;
  }
  if (isConnecting) {
    return null;
  }

  try {
    isConnecting = true;
    const client = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis reconnection limit reached; operating in memory fallback mode');
            return false;
          }
          return Math.min(retries * 200, 2000);
        },
      },
    });

    client.on('error', (err) => {
      logger.warn({ err: err.message }, 'Redis error (fallback mode active)');
    });

    await client.connect();
    logger.info('Connected to Redis');
    redisClient = client as RedisClientType;
    isConnecting = false;
    return redisClient;
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to connect to Redis; continuing with in-memory fallback');
    isConnecting = false;
    return null;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}
