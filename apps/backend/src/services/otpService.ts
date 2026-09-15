import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';
import { logAuditEvent } from './auditService.js';
import { APP_SETTINGS_KEYS } from '@finance/shared-types';

const DEFAULT_OTP_EXPIRY_MINUTES = 10;
const DEFAULT_OTP_MAX_ATTEMPTS = 5;
const DEFAULT_OTP_RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_OTP_MAX_RESENDS_PER_HOUR = 5;

// In-memory fallback maps for when Redis is unavailable
const resendCooldownMemory = new Map<string, number>(); // key → expiryMs
const resendCountMemory = new Map<string, { count: number; resetAt: number }>();

export function clearOtpCooldowns(): void {
  resendCooldownMemory.clear();
  resendCountMemory.clear();
}

export type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

// Reads numeric setting from AppSettings DB with fallback
async function getNumericSetting(key: string, defaultValue: number): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (row?.value !== undefined && row.value !== null) {
      const v = typeof row.value === 'number' ? row.value : Number(row.value);
      if (!isNaN(v)) return v;
    }
  } catch {
    // Non-fatal: fall through to default
  }
  return defaultValue;
}

async function getBooleanSetting(key: string, defaultValue: boolean): Promise<boolean> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (row?.value !== undefined && row.value !== null) {
      return row.value === true || row.value === 'true' || row.value === 1;
    }
  } catch {}
  return defaultValue;
}

// Hash a 6-digit OTP with SHA-256. Never store or log plaintext OTPs.
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

// Generate a cryptographically random 6-digit numeric OTP.
function generateOtpValue(): string {
  // Use crypto.randomInt for unbiased numeric OTP
  const value = crypto.randomInt(0, 1_000_000);
  return value.toString().padStart(6, '0');
}

const resendCooldownRedisKey = (email: string, purpose: OtpPurpose) =>
  `otp_resend_cooldown:${purpose}:${email.toLowerCase()}`;
const resendCountRedisKey = (email: string, purpose: OtpPurpose) =>
  `otp_resend_count:${purpose}:${email.toLowerCase()}`;

