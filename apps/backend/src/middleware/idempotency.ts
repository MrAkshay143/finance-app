// Idempotency middleware for financial mutation endpoints backed by DB idempotency_records
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const IN_PROGRESS_TIMEOUT_MS = 60 * 1000; // 60 seconds stale-lock recovery

// Deterministically sorts object keys recursively for consistent hashing
export function canonicalizeJson(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalizeJson);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    result[key] = canonicalizeJson(obj[key]);
  }
  return result;
}

// Computes deterministic SHA-256 fingerprint over HTTP method, route path, and canonicalized body
export function computeRequestFingerprint(req: Request): string {
  const canonicalBody = JSON.stringify(canonicalizeJson(req.body ?? {}));
  const payload = `${req.method.toUpperCase()}:${req.baseUrl || ''}${req.path}:${canonicalBody}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-idempotency-key'];

  // No key provided — pass through without idempotency checking (backwards compatible)
  if (!key || typeof key !== 'string' || !key.trim()) {
    return next();
  }

  const idempotencyKey = key.trim().substring(0, 255); // max 255 chars (VARCHAR(255) in DB)

  const userId = req.user?.id;
  if (!userId) {
    // Not authenticated — skip idempotency (route authentication middleware handles unauthenticated requests)
    return next();
  }

  // Run async idempotency check
  processIdempotency(req, res, next, userId, idempotencyKey);
}

async function processIdempotency(
  req: Request,
  res: Response,
  next: NextFunction,
  userId: string,
  idempotencyKey: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);
  const currentFingerprint = computeRequestFingerprint(req);

  try {
    // 1. Store an in-progress envelope containing the canonical request fingerprint
    const initialEnvelope = JSON.stringify({
      fingerprint: currentFingerprint,
      inProgress: true,
    });

    // Atomically claim the key via Prisma create
    await prisma.idempotencyRecord.create({
      data: {
        userId,
        key: idempotencyKey,
        responseBody: initialEnvelope,
        expiresAt,
      },
    });

    // 2. Claim successful. Override res.json and res.send to capture the response.
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let responseCaptured = false;

    const captureResponse = (body: any, status: number) => {
      if (responseCaptured) return;
      responseCaptured = true;

      // Do not cache server errors (5xx). Delete the record so the client can safely retry.
      if (status >= 500) {
        prisma.idempotencyRecord
          .delete({ where: { userId_key: { userId, key: idempotencyKey } } })
          .catch((err) => logger.error({ err }, 'Failed to delete idempotency record on 5xx error'));
        return;
      }

      // Store envelope with fingerprint and response body
      const envelope = JSON.stringify({
        fingerprint: currentFingerprint,
        body,
      });

      // Async update in background
      prisma.idempotencyRecord
        .update({
          where: { userId_key: { userId, key: idempotencyKey } },
          data: {
            statusCode: status,
            responseBody: envelope,
          },
        })
        .catch((err) => logger.error({ err }, 'Failed to update idempotency record'));
    };

    res.json = (body: any) => {
      captureResponse(body, res.statusCode || 200);
      return originalJson(body);
    };

    res.send = (body: any) => {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        try {
          const parsed = JSON.parse(body.toString());
          captureResponse(parsed, res.statusCode || 200);
        } catch {
          captureResponse(body.toString(), res.statusCode || 200);
        }
      } else {
        captureResponse(body, res.statusCode || 200);
      }
      return originalSend(body);
    };

    next();
  } catch (error: any) {
    // P2002 indicates a unique constraint violation (duplicate key for this user)
    if (error.code === 'P2002') {
      try {
        const existingRecord = await prisma.idempotencyRecord.findUnique({
          where: { userId_key: { userId, key: idempotencyKey } },
        });

        if (!existingRecord) {
          // Edge case: deleted between create failure and findUnique (e.g. concurrent 500 cleanup)
          return processIdempotency(req, res, next, userId, idempotencyKey);
        }

        if (existingRecord.expiresAt < new Date()) {
          res.status(409).json({
            error: {
              code: 'IDEMPOTENCY_KEY_EXPIRED',
              message: 'Idempotency key expired. Please use a new key.',
            },
          });
          return;
        }

        // Parse stored envelope
        let storedFingerprint: string | null = null;
        let cachedBody: any = null;

        if (existingRecord.responseBody) {
          try {
            const parsed = JSON.parse(existingRecord.responseBody);
            if (parsed && typeof parsed === 'object' && 'fingerprint' in parsed) {
              storedFingerprint = parsed.fingerprint;
              cachedBody = parsed.body;
            } else {
              cachedBody = parsed;
            }
          } catch {
            cachedBody = existingRecord.responseBody;
          }
        }

        // Conflict check: Same user + same key + different request payload -> 409 Conflict
        if (storedFingerprint && storedFingerprint !== currentFingerprint) {
          res.status(409).json({
            error: {
              code: 'IDEMPOTENCY_CONFLICT',
              message: 'Idempotency key was already used with a different request payload.',
            },
          });
          return;
        }

        if (existingRecord.statusCode === null) {
          // Check if request is stale (>60s) due to worker crash
          const ageMs = Date.now() - existingRecord.createdAt.getTime();
          if (ageMs > IN_PROGRESS_TIMEOUT_MS) {
            logger.warn(
              `Stale in-progress idempotency record (age ${ageMs}ms) for user ${userId}, key ${idempotencyKey}. Purging and retrying.`
            );
            await prisma.idempotencyRecord.delete({
              where: { userId_key: { userId, key: idempotencyKey } },
            });
            return processIdempotency(req, res, next, userId, idempotencyKey);
          }

          // Request is actively in progress
          res.status(409).json({
            error: {
              code: 'IDEMPOTENCY_CONFLICT',
              message: 'Duplicate request in progress. Please wait.',
            },
          });
          return;
        }

        // Return exact original status code and body
        res.setHeader('X-Idempotency-Replayed', 'true');
        res.status(existingRecord.statusCode).json(cachedBody);
        return;
      } catch (findErr) {
        return next(findErr);
      }
    }

    next(error);
  }
}

