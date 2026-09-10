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

import { createApp } from '../src/app.js';

describe('TASK-5.2 & TASK-5.1: Admin Suite & Audit Logs Integration Tests', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let adminId: string;

  beforeEach(async () => {
    prismaTestAdapter.clearAll();

    // 1. Create a regular user
    const userRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'regular.user@example.com',
      password: 'Password123!',
      fullName: 'John Regular',
      mobileNumber: '+919876543210',
    });
    userToken = userRes.body.data.tokens.accessToken;
    userId = userRes.body.data.user.id;

    // 2. Create an admin user
    const adminRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'admin.user@example.com',
      password: 'AdminPassword123!',
      fullName: 'System Administrator',
      mobileNumber: '+919999988888',
    });
    adminToken = adminRes.body.data.tokens.accessToken;
    adminId = adminRes.body.data.user.id;

    // Elevate admin user in prismaTestAdapter
    const adminUser = prismaTestAdapter._state.users.get(adminId);
    if (adminUser) {
      adminUser.role = 'ADMIN';
      prismaTestAdapter._state.users.set(adminId, adminUser);
    }

    // Re-issue admin token with ADMIN role
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.user@example.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.data.tokens.accessToken;
  });

  describe('Authorization Enforcement on /api/v1/admin/*', () => {
    const adminEndpoints = [
      { method: 'get', url: '/api/v1/admin/dashboard' },
      { method: 'get', url: '/api/v1/admin/users' },
      { method: 'get', url: '/api/v1/admin/settings' },
      { method: 'get', url: '/api/v1/admin/app-settings' },
      { method: 'get', url: '/api/v1/admin/audit' },
      { method: 'get', url: '/api/v1/admin/audit-logs' },
    ];

    for (const ep of adminEndpoints) {
      it(`returns 401 UNAUTHENTICATED when unauthenticated for ${ep.url}`, async () => {
        const res = await request(app)[ep.method as 'get'](ep.url);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHENTICATED');
      });

      it(`returns 403 FORBIDDEN when accessed by non-admin role (USER) for ${ep.url}`, async () => {
        const res = await request(app)[ep.method as 'get'](ep.url).set(
          'Authorization',
          `Bearer ${userToken}`
        );
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toMatch(/admin/i);
      });
    }
  });

  describe('GET /api/v1/admin/dashboard', () => {
    it('returns dashboard metrics for ADMIN role: totalUsers, activeUsers, suspendedUsers, adminUsers', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        totalUsers: 2,
        activeUsers: 2,
        suspendedUsers: 0,
        adminUsers: 1,
      });
    });
  });

  describe('Admin User Management APIs', () => {
    it('GET /api/v1/admin/users returns paginated list of users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBe(2);
      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 2,
      });
    });

    it('GET /api/v1/admin/users with search filters by user name or email', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=regular')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(1);
      expect(res.body.data.users[0].email).toBe('regular.user@example.com');
    });

    it('GET /api/v1/admin/users/:id returns user details, profile, account summary, and audit logs', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        id: userId,
        email: 'regular.user@example.com',
        role: 'USER',
        status: 'ACTIVE',
      });
      expect(res.body.data.accountsSummary).toBeDefined();
      expect(Array.isArray(res.body.data.recentAuditLogs)).toBe(true);
    });

    it('PATCH /api/v1/admin/users/:id updates role or status and logs audit event', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SUSPENDED',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUSPENDED');

      // Verify audit log entry was created
      const auditEntry = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'ADMIN_USER_UPDATE' && l.targetUserId === userId
      );
      expect(auditEntry).toBeDefined();
      expect(auditEntry.actorUserId).toBe(adminId);
    });

    it('POST /api/v1/admin/users/:id/reset-password generates temp password, revokes sessions, logs audit', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${userId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.temporaryPassword).toBeDefined();
      expect(typeof res.body.data.temporaryPassword).toBe('string');

      const auditEntry = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'ADMIN_RESET_PASSWORD' && l.targetUserId === userId
      );
      expect(auditEntry).toBeDefined();
    });

    it('POST /api/v1/admin/users/:id/reset-kba clears user security questions and logs audit', async () => {
      // Set up questions for regular user
      await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questions: [
            { questionKey: 'FIRST_PET', answer: 'Barnaby' },
            { questionKey: 'MOTHER_MAIDEN_NAME', answer: 'Smith' },
            { questionKey: 'FIRST_CAR', answer: 'Ford' },
          ],
        });

      // Admin resets KBA
      const res = await request(app)
        .post(`/api/v1/admin/users/${userId}/reset-kba`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify questions are deleted
      const qRes = await request(app)
        .get('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`);
      expect(qRes.body.data.length).toBe(0);

      const auditEntry = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'ADMIN_RESET_KBA' && l.targetUserId === userId
      );
      expect(auditEntry).toBeDefined();
    });

    it('DELETE /api/v1/admin/users/:id soft deletes user and logs audit', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const target = prismaTestAdapter._state.users.get(userId);
      expect(target.status).toBe('DELETED');

      const auditEntry = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'ADMIN_DELETE_USER' && l.targetUserId === userId
      );
      expect(auditEntry).toBeDefined();
    });
  });

  describe('App Settings Management APIs', () => {
    it('GET and PATCH /api/v1/admin/app-settings updates system parameters and logs audit', async () => {
      const getRes = await request(app)
        .get('/api/v1/admin/app-settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.maxFailedAttempts).toBeDefined();

      const patchRes = await request(app)
        .patch('/api/v1/admin/app-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sessionTimeoutMinutes: 30,
          maxFailedAttempts: 3,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.sessionTimeoutMinutes).toBe(30);
      expect(patchRes.body.data.maxFailedAttempts).toBe(3);

      const auditEntry = prismaTestAdapter._state.auditLogs.find(
        (l) => l.action === 'ADMIN_APP_SETTINGS_UPDATE'
      );
      expect(auditEntry).toBeDefined();
    });
  });

  describe('Audit Logs APIs (User-scoped and Admin system-wide)', () => {
    it('GET /api/v1/audit returns user-scoped audit records with category filtering', async () => {
      // Generate some user actions
      await request(app)
        .patch('/api/v1/user-settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currency: 'USD', financialMonthStartDay: 5 });

      const res = await request(app)
        .get('/api/v1/audit?category=Settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThan(0);
      expect(res.body.data.logs[0].category).toBe('Settings');
      expect(res.body.data.logs[0].action).toBe('USER_SETTINGS_UPDATE');
    });

    it('GET /api/v1/admin/audit-logs returns system-wide audit records with actor/target info', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });
});
