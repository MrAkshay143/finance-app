import { AccountStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { logAuditEvent } from './auditService.js';
import { formatTransaction } from './transactionService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh, emitSyncEvent } from '../sockets/socketGateway.js';

export interface CreateAccountData {
  name: string;
  type?: string;
  accountType?: string;
  institutionName?: string | null;
  institution?: string | null;
  accountNumberMask?: string | null;
  accountIdentifier?: string | null;
  openingBalance?: number | bigint;
  currency?: string;
}

export interface UpdateAccountData {
  name?: string;
  type?: string;
  accountType?: string;
  institutionName?: string | null;
  institution?: string | null;
  accountNumberMask?: string | null;
  accountIdentifier?: string | null;
}

export function formatAccount(acc: any, defaultCurrency: string = 'INR') {
  const openingPaise = acc.openingBalance || BigInt(0);
  const currentPaise = acc.currentBalance || BigInt(0);

  return {
    id: acc.id,
    userId: acc.userId,
    name: acc.name,
    accountType: acc.accountType,
    type: acc.accountType,
    institution: acc.institution,
    institutionName: acc.institution,
    accountIdentifier: acc.accountIdentifier,
    accountNumberMask: acc.accountIdentifier,
    openingBalance: Number(openingPaise) / 100,
    openingBalancePaise: Number(openingPaise),
    currentBalance: Number(currentPaise) / 100,
    currentBalancePaise: Number(currentPaise),
    currency: acc.currency || defaultCurrency,
    status: acc.status as AccountStatus,
    createdAt: acc.createdAt,
    updatedAt: acc.updatedAt,
  };
}

async function getUserCurrency(userId: string): Promise<string> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { currency: true },
  });
  return settings?.currency || 'INR';
}

export class AccountService {
  // Return user accounts with aggregate balance and active account counts
  async listAccounts(userId: string) {
    const [accounts, userCurrency] = await Promise.all([
      prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      getUserCurrency(userId),
    ]);

    let totalBalancePaise = BigInt(0);
    let activeCount = 0;

    for (const acc of accounts) {
      if (acc.status === 'ACTIVE') {
        totalBalancePaise += acc.currentBalance;
        activeCount++;
      }
    }

    return {
      accounts: accounts.map((acc) => formatAccount(acc, userCurrency)),
      summary: {
        totalBalance: Number(totalBalancePaise) / 100,
        totalBalancePaise: Number(totalBalancePaise),
        activeCount,
        totalCount: accounts.length,
      },
    };
  }

  // Create account with initial balances normalized to BigInt paise
  async createAccount(userId: string, data: CreateAccountData) {
    if (!data.name || !data.name.trim()) {
      throw new ValidationError('Account name is required');
    }

    let openingPaise = BigInt(0);
    if (data.openingBalance !== undefined) {
      if (typeof data.openingBalance === 'bigint') {
        openingPaise = data.openingBalance;
      } else {
        const num = Number(data.openingBalance);
        if (isNaN(num)) {
          throw new ValidationError('Invalid opening balance value');
        }
        openingPaise = BigInt(Math.round(num * 100));
      }
    }

    const accountType = (data.accountType || data.type || 'BANK').trim();
    const institution = (data.institution !== undefined ? data.institution : data.institutionName)?.trim() || null;
    const accountIdentifier = (data.accountIdentifier !== undefined ? data.accountIdentifier : data.accountNumberMask)?.trim() || null;

    const account = await prisma.account.create({
      data: {
        userId,
        name: data.name.trim(),
        accountType,
        institution,
        accountIdentifier,
        openingBalance: openingPaise,
        currentBalance: openingPaise,
        status: 'ACTIVE',
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'ACCOUNT_CREATE',
      details: {
        accountId: account.id,
        name: account.name,
        accountType: account.accountType,
        openingBalancePaise: openingPaise.toString(),
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'ACCOUNT', action: 'CREATE', entityId: account.id, affectedAccountIds: [account.id] });

    const userCurrency = await getUserCurrency(userId);
    return formatAccount(account, userCurrency);
  }

  // Return single account detail with recent transactions
  async getAccount(userId: string, id: string) {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        transactions: {
          where: { status: 'ACTIVE' },
          orderBy: [{ txnDate: 'desc' }, { createdAt: 'desc' }],
          take: 20,
          include: { category: true, merchant: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }
    if (account.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this account');
    }

    const userCurrency = await getUserCurrency(userId);
    return {
      ...formatAccount(account, userCurrency),
      recentTransactions: (account.transactions || []).map(formatTransaction),
    };
  }

  // Update account metadata and emit dashboard refresh
  async updateAccount(userId: string, id: string, data: UpdateAccountData) {
    const existing = await prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Account not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this account');
    }

    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const accountType = data.accountType || data.type || existing.accountType;
    const institution =
      data.institution !== undefined
        ? (data.institution?.trim() || null)
        : data.institutionName !== undefined
        ? (data.institutionName?.trim() || null)
        : existing.institution;
    const accountIdentifier =
      data.accountIdentifier !== undefined
        ? (data.accountIdentifier?.trim() || null)
        : data.accountNumberMask !== undefined
        ? (data.accountNumberMask?.trim() || null)
        : existing.accountIdentifier;

    const updated = await prisma.account.update({
      where: { id },
      data: {
        name,
        accountType,
        institution,
        accountIdentifier,
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'ACCOUNT_UPDATE',
      details: {
        accountId: id,
        name,
        accountType,
        institution,
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'ACCOUNT', action: 'UPDATE', entityId: id, affectedAccountIds: [id] });

    const userCurrency = await getUserCurrency(userId);
    return formatAccount(updated, userCurrency);
  }

  // Toggle or update account active status and emit dashboard refresh
  async toggleAccountStatus(userId: string, id: string, status?: AccountStatus) {
    const existing = await prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Account not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this account');
    }

    const targetStatus: AccountStatus =
      status || (existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

    const updated = await prisma.account.update({
      where: { id },
      data: { status: targetStatus },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'ACCOUNT_STATUS_CHANGE',
      details: {
        accountId: id,
        oldStatus: existing.status,
        newStatus: targetStatus,
      },
    });

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'ACCOUNT', action: 'STATUS_CHANGE', entityId: id, affectedAccountIds: [id] });

    const userCurrency = await getUserCurrency(userId);
    return formatAccount(updated, userCurrency);
  }

  // Delete account or mark INACTIVE if transactions exist
  async deleteAccount(userId: string, id: string): Promise<{ message: string }> {
    const existing = await prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Account not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Access forbidden to this account');
    }

    const txnCount = await prisma.transaction.count({
      where: { accountId: id },
    });

    let message: string;
    if (txnCount > 0) {
      await prisma.account.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      message = 'Account contains transaction history and was marked inactive';
      await logAuditEvent({
        actorUserId: userId,
        action: 'ACCOUNT_DEACTIVATE',
        details: { accountId: id, name: existing.name, reason: 'transactions_exist' },
      });
    } else {
      await prisma.account.delete({
        where: { id },
      });
      message = 'Account successfully deleted';
      await logAuditEvent({
        actorUserId: userId,
        action: 'ACCOUNT_DELETE',
        details: { accountId: id, name: existing.name },
      });
    }

    await invalidateDashboardCache(userId);
    emitSyncEvent(userId, { entity: 'ACCOUNT', action: 'DELETE', entityId: id, affectedAccountIds: [id] });

    return { message };
  }
}

export const accountService = new AccountService();
export default accountService;
