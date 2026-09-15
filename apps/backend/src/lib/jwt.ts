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
  sessionId?: string; // RefreshToken.id - used to identify the current session in getSessions
}

const BCRYPT_ROUNDS = 10;

// Hash plaintext password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Compare candidate password against bcrypt hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate signed JWT access token with custom or default TTL
export function signAccessToken(
  payload: { userId: string; role: string; sessionId?: string },
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

  const claims: Record<string, any> = { role: payload.role };
  if (payload.sessionId) {
    claims.sessionId = payload.sessionId;
  }

  const token = jwt.sign(claims, env.JWT_ACCESS_SECRET, options);

  return { token, expiresIn, jti };
}

// Verify and decode signed JWT access token
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as AccessTokenPayload;
}

// Generate cryptographically secure 40-byte hex refresh token
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

// Hash refresh token using SHA-256 for secure persistent storage
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

// Sign 15-minute password reset token using dedicated reset secret
export function signResetToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    { sub: payload.userId, email: payload.email, type: 'PASSWORD_RESET' },
    env.JWT_RESET_SECRET,
    { expiresIn: '15m' }
  );
}

// Verify password reset token authenticity and token type
export function verifyResetToken(token: string): { userId: string; email: string } {
  const decoded = jwt.verify(token, env.JWT_RESET_SECRET) as any;
  if (!decoded || decoded.type !== 'PASSWORD_RESET' || !decoded.sub) {
    throw new UnauthorizedError('Invalid or expired password reset token');
  }
  return { userId: decoded.sub, email: decoded.email };
}

// Sign 15-minute registration authorization token with cryptographic claims
export function signRegistrationToken(payload: { email: string }): {
  token: string;
  jti: string;
  expiresIn: number;
} {
  const jti = crypto.randomUUID();
  const expiresIn = 900; // 15 minutes
  const token = jwt.sign(
    {
      email: payload.email.toLowerCase().trim(),
      type: 'REGISTRATION_AUTHORIZED',
      purpose: 'REGISTRATION',
    },
    env.JWT_RESET_SECRET,
    {
      expiresIn: '15m',
      jwtid: jti,
      audience: 'finance-registration',
      issuer: 'finance-api',
    }
  );
  return { token, jti, expiresIn };
}

// Verify registration authorization token authenticity, claims, and audience
export function verifyRegistrationToken(token: string): { email: string; jti: string } {
  try {
    const decoded = jwt.verify(token, env.JWT_RESET_SECRET, {
      audience: 'finance-registration',
      issuer: 'finance-api',
    }) as any;
    if (
      !decoded ||
      decoded.type !== 'REGISTRATION_AUTHORIZED' ||
      decoded.purpose !== 'REGISTRATION' ||
      !decoded.jti ||
      !decoded.email
    ) {
      throw new UnauthorizedError('Invalid registration token claims');
    }
    return { email: decoded.email.toLowerCase().trim(), jti: decoded.jti };
  } catch (err: any) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired registration token');
  }
}
