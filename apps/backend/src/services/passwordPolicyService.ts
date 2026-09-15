import { prisma } from '../lib/prisma.js';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { APP_SETTINGS_KEYS } from '@finance/shared-types';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const CACHE_KEY = 'password_policy:v1';
const CACHE_TTL_SECONDS = 60;

let memoryCache: { policy: PasswordPolicy; expiresAt: number } | null = null;

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: false,
};

async function loadPolicyFromDb(): Promise<PasswordPolicy> {
  const keys = [
    APP_SETTINGS_KEYS.PASSWORD_MIN_LENGTH,
    APP_SETTINGS_KEYS.PASSWORD_REQUIRE_UPPERCASE,
    APP_SETTINGS_KEYS.PASSWORD_REQUIRE_LOWERCASE,
    APP_SETTINGS_KEYS.PASSWORD_REQUIRE_DIGIT,
    APP_SETTINGS_KEYS.PASSWORD_REQUIRE_SPECIAL,
  ];

  const rows = await prisma.appSetting.findMany({
    where: { key: { in: keys } },
  });

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const toBool = (val: any, fallback: boolean): boolean => {
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === 1 || val === '1') return true;
    if (val === 'false' || val === 0 || val === '0') return false;
    return fallback;
  };

  const toInt = (val: any, fallback: number): number => {
    if (val === undefined || val === null) return fallback;
    const n = typeof val === 'number' ? val : parseInt(String(val), 10);
    return isNaN(n) || n < 1 ? fallback : n;
  };

  return {
    minLength: toInt(map[APP_SETTINGS_KEYS.PASSWORD_MIN_LENGTH], DEFAULT_POLICY.minLength),
    requireUppercase: toBool(map[APP_SETTINGS_KEYS.PASSWORD_REQUIRE_UPPERCASE], DEFAULT_POLICY.requireUppercase),
    requireLowercase: toBool(map[APP_SETTINGS_KEYS.PASSWORD_REQUIRE_LOWERCASE], DEFAULT_POLICY.requireLowercase),
    requireDigit: toBool(map[APP_SETTINGS_KEYS.PASSWORD_REQUIRE_DIGIT], DEFAULT_POLICY.requireDigit),
    requireSpecial: toBool(map[APP_SETTINGS_KEYS.PASSWORD_REQUIRE_SPECIAL], DEFAULT_POLICY.requireSpecial),
  };
}

// Returns active password policy cached in Redis or in-memory
export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  const redis = getRedisClient();
  if (redis?.isOpen) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached) as PasswordPolicy;
    } catch {
      // Fall through to DB
    }
  } else {
    if (memoryCache && Date.now() < memoryCache.expiresAt) {
      return memoryCache.policy;
    }
  }

  let policy: PasswordPolicy;
  try {
    policy = await loadPolicyFromDb();
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to load password policy from DB - using defaults');
    policy = { ...DEFAULT_POLICY };
  }

  if (redis?.isOpen) {
    try {
      await redis.set(CACHE_KEY, JSON.stringify(policy), { EX: CACHE_TTL_SECONDS });
    } catch {}
  } else {
    memoryCache = { policy, expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000 };
  }

  return policy;
}

// Validates a password against the current active policy. This is the SINGLE authoritative password validator for the entire backend.
export async function validatePasswordAgainstPolicy(
  password: string
): Promise<PasswordValidationResult> {
  const policy = await getPasswordPolicy();
  const errors: string[] = [];

  if (!password || password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  if (policy.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit (0-9)');
  }

  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return { valid: errors.length === 0, errors };
}

// Invalidates the password policy cache. Call this after an admin updates password policy settings.
export async function invalidatePasswordPolicyCache(): Promise<void> {
  memoryCache = null;
  const redis = getRedisClient();
  if (redis?.isOpen) {
    try {
      await redis.del(CACHE_KEY);
    } catch {}
  }
}
