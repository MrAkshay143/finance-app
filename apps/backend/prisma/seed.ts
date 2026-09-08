import { PrismaClient, TxnType } from '@prisma/client';

export interface SystemCategorySeed {
  name: string;
  type: TxnType;
  sortOrder: number;
}

export const SYSTEM_CATEGORIES: SystemCategorySeed[] = [
  // Expense categories
  { name: 'Food & Dining', type: TxnType.EXPENSE, sortOrder: 1 },
  { name: 'Groceries', type: TxnType.EXPENSE, sortOrder: 2 },
  { name: 'Fuel', type: TxnType.EXPENSE, sortOrder: 3 },
  { name: 'Rent', type: TxnType.EXPENSE, sortOrder: 4 },
  { name: 'Utilities', type: TxnType.EXPENSE, sortOrder: 5 },
  { name: 'Shopping', type: TxnType.EXPENSE, sortOrder: 6 },
  { name: 'Health & Medical', type: TxnType.EXPENSE, sortOrder: 7 },
  { name: 'Entertainment', type: TxnType.EXPENSE, sortOrder: 8 },
  { name: 'Travel & Transit', type: TxnType.EXPENSE, sortOrder: 9 },

  // Income categories
  { name: 'Salary', type: TxnType.INCOME, sortOrder: 10 },
  { name: 'Freelance', type: TxnType.INCOME, sortOrder: 11 },
  { name: 'Investment Return', type: TxnType.INCOME, sortOrder: 12 },

  // Investment categories
  { name: 'Bonds', type: TxnType.INVESTMENT, sortOrder: 13 },
  { name: 'Fixed Deposit', type: TxnType.INVESTMENT, sortOrder: 14 },
  { name: 'Gold', type: TxnType.INVESTMENT, sortOrder: 15 },
  { name: 'Mutual Funds', type: TxnType.INVESTMENT, sortOrder: 16 },
  { name: 'Real Estate', type: TxnType.INVESTMENT, sortOrder: 17 },
];

export const DEFAULT_APP_SETTINGS = [
  { key: 'session_timeout_minutes', value: 15 },
  { key: 'max_failed_attempts', value: 5 },
];

export async function seed(prisma: PrismaClient = new PrismaClient()): Promise<void> {
  console.log('Seeding system categories...');
  for (const cat of SYSTEM_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        name: cat.name,
        isSystem: true,
        userId: null,
      },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          type: cat.type,
          sortOrder: cat.sortOrder,
        },
      });
    } else {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          isSystem: true,
          userId: null,
          sortOrder: cat.sortOrder,
        },
      });
    }
  }

  console.log('Seeding default app settings...');
  for (const setting of DEFAULT_APP_SETTINGS) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }

  console.log('Database seed completed successfully.');
}

if (process.argv[1]?.includes('seed')) {
  const prisma = new PrismaClient();
  seed(prisma)
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
