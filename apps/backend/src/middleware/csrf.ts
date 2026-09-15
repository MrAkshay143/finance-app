// CSRF protection using double-submit cookie pattern with HMAC-signed token
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import logger from '../lib/logger.js';

// SAFE_METHODS: CSRF only needed for state-changing requests
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Routes exempt from CSRF check even when method is unsafe
const CSRF_EXEMPT_PATHS = new Set([
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/metrics',
]);

// HMAC-based CSRF token - uses crypto module (no external runtime dep needed for basic version)
import crypto from 'crypto';

function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now().toString();
  const secret = env.JWT_ACCESS_SECRET; // reuse access secret for CSRF signing
  const payload = `${sessionId}:${timestamp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function verifyCsrfToken(token: string, sessionId: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [sid, timestamp, sig] = parts;
    if (sid !== sessionId) return false;
    // Token expires in 24 hours
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 86_400_000) return false;
    const secret = env.JWT_ACCESS_SECRET;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${sid}:${timestamp}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip safe HTTP methods
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Skip exempt paths
  const path = req.path;
  if (CSRF_EXEMPT_PATHS.has(path)) {
    next();
    return;
  }

  // Get session identifier - use userId from JWT if authenticated, else IP
  const sessionId = (req as any).user?.id ?? req.ip ?? 'anonymous';

  // Read CSRF token from header (X-CSRF-Token) or body (_csrf)
  const clientToken = (req.headers['x-csrf-token'] as string) || (req.body?._csrf as string);

  if (!clientToken) {
    logger.warn({ path, method: req.method, ip: req.ip }, 'CSRF token missing');
    res.status(403).json({ success: false, error: 'CSRF token required', code: 'CSRF_MISSING' });
    return;
  }

  if (!verifyCsrfToken(clientToken, sessionId)) {
    logger.warn({ path, method: req.method, ip: req.ip }, 'CSRF token invalid');
    res.status(403).json({ success: false, error: 'CSRF validation failed', code: 'CSRF_INVALID' });
    return;
  }

  next();
}

// Handler for GET /api/v1/auth/csrf-token - issues a CSRF token. The frontend should call this on app load and include the token in subsequent requests.
export function getCsrfToken(req: Request, res: Response): void {
  const sessionId = (req as any).user?.id ?? req.ip ?? 'anonymous';
  const token = generateCsrfToken(sessionId);
  // Expose in response body - JS can read it and attach to X-CSRF-Token header
  res.status(200).json({ success: true, csrfToken: token });
}
