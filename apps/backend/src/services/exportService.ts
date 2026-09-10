import { prisma } from '../lib/prisma.js';
import { logAuditEvent } from './auditService.js';
import { NotFoundError } from '../utils/errors.js';

export interface ExportDataResult {
  data: string;
  format: 'json' | 'csv';
  filename: string;
  contentType: string;
}

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class ExportService {
  /**
   * Generates a complete data export of the user's financial record.
   * Produces either JSON or CSV format, and writes an unalterable audit log entry.
   */
  async exportUserData(
    userId: string,
    format: 'json' | 'csv' = 'json',
    ipAddress?: string
  ): Promise<ExportDataResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        financeProfile: true,
        userSettings: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [transactions, accounts, budgets, goals, recurringTxns, categories, userSettings] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
        orderBy: { txnDate: 'desc' },
      }),
      prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.budget.findMany({
        where: { userId },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.goal.findMany({
        where: { userId },
      }),
      prisma.recurringTransaction.findMany({
        where: { userId },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.category.findMany({
        where: { OR: [{ userId }, { isSystem: true }] },
      }),
      prisma.userSettings.findUnique({
        where: { userId },
      }),
    ]);

    const userCurrency = userSettings?.currency || 'INR';
    const dateStr = new Date().toISOString().split('T')[0];

    // Log the data export operation in unalterable AuditLog
    await logAuditEvent({
      actorUserId: userId,
      action: 'DATA_EXPORT',
      targetUserId: userId,
      details: {
        format,
        transactionCount: transactions.length,
        accountCount: accounts.length,
      },
      ipAddress,
    });

    if (format === 'csv') {
      const headers = [
        'Date',
        'Account',
        'Type',
        'Direction',
        'Category',
        `Amount (${userCurrency})`,
        'Amount (Paise)',
        'Description',
        'Status',
      ];

      const csvRows = [headers.join(',')];

      for (const t of transactions) {
        const paise = Number(t.amount);
        const inr = (paise / 100).toFixed(2);
        const date = new Date(t.txnDate).toISOString().split('T')[0];

        const row = [
          escapeCsvField(date),
          escapeCsvField(t.account?.name || ''),
          escapeCsvField(t.type),
          escapeCsvField(t.direction),
          escapeCsvField(t.category?.name || 'Uncategorized'),
          escapeCsvField(inr),
          escapeCsvField(paise),
          escapeCsvField(t.description || ''),
          escapeCsvField(t.status),
        ];

        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\r\n');
      return {
        data: csvContent,
        format: 'csv',
        filename: `finance-export-${dateStr}.csv`,
        contentType: 'text/csv',
      };
    }

    // JSON format
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        createdAt: user.createdAt,
      },
      financeProfile: user.financeProfile,
      userSettings: user.userSettings,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        isSystem: c.isSystem,
      })),
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        institution: a.institution,
        accountType: a.accountType,
        openingBalancePaise: Number(a.openingBalance),
        currentBalancePaise: Number(a.currentBalance),
        status: a.status,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        accountId: t.accountId,
        accountName: t.account?.name || null,
        categoryId: t.categoryId,
        categoryName: t.category?.name || null,
        type: t.type,
        direction: t.direction,
        amountPaise: Number(t.amount),
        description: t.description,
        txnDate: new Date(t.txnDate).toISOString(),
        status: t.status,
      })),
      budgets: budgets.map((b) => ({
        id: b.id,
        name: b.name,
        categoryId: b.categoryId,
        categoryName: b.category?.name || null,
        targetAmountPaise: Number(b.targetAmount),
        period: b.period,
        status: b.status,
      })),
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmountPaise: Number(g.targetAmount),
        currentAmountPaise: Number(g.currentAmount),
        targetDate: g.targetDate ? new Date(g.targetDate).toISOString() : null,
        status: g.status,
      })),
      recurringTransactions: recurringTxns.map((r) => ({
        id: r.id,
        type: r.type,
        accountId: r.accountId,
        accountName: r.account?.name || null,
        amountPaise: Number(r.amount),
        description: r.description,
        scheduleFreq: r.scheduleFreq,
        nextOccurrence: new Date(r.nextOccurrence).toISOString(),
        status: r.status,
      })),
    };

    return {
      data: JSON.stringify(exportPayload, null, 2),
      format: 'json',
      filename: `finance-export-${dateStr}.json`,
      contentType: 'application/json',
    };
  }
}

export const exportService = new ExportService();
export default exportService;
