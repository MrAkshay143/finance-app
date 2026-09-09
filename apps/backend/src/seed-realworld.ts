import { PrismaClient, TxnType, TxnDirection, AccountStatus, RecordStatus, RecurringStatus, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createClient } from 'redis';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting real-world institutional data seeding for akshay@gmail.com...');

  // 1. Locate User
  let user = await prisma.user.findUnique({
    where: { email: 'akshay@gmail.com' },
  });

  if (!user) {
    console.error('User akshay@gmail.com does not exist!');
    return;
  }

  const userId = user.id;
  console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email}) [${userId}]`);

  // 2. Update User basic info & mark onboarding completed
  user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: 'Akshay',
      lastName: 'Mondal',
      mobileNumber: '+919876543210',
      onboardingCompleted: true,
      status: UserStatus.ACTIVE,
      role: UserRole.USER,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log('Updated user record (onboarding completed: true).');

  // 3. Upsert FinanceProfile
  await prisma.financeProfile.upsert({
    where: { userId },
    update: {
      dateOfBirth: new Date('1995-08-30T00:00:00.000Z'),
      address: 'Flat 402, Tower B, Prestige Tech Vista, Kadubeesanahalli, Outer Ring Road, Bengaluru, Karnataka 560103',
      monthlyIncome: BigInt(18000000), // ₹1,80,000.00
      monthlyExpenseBudget: BigInt(7500000), // ₹75,000.00
      monthlyInvestmentTarget: BigInt(5000000), // ₹50,000.00
      savingsTarget: BigInt(43200000), // ₹4,32,000.00 (20% of ₹21,60,000 annual income in paise)
      incomeRange: '₹10,00,000 - ₹25,00,000',
      investmentExperience: 'Intermediate',
      riskAppetite: 'MEDIUM',
      investmentHorizon: 'LONG',
    },
    create: {
      userId,
      dateOfBirth: new Date('1995-08-30T00:00:00.000Z'),
      address: 'Flat 402, Tower B, Prestige Tech Vista, Kadubeesanahalli, Outer Ring Road, Bengaluru, Karnataka 560103',
      monthlyIncome: BigInt(18000000),
      monthlyExpenseBudget: BigInt(7500000),
      monthlyInvestmentTarget: BigInt(5000000),
      savingsTarget: BigInt(43200000), // ₹4,32,000.00
      incomeRange: '₹10,00,000 - ₹25,00,000',
      investmentExperience: 'Intermediate',
      riskAppetite: 'MEDIUM',
      investmentHorizon: 'LONG',
    },
  });
  console.log('Upserted FinanceProfile with institutional Bengaluru tech professional parameters.');

  // 4. Upsert UserSettings
  await prisma.userSettings.upsert({
    where: { userId },
    update: {
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      financialMonthStartDay: 1,
      quickAddEnabled: true,
      dashboardDonutsConfig: { income: true, expense: true, investment: true },
      featuresConfig: { investments: true, recurring: true },
    },
    create: {
      userId,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      financialMonthStartDay: 1,
      quickAddEnabled: true,
      dashboardDonutsConfig: { income: true, expense: true, investment: true },
      featuresConfig: { investments: true, recurring: true },
    },
  });
  console.log('Upserted UserSettings (INR, Asia/Kolkata, Day 1).');

  // 5. Setup 3 Security Questions (KBA)
  console.log('Setting up KBA Security Questions...');
  const kbaQuestions = [
    { key: 'first_pet', answer: 'bruno' },
    { key: 'elementary_school', answer: "st. xavier's high school" },
    { key: 'birth_city', answer: 'bengaluru' },
  ];
  for (const q of kbaQuestions) {
    const answerHash = await bcrypt.hash(q.answer, 10);
    await prisma.securityQuestion.upsert({
      where: {
        userId_questionKey: {
          userId,
          questionKey: q.key,
        },
      },
      update: { answerHash },
      create: {
        userId,
        questionKey: q.key,
        answerHash,
      },
    });
  }
  console.log('Upserted 3 KBA Security Questions (100% security completion).');

  // 6. Clean existing user data (transactions, transfers, budgets, goals, recurring, old accounts, merchants)
  console.log('Cleaning existing sparse/toy data for user...');
  await prisma.transfer.deleteMany({ where: { userId } });
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.recurringTransaction.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.merchant.deleteMany({ where: { userId } });

  // 7. System categories lookup
  const systemCategories = await prisma.category.findMany({
    where: { isSystem: true, userId: null },
  });
  const catMap = new Map<string, string>();
  for (const cat of systemCategories) {
    catMap.set(cat.name, cat.id);
  }

  // Helper to ensure category exists
  const getCatId = (name: string): string => {
    const id = catMap.get(name);
    if (!id) throw new Error(`Category "${name}" not found in system categories!`);
    return id;
  };

  // 8. Create Realistic Accounts
  console.log('Creating institutional accounts...');
  const hdfcSalaryAccount = await prisma.account.create({
    data: {
      userId,
      name: 'HDFC Bank - Salary Account',
      institution: 'HDFC Bank',
      accountType: 'BANK',
      accountIdentifier: '•••• 4192',
      openingBalance: BigInt(8500000), // ₹85,000.00
      currentBalance: BigInt(16435000), // ₹1,64,350.00
      status: AccountStatus.ACTIVE,
    },
  });

  const iciciWealthAccount = await prisma.account.create({
    data: {
      userId,
      name: 'ICICI Wealth Advantage Savings',
      institution: 'ICICI Bank',
      accountType: 'BANK',
      accountIdentifier: '•••• 8831',
      openingBalance: BigInt(7500000), // ₹75,000.00
      currentBalance: BigInt(11540000), // ₹1,15,400.00
      status: AccountStatus.ACTIVE,
    },
  });

  const zerodhaAccount = await prisma.account.create({
    data: {
      userId,
      name: 'Zerodha Demat & Trading',
      institution: 'Zerodha Broking',
      accountType: 'INVESTMENT',
      accountIdentifier: '•••• ZH9214',
      openingBalance: BigInt(32000000), // ₹3,20,000.00
      currentBalance: BigInt(42500000), // ₹4,25,000.00
      status: AccountStatus.ACTIVE,
    },
  });

  const sbiCreditCard = await prisma.account.create({
    data: {
      userId,
      name: 'SBI Card PRIME (Credit Card)',
      institution: 'State Bank of India',
      accountType: 'CREDIT_CARD',
      accountIdentifier: '•••• 1044',
      openingBalance: BigInt(-1240000), // -₹12,400.00
      currentBalance: BigInt(-2375000), // -₹23,750.00
      status: AccountStatus.ACTIVE,
    },
  });

  console.log('Created 4 institutional accounts (HDFC, ICICI, Zerodha, SBI Card).');

  // 9. Create Real-World Merchants
  console.log('Creating real-world merchants...');
  const merchantNames = [
    'TechCorp India Technologies Pvt Ltd',
    'Greenwood High Residency',
    'Zerodha Coin - AMC',
    'Nippon India ETF Gold BeES',
    'Zepto Quick Commerce',
    'Swiggy Gourmet',
    'Starbucks Coffee India',
    'Shell Auto Care',
    'BESCOM Bangalore Electricity',
    'Airtel Broadband & Fiber',
    'Amazon India',
    'Cult.fit Fitness & Gym',
    'Apollo Pharmacy Bangalore',
    'Uber Premier India',
    'Netflix India',
    'Freelance Consulting Client',
    'BigBasket Supermarket',
    'Mirae Asset Mutual Fund',
  ];

  const merchMap = new Map<string, string>();
  for (const name of merchantNames) {
    const merch = await prisma.merchant.create({
      data: { userId, name },
    });
    merchMap.set(name, merch.id);
  }
  const getMerchId = (name: string): string => merchMap.get(name)!;

  // 10. Seed Real-World Transactions
  console.log('Seeding real-world transactions for September and August 2026...');

  interface TxnData {
    accountId: string;
    categoryId: string;
    merchantId?: string;
    type: TxnType;
    direction: TxnDirection;
    amount: bigint;
    description: string;
    txnDate: Date;
  }

  const txns: TxnData[] = [
    // Current Month (September 2026) - Incomes
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Salary'),
      merchantId: getMerchId('TechCorp India Technologies Pvt Ltd'),
      type: TxnType.INCOME,
      direction: TxnDirection.CREDIT,
      amount: BigInt(18000000), // ₹1,80,000.00
      description: 'Monthly Salary Credit - September 2026',
      txnDate: new Date('2026-09-01T09:30:00.000Z'),
    },
    {
      accountId: iciciWealthAccount.id,
      categoryId: getCatId('Freelance'),
      merchantId: getMerchId('Freelance Consulting Client'),
      type: TxnType.INCOME,
      direction: TxnDirection.CREDIT,
      amount: BigInt(2500000), // ₹25,000.00
      description: 'Q3 Architectural Advisory Honorarium',
      txnDate: new Date('2026-09-07T14:15:00.000Z'),
    },

    // Current Month (September 2026) - Investments
    {
      accountId: zerodhaAccount.id,
      categoryId: getCatId('Mutual Funds'),
      merchantId: getMerchId('Zerodha Coin - AMC'),
      type: TxnType.INVESTMENT,
      direction: TxnDirection.DEBIT,
      amount: BigInt(2500000), // ₹25,000.00
      description: 'Monthly SIP - UTI Nifty 50 Index Direct Growth',
      txnDate: new Date('2026-09-02T10:00:00.000Z'),
    },
    {
      accountId: zerodhaAccount.id,
      categoryId: getCatId('Mutual Funds'),
      merchantId: getMerchId('Zerodha Coin - AMC'),
      type: TxnType.INVESTMENT,
      direction: TxnDirection.DEBIT,
      amount: BigInt(1500000), // ₹15,000.00
      description: 'Monthly SIP - Parag Parikh Flexi Cap Fund Direct Growth',
      txnDate: new Date('2026-09-02T10:05:00.000Z'),
    },
    {
      accountId: zerodhaAccount.id,
      categoryId: getCatId('Gold'),
      merchantId: getMerchId('Nippon India ETF Gold BeES'),
      type: TxnType.INVESTMENT,
      direction: TxnDirection.DEBIT,
      amount: BigInt(1000000), // ₹10,000.00
      description: 'Monthly Gold Accumulation - Nippon Gold BeES ETF',
      txnDate: new Date('2026-09-03T11:20:00.000Z'),
    },

    // Current Month (September 2026) - Expenses
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Rent'),
      merchantId: getMerchId('Greenwood High Residency'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(3200000), // ₹32,000.00
      description: 'Apartment Monthly Rent & Society Maintenance',
      txnDate: new Date('2026-09-01T11:00:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Groceries'),
      merchantId: getMerchId('Zepto Quick Commerce'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(342000), // ₹3,420.00
      description: 'Weekly Organic Groceries & Farm Essentials',
      txnDate: new Date('2026-09-03T18:45:00.000Z'),
    },
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Fuel'),
      merchantId: getMerchId('Shell Auto Care'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(420000), // ₹4,200.00
      description: 'V-Power Premium Fuel Full Tank Refill',
      txnDate: new Date('2026-09-04T08:15:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Food & Dining'),
      merchantId: getMerchId('Swiggy Gourmet'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(185000), // ₹1,850.00
      description: 'Weekend Artisan Dinner Order for Family',
      txnDate: new Date('2026-09-04T20:30:00.000Z'),
    },
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Utilities'),
      merchantId: getMerchId('BESCOM Bangalore Electricity'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(315000), // ₹3,150.00
      description: 'BESCOM Monthly Electricity Bill - Outer Ring Road',
      txnDate: new Date('2026-09-05T12:00:00.000Z'),
    },
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Utilities'),
      merchantId: getMerchId('Airtel Broadband & Fiber'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(139900), // ₹1,399.00
      description: 'Airtel Black 1Gbps Fiber Internet + OTT Pack',
      txnDate: new Date('2026-09-05T15:30:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Shopping'),
      merchantId: getMerchId('Amazon India'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(849000), // ₹8,490.00
      description: 'Ergonomic Mesh Chair & Office Desk Accessories',
      txnDate: new Date('2026-09-06T16:00:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Health & Medical'),
      merchantId: getMerchId('Cult.fit Fitness & Gym'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(175000), // ₹1,750.00
      description: 'Cult.fit Elite Monthly Fitness & Strength Pass',
      txnDate: new Date('2026-09-06T19:20:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Food & Dining'),
      merchantId: getMerchId('Starbucks Coffee India'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(72000), // ₹720.00
      description: 'Client Morning Catchup & Cold Brew Coffee',
      txnDate: new Date('2026-09-07T11:00:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Health & Medical'),
      merchantId: getMerchId('Apollo Pharmacy Bangalore'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(124000), // ₹1,240.00
      description: 'Monthly Wellness Supplements & Vitamin D3',
      txnDate: new Date('2026-09-08T09:45:00.000Z'),
    },
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Travel & Transit'),
      merchantId: getMerchId('Uber Premier India'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(58000), // ₹580.00
      description: 'Airport Commute / Bellandur Tech Park Ride',
      txnDate: new Date('2026-09-08T17:10:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Entertainment'),
      merchantId: getMerchId('Netflix India'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(64900), // ₹649.00
      description: 'Netflix 4K Ultra HD Premium Monthly Plan',
      txnDate: new Date('2026-09-08T21:00:00.000Z'),
    },

    // Previous Month (August 2026) - Historical comparison data
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Salary'),
      merchantId: getMerchId('TechCorp India Technologies Pvt Ltd'),
      type: TxnType.INCOME,
      direction: TxnDirection.CREDIT,
      amount: BigInt(18000000),
      description: 'Monthly Salary Credit - August 2026',
      txnDate: new Date('2026-08-01T09:30:00.000Z'),
    },
    {
      accountId: iciciWealthAccount.id,
      categoryId: getCatId('Investment Return'),
      merchantId: getMerchId('Mirae Asset Mutual Fund'),
      type: TxnType.INCOME,
      direction: TxnDirection.CREDIT,
      amount: BigInt(480000), // ₹4,800.00
      description: 'Quarterly Mutual Fund Dividend Payout',
      txnDate: new Date('2026-08-28T11:00:00.000Z'),
    },
    {
      accountId: zerodhaAccount.id,
      categoryId: getCatId('Mutual Funds'),
      merchantId: getMerchId('Zerodha Coin - AMC'),
      type: TxnType.INVESTMENT,
      direction: TxnDirection.DEBIT,
      amount: BigInt(4000000), // ₹40,000.00
      description: 'Monthly Mutual Fund SIP Allocation',
      txnDate: new Date('2026-08-02T10:00:00.000Z'),
    },
    {
      accountId: zerodhaAccount.id,
      categoryId: getCatId('Gold'),
      merchantId: getMerchId('Nippon India ETF Gold BeES'),
      type: TxnType.INVESTMENT,
      direction: TxnDirection.DEBIT,
      amount: BigInt(1000000), // ₹10,000.00
      description: 'Nippon Gold BeES ETF Allocation',
      txnDate: new Date('2026-08-03T11:00:00.000Z'),
    },
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Rent'),
      merchantId: getMerchId('Greenwood High Residency'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(3200000),
      description: 'Apartment Monthly Rent & Maintenance',
      txnDate: new Date('2026-08-01T11:00:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Groceries'),
      merchantId: getMerchId('BigBasket Supermarket'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(1420000), // ₹14,200.00
      description: 'Monthly Bulk Household & Kitchen Grocery Stock',
      txnDate: new Date('2026-08-08T15:00:00.000Z'),
    },
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Utilities'),
      merchantId: getMerchId('BESCOM Bangalore Electricity'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(460000), // ₹4,600.00
      description: 'BESCOM Electricity & Utility Clearing',
      txnDate: new Date('2026-08-05T14:00:00.000Z'),
    },
    {
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Fuel'),
      merchantId: getMerchId('Shell Auto Care'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(540000), // ₹5,400.00
      description: 'Shell Petrol & Highway Tolls',
      txnDate: new Date('2026-08-12T17:00:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Shopping'),
      merchantId: getMerchId('Amazon India'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(1150000), // ₹11,500.00
      description: 'Independence Day Tech Accessories & Apparel',
      txnDate: new Date('2026-08-15T18:30:00.000Z'),
    },
    {
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Food & Dining'),
      merchantId: getMerchId('Swiggy Gourmet'),
      type: TxnType.EXPENSE,
      direction: TxnDirection.DEBIT,
      amount: BigInt(780000), // ₹7,800.00
      description: 'Family Gatherings & Weekend Dinners',
      txnDate: new Date('2026-08-20T21:00:00.000Z'),
    },
  ];

  for (const t of txns) {
    await prisma.transaction.create({
      data: {
        userId,
        accountId: t.accountId,
        categoryId: t.categoryId,
        merchantId: t.merchantId,
        type: t.type,
        direction: t.direction,
        amount: t.amount,
        description: t.description,
        txnDate: t.txnDate,
        status: RecordStatus.ACTIVE,
      },
    });
  }
  console.log(`Created ${txns.length} realistic transactions across current and previous periods.`);

  // 11. Create Realistic Budgets (Planning)
  console.log('Creating realistic monthly budgets...');
  const budgetConfigs = [
    { catName: 'Groceries', amount: BigInt(1500000) }, // ₹15,000.00
    { catName: 'Food & Dining', amount: BigInt(1000000) }, // ₹10,000.00
    { catName: 'Rent', amount: BigInt(3500000) }, // ₹35,000.00
    { catName: 'Fuel', amount: BigInt(800000) }, // ₹8,000.00
    { catName: 'Utilities', amount: BigInt(800000) }, // ₹8,000.00
    { catName: 'Shopping', amount: BigInt(1500000) }, // ₹15,000.00
    { catName: 'Health & Medical', amount: BigInt(600000) }, // ₹6,000.00
    { catName: 'Entertainment', amount: BigInt(300000) }, // ₹3,000.00
    { catName: 'Travel & Transit', amount: BigInt(400000) }, // ₹4,000.00
  ];

  for (const b of budgetConfigs) {
    await prisma.budget.create({
      data: {
        userId,
        categoryId: getCatId(b.catName),
        name: `${b.catName} Budget`,
        targetAmount: b.amount,
        period: 'MONTHLY',
        periodStart: new Date('2026-09-01T00:00:00.000Z'),
        status: RecordStatus.ACTIVE,
      },
    });
  }
  console.log(`Created ${budgetConfigs.length} monthly budgets for planning.`);

  // 12. Create Realistic Milestone Goals
  console.log('Creating milestone savings and wealth goals...');
  const goalConfigs = [
    {
      name: 'Emergency Fund (6 Months Expenses)',
      targetAmount: BigInt(45000000), // ₹4,50,000.00
      currentAmount: BigInt(28000000), // ₹2,80,000.00 (62.2%)
      targetDate: new Date('2027-03-31T00:00:00.000Z'),
    },
    {
      name: 'Japan Cherry Blossom Vacation',
      targetAmount: BigInt(25000000), // ₹2,50,000.00
      currentAmount: BigInt(16500000), // ₹1,65,000.00 (66.0%)
      targetDate: new Date('2027-04-15T00:00:00.000Z'),
    },
    {
      name: 'Apartment Down Payment (Bangalore)',
      targetAmount: BigInt(250000000), // ₹25,00,000.00
      currentAmount: BigInt(85000000), // ₹8,50,000.00 (34.0%)
      targetDate: new Date('2028-12-31T00:00:00.000Z'),
    },
  ];

  for (const g of goalConfigs) {
    await prisma.goal.create({
      data: {
        userId,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        status: RecordStatus.ACTIVE,
      },
    });
  }
  console.log(`Created ${goalConfigs.length} milestone financial goals.`);

  // 13. Create Recurring Transaction Schedules
  console.log('Creating recurring transaction schedules...');
  const recurringConfigs = [
    {
      type: TxnType.INCOME,
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Salary'),
      amount: BigInt(18000000), // ₹1,80,000.00
      description: 'Monthly Salary Credit',
      scheduleFreq: 'MONTHLY',
      scheduleInterval: 1,
      nextOccurrence: new Date('2026-10-01T09:30:00.000Z'),
    },
    {
      type: TxnType.EXPENSE,
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Rent'),
      amount: BigInt(3200000), // ₹32,000.00
      description: 'House Rent & Society Maintenance',
      scheduleFreq: 'MONTHLY',
      scheduleInterval: 1,
      nextOccurrence: new Date('2026-10-01T11:00:00.000Z'),
    },
    {
      type: TxnType.INVESTMENT,
      accountId: zerodhaAccount.id,
      categoryId: getCatId('Mutual Funds'),
      amount: BigInt(2500000), // ₹25,000.00
      description: 'UTI Nifty 50 Index Fund SIP',
      scheduleFreq: 'MONTHLY',
      scheduleInterval: 1,
      nextOccurrence: new Date('2026-10-02T10:00:00.000Z'),
    },
    {
      type: TxnType.INVESTMENT,
      accountId: zerodhaAccount.id,
      categoryId: getCatId('Mutual Funds'),
      amount: BigInt(1500000), // ₹15,000.00
      description: 'Parag Parikh Flexi Cap Fund SIP',
      scheduleFreq: 'MONTHLY',
      scheduleInterval: 1,
      nextOccurrence: new Date('2026-10-02T10:05:00.000Z'),
    },
    {
      type: TxnType.EXPENSE,
      accountId: hdfcSalaryAccount.id,
      categoryId: getCatId('Utilities'),
      amount: BigInt(139900), // ₹1,399.00
      description: 'Airtel Black Fiber Gigabit Internet',
      scheduleFreq: 'MONTHLY',
      scheduleInterval: 1,
      nextOccurrence: new Date('2026-10-05T15:30:00.000Z'),
    },
    {
      type: TxnType.EXPENSE,
      accountId: sbiCreditCard.id,
      categoryId: getCatId('Entertainment'),
      amount: BigInt(64900), // ₹649.00
      description: 'Netflix Premium 4K UHD Subscription',
      scheduleFreq: 'MONTHLY',
      scheduleInterval: 1,
      nextOccurrence: new Date('2026-10-08T21:00:00.000Z'),
    },
  ];

  for (const r of recurringConfigs) {
    await prisma.recurringTransaction.create({
      data: {
        userId,
        type: r.type,
        accountId: r.accountId,
        categoryId: r.categoryId,
        amount: r.amount,
        description: r.description,
        scheduleFreq: r.scheduleFreq,
        scheduleInterval: r.scheduleInterval,
        nextOccurrence: r.nextOccurrence,
        status: RecurringStatus.ACTIVE,
      },
    });
  }
  console.log(`Created ${recurringConfigs.length} recurring schedules.`);

  // 14. Create Institutional Notifications
  console.log('Creating institutional alerts and notifications...');
  const notifications = [
    {
      title: 'Salary Credited',
      message: '₹1,80,000.00 credited to HDFC Bank A/c •••• 4192 from TechCorp India Technologies Pvt Ltd.',
      type: 'TRANSACTION',
      read: true,
      createdAt: new Date('2026-09-01T09:35:00.000Z'),
    },
    {
      title: 'SIP Execution Notice',
      message: 'Monthly SIP order of ₹25,000.00 executed successfully for UTI Nifty 50 Index Fund.',
      type: 'INVESTMENT',
      read: true,
      createdAt: new Date('2026-09-02T10:15:00.000Z'),
    },
    {
      title: 'SIP Execution Notice',
      message: 'Monthly SIP order of ₹15,000.00 executed successfully for Parag Parikh Flexi Cap Fund.',
      type: 'INVESTMENT',
      read: true,
      createdAt: new Date('2026-09-02T10:20:00.000Z'),
    },
    {
      title: 'Credit Card Statement Ready',
      message: 'SBI Card PRIME statement generated. Current due: ₹23,750.00. Due date: 24-09-2026.',
      type: 'BILL',
      read: false,
      createdAt: new Date('2026-09-06T10:00:00.000Z'),
    },
    {
      title: 'Budget Allocation Update',
      message: 'Rent & housing budget has reached 91.4% utilization for September 2026.',
      type: 'BUDGET',
      read: false,
      createdAt: new Date('2026-09-07T08:00:00.000Z'),
    },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
      },
    });
  }
  console.log(`Created ${notifications.length} institutional notifications.`);

  // 15. Invalidate Redis Caches if Redis is available
  try {
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redis.connect();
    const keys = await redis.keys(`*${userId}*`);
    const dashKeys = await redis.keys('dashboard:*');
    const allKeys = Array.from(new Set([...keys, ...dashKeys]));
    if (allKeys.length > 0) {
      await redis.del(allKeys);
      console.log(`Cleared ${allKeys.length} Redis cache keys for user.`);
    }
    await redis.disconnect();
  } catch (err: any) {
    console.log('Redis cache flush skipped (Redis offline or not reachable):', err?.message);
  }

  console.log('\n=========================================');
  console.log('REAL-WORLD SEEDING COMPLETED SUCCESSFULLY');
  console.log('=========================================');
  console.log(`User: Akshay Mondal (${user.email})`);
  console.log('Net Worth: ₹6,81,000.00 across 4 institutional accounts');
  console.log('September Income: ₹2,05,000.00');
  console.log('September Investments: ₹50,000.00 (SIPs & Gold)');
  console.log('September Expenses: ₹59,448.00 across all 9 categories');
  console.log('Active Budgets: 9 categories with live utilization');
  console.log('Milestone Goals: 3 wealth milestones');
  console.log('Recurring Schedules: 6 automated items');
  console.log('Security Status: 100% (3 KBA questions set)');
}

main()
  .catch((e) => {
    console.error('Real-world seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
