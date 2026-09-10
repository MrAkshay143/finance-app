import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { isDenylisted } from '../lib/tokenDenylist.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Session expired. Please sign in.'));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next(new UnauthorizedError('Session expired. Please sign in.'));
  }

  try {
    const payload = verifyAccessToken(token);

    // Reject password reset tokens or any token not explicitly typed as ACCESS (SEC-04)
    if (payload.type && payload.type !== 'ACCESS') {
      return next(new UnauthorizedError('Invalid session. Please sign in.'));
    }

    // Check if token jti or token itself is denylisted
    const denylisted = await isDenylisted(payload.jti || token);
    if (denylisted) {
      return next(new UnauthorizedError('Session has been revoked. Please log in again.'));
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId, // undefined for tokens issued before this deploy
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Session expired. Please sign in.'));
    }
    return next(new UnauthorizedError('Session expired. Please sign in.'));
  }
}

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = verifyAccessToken(token);
    const denylisted = await isDenylisted(payload.jti || token);
    if (!denylisted) {
      req.user = { id: payload.sub, role: payload.role, sessionId: payload.sessionId };
    }
  } catch {
    // Ignore invalid/expired token in optional mode
  }
  next();
}


export default authenticate;
