import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('TASK-3.2: Planning (Budgets & Goals), Categories & Merchants APIs', () => {
  const app = createApp();
  let userTokenA: string;
  let userIdA: string;
  let userTokenB: string;
  let userIdB: string;
  let accountIdA: string;
  let systemExpenseCategoryId: string;

  beforeEach(async () => {
    mockPrisma.clearAll();

    // Create User A
    const signupA = await request(app).post('/api/v1/auth/signup').send({
      email: 'user.a.planning@example.com',
      password: 'Password123!',
      fullName: 'Alice Planning',
      mobileNumber: '+919876511101',
    });
    userTokenA = signupA.body.data.tokens.accessToken;
    userIdA = signupA.body.data.user.id;

    // Create User B
    const signupB = await request(app).post('/api/v1/auth/signup').send({
      email: 'user.b.planning@example.com',
      password: 'Password123!',
      fullName: 'Bob Planning',
      mobileNumber: '+919876511102',
    });
    userTokenB = signupB.body.data.tokens.accessToken;
    userIdB = signupB.body.data.user.id;

    // Create an account for User A
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        name: 'ICICI Savings',
        type: 'BANK',
        openingBalance: 50000,
      });
    accountIdA = accRes.body.data.id;

    // Get system category 'Food & Dining'
    const catList = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${userTokenA}`);
    const foodCat = catList.body.data.find(
      (c: any) => c.name === 'Food & Dining' && c.isSystem === true
    );
    systemExpenseCategoryId = foodCat.id;
  });

  describe('Budgets API & Live Spent Calculation', () => {
    it('creates a budget with targetAmount in BigInt paise and computes live spent and remaining from real transactions', async () => {
      // 1. Create a monthly budget of ₹10,000 for Food & Dining
      const createRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          categoryId: systemExpenseCategoryId,
          name: 'Monthly Dining Budget',
          targetAmount: 10000,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const budgetId = createRes.body.data.id;
      expect(createRes.body.data.targetAmount).toBe(10000);
      expect(createRes.body.data.targetAmountPaise).toBe(1000000);
      expect(createRes.body.data.spent).toBe(0);
      expect(createRes.body.data.remaining).toBe(10000);
      expect(createRes.body.data.progress).toBe(0);

      // 2. Add an active EXPENSE transaction of ₹3,000 matching categoryId
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA,
          categoryId: systemExpenseCategoryId,
          type: 'EXPENSE',
          amount: 3000,
          description: 'Team Lunch',
        });

      // 3. GET /api/v1/budgets -> spent reflects ₹3,000, remaining ₹7,000, progress 30%
      const listRes1 = await request(app)
        .get('/api/v1/budgets')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(listRes1.status).toBe(200);
      expect(listRes1.body.data.length).toBe(1);
      const b1 = listRes1.body.data[0];
      expect(b1.spent).toBe(3000);
      expect(b1.remaining).toBe(7000);
      expect(b1.progress).toBe(30);

      // 4. Add another transaction of ₹2,500
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA,
          categoryId: systemExpenseCategoryId,
          type: 'EXPENSE',
          amount: 2500,
          description: 'Groceries',
        });

      // 5. GET /api/v1/budgets -> spent reflects ₹5,500, remaining ₹4,500, progress 55%
      const listRes2 = await request(app)
        .get('/api/v1/budgets')
        .set('Authorization', `Bearer ${userTokenA}`);
      const b2 = listRes2.body.data[0];
      expect(b2.spent).toBe(5500);
      expect(b2.remaining).toBe(4500);
      expect(b2.progress).toBe(55);

      // 6. Update budget target to ₹15,000
      const updateRes = await request(app)
        .put(`/api/v1/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          targetAmount: 15000,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.targetAmount).toBe(15000);
      expect(updateRes.body.data.spent).toBe(5500);
      expect(updateRes.body.data.remaining).toBe(9500);

      // 7. Soft delete budget
      const delRes = await request(app)
        .delete(`/api/v1/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(delRes.status).toBe(200);

      // Budget should no longer appear in active budgets list
      const listRes3 = await request(app)
        .get('/api/v1/budgets')
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(listRes3.body.data.length).toBe(0);
    });

    it('prevents User B from accessing or mutating User A budget', async () => {
      const createRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          categoryId: systemExpenseCategoryId,
          targetAmount: 5000,
        });
      const budgetId = createRes.body.data.id;

      // User B tries to get User A's budget
      const getRes = await request(app)
        .get(`/api/v1/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(getRes.status).toBe(403);

      // User B tries to update User A's budget
      const updateRes = await request(app)
        .put(`/api/v1/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({ targetAmount: 20000 });
      expect(updateRes.status).toBe(403);

      // User B tries to delete User A's budget
      const delRes = await request(app)
        .delete(`/api/v1/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(delRes.status).toBe(403);
    });
  });

  describe('Goals API', () => {
    it('creates, lists, updates, and soft deletes goals with BigInt paise conversions and progress calculations', async () => {
      // 1. Create Goal: target ₹2,00,000, current ₹50,000
      const createRes = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Emergency Fund',
          targetAmount: 200000,
          currentAmount: 50000,
          targetDate: '2027-12-31',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const goalId = createRes.body.data.id;
      expect(createRes.body.data.name).toBe('Emergency Fund');
      expect(createRes.body.data.targetAmount).toBe(200000);
      expect(createRes.body.data.currentAmount).toBe(50000);
      expect(createRes.body.data.remainingAmount).toBe(150000);
      expect(createRes.body.data.progress).toBe(25);

      // 2. GET /api/v1/goals
      const listRes1 = await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(listRes1.status).toBe(200);
      expect(listRes1.body.data.length).toBe(1);
      expect(listRes1.body.data[0].id).toBe(goalId);

      // 3. PUT /api/v1/goals/:id - update current amount to ₹1,00,000 (50% progress)
      const updateRes = await request(app)
        .put(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          currentAmount: 100000,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.currentAmount).toBe(100000);
      expect(updateRes.body.data.remainingAmount).toBe(100000);
      expect(updateRes.body.data.progress).toBe(50);

      // 4. Soft delete goal
      const delRes = await request(app)
        .delete(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(delRes.status).toBe(200);

      // 5. Verify goal no longer returned
      const listRes2 = await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(listRes2.body.data.length).toBe(0);
    });
  });

  describe('Categories API & System Category Protection', () => {
    it('lists system categories and creates custom category with isSystem = false', async () => {
      // 1. GET /api/v1/categories returns system categories
      const listRes1 = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(listRes1.status).toBe(200);
      expect(listRes1.body.data.length).toBeGreaterThanOrEqual(17);
      const systemCats = listRes1.body.data.filter((c: any) => c.isSystem === true);
      expect(systemCats.length).toBeGreaterThanOrEqual(17);

      // 2. Create custom category
      const createRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Gaming & Subscriptions',
          type: 'EXPENSE',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.name).toBe('Gaming & Subscriptions');
      expect(createRes.body.data.isSystem).toBe(false);
      expect(createRes.body.data.userId).toBe(userIdA);
    });

    it('CRITICAL: System categories are immutable! PUT and DELETE return 403 Forbidden', async () => {
      // Attempt to update a system category
      const updateRes = await request(app)
        .put(`/api/v1/categories/${systemExpenseCategoryId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Hacked Category Name',
        });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.success).toBe(false);
      expect(updateRes.body.error.code).toBe('FORBIDDEN');
      expect(updateRes.body.error.message).toContain('System categories');

      // Attempt to delete a system category
      const deleteRes = await request(app)
        .delete(`/api/v1/categories/${systemExpenseCategoryId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.success).toBe(false);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
      expect(deleteRes.body.error.message).toContain('System categories');
    });

    it('allows updating and deleting user custom categories', async () => {
      // Create custom category
      const createRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Pet Care',
          type: 'EXPENSE',
        });
      const customCatId = createRes.body.data.id;

      // Update custom category
      const updateRes = await request(app)
        .put(`/api/v1/categories/${customCatId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Pet Care & Food',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Pet Care & Food');

      // Delete custom category
      const delRes = await request(app)
        .delete(`/api/v1/categories/${customCatId}`)
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.data.message).toBe('Category deleted successfully');
    });

    it('reorders categories in a single transaction via PATCH /api/v1/categories/reorder', async () => {
      const catList = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${userTokenA}`);

      const firstThree = catList.body.data.slice(0, 3);
      const reversedIds = [firstThree[2].id, firstThree[1].id, firstThree[0].id];

      const reorderRes = await request(app)
        .patch('/api/v1/categories/reorder')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          categoryIds: reversedIds,
        });

      expect(reorderRes.status).toBe(200);
      expect(reorderRes.body.success).toBe(true);

      // Verify new sortOrder
      const cat0 = mockPrisma._state.categories.get(reversedIds[0]);
      const cat1 = mockPrisma._state.categories.get(reversedIds[1]);
      const cat2 = mockPrisma._state.categories.get(reversedIds[2]);

      expect(cat0.sortOrder).toBe(1);
      expect(cat1.sortOrder).toBe(2);
      expect(cat2.sortOrder).toBe(3);
    });
  });

  describe('Merchants API', () => {
    it('creates, lists with counts and total spent, and updates merchants', async () => {
      // 1. Create merchant
      const createRes = await request(app)
        .post('/api/v1/merchants')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Swiggy',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.name).toBe('Swiggy');
      const merchantId = createRes.body.data.id;

      // 2. Add transactions associated with this merchant
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA,
          type: 'EXPENSE',
          amount: 800,
          description: 'Biryani Order',
          merchantId,
        });

      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA,
          type: 'EXPENSE',
          amount: 1200,
          description: 'Pizza Party',
          merchantId,
        });

      // 3. GET /api/v1/merchants -> transactionCount: 2, totalSpent: 2000
      const listRes = await request(app)
        .get('/api/v1/merchants')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(listRes.status).toBe(200);
      const swiggy = listRes.body.data.find((m: any) => m.id === merchantId);
      expect(swiggy).toBeDefined();
      expect(swiggy.transactionCount).toBe(2);
      expect(swiggy.totalSpent).toBe(2000);
      expect(swiggy.totalSpentPaise).toBe(200000);

      // 4. PUT /api/v1/merchants/:id -> update merchant name
      const updateRes = await request(app)
        .put(`/api/v1/merchants/${merchantId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Swiggy Instamart',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Swiggy Instamart');
    });
  });
});
