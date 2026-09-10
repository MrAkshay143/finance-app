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
import { balanceService } from '../src/services/balanceService.js';

describe('TASK-2.1 & TASK-2.2: Transactions & Transfers Integration Tests', () => {
  const app = createApp();
  let userTokenA: string;
  let userIdA: string;
  let userTokenB: string;
  let userIdB: string;
  let accountIdA1: string;
  let accountIdA2: string;

  beforeEach(async () => {
    prismaTestAdapter.clearAll();

    // Create User A
    const signupA = await request(app).post('/api/v1/auth/signup').send({
      email: 'alice.tx@example.com',
      password: 'Password123!',
      fullName: 'Alice Tx',
      mobileNumber: '+919876543101',
    });
    userTokenA = signupA.body.data.tokens.accessToken;
    userIdA = signupA.body.data.user.id;

    // Create User B
    const signupB = await request(app).post('/api/v1/auth/signup').send({
      email: 'bob.tx@example.com',
      password: 'Password123!',
      fullName: 'Bob Tx',
      mobileNumber: '+919876543102',
    });
    userTokenB = signupB.body.data.tokens.accessToken;
    userIdB = signupB.body.data.user.id;

    // Create Account 1 for User A: Opening Balance ₹10,000 (1000000 paise)
    const acc1 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        name: 'Main Checking',
        type: 'BANK',
        openingBalance: 10000,
      });
    accountIdA1 = acc1.body.data.id;

    // Create Account 2 for User A: Opening Balance ₹5,000 (500000 paise)
    const acc2 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        name: 'Secondary Savings',
        type: 'BANK',
        openingBalance: 5000,
      });
    accountIdA2 = acc2.body.data.id;
  });

  describe('Balance Invariant across Income, Expense, and Investment', () => {
    it('enforces balance invariant across CREATE, UPDATE, and SOFT-DELETE', async () => {
      // Step 1: Baseline check
      const baseAcc = prismaTestAdapter._state.accounts.get(accountIdA1);
      expect(baseAcc.currentBalance).toBe(BigInt(1000000)); // ₹10,000

      // Step 2: Add INCOME (+₹5,000) -> mapped to CREDIT
      const incomeRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA1,
          type: 'INCOME',
          amount: 5000,
          description: 'Consulting Fee',
        });

      expect(incomeRes.status).toBe(201);
      expect(incomeRes.body.data.direction).toBe('CREDIT');
      expect(incomeRes.body.data.amount).toBe(5000);
      expect(incomeRes.body.data.amountPaise).toBe(500000);

      // Verify balance: 10,000 + 5,000 = 15,000 (1500000 paise)
      let currentAcc = prismaTestAdapter._state.accounts.get(accountIdA1);
      expect(currentAcc.currentBalance).toBe(BigInt(1500000));

      // Step 3: Add EXPENSE (-₹2,000) -> mapped to DEBIT
      const expenseRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA1,
          type: 'EXPENSE',
          amount: 2000,
          description: 'Grocery Shopping',
          merchant: 'SuperMart',
        });

      expect(expenseRes.status).toBe(201);
      expect(expenseRes.body.data.direction).toBe('DEBIT');
      expect(expenseRes.body.data.merchant).toBe('SuperMart');

      // Verify balance: 15,000 - 2,000 = 13,000 (1300000 paise)
      currentAcc = prismaTestAdapter._state.accounts.get(accountIdA1);
      expect(currentAcc.currentBalance).toBe(BigInt(1300000));

      // Step 4: Add INVESTMENT (-₹3,000) -> mapped to DEBIT
      const investRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA1,
          type: 'INVESTMENT',
          amount: 3000,
          description: 'Index Fund SIP',
        });

      expect(investRes.status).toBe(201);
      expect(investRes.body.data.direction).toBe('DEBIT');

      // Verify balance: 13,000 - 3,000 = 10,000 (1000000 paise)
      currentAcc = prismaTestAdapter._state.accounts.get(accountIdA1);
      expect(currentAcc.currentBalance).toBe(BigInt(1000000));

      // Step 5: UPDATE the EXPENSE from ₹2,000 down to ₹1,000
      const expenseId = expenseRes.body.data.id;
      const updateRes = await request(app)
        .put(`/api/v1/transactions/${expenseId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          amount: 1000, // reduced expense
          description: 'Groceries with discount coupon',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.amount).toBe(1000);

      // Verify balance recalculated: 10000 + 5000 - 1000 - 3000 = 11,000 (1100000 paise)
      currentAcc = prismaTestAdapter._state.accounts.get(accountIdA1);
      expect(currentAcc.currentBalance).toBe(BigInt(1100000));

      // Step 6: SOFT-DELETE the INVESTMENT (-₹3,000)
      const investId = investRes.body.data.id;
      const deleteRes = await request(app)
        .delete(`/api/v1/transactions/${investId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify investment is marked DELETED in DB
      const dbInvestTxn = prismaTestAdapter._state.transactions.get(investId);
      expect(dbInvestTxn.status).toBe('DELETED');

      // Verify balance invariant: 10000 + 5000 - 1000 = 14,000 (1400000 paise)
      currentAcc = prismaTestAdapter._state.accounts.get(accountIdA1);
      expect(currentAcc.currentBalance).toBe(BigInt(1400000));

      // Step 7: Direct invariant test via balanceService.recalculateAccountBalance
      const recalculated = await balanceService.recalculateAccountBalance(
        prismaTestAdapter as any,
        accountIdA1
      );
      expect(recalculated).toBe(BigInt(1400000));
      expect(prismaTestAdapter._state.accounts.get(accountIdA1).currentBalance).toBe(BigInt(1400000));
    });
  });

  describe('Transfers & Dual Account Balance Adjustment', () => {
    it('adjusts both accounts on transfer creation and reverts both on transfer deletion', async () => {
      // Account 1 opening: ₹10,000 (1000000 paise)
      // Account 2 opening: ₹5,000 (500000 paise)

      // Transfer ₹3,000 from Account 1 to Account 2
      const transferRes = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          sourceAccountId: accountIdA1,
          destinationAccountId: accountIdA2,
          amount: 3000,
          description: 'Monthly savings transfer',
        });

      expect(transferRes.status).toBe(201);
      expect(transferRes.body.success).toBe(true);
      expect(transferRes.body.data.amount).toBe(3000);
      expect(transferRes.body.data.amountPaise).toBe(300000);
      expect(transferRes.body.data.sourceAccountId).toBe(accountIdA1);
      expect(transferRes.body.data.destinationAccountId).toBe(accountIdA2);

      const transferId = transferRes.body.data.id;
      const debitTxnId = transferRes.body.data.debitTransactionId;
      const creditTxnId = transferRes.body.data.creditTransactionId;

      // Verify source account balance decreased: 10,000 - 3,000 = 7,000 (700000 paise)
      const srcAcc = prismaTestAdapter._state.accounts.get(accountIdA1);
      expect(srcAcc.currentBalance).toBe(BigInt(700000));

      // Verify destination account balance increased: 5,000 + 3,000 = 8,000 (800000 paise)
      const dstAcc = prismaTestAdapter._state.accounts.get(accountIdA2);
      expect(dstAcc.currentBalance).toBe(BigInt(800000));

      // Verify debit and credit transactions exist and are linked
      const debitTxn = prismaTestAdapter._state.transactions.get(debitTxnId);
      const creditTxn = prismaTestAdapter._state.transactions.get(creditTxnId);
      expect(debitTxn.direction).toBe('DEBIT');
      expect(debitTxn.amount).toBe(BigInt(300000));
      expect(creditTxn.direction).toBe('CREDIT');
      expect(creditTxn.amount).toBe(BigInt(300000));

      // Delete transfer
      const deleteTransferRes = await request(app)
        .delete(`/api/v1/transfers/${transferId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(deleteTransferRes.status).toBe(200);
      expect(deleteTransferRes.body.success).toBe(true);

      // Verify both transactions are marked DELETED
      expect(prismaTestAdapter._state.transactions.get(debitTxnId).status).toBe('DELETED');
      expect(prismaTestAdapter._state.transactions.get(creditTxnId).status).toBe('DELETED');

      // Verify both balances reverted back to opening balances
      expect(prismaTestAdapter._state.accounts.get(accountIdA1).currentBalance).toBe(BigInt(1000000));
      expect(prismaTestAdapter._state.accounts.get(accountIdA2).currentBalance).toBe(BigInt(500000));
    });

    it('rejects transfer between identical source and destination accounts (422 VALIDATION_ERROR)', async () => {
      const res = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          sourceAccountId: accountIdA1,
          destinationAccountId: accountIdA1,
          amount: 500,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Ownership Isolation (User A vs User B)', () => {
    it('prevents User B from reading, modifying, or deleting User A transactions', async () => {
      // User A creates a transaction
      const createRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          accountId: accountIdA1,
          type: 'EXPENSE',
          amount: 750,
          description: "Alice's Private Purchase",
        });
      const txnId = createRes.body.data.id;

      // User B attempts GET
      const getRes = await request(app)
        .get(`/api/v1/transactions/${txnId}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe('FORBIDDEN');

      // User B attempts PUT
      const putRes = await request(app)
        .put(`/api/v1/transactions/${txnId}`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({ amount: 10 });
      expect(putRes.status).toBe(403);
      expect(putRes.body.error.code).toBe('FORBIDDEN');

      // User B attempts DELETE
      const delRes = await request(app)
        .delete(`/api/v1/transactions/${txnId}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(delRes.status).toBe(403);
      expect(delRes.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents User B from creating a transaction using User A account', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          accountId: accountIdA1, // User A's account!
          type: 'EXPENSE',
          amount: 500,
          description: 'Unauthorized charge',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents User B from transferring from or to User A account', async () => {
      // User B creates their own account
      const bobAcc = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          name: "Bob's Checking",
          type: 'BANK',
          openingBalance: 10000,
        });
      const bobAccId = bobAcc.body.data.id;

      // User B attempts transfer from User A's account to Bob's account
      const res = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          sourceAccountId: accountIdA1, // User A's account!
          destinationAccountId: bobAccId,
          amount: 1000,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Pagination, Filtering, and Search', () => {
    it('supports pagination and filtering by type, account, and search term', async () => {
      // Create 5 transactions of various types
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ accountId: accountIdA1, type: 'INCOME', amount: 1000, description: 'Freelance Design' });

      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ accountId: accountIdA1, type: 'INCOME', amount: 2000, description: 'Salary Bonus' });

      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ accountId: accountIdA1, type: 'EXPENSE', amount: 500, description: 'Coffee Shop', merchant: 'Blue Tokai' });

      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ accountId: accountIdA1, type: 'EXPENSE', amount: 800, description: 'Dinner with friends', merchant: 'Trattoria' });

      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ accountId: accountIdA2, type: 'INVESTMENT', amount: 1500, description: 'Mutual Fund Growth' });

      // 1. Filter by type = INCOME
      const incomeList = await request(app)
        .get('/api/v1/transactions?type=INCOME')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(incomeList.status).toBe(200);
      expect(incomeList.body.data.items.length).toBe(2);
      expect(incomeList.body.data.items.every((i: any) => i.type === 'INCOME')).toBe(true);

      // 2. Filter by accountId = accountIdA2
      const acc2List = await request(app)
        .get(`/api/v1/transactions?accountId=${accountIdA2}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(acc2List.status).toBe(200);
      expect(acc2List.body.data.items.length).toBe(1);
      expect(acc2List.body.data.items[0].accountId).toBe(accountIdA2);

      // 3. Search by merchant term
      const searchRes = await request(app)
        .get('/api/v1/transactions?search=Tokai')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.items.length).toBe(1);
      expect(searchRes.body.data.items[0].merchant).toBe('Blue Tokai');

      // 4. Pagination: pageSize = 2
      const page1Res = await request(app)
        .get('/api/v1/transactions?page=1&pageSize=2')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.data.items.length).toBe(2);
      expect(page1Res.body.data.total).toBe(5);
      expect(page1Res.body.data.page).toBe(1);
      expect(page1Res.body.data.pageSize).toBe(2);

      const page2Res = await request(app)
        .get('/api/v1/transactions?page=2&pageSize=2')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(page2Res.status).toBe(200);
      expect(page2Res.body.data.items.length).toBe(2);
      expect(page2Res.body.data.page).toBe(2);
    });
  });
});
