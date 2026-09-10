import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { prismaTestAdapter } from './fixtures/prismaTestAdapter.js';

vi.mock('../src/lib/prisma.js', async () => {
  const { prismaTestAdapter } = await import('./fixtures/prismaTestAdapter.js');
  return {
    prisma: prismaTestAdapter,
    default: prismaTestAdapter,
  };
});

// Import app after mocking prisma
import { createApp } from '../src/app.js';
import { clearMemoryDenylist } from '../src/lib/tokenDenylist.js';

describe('TASK-1.1: Authentication & Session Strategy Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    prismaTestAdapter.clearAll();
    clearMemoryDenylist();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('creates a new user, default user settings, and issues access & refresh tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'jane.doe@example.com',
          password: 'Password123!',
          fullName: 'Jane Doe',
          mobileNumber: '+919876543210',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        email: 'jane.doe@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
        status: 'ACTIVE',
        onboardingCompleted: false,
      });

      // Verify tokens
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      expect(res.body.data.tokens.expiresIn).toBeGreaterThan(0);

      // Verify httpOnly cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=');
      expect(cookies[0]).toContain('HttpOnly');

      // Verify DB state
      const createdUser = Array.from(prismaTestAdapter._state.users.values())[0];
      expect(createdUser.passwordHash).not.toBe('Password123!');
      expect(createdUser.failedLoginAttempts).toBe(0);

      // Verify default userSettings were created
      const settings = prismaTestAdapter._state.userSettings.get(createdUser.id);
      expect(settings).toBeDefined();
      expect(settings.currency).toBe('INR');
      expect(settings.timezone).toBe('Asia/Kolkata');
    });

    it('rejects duplicate email signup with 409 CONFLICT', async () => {
      await request(app).post('/api/v1/auth/signup').send({
        email: 'duplicate@example.com',
        password: 'Password123!',
        fullName: 'Original User',
      });

      const res = await request(app).post('/api/v1/auth/signup').send({
        email: 'duplicate@example.com',
        password: 'Password123!',
        fullName: 'Second User',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('validates password complexity (min 8 chars, uppercase, lowercase, number)', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        email: 'weak@example.com',
        password: 'weak',
        fullName: 'Weak User',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/signup').send({
        email: 'login.test@example.com',
        password: 'Password123!',
        fullName: 'Login Test',
      });
    });

    it('successfully logs in with valid credentials, returns tokens, and resets attempt counter', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'login.test@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login.test@example.com');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      const user = Array.from(prismaTestAdapter._state.users.values()).find(
        (u) => u.email === 'login.test@example.com'
      );
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lastLoginAt).not.toBeNull();
    });

    it('increments failedLoginAttempts on invalid password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'login.test@example.com',
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');

      const user = Array.from(prismaTestAdapter._state.users.values()).find(
        (u) => u.email === 'login.test@example.com'
      );
      expect(user.failedLoginAttempts).toBe(1);
    });

    it('locks account after max failed attempts (5) with 403 ACCOUNT_LOCKED', async () => {
      // 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        const attemptRes = await request(app).post('/api/v1/auth/login').send({
          email: 'login.test@example.com',
          password: 'WrongPassword!',
        });
        expect(attemptRes.status).toBe(401);
      }

      // 5th attempt triggers lockout
      const lockRes = await request(app).post('/api/v1/auth/login').send({
        email: 'login.test@example.com',
        password: 'WrongPassword!',
      });
      expect(lockRes.status).toBe(403);
      expect(lockRes.body.error.code).toBe('ACCOUNT_LOCKED');
      expect(lockRes.body.error.message).toContain('Account locked');

      // Subsequent attempt even with correct password is still locked
      const blockedRes = await request(app).post('/api/v1/auth/login').send({
        email: 'login.test@example.com',
        password: 'Password123!',
      });
      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('POST /api/v1/auth/refresh & Token Rotation', () => {
    it('rotates refresh token, invalidates old token, and issues new token pair in same family', async () => {
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        email: 'rotate@example.com',
        password: 'Password123!',
        fullName: 'Rotate User',
      });
      const initialRefreshToken = signupRes.body.data.tokens.refreshToken;

      // 1. Refresh using initial token
      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
      expect(refreshRes.body.data.tokens.refreshToken).toBeDefined();

      const newRefreshToken = refreshRes.body.data.tokens.refreshToken;
      expect(newRefreshToken).not.toBe(initialRefreshToken);

      // Verify the old token record is marked revoked in DB
      const tokensInDb = Array.from(prismaTestAdapter._state.refreshTokens.values());
      const oldRecord = tokensInDb.find((t) => t.revokedAt !== null);
      expect(oldRecord).toBeDefined();

      const newRecord = tokensInDb.find((t) => t.revokedAt === null);
      expect(newRecord).toBeDefined();
      expect(newRecord.familyId).toBe(oldRecord.familyId); // SAME familyId preserved
    });

    it('THEFT DETECTION: detects reuse of revoked refresh token and revokes entire family', async () => {
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        email: 'theft@example.com',
        password: 'Password123!',
        fullName: 'Theft User',
      });
      const initialRefreshToken = signupRes.body.data.tokens.refreshToken;

      // Legitimate user rotates token
      const legitimateRefreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });
      expect(legitimateRefreshRes.status).toBe(200);
      const secondRefreshToken = legitimateRefreshRes.body.data.tokens.refreshToken;

      // Attacker tries to reuse the initial (now revoked) token!
      const theftAttemptRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });

      expect(theftAttemptRes.status).toBe(401);
      expect(theftAttemptRes.body.error.code).toBe('UNAUTHENTICATED');
      expect(theftAttemptRes.body.error.message).toMatch(/(Session security violation|Session expired for security reasons)/i);

      // Now the legitimate second token must ALSO be revoked because the entire family was compromised!
      const subsequentLegitimateRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: secondRefreshToken,
      });
      expect(subsequentLegitimateRes.status).toBe(401);

      // Verify in DB that all tokens with this familyId are revoked
      const tokensInDb = Array.from(prismaTestAdapter._state.refreshTokens.values());
      for (const t of tokensInDb) {
        expect(t.revokedAt).not.toBeNull();
      }
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes refresh token and denylists access token', async () => {
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        email: 'logout@example.com',
        password: 'Password123!',
        fullName: 'Logout User',
      });
      const { accessToken, refreshToken } = signupRes.body.data.tokens;

      // Access /auth/me before logout
      const beforeRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(beforeRes.status).toBe(200);

      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Access /auth/me after logout should fail because access token is denylisted
      const afterRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(afterRes.status).toBe(401);
      expect(afterRes.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('verifies current password, updates to new password, and revokes all active refresh tokens', async () => {
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        email: 'chgpwd@example.com',
        password: 'Password123!',
        fullName: 'Password Changer',
      });
      const { accessToken, refreshToken } = signupRes.body.data.tokens;

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewStrongPassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Old refresh token must be revoked
      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });
      expect(refreshRes.status).toBe(401);

      // Login with old password must fail
      const oldLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'chgpwd@example.com',
        password: 'Password123!',
      });
      expect(oldLoginRes.status).toBe(401);

      // Login with new password must succeed
      const newLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'chgpwd@example.com',
        password: 'NewStrongPassword456!',
      });
      expect(newLoginRes.status).toBe(200);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns user details when authenticated', async () => {
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        email: 'me.test@example.com',
        password: 'Password123!',
        fullName: 'Me Test',
      });
      const { accessToken } = signupRes.body.data.tokens;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('me.test@example.com');
      expect(res.body.data.fullName).toBe('Me Test');
      expect(res.body.data.kbaConfigured).toBe(false);
    });
  });
});
