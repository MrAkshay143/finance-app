import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma } from './fixtures/mockPrisma.js';

vi.mock('../src/lib/prisma.js', async () => {
  const { mockPrisma } = await import('./fixtures/mockPrisma.js');
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

import { createApp } from '../src/app.js';
import { categoryService } from '../src/services/categoryService.js';
import { adminService } from '../src/services/adminService.js';
import { invalidateMaintenanceCache } from '../src/middleware/maintenanceMiddleware.js';

describe('Admin System Category & Maintenance Mode APIs', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let adminId: string;

  beforeAll(() => {
    process.env.TEST_MAINTENANCE = 'true';
  });

  afterAll(() => {
    delete process.env.TEST_MAINTENANCE;
  });

  beforeEach(async () => {
    mockPrisma.clearAll();
    invalidateMaintenanceCache();

    // 1. Create a regular user
    const userRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'regular.cat.user@example.com',
      password: 'Password123!',
      fullName: 'Regular User',
      mobileNumber: '+919876543210',
    });
    userToken = userRes.body.data.tokens.accessToken;
    userId = userRes.body.data.user.id;

    // 2. Create an admin user
    const adminRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'admin.cat.user@example.com',
      password: 'AdminPassword123!',
      fullName: 'Admin User',
      mobileNumber: '+919999988888',
    });
    adminId = adminRes.body.data.user.id;

    // Elevate admin user in mockPrisma
    const adminUser = mockPrisma._state.users.get(adminId);
    if (adminUser) {
      adminUser.role = 'ADMIN';
      mockPrisma._state.users.set(adminId, adminUser);
    }

    // Re-issue admin token with ADMIN role
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.cat.user@example.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.data.tokens.accessToken;
  });

  describe('Admin Category Management (/api/v1/admin/categories)', () => {
    it('GET /api/v1/admin/categories returns list of system categories', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const cat of res.body.data) {
        expect(cat.isSystem).toBe(true);
        expect(cat.userId).toBeNull();
      }
    });

    it('POST /api/v1/admin/categories creates a system category and writes ADMIN_CATEGORY_CREATE audit log', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Crypto & Digital Assets',
          type: 'INVESTMENT',
          sortOrder: 25,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Crypto & Digital Assets');
      expect(res.body.data.type).toBe('INVESTMENT');
      expect(res.body.data.isSystem).toBe(true);
      expect(res.body.data.userId).toBeNull();

      // Verify audit log
      const auditEntry = mockPrisma._state.auditLogs.find(
        (l: any) => l.action === 'ADMIN_CATEGORY_CREATE'
      );
      expect(auditEntry).toBeDefined();
      expect(auditEntry.actorUserId).toBe(adminId);
      expect(auditEntry.details.name).toBe('Crypto & Digital Assets');
    });

    it('POST /api/v1/admin/categories rejects duplicate category name for same type', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Salary',
          type: 'INCOME',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('PUT /api/v1/admin/categories/:id updates a system category and writes ADMIN_CATEGORY_UPDATE audit log', async () => {
      // Fetch system categories to get an ID
      const listRes = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);
      const targetCat = listRes.body.data[0];

      const res = await request(app)
        .put(`/api/v1/admin/categories/${targetCat.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated System Category Name',
          sortOrder: 99,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated System Category Name');
      expect(res.body.data.sortOrder).toBe(99);

      // Verify audit log
      const auditEntry = mockPrisma._state.auditLogs.find(
        (l: any) => l.action === 'ADMIN_CATEGORY_UPDATE'
      );
      expect(auditEntry).toBeDefined();
      expect(auditEntry.actorUserId).toBe(adminId);
    });

    it('DELETE /api/v1/admin/categories/:id unlinks transactions and deletes system category', async () => {
      // Create a test system category
      const createRes = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Temporary Category',
          type: 'EXPENSE',
          sortOrder: 50,
        });
      const catId = createRes.body.data.id;

      // Create an account & transaction linked to this category
      const acc = await mockPrisma.account.create({
        data: {
          userId,
          name: 'Checking',
          accountType: 'BANK',
          openingBalance: BigInt(100000),
          currentBalance: BigInt(100000),
        },
      });
      const txn = await mockPrisma.transaction.create({
        data: {
          userId,
          accountId: acc.id,
          categoryId: catId,
          type: 'EXPENSE',
          direction: 'DEBIT',
          amount: BigInt(5000),
          description: 'Coffee',
        },
      });
      expect(txn.categoryId).toBe(catId);

      // Delete system category
      const delRes = await request(app)
        .delete(`/api/v1/admin/categories/${catId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify category is deleted
      const catCheck = await mockPrisma.category.findUnique({ where: { id: catId } });
      expect(catCheck).toBeNull();

      // Verify transaction categoryId was safely set to null
      const updatedTxn = await mockPrisma.transaction.findUnique({ where: { id: txn.id } });
      expect(updatedTxn.categoryId).toBeNull();

      // Verify audit log
      const auditEntry = mockPrisma._state.auditLogs.find(
        (l: any) => l.action === 'ADMIN_CATEGORY_DELETE'
      );
      expect(auditEntry).toBeDefined();
      expect(auditEntry.actorUserId).toBe(adminId);
    });

    it('rejects non-admin users with 403 Forbidden', async () => {
      const postRes = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacker Cat', type: 'EXPENSE' });
      expect(postRes.status).toBe(403);

      const putRes = await request(app)
        .put('/api/v1/admin/categories/some-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacker Cat' });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete('/api/v1/admin/categories/some-id')
        .set('Authorization', `Bearer ${userToken}`);
      expect(delRes.status).toBe(403);
    });

    it('ensureSystemCategories does not overwrite existing system category sortOrder or customizations', async () => {
      // Update an existing category
      const listRes = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);
      const firstCat = listRes.body.data[0];

      await request(app)
        .put(`/api/v1/admin/categories/${firstCat.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sortOrder: 888,
        });

      // Run ensureSystemCategories()
      await categoryService.ensureSystemCategories();

      // Verify sortOrder remained 888
      const catCheck = await mockPrisma.category.findUnique({ where: { id: firstCat.id } });
      expect(catCheck.sortOrder).toBe(888);
    });
  });

  describe('Maintenance Mode & Settings (/api/v1/admin/app-settings & maintenanceMiddleware)', () => {
    it('adminService.getAppSettings() includes maintenanceMessage and defaults', async () => {
      const settings = await adminService.getAppSettings();
      expect(settings.maintenanceMessage).toBeDefined();
      expect(typeof settings.maintenanceMessage).toBe('string');
    });

    it('adminService.updateAppSettings() updates maintenanceMessage and invalidates cache', async () => {
      const updated = await adminService.updateAppSettings(adminId, {
        maintenanceMessage: 'System upgrading for database optimization until 10:00 PM UTC.',
      });

      expect(updated.maintenanceMessage).toBe(
        'System upgrading for database optimization until 10:00 PM UTC.'
      );

      const fetched = await adminService.getAppSettings();
      expect(fetched.maintenanceMessage).toBe(
        'System upgrading for database optimization until 10:00 PM UTC.'
      );
    });

    it('when maintenance_mode is active, regular users receive 503 with maintenanceMessage while admin passes through', async () => {
      const customMessage = 'System is currently undergoing routine maintenance. Please check back at 8 PM.';
      
      // Admin activates maintenance mode with custom message
      await request(app)
        .patch('/api/v1/admin/app-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maintenanceMode: true,
          maintenanceMessage: customMessage,
        });

      invalidateMaintenanceCache();

      // Regular user gets 503
      const userReq = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(userReq.status).toBe(503);
      expect(userReq.body.success).toBe(false);
      expect(userReq.body.error.code).toBe('MAINTENANCE_MODE');
      expect(userReq.body.error.message).toBe(customMessage);

      // Admin user passes through (exempt)
      const adminReq = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminReq.status).toBe(200);
      expect(adminReq.body.success).toBe(true);

      // Admin routes and health routes remain accessible
      const healthReq = await request(app).get('/healthz');
      expect(healthReq.status).toBe(200);

      const adminDashboardReq = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminDashboardReq.status).toBe(200);

      // Turn off maintenance mode
      await request(app)
        .patch('/api/v1/admin/app-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maintenanceMode: false,
        });
      invalidateMaintenanceCache();

      const userReqAfter = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`);
      expect(userReqAfter.status).toBe(200);
    });
  });
});