export class OtpService {
  // Generates 6-digit OTP enforcing cooldown, hourly limits, and SHA-256 hash storage
  async generateOtp(email: string, purpose: OtpPurpose): Promise<{ otp: string; otpId: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Load admin-configurable limits
    const resendCooldownSecs = await getNumericSetting(
      APP_SETTINGS_KEYS.OTP_RESEND_COOLDOWN_SECONDS,
      DEFAULT_OTP_RESEND_COOLDOWN_SECONDS
    );
    const maxResendsPerHour = await getNumericSetting(
      APP_SETTINGS_KEYS.OTP_MAX_RESENDS_PER_HOUR,
      DEFAULT_OTP_MAX_RESENDS_PER_HOUR
    );
    const expiryMinutes = await getNumericSetting(
      APP_SETTINGS_KEYS.OTP_EXPIRY_MINUTES,
      DEFAULT_OTP_EXPIRY_MINUTES
    );

    // Check resend cooldown (Redis atomic SET NX prevents race conditions)
    const cooldownKey = resendCooldownRedisKey(normalizedEmail, purpose);
    const countKey = resendCountRedisKey(normalizedEmail, purpose);
    const redis = getRedisClient();

    if (redis?.isOpen) {
      try {
        // Atomic: only set if not exists. PX = milliseconds TTL.
        const set = await redis.set(cooldownKey, '1', {
          NX: true,
          PX: resendCooldownSecs * 1000,
        });
        if (set === null) {
          // Key already exists → cooldown active
          const ttl = await redis.pTTL(cooldownKey);
          const secondsLeft = ttl > 0 ? Math.ceil(ttl / 1000) : resendCooldownSecs;
          throw new ValidationError(
            `Please wait ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''} before requesting another OTP.`
          );
        }
        // Check hourly resend count
        const countRaw = await redis.incr(countKey);
        if (countRaw === 1) {
          await redis.expire(countKey, 3600); // 1-hour rolling window
        }
        if (countRaw > maxResendsPerHour) {
          // Exceeded - remove the cooldown we just set, and throw
          await redis.del(cooldownKey);
          throw new ValidationError(
            `Too many OTP requests. Please try again in an hour.`
          );
        }
      } catch (err: any) {
        if (err instanceof ValidationError) throw err;
        logger.warn({ err: err?.message }, 'Redis OTP rate limit check failed - falling through to in-memory');
        // Fall through to in-memory fallback below
      }
    } else {
      // In-memory fallback
      const now = Date.now();
      const cooldownExpiry = resendCooldownMemory.get(cooldownKey);
      if (cooldownExpiry && now < cooldownExpiry) {
        const secondsLeft = Math.ceil((cooldownExpiry - now) / 1000);
        throw new ValidationError(
          `Please wait ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''} before requesting another OTP.`
        );
      }
      resendCooldownMemory.set(cooldownKey, now + resendCooldownSecs * 1000);

      const countEntry = resendCountMemory.get(countKey);
      if (!countEntry || now > countEntry.resetAt) {
        resendCountMemory.set(countKey, { count: 1, resetAt: now + 3600_000 });
      } else {
        countEntry.count += 1;
        if (countEntry.count > maxResendsPerHour) {
          throw new ValidationError(`Too many OTP requests. Please try again in an hour.`);
        }
      }
    }

    // Invalidate any existing active (unexpired, unused) OTPs for this email+purpose
    await prisma.emailOtp.updateMany({
      where: {
        email: normalizedEmail,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() }, // mark as "consumed" so they can no longer be verified
    });

    // Generate the OTP - never log the plaintext
    const otp = generateOtpValue();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const record = await prisma.emailOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        purpose,
        expiresAt,
      },
    });

    await logAuditEvent({
      action: 'OTP_GENERATED',
      details: { email: normalizedEmail, purpose, otpId: record.id, expiresAt },
    });

    // Return plaintext OTP - caller MUST pass it to email service only (never log)
    return { otp, otpId: record.id };
  }

  // Verifies a 6-digit OTP submitted by a user. - Finds the most recent active (unexpired, unused) OTP - Enforces per-OTP attempt limit - On success: marks as used (one-time use) - On failure: increments attempt counter and throws
  async verifyOtp(email: string, purpose: OtpPurpose, candidate: string): Promise<{ verified: true; otpId: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCandidate = (candidate || '').trim();

    if (!normalizedCandidate || !/^\d{6}$/.test(normalizedCandidate)) {
      throw new ValidationError('OTP must be 6 digits.');
    }

    const maxAttempts = await getNumericSetting(
      APP_SETTINGS_KEYS.OTP_MAX_ATTEMPTS,
      DEFAULT_OTP_MAX_ATTEMPTS
    );

    // Find the most recent active OTP for this email+purpose
    const record = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedError('OTP has expired or is invalid. Please request a new one.');
    }

    // Enforce per-OTP attempt limit
    if (record.attempts >= maxAttempts) {
      await logAuditEvent({
        action: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        details: { email: normalizedEmail, purpose, otpId: record.id },
      });
      throw new UnauthorizedError(
        'Too many incorrect attempts. Please request a new OTP.'
      );
    }

    const candidateHash = hashOtp(normalizedCandidate);

    if (candidateHash !== record.otpHash) {
      // Increment attempt count
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      await logAuditEvent({
        action: 'OTP_VERIFY_FAILED',
        details: { email: normalizedEmail, purpose, otpId: record.id, attempts: record.attempts + 1 },
      });
      const remaining = maxAttempts - (record.attempts + 1);
      throw new UnauthorizedError(
        remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many incorrect attempts. Please request a new OTP.'
      );
    }

    // Atomically mark OTP used with row-level conditional guard to prevent race conditions
    const consumeResult = await prisma.emailOtp.updateMany({
      where: {
        id: record.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lte: maxAttempts },
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (consumeResult.count !== 1) {
      throw new UnauthorizedError('OTP has already been used or expired. Please request a new OTP.');
    }

    await logAuditEvent({
      action: 'OTP_VERIFIED',
      details: { email: normalizedEmail, purpose, otpId: record.id },
    });

    return { verified: true, otpId: record.id };
  }

  // Returns resend cooldown seconds remaining and resends remaining in current window. Used by frontend to show countdown timers.
  async getRateLimitStatus(
    email: string,
    purpose: OtpPurpose
  ): Promise<{ cooldownSeconds: number; resendsRemaining: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const maxResendsPerHour = await getNumericSetting(
      APP_SETTINGS_KEYS.OTP_MAX_RESENDS_PER_HOUR,
      DEFAULT_OTP_MAX_RESENDS_PER_HOUR
    );
    const cooldownKey = resendCooldownRedisKey(normalizedEmail, purpose);
    const countKey = resendCountRedisKey(normalizedEmail, purpose);
    const redis = getRedisClient();

    let cooldownSeconds = 0;
    let currentCount = 0;

    if (redis?.isOpen) {
      try {
        const ttl = await redis.pTTL(cooldownKey);
        cooldownSeconds = ttl > 0 ? Math.ceil(ttl / 1000) : 0;
        const countRaw = await redis.get(countKey);
        currentCount = countRaw ? parseInt(countRaw, 10) : 0;
      } catch {}
    } else {
      const now = Date.now();
      const expiry = resendCooldownMemory.get(cooldownKey);
      cooldownSeconds = expiry && now < expiry ? Math.ceil((expiry - now) / 1000) : 0;
      const countEntry = resendCountMemory.get(countKey);
      currentCount = (countEntry && now <= countEntry.resetAt) ? countEntry.count : 0;
    }

    return {
      cooldownSeconds,
      resendsRemaining: Math.max(0, maxResendsPerHour - currentCount),
    };
  }

  // Returns true if registration requires email verification (Admin-configurable).
  async isEmailVerificationRequired(): Promise<boolean> {
    if (process.env.NODE_ENV === 'test' && process.env.TEST_REQUIRE_EMAIL_VERIFICATION !== 'true') {
      return false;
    }
    return getBooleanSetting(
      APP_SETTINGS_KEYS.REGISTRATION_REQUIRE_EMAIL_VERIFICATION,
      true
    );
  }
}

export const otpService = new OtpService();
export default otpService;
