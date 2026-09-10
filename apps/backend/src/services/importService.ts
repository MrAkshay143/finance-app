import { TxnType, TxnDirection } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { balanceService } from './balanceService.js';
import { logAuditEvent } from './auditService.js';
import { invalidateDashboardCache } from './dashboardService.js';
import { emitDashboardRefresh } from '../sockets/socketGateway.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface ImportCsvResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmountToPaise(raw: string): { amountPaise: bigint; isNegative: boolean } {
  // Strip currency symbols and commas
  const cleaned = raw.replace(/[₹$,\s]/g, '').trim();
  const isNegative = cleaned.startsWith('-') || (cleaned.startsWith('(') && cleaned.endsWith(')'));
  const absString = cleaned.replace(/[-()]/g, '').trim();

  const floatVal = parseFloat(absString);
  if (isNaN(floatVal) || floatVal <= 0) {
    throw new ValidationError('Invalid transaction amount format');
  }

  const paise = BigInt(Math.round(floatVal * 100));
  return { amountPaise: paise, isNegative };
}

export class ImportService {
  // Import transactions from CSV, enforce balance invariant, and log audit event
  async importCsv(
    userId: string,
    accountId: string,
    csvData: string,
    ipAddress?: string
  ): Promise<ImportCsvResult> {
    if (!csvData || !csvData.trim()) {
      throw new ValidationError('CSV data is empty');
    }

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Load user categories & system categories for mapping
    const existingCategories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null }, { isSystem: true }],
      },
    });

    const categoryMap = new Map<string, string>();
    for (const cat of existingCategories) {
      categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
    }

    const lines = csvData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new ValidationError('CSV must contain a header row and at least one data row');
    }

    // Header matching
    const headerRow = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const dateIdx = headerRow.findIndex((h) => h.includes('date') || h.includes('time'));
    const descIdx = headerRow.findIndex(
      (h) => h.includes('desc') || h.includes('narration') || h.includes('memo') || h.includes('payee')
    );
    const catIdx = headerRow.findIndex((h) => h.includes('cat'));
    const amtIdx = headerRow.findIndex((h) => h.includes('amount') || h.includes('amt'));
    const typeIdx = headerRow.findIndex((h) => h.includes('type') || h.includes('direction'));

    if (amtIdx === -1) {
      throw new ValidationError('CSV must contain an "amount" column');
    }

    const validRowsToCreate: Array<{
      userId: string;
      accountId: string;
      categoryId: string | null;
      type: TxnType;
      direction: TxnDirection;
      amount: bigint;
      description: string;
      txnDate: Date;
    }> = [];

    const errors: string[] = [];
    let skippedCount = 0;

    for (let lineNum = 1; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const cols = parseCsvLine(line);

      try {
        const rawAmt = cols[amtIdx];
        if (!rawAmt) {
          skippedCount++;
          continue;
        }

        const { amountPaise, isNegative } = parseAmountToPaise(rawAmt);

        // Date parsing
        let txnDate = new Date();
        if (dateIdx !== -1 && cols[dateIdx]) {
          const parsed = new Date(cols[dateIdx]);
          if (!isNaN(parsed.getTime())) {
            txnDate = parsed;
          }
        }

        // Description
        let description = 'Imported Transaction';
        if (descIdx !== -1 && cols[descIdx]) {
          description = cols[descIdx].trim();
        }

        // Category mapping
        let categoryId: string | null = null;
        if (catIdx !== -1 && cols[catIdx]) {
          const catName = cols[catIdx].trim().toLowerCase();
          categoryId = categoryMap.get(catName) || null;
        }

        // Determine type and direction
        let type: TxnType = TxnType.EXPENSE;
        let direction: TxnDirection = isNegative ? TxnDirection.DEBIT : TxnDirection.CREDIT;

        if (typeIdx !== -1 && cols[typeIdx]) {
          const rawType = cols[typeIdx].trim().toUpperCase();
          if (rawType.includes('INCOME') || rawType === 'CREDIT' || rawType === 'CR') {
            type = TxnType.INCOME;
            direction = TxnDirection.CREDIT;
          } else if (rawType.includes('INVEST')) {
            type = TxnType.INVESTMENT;
            direction = TxnDirection.DEBIT;
          } else if (rawType.includes('EXPENSE') || rawType === 'DEBIT' || rawType === 'DR') {
            type = TxnType.EXPENSE;
            direction = TxnDirection.DEBIT;
          }
        } else {
          // Default based on sign
          if (isNegative) {
            type = TxnType.EXPENSE;
            direction = TxnDirection.DEBIT;
          } else {
            type = TxnType.INCOME;
            direction = TxnDirection.CREDIT;
          }
        }

        validRowsToCreate.push({
          userId,
          accountId,
          categoryId,
          type,
          direction,
          amount: amountPaise,
          description,
          txnDate,
        });
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${lineNum + 1}: ${err.message || 'Failed to parse row'}`);
      }
    }

    if (validRowsToCreate.length === 0) {
      return {
        importedCount: 0,
        skippedCount,
        errors,
      };
    }

    // Execute in a single Prisma transaction with balance recalculation
    await prisma.$transaction(async (tx) => {
      for (const row of validRowsToCreate) {
        await tx.transaction.create({
          data: {
            userId: row.userId,
            accountId: row.accountId,
            categoryId: row.categoryId,
            type: row.type,
            direction: row.direction,
            amount: row.amount,
            description: row.description,
            txnDate: row.txnDate,
            status: 'ACTIVE',
          },
        });
      }

      // Recalculate account balance using the invariant
      await balanceService.recalculateAccountBalance(tx, accountId);
    });

    // Invalidate dashboard caches & emit refresh
    try {
      await invalidateDashboardCache(userId);
      emitDashboardRefresh(userId, { importedCount: validRowsToCreate.length });
    } catch {
      // Ignored if socket/cache is unavailable in test
    }

    // Write unalterable AuditLog
    await logAuditEvent({
      actorUserId: userId,
      action: 'DATA_IMPORT_CSV',
      targetUserId: userId,
      details: {
        accountId,
        importedCount: validRowsToCreate.length,
        skippedCount,
      },
      ipAddress,
    });

    return {
      importedCount: validRowsToCreate.length,
      skippedCount,
      errors,
    };
  }
}

export const importService = new ImportService();
export default importService;
