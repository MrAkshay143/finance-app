import { vi } from 'vitest';
import crypto from 'crypto';

export function createMockPrisma() {
  const users = new Map<string, any>();
  const refreshTokens = new Map<string, any>();
  const securityQuestions = new Map<string, any>();
  const financeProfiles = new Map<string, any>();
  const userSettings = new Map<string, any>();
  const appSettings = new Map<string, any>();
  const auditLogs: any[] = [];
  const accounts = new Map<string, any>();
  const transactions = new Map<string, any>();
  const transfers = new Map<string, any>();
  const categories = new Map<string, any>();
  const merchants = new Map<string, any>();
  const budgets = new Map<string, any>();
  const goals = new Map<string, any>();
  const recurringTransactions = new Map<string, any>();
  const notifications = new Map<string, any>();
  const reminders = new Map<string, any>();

  function seedSystemCategories() {
    const defaultCategories = [
      { name: 'Food & Dining', type: 'EXPENSE', sortOrder: 1 },
      { name: 'Groceries', type: 'EXPENSE', sortOrder: 2 },
      { name: 'Fuel', type: 'EXPENSE', sortOrder: 3 },
      { name: 'Rent', type: 'EXPENSE', sortOrder: 4 },
      { name: 'Utilities', type: 'EXPENSE', sortOrder: 5 },
      { name: 'Shopping', type: 'EXPENSE', sortOrder: 6 },
      { name: 'Health & Medical', type: 'EXPENSE', sortOrder: 7 },
      { name: 'Entertainment', type: 'EXPENSE', sortOrder: 8 },
      { name: 'Travel & Transit', type: 'EXPENSE', sortOrder: 9 },
      { name: 'Salary', type: 'INCOME', sortOrder: 10 },
      { name: 'Freelance', type: 'INCOME', sortOrder: 11 },
      { name: 'Investment Return', type: 'INCOME', sortOrder: 12 },
      { name: 'Bonds', type: 'INVESTMENT', sortOrder: 13 },
      { name: 'Fixed Deposit', type: 'INVESTMENT', sortOrder: 14 },
      { name: 'Gold', type: 'INVESTMENT', sortOrder: 15 },
      { name: 'Mutual Funds', type: 'INVESTMENT', sortOrder: 16 },
      { name: 'Real Estate', type: 'INVESTMENT', sortOrder: 17 },
    ];
    for (const c of defaultCategories) {
      const id = `00000000-0000-4000-8000-${String(c.sortOrder).padStart(12, '0')}`;
      categories.set(id, {
        id,
        userId: null,
        name: c.name,
        type: c.type,
        isSystem: true,
        sortOrder: c.sortOrder,
        createdAt: new Date(),
      });
    }
  }

  // Seed default app settings & system categories
  appSettings.set('max_failed_attempts', { key: 'max_failed_attempts', value: 5 });
  appSettings.set('lockout_duration_minutes', { key: 'lockout_duration_minutes', value: 15 });
  appSettings.set('session_timeout_minutes', { key: 'session_timeout_minutes', value: 15 });
  seedSystemCategories();

  function clearAll() {
    users.clear();
    refreshTokens.clear();
    securityQuestions.clear();
    financeProfiles.clear();
    userSettings.clear();
    auditLogs.length = 0;
    accounts.clear();
    transactions.clear();
    transfers.clear();
    categories.clear();
    merchants.clear();
    budgets.clear();
    goals.clear();
    recurringTransactions.clear();
    notifications.clear();
    reminders.clear();
    appSettings.set('max_failed_attempts', { key: 'max_failed_attempts', value: 5 });
    appSettings.set('lockout_duration_minutes', { key: 'lockout_duration_minutes', value: 15 });
    seedSystemCategories();
  }

  const mockPrisma = {
    clearAll,
    _state: {
      users,
      refreshTokens,
      securityQuestions,
      financeProfiles,
      userSettings,
      appSettings,
      auditLogs,
      accounts,
      transactions,
      transfers,
      categories,
      merchants,
      budgets,
      goals,
      recurringTransactions,
      notifications,
      reminders,
    },
    user: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        let user: any = null;
        if (where.id) {
          user = users.get(where.id);
        } else if (where.email) {
          user = Array.from(users.values()).find((u) => u.email === where.email);
        }
        if (!user) return null;

        const result = { ...user };
        if (include?.financeProfile) {
          result.financeProfile = financeProfiles.get(user.id) || null;
        }
        if (include?.userSettings) {
          result.userSettings = userSettings.get(user.id) || null;
        }
        if (include?.securityQuestions) {
          result.securityQuestions = Array.from(securityQuestions.values()).filter(
            (q) => q.userId === user.id
          );
        }
        if (include?.accounts) {
          result.accounts = Array.from(accounts.values()).filter(
            (a) => a.userId === user.id
          );
        }
        return result;
      }),

      create: vi.fn(async ({ data, include }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const newUser = {
          id,
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          mobileNumber: data.mobileNumber || '',
          role: data.role || 'USER',
          status: data.status || 'ACTIVE',
          failedLoginAttempts: data.failedLoginAttempts ?? 0,
          lockedUntil: data.lockedUntil || null,
          onboardingCompleted: data.onboardingCompleted ?? false,
          lastLoginAt: data.lastLoginAt || null,
          createdAt: now,
          updatedAt: now,
        };
        users.set(id, newUser);

        if (data.userSettings?.create) {
          const settings = {
            id: `settings-${id}`,
            userId: id,
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            financialMonthStartDay: 1,
            quickAddEnabled: false,
            dashboardDonutsConfig: { income: true, expense: true, investment: true },
            featuresConfig: { investments: true, recurring: true },
            createdAt: now,
            updatedAt: now,
            ...data.userSettings.create,
          };
          userSettings.set(id, settings);
        }

        if (data.financeProfile?.create) {
          const profile = {
            id: `fp-${id}`,
            userId: id,
            monthlyIncome: data.financeProfile.create.monthlyIncome ?? BigInt(0),
            monthlyExpenseBudget: data.financeProfile.create.monthlyExpenseBudget ?? BigInt(0),
            monthlyInvestmentTarget: data.financeProfile.create.monthlyInvestmentTarget ?? BigInt(0),
            incomeRange: null,
            savingsTarget: null,
            investmentExperience: null,
            riskAppetite: 'MEDIUM',
            investmentHorizon: 'MEDIUM',
            dateOfBirth: null,
            address: null,
            createdAt: now,
            updatedAt: now,
          };
          financeProfiles.set(id, profile);
        }

        const result = { ...newUser };
        if (include?.userSettings) {
          result.userSettings = userSettings.get(id);
        }
        if (include?.financeProfile) {
          result.financeProfile = financeProfiles.get(id);
        }
        return result;
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const user = users.get(where.id);
        if (!user) throw new Error(`User not found: ${where.id}`);
        const updated = {
          ...user,
          ...data,
          updatedAt: new Date(),
        };
        users.set(where.id, updated);
        return { ...updated };
      }),

      findMany: vi.fn(async ({ where, skip = 0, take, orderBy }: any = {}) => {
        let list = Array.from(users.values());
        if (where?.status) {
          if (typeof where.status === 'object' && where.status.not) {
            list = list.filter((u) => u.status !== where.status.not);
          } else {
            list = list.filter((u) => u.status === where.status);
          }
        }
        if (where?.role) {
          list = list.filter((u) => u.role === where.role);
        }
        if (where?.OR) {
          list = list.filter((u) => {
            return where.OR.some((cond: any) => {
              if (cond.email?.contains) {
                return u.email.toLowerCase().includes(cond.email.contains.toLowerCase());
              }
              if (cond.firstName?.contains) {
                return (u.firstName || '').toLowerCase().includes(cond.firstName.contains.toLowerCase());
              }
              if (cond.lastName?.contains) {
                return (u.lastName || '').toLowerCase().includes(cond.lastName.contains.toLowerCase());
              }
              return false;
            });
          });
        }
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (take !== undefined) {
          list = list.slice(skip, skip + take);
        }
        return list.map((u) => ({ ...u }));
      }),

      count: vi.fn(async ({ where }: any = {}) => {
        let list = Array.from(users.values());
        if (where?.status) {
          if (typeof where.status === 'object' && where.status.not) {
            list = list.filter((u) => u.status !== where.status.not);
          } else {
            list = list.filter((u) => u.status === where.status);
          }
        }
        if (where?.role) {
          list = list.filter((u) => u.role === where.role);
        }
        if (where?.OR) {
          list = list.filter((u) => {
            return where.OR.some((cond: any) => {
              if (cond.email?.contains) {
                return u.email.toLowerCase().includes(cond.email.contains.toLowerCase());
              }
              if (cond.firstName?.contains) {
                return (u.firstName || '').toLowerCase().includes(cond.firstName.contains.toLowerCase());
              }
              if (cond.lastName?.contains) {
                return (u.lastName || '').toLowerCase().includes(cond.lastName.contains.toLowerCase());
              }
              return false;
            });
          });
        }
        return list.length;
      }),
    },

    refreshToken: {
      create: vi.fn(async ({ data }: any) => {
        const id = data.id || `rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const record = {
          id,
          userId: data.userId,
          tokenHash: data.tokenHash,
          familyId: data.familyId,
          userAgent: data.userAgent || null,
          ipAddress: data.ipAddress || null,
          revokedAt: null,
          createdAt: new Date(),
          expiresAt: data.expiresAt,
        };
        refreshTokens.set(data.tokenHash, record);
        return record;
      }),

      findUnique: vi.fn(async ({ where, include }: any) => {
        const token = refreshTokens.get(where.tokenHash);
        if (!token) return null;
        const result = { ...token };
        if (include?.user) {
          result.user = users.get(token.userId) || null;
        }
        return result;
      }),

      update: vi.fn(async ({ where, data }: any) => {
        for (const [key, token] of refreshTokens.entries()) {
          if (token.id === where.id) {
            const updated = { ...token, ...data };
            refreshTokens.set(key, updated);
            return updated;
          }
        }
        return null;
      }),

      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const [key, token] of refreshTokens.entries()) {
          let match = true;
          if (where.familyId && token.familyId !== where.familyId) match = false;
          if (where.userId && token.userId !== where.userId) match = false;
          if (where.revokedAt === null && token.revokedAt !== null) match = false;

          if (match) {
            refreshTokens.set(key, { ...token, ...data });
            count++;
          }
        }
        return { count };
      }),
    },

    securityQuestion: {
      findMany: vi.fn(async ({ where, select }: any) => {
        const matched = Array.from(securityQuestions.values()).filter(
          (q) => q.userId === where.userId
        );
        if (select) {
          return matched.map((q) => {
            const filtered: any = {};
            for (const key of Object.keys(select)) {
              if (select[key]) filtered[key] = q[key];
            }
            return filtered;
          });
        }
        return matched;
      }),

      count: vi.fn(async ({ where }: any) => {
        let list = Array.from(securityQuestions.values());
        if (where?.userId) {
          list = list.filter((q) => q.userId === where.userId);
        }
        return list.length;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, q] of securityQuestions.entries()) {
          if (q.userId === where.userId) {
            securityQuestions.delete(id);
            count++;
          }
        }
        return { count };
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = `sq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const record = {
          id,
          userId: data.userId,
          questionKey: data.questionKey,
          answerHash: data.answerHash,
          createdAt: new Date(),
        };
        securityQuestions.set(id, record);
        return record;
      }),
    },

    financeProfile: {
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const existing = financeProfiles.get(where.userId);
        const now = new Date();
        if (existing) {
          const updated = {
            ...existing,
            ...update,
            updatedAt: now,
          };
          financeProfiles.set(where.userId, updated);
          return updated;
        } else {
          const created = {
            id: `fp-${where.userId}`,
            userId: where.userId,
            monthlyIncome: BigInt(0),
            monthlyExpenseBudget: BigInt(0),
            monthlyInvestmentTarget: BigInt(0),
            savingsTarget: null,
            incomeRange: null,
            investmentExperience: null,
            riskAppetite: 'MEDIUM',
            investmentHorizon: 'MEDIUM',
            dateOfBirth: null,
            address: null,
            ...create,
            createdAt: now,
            updatedAt: now,
          };
          financeProfiles.set(where.userId, created);
          return created;
        }
      }),

      findUnique: vi.fn(async ({ where }: any) => {
        return financeProfiles.get(where.userId) || null;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        if (where?.userId && financeProfiles.has(where.userId)) {
          financeProfiles.delete(where.userId);
          count++;
        }
        return { count };
      }),
    },

    account: {
      findFirst: vi.fn(async ({ where }: any) => {
        let list = Array.from(accounts.values());
        if (where?.id) list = list.filter((a) => a.id === where.id);
        if (where?.userId) list = list.filter((a) => a.userId === where.userId);
        return list[0] ? { ...list[0] } : null;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, acc] of accounts.entries()) {
          if (where?.userId && acc.userId === where.userId) {
            accounts.delete(id);
            count++;
          }
        }
        return { count };
      }),

      findUnique: vi.fn(async ({ where, include }: any) => {
        const acc = accounts.get(where.id);
        if (!acc) return null;
        const res = { ...acc };
        if (include?.transactions) {
          const list = Array.from(transactions.values())
            .filter(
              (t) =>
                t.accountId === where.id &&
                (!include.transactions.where?.status ||
                  t.status === include.transactions.where.status)
            )
            .sort(
              (a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime()
            );
          const limit = include.transactions.take || list.length;
          res.transactions = list.slice(0, limit).map((t) => ({
            ...t,
            category: t.categoryId ? categories.get(t.categoryId) || null : null,
            merchant: t.merchantId ? merchants.get(t.merchantId) || null : null,
          }));
        }
        return res;
      }),

      findMany: vi.fn(async ({ where, orderBy }: any) => {
        let list = Array.from(accounts.values());
        if (where?.userId) {
          list = list.filter((a) => a.userId === where.userId);
        }
        if (where?.status) {
          list = list.filter((a) => a.status === where.status);
        }
        return list.map((a) => ({ ...a }));
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const acc = {
          id,
          userId: data.userId,
          name: data.name,
          accountType: data.accountType || 'BANK',
          institution: data.institution || null,
          accountIdentifier: data.accountIdentifier || null,
          openingBalance: data.openingBalance ?? BigInt(0),
          currentBalance: data.currentBalance ?? data.openingBalance ?? BigInt(0),
          status: data.status || 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        accounts.set(id, acc);
        return { ...acc };
      }),

      update: vi.fn(async ({ where, data, select }: any) => {
        const acc = accounts.get(where.id);
        if (!acc) throw new Error(`Account not found: ${where.id}`);

        let currentBalance = acc.currentBalance ?? BigInt(0);
        if (data.currentBalance !== undefined) {
          if (typeof data.currentBalance === 'object' && data.currentBalance !== null) {
            if ('increment' in data.currentBalance) {
              currentBalance = BigInt(currentBalance) + BigInt(data.currentBalance.increment);
            } else if ('decrement' in data.currentBalance) {
              currentBalance = BigInt(currentBalance) - BigInt(data.currentBalance.decrement);
            } else {
              currentBalance = data.currentBalance;
            }
          } else {
            currentBalance = BigInt(data.currentBalance);
          }
        }

        let openingBalance = acc.openingBalance ?? BigInt(0);
        if (data.openingBalance !== undefined) {
          if (typeof data.openingBalance === 'object' && data.openingBalance !== null) {
            if ('increment' in data.openingBalance) {
              openingBalance = BigInt(openingBalance) + BigInt(data.openingBalance.increment);
            } else if ('decrement' in data.openingBalance) {
              openingBalance = BigInt(openingBalance) - BigInt(data.openingBalance.decrement);
            } else {
              openingBalance = data.openingBalance;
            }
          } else {
            openingBalance = BigInt(data.openingBalance);
          }
        }

        const updated = {
          ...acc,
          ...data,
          currentBalance,
          openingBalance,
          updatedAt: new Date(),
        };
        accounts.set(where.id, updated);

        if (select) {
          const selected: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) selected[key] = updated[key];
          }
          return selected;
        }

        return { ...updated };
      }),

      delete: vi.fn(async ({ where }: any) => {
        const acc = accounts.get(where.id);
        if (!acc) throw new Error(`Account not found: ${where.id}`);
        accounts.delete(where.id);
        return { ...acc };
      }),
    },

    transaction: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const txn = transactions.get(where.id);
        if (!txn) return null;
        const res = { ...txn };
        if (include?.account) {
          res.account = accounts.get(txn.accountId) || null;
        }
        if (include?.category) {
          res.category = txn.categoryId ? categories.get(txn.categoryId) || null : null;
        }
        if (include?.merchant) {
          res.merchant = txn.merchantId ? merchants.get(txn.merchantId) || null : null;
        }
        if (include?.transferAsDebit) {
          res.transferAsDebit =
            Array.from(transfers.values()).find((tr) => tr.debitTransactionId === txn.id) || null;
        }
        if (include?.transferAsCredit) {
          res.transferAsCredit =
            Array.from(transfers.values()).find((tr) => tr.creditTransactionId === txn.id) || null;
        }
        return res;
      }),

      findMany: vi.fn(async ({ where, orderBy, skip = 0, take, include }: any) => {
        let list = Array.from(transactions.values());
        if (where?.userId) {
          list = list.filter((t) => t.userId === where.userId);
        }
        if (where?.accountId) {
          list = list.filter((t) => t.accountId === where.accountId);
        }
        if (where?.categoryId) {
          list = list.filter((t) => t.categoryId === where.categoryId);
        }
        if (where?.merchantId !== undefined) {
          if (where.merchantId === null) {
            list = list.filter((t) => t.merchantId === null);
          } else if (typeof where.merchantId === 'object' && where.merchantId.not === null) {
            list = list.filter((t) => t.merchantId !== null);
          } else if (typeof where.merchantId === 'string') {
            list = list.filter((t) => t.merchantId === where.merchantId);
          }
        }
        if (where?.type) {
          list = list.filter((t) => t.type === where.type);
        }
        if (where?.direction) {
          list = list.filter((t) => t.direction === where.direction);
        }
        if (where?.status) {
          list = list.filter((t) => t.status === where.status);
        }
        if (where?.txnDate?.gte) {
          list = list.filter((t) => new Date(t.txnDate) >= new Date(where.txnDate.gte));
        }
        if (where?.txnDate?.lt) {
          list = list.filter((t) => new Date(t.txnDate) < new Date(where.txnDate.lt));
        }
        if (where?.txnDate?.lte) {
          list = list.filter((t) => new Date(t.txnDate) <= new Date(where.txnDate.lte));
        }
        if (where?.OR) {
          const searchVal = where.OR[0]?.description?.contains?.toLowerCase();
          if (searchVal) {
            list = list.filter((t) => {
              const desc = (t.description || '').toLowerCase();
              const merch = t.merchantId ? (merchants.get(t.merchantId)?.name || '').toLowerCase() : '';
              return desc.includes(searchVal) || merch.includes(searchVal);
            });
          }
        }

        // Sort descending by txnDate
        list.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());

        const paginated = list.slice(skip, take !== undefined ? skip + take : undefined);
        return paginated.map((txn) => {
          const res = { ...txn };
          if (include?.account) {
            res.account = accounts.get(txn.accountId) || null;
          }
          if (include?.category) {
            res.category = txn.categoryId ? categories.get(txn.categoryId) || null : null;
          }
          if (include?.merchant) {
            res.merchant = txn.merchantId ? merchants.get(txn.merchantId) || null : null;
          }
          return res;
        });
      }),

      count: vi.fn(async ({ where }: any) => {
        let list = Array.from(transactions.values());
        if (where?.userId) {
          list = list.filter((t) => t.userId === where.userId);
        }
        if (where?.accountId) {
          list = list.filter((t) => t.accountId === where.accountId);
        }
        if (where?.categoryId) {
          list = list.filter((t) => t.categoryId === where.categoryId);
        }
        if (where?.merchantId) {
          list = list.filter((t) => t.merchantId === where.merchantId);
        }
        if (where?.type) {
          list = list.filter((t) => t.type === where.type);
        }
        if (where?.direction) {
          list = list.filter((t) => t.direction === where.direction);
        }
        if (where?.status) {
          list = list.filter((t) => t.status === where.status);
        }
        if (where?.txnDate?.gte) {
          list = list.filter((t) => new Date(t.txnDate) >= new Date(where.txnDate.gte));
        }
        if (where?.txnDate?.lt) {
          list = list.filter((t) => new Date(t.txnDate) < new Date(where.txnDate.lt));
        }
        if (where?.txnDate?.lte) {
          list = list.filter((t) => new Date(t.txnDate) <= new Date(where.txnDate.lte));
        }
        if (where?.OR) {
          const searchVal = where.OR[0]?.description?.contains?.toLowerCase();
          if (searchVal) {
            list = list.filter((t) => {
              const desc = (t.description || '').toLowerCase();
              const merch = t.merchantId ? (merchants.get(t.merchantId)?.name || '').toLowerCase() : '';
              return desc.includes(searchVal) || merch.includes(searchVal);
            });
          }
        }
        return list.length;
      }),

      aggregate: vi.fn(async ({ where, _sum }: any) => {
        let list = Array.from(transactions.values());
        if (where?.userId) {
          list = list.filter((t) => t.userId === where.userId);
        }
        if (where?.accountId) {
          list = list.filter((t) => t.accountId === where.accountId);
        }
        if (where?.categoryId) {
          list = list.filter((t) => t.categoryId === where.categoryId);
        }
        if (where?.merchantId) {
          list = list.filter((t) => t.merchantId === where.merchantId);
        }
        if (where?.type) {
          list = list.filter((t) => t.type === where.type);
        }
        if (where?.direction) {
          list = list.filter((t) => t.direction === where.direction);
        }
        if (where?.status) {
          list = list.filter((t) => t.status === where.status);
        }
        if (where?.txnDate?.gte) {
          list = list.filter((t) => new Date(t.txnDate) >= new Date(where.txnDate.gte));
        }
        if (where?.txnDate?.lt) {
          list = list.filter((t) => new Date(t.txnDate) < new Date(where.txnDate.lt));
        }
        if (where?.txnDate?.lte) {
          list = list.filter((t) => new Date(t.txnDate) <= new Date(where.txnDate.lte));
        }
        let total = BigInt(0);
        for (const t of list) {
          total += BigInt(t.amount);
        }
        return { _sum: { amount: total } };
      }),

      create: vi.fn(async ({ data, include }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const txn = {
          id,
          userId: data.userId,
          accountId: data.accountId,
          categoryId: data.categoryId || null,
          merchantId: data.merchantId || null,
          type: data.type,
          direction: data.direction,
          amount: BigInt(data.amount),
          description: data.description || '',
          txnDate: data.txnDate ? new Date(data.txnDate) : now,
          status: data.status || 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        transactions.set(id, txn);
        const res = { ...txn };
        if (include?.account) {
          res.account = accounts.get(txn.accountId) || null;
        }
        if (include?.category) {
          res.category = txn.categoryId ? categories.get(txn.categoryId) || null : null;
        }
        if (include?.merchant) {
          res.merchant = txn.merchantId ? merchants.get(txn.merchantId) || null : null;
        }
        return res;
      }),

      update: vi.fn(async ({ where, data, include }: any) => {
        const txn = transactions.get(where.id);
        if (!txn) throw new Error(`Transaction not found: ${where.id}`);
        const updated = {
          ...txn,
          ...data,
          amount: data.amount !== undefined ? BigInt(data.amount) : txn.amount,
          updatedAt: new Date(),
        };
        transactions.set(where.id, updated);
        const res = { ...updated };
        if (include?.account) {
          res.account = accounts.get(res.accountId) || null;
        }
        if (include?.category) {
          res.category = res.categoryId ? categories.get(res.categoryId) || null : null;
        }
        if (include?.merchant) {
          res.merchant = res.merchantId ? merchants.get(res.merchantId) || null : null;
        }
        return res;
      }),

      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const [id, txn] of transactions.entries()) {
          let match = true;
          if (where?.id?.in && !where.id.in.includes(id)) match = false;
          if (where?.categoryId && txn.categoryId !== where.categoryId) match = false;
          if (where?.userId && txn.userId !== where.userId) match = false;
          if (match) {
            transactions.set(id, { ...txn, ...data, updatedAt: new Date() });
            count++;
          }
        }
        return { count };
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, txn] of transactions.entries()) {
          if (where?.userId && txn.userId === where.userId) {
            transactions.delete(id);
            count++;
          }
        }
        return { count };
      }),
    },

    transfer: {
      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const record = {
          id,
          userId: data.userId,
          sourceAccountId: data.sourceAccountId,
          destinationAccountId: data.destinationAccountId,
          amount: BigInt(data.amount),
          txnDate: data.txnDate ? new Date(data.txnDate) : new Date(),
          description: data.description || null,
          debitTransactionId: data.debitTransactionId,
          creditTransactionId: data.creditTransactionId,
          createdAt: new Date(),
        };
        transfers.set(id, record);
        return { ...record };
      }),

      findUnique: vi.fn(async ({ where, include }: any) => {
        const tr = transfers.get(where.id);
        if (!tr) return null;
        const res = { ...tr };
        if (include?.debitTransaction) {
          res.debitTransaction = transactions.get(tr.debitTransactionId) || null;
        }
        if (include?.creditTransaction) {
          res.creditTransaction = transactions.get(tr.creditTransactionId) || null;
        }
        return res;
      }),

      findMany: vi.fn(async ({ where }: any) => {
        let list = Array.from(transfers.values());
        if (where?.userId) {
          list = list.filter((t) => t.userId === where.userId);
        }
        return list.map((t) => ({ ...t }));
      }),

      delete: vi.fn(async ({ where }: any) => {
        const tr = transfers.get(where.id);
        if (tr) {
          transfers.delete(where.id);
        }
        return tr;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, tr] of transfers.entries()) {
          if (where?.userId && tr.userId === where.userId) {
            transfers.delete(id);
            count++;
          }
        }
        return { count };
      }),
    },

    category: {
      findUnique: vi.fn(async ({ where }: any) => {
        return categories.get(where.id) || null;
      }),

      findFirst: vi.fn(async ({ where }: any) => {
        let list = Array.from(categories.values());
        if (where?.name) {
          const matchName =
            typeof where.name === 'string'
              ? where.name.toLowerCase()
              : where.name.equals?.toLowerCase();
          if (matchName) {
            list = list.filter((c) => c.name.toLowerCase() === matchName);
          }
        }
        if (where?.type) {
          list = list.filter((c) => c.type === where.type);
        }
        if (where?.isSystem !== undefined) {
          list = list.filter((c) => c.isSystem === where.isSystem);
        }
        if (where?.userId !== undefined) {
          list = list.filter((c) => c.userId === where.userId);
        }
        if (where?.OR) {
          list = list.filter((c) => {
            return where.OR.some((cond: any) => {
              if (cond.isSystem !== undefined && c.isSystem === cond.isSystem) return true;
              if (cond.userId !== undefined && c.userId === cond.userId) return true;
              return false;
            });
          });
        }
        return list[0] ? { ...list[0] } : null;
      }),

      findMany: vi.fn(async ({ where, select }: any) => {
        let list = Array.from(categories.values());
        if (where?.OR) {
          list = list.filter((c) => {
            return where.OR.some((cond: any) => {
              if (cond.isSystem !== undefined && c.isSystem === cond.isSystem) return true;
              if (cond.userId !== undefined && c.userId === cond.userId) return true;
              return false;
            });
          });
        } else {
          if (where?.userId !== undefined) {
            list = list.filter((c) => c.userId === where.userId);
          }
          if (where?.isSystem !== undefined) {
            list = list.filter((c) => c.isSystem === where.isSystem);
          }
        }
        if (where?.type) {
          list = list.filter((c) => c.type === where.type);
        }
        if (where?.id?.not) {
          list = list.filter((c) => c.id !== where.id.not);
        }
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        return list.map((c) => ({ ...c }));
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const rec = {
          id,
          userId: data.userId || null,
          name: data.name,
          type: data.type,
          isSystem: data.isSystem || false,
          sortOrder: data.sortOrder || 0,
          createdAt: new Date(),
        };
        categories.set(id, rec);
        return { ...rec };
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const cat = categories.get(where.id);
        if (!cat) throw new Error(`Category not found: ${where.id}`);
        const updated = { ...cat, ...data };
        categories.set(where.id, updated);
        return { ...updated };
      }),

      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const [id, c] of categories.entries()) {
          let match = true;
          if (where?.id && c.id !== where.id) match = false;
          if (where?.userId !== undefined && c.userId !== where.userId) match = false;
          if (where?.isSystem !== undefined && c.isSystem !== where.isSystem) match = false;
          if (match) {
            categories.set(id, { ...c, ...data });
            count++;
          }
        }
        return { count };
      }),

      delete: vi.fn(async ({ where }: any) => {
        const cat = categories.get(where.id);
        if (cat) categories.delete(where.id);
        return cat ? { ...cat } : null;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, c] of categories.entries()) {
          let match = true;
          if (where?.userId && c.userId !== where.userId) match = false;
          if (where?.isSystem !== undefined && c.isSystem !== where.isSystem) match = false;
          if (match) {
            categories.delete(id);
            count++;
          }
        }
        return { count };
      }),
    },

    merchant: {
      findUnique: vi.fn(async ({ where }: any) => {
        return merchants.get(where.id) || null;
      }),

      findFirst: vi.fn(async ({ where }: any) => {
        const list = Array.from(merchants.values());
        const match = list.find((m) => {
          if (where.userId && m.userId !== where.userId) return false;
          if (where.name) {
            const matchName =
              typeof where.name === 'string'
                ? where.name.toLowerCase()
                : where.name.equals?.toLowerCase();
            if (matchName && m.name.toLowerCase() !== matchName) return false;
          }
          return true;
        });
        return match ? { ...match } : null;
      }),

      findMany: vi.fn(async ({ where }: any) => {
        let list = Array.from(merchants.values());
        if (where?.userId) {
          list = list.filter((m) => m.userId === where.userId);
        }
        return list.map((m) => ({ ...m }));
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const rec = {
          id,
          userId: data.userId,
          name: data.name,
          createdAt: new Date(),
        };
        merchants.set(id, rec);
        return { ...rec };
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const m = merchants.get(where.id);
        if (!m) throw new Error(`Merchant not found: ${where.id}`);
        const updated = { ...m, ...data };
        merchants.set(where.id, updated);
        return { ...updated };
      }),

      delete: vi.fn(async ({ where }: any) => {
        const m = merchants.get(where.id);
        if (m) merchants.delete(where.id);
        return m ? { ...m } : null;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, m] of merchants.entries()) {
          if (where?.userId && m.userId === where.userId) {
            merchants.delete(id);
            count++;
          }
        }
        return { count };
      }),
    },

    budget: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const b = budgets.get(where.id);
        if (!b) return null;
        const res = { ...b };
        if (include?.category) {
          res.category = categories.get(b.categoryId) || null;
        }
        return res;
      }),

      findMany: vi.fn(async ({ where, include }: any) => {
        let list = Array.from(budgets.values());
        if (where?.userId) {
          list = list.filter((b) => b.userId === where.userId);
        }
        if (where?.status) {
          list = list.filter((b) => b.status === where.status);
        }
        return list.map((b) => {
          const res = { ...b };
          if (include?.category) {
            res.category = categories.get(b.categoryId) || null;
          }
          return res;
        });
      }),

      create: vi.fn(async ({ data, include }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const rec = {
          id,
          userId: data.userId,
          categoryId: data.categoryId,
          name: data.name,
          targetAmount: BigInt(data.targetAmount),
          period: data.period || 'MONTHLY',
          periodStart: data.periodStart ? new Date(data.periodStart) : now,
          status: data.status || 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        budgets.set(id, rec);
        const res = { ...rec };
        if (include?.category) {
          res.category = categories.get(rec.categoryId) || null;
        }
        return res;
      }),

      update: vi.fn(async ({ where, data, include }: any) => {
        const b = budgets.get(where.id);
        if (!b) throw new Error(`Budget not found: ${where.id}`);
        const updated = {
          ...b,
          ...data,
          targetAmount:
            data.targetAmount !== undefined ? BigInt(data.targetAmount) : b.targetAmount,
          updatedAt: new Date(),
        };
        budgets.set(where.id, updated);
        const res = { ...updated };
        if (include?.category) {
          res.category = categories.get(updated.categoryId) || null;
        }
        return res;
      }),

      delete: vi.fn(async ({ where }: any) => {
        const b = budgets.get(where.id);
        if (b) budgets.delete(where.id);
        return b;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, b] of budgets.entries()) {
          let match = true;
          if (where?.userId && b.userId !== where.userId) match = false;
          if (where?.categoryId && b.categoryId !== where.categoryId) match = false;
          if (match) {
            budgets.delete(id);
            count++;
          }
        }
        return { count };
      }),
    },

    goal: {
      findUnique: vi.fn(async ({ where }: any) => {
        return goals.get(where.id) || null;
      }),

      findMany: vi.fn(async ({ where }: any) => {
        let list = Array.from(goals.values());
        if (where?.userId) {
          list = list.filter((g) => g.userId === where.userId);
        }
        if (where?.status) {
          list = list.filter((g) => g.status === where.status);
        }
        return list.map((g) => ({ ...g }));
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const rec = {
          id,
          userId: data.userId,
          name: data.name,
          targetAmount: BigInt(data.targetAmount),
          currentAmount:
            data.currentAmount !== undefined ? BigInt(data.currentAmount) : BigInt(0),
          targetDate: data.targetDate ? new Date(data.targetDate) : null,
          status: data.status || 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        goals.set(id, rec);
        return { ...rec };
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const g = goals.get(where.id);
        if (!g) throw new Error(`Goal not found: ${where.id}`);
        const updated = {
          ...g,
          ...data,
          targetAmount:
            data.targetAmount !== undefined ? BigInt(data.targetAmount) : g.targetAmount,
          currentAmount:
            data.currentAmount !== undefined ? BigInt(data.currentAmount) : g.currentAmount,
          updatedAt: new Date(),
        };
        goals.set(where.id, updated);
        return { ...updated };
      }),

      delete: vi.fn(async ({ where }: any) => {
        const g = goals.get(where.id);
        if (g) goals.delete(where.id);
        return g;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, g] of goals.entries()) {
          if (where?.userId && g.userId === where.userId) {
            goals.delete(id);
            count++;
          }
        }
        return { count };
      }),
    },

    recurringTransaction: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const rec = recurringTransactions.get(where.id);
        if (!rec) return null;
        const res = { ...rec };
        if (include?.account) {
          res.account = accounts.get(rec.accountId) || null;
        }
        if (include?.category) {
          res.category = categories.get(rec.categoryId) || null;
        }
        return res;
      }),

      findFirst: vi.fn(async ({ where, include }: any) => {
        let list = Array.from(recurringTransactions.values());
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        const rec = list[0] || null;
        if (!rec) return null;
        const res = { ...rec };
        if (include?.account) res.account = accounts.get(rec.accountId) || null;
        if (include?.category) res.category = categories.get(rec.categoryId) || null;
        return res;
      }),

      findMany: vi.fn(async ({ where, include, orderBy }: any) => {
        let list = Array.from(recurringTransactions.values());
        if (where?.userId) {
          list = list.filter((r) => r.userId === where.userId);
        }
        if (where?.status) {
          if (typeof where.status === 'object' && where.status.not) {
            list = list.filter((r) => r.status !== where.status.not);
          } else {
            list = list.filter((r) => r.status === where.status);
          }
        }
        if (where?.type) {
          list = list.filter((r) => r.type === where.type);
        }
        if (where?.id) {
          list = list.filter((r) => r.id === where.id);
        }
        if (where?.nextOccurrence) {
          if (where.nextOccurrence.lte) {
            const lteDate = new Date(where.nextOccurrence.lte);
            list = list.filter((r) => new Date(r.nextOccurrence) <= lteDate);
          }
          if (where.nextOccurrence.gte) {
            const gteDate = new Date(where.nextOccurrence.gte);
            list = list.filter((r) => new Date(r.nextOccurrence) >= gteDate);
          }
        }
        list.sort((a, b) => new Date(a.nextOccurrence).getTime() - new Date(b.nextOccurrence).getTime());
        return list.map((r) => {
          const res = { ...r };
          if (include?.account) res.account = accounts.get(r.accountId) || null;
          if (include?.category) res.category = categories.get(r.categoryId) || null;
          return res;
        });
      }),

      create: vi.fn(async ({ data, include }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const rec = {
          id,
          userId: data.userId,
          accountId: data.accountId,
          categoryId: data.categoryId || null,
          type: data.type,
          amount: typeof data.amount === 'bigint' ? data.amount : BigInt(data.amount),
          description: data.description || null,
          scheduleFreq: data.scheduleFreq,
          scheduleInterval: data.scheduleInterval || 1,
          nextOccurrence: new Date(data.nextOccurrence),
          status: data.status || 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        recurringTransactions.set(id, rec);
        const res = { ...rec };
        if (include?.account) res.account = accounts.get(rec.accountId) || null;
        if (include?.category) res.category = categories.get(rec.categoryId) || null;
        return res;
      }),

      update: vi.fn(async ({ where, data, include }: any) => {
        const existing = recurringTransactions.get(where.id);
        if (!existing) throw new Error(`Recurring transaction not found: ${where.id}`);
        const updated = {
          ...existing,
          ...data,
          amount: data.amount !== undefined ? BigInt(data.amount) : existing.amount,
          nextOccurrence: data.nextOccurrence ? new Date(data.nextOccurrence) : existing.nextOccurrence,
          updatedAt: new Date(),
        };
        recurringTransactions.set(where.id, updated);
        const res = { ...updated };
        if (include?.account) res.account = accounts.get(updated.accountId) || null;
        if (include?.category) res.category = categories.get(updated.categoryId) || null;
        return res;
      }),

      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const [id, r] of recurringTransactions.entries()) {
          let match = true;
          if (where?.userId && r.userId !== where.userId) match = false;
          if (where?.categoryId && r.categoryId !== where.categoryId) match = false;
          if (match) {
            recurringTransactions.set(id, { ...r, ...data, updatedAt: new Date() });
            count++;
          }
        }
        return { count };
      }),

      delete: vi.fn(async ({ where }: any) => {
        const rec = recurringTransactions.get(where.id);
        if (rec) recurringTransactions.delete(where.id);
        return rec;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, r] of recurringTransactions.entries()) {
          if (where?.userId && r.userId === where.userId) {
            recurringTransactions.delete(id);
            count++;
          }
        }
        return { count };
      }),

      count: vi.fn(async ({ where }: any) => {
        let list = Array.from(recurringTransactions.values());
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        return list.length;
      }),
    },

    notification: {
      findUnique: vi.fn(async ({ where }: any) => {
        return notifications.get(where.id) || null;
      }),

      findFirst: vi.fn(async ({ where }: any) => {
        let list = Array.from(notifications.values());
        if (where?.userId) list = list.filter((n) => n.userId === where.userId);
        if (where?.title) list = list.filter((n) => n.title === where.title);
        if (where?.createdAt?.gte) {
          const gte = new Date(where.createdAt.gte);
          list = list.filter((n) => new Date(n.createdAt) >= gte);
        }
        if (where?.createdAt?.lte) {
          const lte = new Date(where.createdAt.lte);
          list = list.filter((n) => new Date(n.createdAt) <= lte);
        }
        return list[0] || null;
      }),

      findMany: vi.fn(async ({ where, orderBy, skip = 0, take }: any) => {
        let list = Array.from(notifications.values());
        if (where?.userId) list = list.filter((n) => n.userId === where.userId);
        if (where?.read !== undefined) list = list.filter((n) => n.read === where.read);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (skip) list = list.slice(skip);
        if (take) list = list.slice(0, take);
        return list.map((n) => ({ ...n }));
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const rec = {
          id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read ?? false,
          createdAt: now,
        };
        notifications.set(id, rec);
        return { ...rec };
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const existing = notifications.get(where.id);
        if (!existing) throw new Error(`Notification not found: ${where.id}`);
        const updated = { ...existing, ...data };
        notifications.set(where.id, updated);
        return { ...updated };
      }),

      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const [id, n] of notifications.entries()) {
          let match = true;
          if (where?.userId && n.userId !== where.userId) match = false;
          if (where?.read !== undefined && n.read !== where.read) match = false;
          if (match) {
            notifications.set(id, { ...n, ...data });
            count++;
          }
        }
        return { count };
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, n] of notifications.entries()) {
          if (where?.userId && n.userId === where.userId) {
            notifications.delete(id);
            count++;
          }
        }
        return { count };
      }),

      count: vi.fn(async ({ where }: any) => {
        let list = Array.from(notifications.values());
        if (where?.userId) list = list.filter((n) => n.userId === where.userId);
        if (where?.read !== undefined) list = list.filter((n) => n.read === where.read);
        return list.length;
      }),
    },

    reminder: {
      findUnique: vi.fn(async ({ where }: any) => {
        return reminders.get(where.id) || null;
      }),

      findFirst: vi.fn(async ({ where }: any) => {
        let list = Array.from(reminders.values());
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        return list[0] || null;
      }),

      findMany: vi.fn(async ({ where, include }: any) => {
        let list = Array.from(reminders.values());
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        if (where?.enabled !== undefined) list = list.filter((r) => r.enabled === where.enabled);
        return list.map((r) => {
          const res = { ...r };
          if (include?.user) {
            const u = users.get(r.userId);
            res.user = u ? { ...u, userSettings: userSettings.get(r.userId) || null } : null;
          }
          return res;
        });
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date();
        const rec = {
          id,
          userId: data.userId,
          type: data.type,
          timingConfig: data.timingConfig,
          enabled: data.enabled ?? true,
          createdAt: now,
          updatedAt: now,
        };
        reminders.set(id, rec);
        return { ...rec };
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const existing = reminders.get(where.id);
        if (!existing) throw new Error(`Reminder not found: ${where.id}`);
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        reminders.set(where.id, updated);
        return { ...updated };
      }),

      delete: vi.fn(async ({ where }: any) => {
        const r = reminders.get(where.id);
        if (r) reminders.delete(where.id);
        return r;
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        for (const [id, rem] of reminders.entries()) {
          if (where?.userId && rem.userId === where.userId) {
            reminders.delete(id);
            count++;
          }
        }
        return { count };
      }),
    },

    appSetting: {
      findUnique: vi.fn(async ({ where }: any) => {
        return appSettings.get(where.key) || null;
      }),

      findMany: vi.fn(async () => {
        return Array.from(appSettings.values());
      }),

      upsert: vi.fn(async ({ where, create, update }: any) => {
        const existing = appSettings.get(where.key);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          appSettings.set(where.key, updated);
          return updated;
        } else {
          const created = { ...create, updatedAt: new Date() };
          appSettings.set(where.key, created);
          return created;
        }
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const existing = appSettings.get(where.key);
        const updated = { ...(existing || {}), ...data, updatedAt: new Date() };
        appSettings.set(where.key, updated);
        return updated;
      }),
    },

    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        const entry = {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ...data,
          createdAt: new Date(),
        };
        auditLogs.push(entry);
        return entry;
      }),

      findMany: vi.fn(async ({ where, orderBy, skip = 0, take, include }: any = {}) => {
        let list = [...auditLogs];
        if (where?.actorUserId) {
          list = list.filter((l) => l.actorUserId === where.actorUserId);
        }
        if (where?.targetUserId) {
          list = list.filter((l) => l.targetUserId === where.targetUserId);
        }
        if (where?.action) {
          if (typeof where.action === 'string') {
            list = list.filter((l) => l.action === where.action);
          } else if (where.action.contains) {
            list = list.filter((l) =>
              l.action.toLowerCase().includes(where.action.contains.toLowerCase())
            );
          }
        }
        if (where?.createdAt?.gte) {
          list = list.filter((l) => new Date(l.createdAt) >= new Date(where.createdAt.gte));
        }
        if (where?.createdAt?.lte) {
          list = list.filter((l) => new Date(l.createdAt) <= new Date(where.createdAt.lte));
        }
        if (where?.OR) {
          list = list.filter((l) => {
            return where.OR.some((cond: any) => {
              if (cond.actorUserId && l.actorUserId === cond.actorUserId) return true;
              if (cond.targetUserId && l.targetUserId === cond.targetUserId) return true;
              if (
                cond.action?.contains &&
                l.action.toLowerCase().includes(cond.action.contains.toLowerCase())
              )
                return true;
              if (
                cond.ipAddress?.contains &&
                l.ipAddress?.toLowerCase().includes(cond.ipAddress.contains.toLowerCase())
              )
                return true;
              if (cond.actor?.email?.contains && l.actorUserId) {
                const u = users.get(l.actorUserId);
                if (u?.email.toLowerCase().includes(cond.actor?.email?.contains.toLowerCase()))
                  return true;
              }
              if (cond.target?.email?.contains && l.targetUserId) {
                const u = users.get(l.targetUserId);
                if (u?.email.toLowerCase().includes(cond.target?.email?.contains.toLowerCase()))
                  return true;
              }
              return false;
            });
          });
        }
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (take !== undefined) {
          list = list.slice(skip, skip + take);
        }
        return list.map((l) => {
          const res = { ...l };
          if (include?.actor && l.actorUserId) {
            const actor = users.get(l.actorUserId);
            res.actor = actor
              ? { id: actor.id, email: actor.email, firstName: actor.firstName, lastName: actor.lastName }
              : null;
          }
          if (include?.target && l.targetUserId) {
            const target = users.get(l.targetUserId);
            res.target = target
              ? { id: target.id, email: target.email, firstName: target.firstName, lastName: target.lastName }
              : null;
          }
          return res;
        });
      }),

      count: vi.fn(async ({ where }: any = {}) => {
        let list = [...auditLogs];
        if (where?.actorUserId) {
          list = list.filter((l) => l.actorUserId === where.actorUserId);
        }
        if (where?.targetUserId) {
          list = list.filter((l) => l.targetUserId === where.targetUserId);
        }
        return list.length;
      }),
    },

    userSettings: {
      findUnique: vi.fn(async ({ where }: any) => {
        const s = userSettings.get(where.userId);
        return s ? { ...s } : null;
      }),

      create: vi.fn(async ({ data }: any) => {
        const id = data.id || `settings-${data.userId}`;
        const now = new Date();
        const rec = {
          id,
          userId: data.userId,
          currency: data.currency || 'INR',
          timezone: data.timezone || 'Asia/Kolkata',
          financialMonthStartDay: data.financialMonthStartDay ?? 1,
          quickAddEnabled: data.quickAddEnabled ?? false,
          dashboardDonutsConfig:
            data.dashboardDonutsConfig || { income: true, expense: true, investment: true },
          featuresConfig: data.featuresConfig || { investments: true, recurring: true },
          createdAt: now,
          updatedAt: now,
        };
        userSettings.set(data.userId, rec);
        return { ...rec };
      }),

      upsert: vi.fn(async ({ where, create, update }: any) => {
        const existing = userSettings.get(where.userId);
        const now = new Date();
        if (existing) {
          const updated = {
            ...existing,
            ...update,
            updatedAt: now,
          };
          userSettings.set(where.userId, updated);
          return { ...updated };
        } else {
          const rec = {
            id: `settings-${where.userId}`,
            userId: where.userId,
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            financialMonthStartDay: 1,
            quickAddEnabled: false,
            dashboardDonutsConfig: { income: true, expense: true, investment: true },
            featuresConfig: { investments: true, recurring: true },
            ...create,
            createdAt: now,
            updatedAt: now,
          };
          userSettings.set(where.userId, rec);
          return { ...rec };
        }
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const existing = userSettings.get(where.userId);
        if (!existing) throw new Error(`UserSettings not found for user: ${where.userId}`);
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        userSettings.set(where.userId, updated);
        return { ...updated };
      }),

      delete: vi.fn(async ({ where }: any) => {
        const s = userSettings.get(where.userId);
        if (s) userSettings.delete(where.userId);
        return s;
      }),
    },

    $transaction: vi.fn(async (cbOrPromises: any) => {
      if (typeof cbOrPromises === 'function') {
        return cbOrPromises(mockPrisma);
      }
      return Promise.all(cbOrPromises);
    }),
  };

  return mockPrisma;
}

export const prismaTestAdapter = createMockPrisma();
export const mockPrisma = prismaTestAdapter;
export default prismaTestAdapter;
