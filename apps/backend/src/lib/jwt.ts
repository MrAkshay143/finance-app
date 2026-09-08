import crypto from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  jti: string;
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
export function signAccessToken(payload: { userId: string; role: string }): {
  token: string;
  expiresIn: number;
  jti: string;
} {
  const jti = crypto.randomUUID();
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
    subject: payload.userId,
    jwtid: jti,
  };

  const token = jwt.sign({ role: payload.role }, env.JWT_ACCESS_SECRET, options);

  // Parse approximate expiry in seconds (e.g. 15m -> 900s)
  let expiresIn = 900;
  if (env.JWT_ACCESS_TTL.endsWith('m')) {
    expiresIn = parseInt(env.JWT_ACCESS_TTL.replace('m', ''), 10) * 60;
  } else if (env.JWT_ACCESS_TTL.endsWith('s')) {
    expiresIn = parseInt(env.JWT_ACCESS_TTL.replace('s', ''), 10);
  } else if (env.JWT_ACCESS_TTL.endsWith('h')) {
    expiresIn = parseInt(env.JWT_ACCESS_TTL.replace('h', ''), 10) * 3600;
  }

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
