import crypto from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  jti: string;
  type?: string;
}

const BCRYPT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compares candidate password against a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a short-lived signed JWT access token.
 * Payload includes { sub: user.id, role: user.role, jti: uuid }.
 */
export function signAccessToken(
  payload: { userId: string; role: string },
  customTtlMinutes?: number
): {
  token: string;
  expiresIn: number;
  jti: string;
} {
  const jti = crypto.randomUUID();
  let ttlString = env.JWT_ACCESS_TTL;
  let expiresIn = 900;

  if (customTtlMinutes && customTtlMinutes > 0) {
    ttlString = `${customTtlMinutes}m`;
    expiresIn = customTtlMinutes * 60;
  } else if (env.JWT_ACCESS_TTL.endsWith('m')) {
    expiresIn = parseInt(env.JWT_ACCESS_TTL.replace('m', ''), 10) * 60;
  } else if (env.JWT_ACCESS_TTL.endsWith('s')) {
    expiresIn = parseInt(env.JWT_ACCESS_TTL.replace('s', ''), 10);
  } else if (env.JWT_ACCESS_TTL.endsWith('h')) {
    expiresIn = parseInt(env.JWT_ACCESS_TTL.replace('h', ''), 10) * 3600;
  }

  const options: SignOptions = {
    expiresIn: ttlString as jwt.SignOptions['expiresIn'],
    subject: payload.userId,
    jwtid: jti,
  };

  const token = jwt.sign({ role: payload.role }, env.JWT_ACCESS_SECRET, options);

  return { token, expiresIn, jti };
}

/**
 * Verifies and decodes a signed JWT access token.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as AccessTokenPayload;
}

/**
 * Generates an opaque, cryptographically secure 40-byte random string for refresh tokens.
 */
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Deterministically hashes a refresh token string using SHA-256 for secure database storage.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Signs a short-lived (15 min) JWT password reset token.
 * Uses a DEDICATED reset secret (JWT_RESET_SECRET) so reset tokens cannot
 * be used as Bearer access tokens (SEC-04).
 */
export function signResetToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    { sub: payload.userId, email: payload.email, type: 'PASSWORD_RESET' },
    env.JWT_RESET_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Verifies a password reset token and returns payload.
 * Only accepts tokens signed with JWT_RESET_SECRET and typed as PASSWORD_RESET.
 */
export function verifyResetToken(token: string): { userId: string; email: string } {
  const decoded = jwt.verify(token, env.JWT_RESET_SECRET) as any;
  if (!decoded || decoded.type !== 'PASSWORD_RESET' || !decoded.sub) {
    throw new UnauthorizedError('Invalid or expired password reset token');
  }
  return { userId: decoded.sub, email: decoded.email };
}
