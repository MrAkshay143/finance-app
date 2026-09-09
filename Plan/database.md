# Database Specifications

Relational architecture managed via Prisma ORM. Supports PostgreSQL 16+ (local development / container) and MySQL 8.0+ (Hostinger cloud production). All monetary amounts are stored as minor units (paise / cents) in integer fields (BigInt) to eliminate floating-point rounding errors.

## 1. Schema Definitions

The application maintains dual Prisma schema definitions:
- apps/backend/prisma/schema.prisma (PostgreSQL 16+ engine)
- apps/backend/prisma/schema.mysql.prisma (MySQL 8.0+ engine for Hostinger cloud)

### Enums (7 Total)

1. UserRole: USER, ADMIN
2. UserStatus: ACTIVE, SUSPENDED, DELETED
3. TxnType: INCOME, EXPENSE, TRANSFER, INVESTMENT
4. TxnDirection: CREDIT, DEBIT
5. RecordStatus: ACTIVE, INACTIVE, ARCHIVED
6. AccountStatus: ACTIVE, INACTIVE, CLOSED
7. RecurringStatus: ACTIVE, PAUSED, COMPLETED, CANCELLED

### Models (17 Total)

1. User (Table: users)
   - id: String (UUID, primary key)
   - email: String (unique)
   - passwordHash: String
   - role: UserRole (default USER)
   - status: UserStatus (default ACTIVE)
   - name: String?
   - phone: String?
   - country: String?
   - isKbaConfigured: Boolean (default false)
   - failedLoginAttempts: Int (default 0)
   - lockedUntil: DateTime?
   - onboardingCompleted: Boolean (default false)
   - avatarUrl: String? (stored as text/longtext)
   - createdAt: DateTime (default now)
   - updatedAt: DateTime (updatedAt)
   - lastLoginAt: DateTime?
   - Relations: financeProfile, userSettings, securityQuestions, accounts, categories, merchants, transactions, transfers, budgets, goals, recurringTxns, notifications, reminders, refreshTokens, auditLogsAsActor, auditLogsAsTarget.

2. RefreshToken (Table: refresh_tokens)
   - id: String (UUID, primary key)
   - userId: String (foreign key to User, cascade delete)
   - tokenHash: String (unique)
   - familyId: String
   - userAgent: String?
   - ipAddress: String?
   - revokedAt: DateTime?
   - createdAt: DateTime (default now)
   - expiresAt: DateTime

3. SecurityQuestion (Table: security_questions)
   - id: String (UUID, primary key)
   - userId: String (foreign key to User, cascade delete)
   - questionKey: String
   - answerHash: String (bcrypt hashed)
   - createdAt: DateTime (default now)

4. FinanceProfile (Table: finance_profiles)
   - id: String (UUID, primary key)
   - userId: String (unique foreign key to User, cascade delete)
   - dateOfBirth: DateTime?
   - address: String?
   - monthlyIncome: BigInt (default 0, minor units)
   - monthlyExpenseBudget: BigInt (default 0, minor units)
   - monthlyInvestmentTarget: BigInt (default 0, minor units)
   - incomeRange: String?
   - savingsTarget: BigInt?
   - investmentExperience: String?
   - riskAppetite: String?
   - investmentHorizon: String?
   - createdAt: DateTime (default now)
   - updatedAt: DateTime (updatedAt)

5. Account (Table: accounts)
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - name: String
   - institution: String?
   - accountType: String (SAVINGS, CHECKING, CREDIT_CARD, CASH, INVESTMENT, LOAN)
   - accountIdentifier: String?
   - openingBalance: BigInt (default 0, minor units)
   - currentBalance: BigInt (default 0, minor units)
   - status: AccountStatus (default ACTIVE)
   - createdAt: DateTime (default now)
   - updatedAt: DateTime (updatedAt)
   - Relations: transactions, recurringTxns.

6. Category (Table: categories)
   - id: String (UUID, primary key)
   - userId: String? (null indicates global default system category)
   - name: String
   - type: TxnType (INCOME, EXPENSE, TRANSFER, INVESTMENT)
   - isSystem: Boolean (default false)
   - sortOrder: Int (default 0)
   - createdAt: DateTime (default now)
   - Relations: transactions, budgets, recurringTxns.

7. Merchant (Table: merchants)
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - name: String
   - createdAt: DateTime (default now)
   - Relations: transactions.

8. Transaction (Table: transactions)
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - accountId: String (foreign key to Account)
   - categoryId: String? (foreign key to Category)
   - merchantId: String? (foreign key to Merchant)
   - type: TxnType
   - direction: TxnDirection (CREDIT, DEBIT)
   - amount: BigInt (minor units)
   - description: String?
   - txnDate: DateTime
   - status: RecordStatus (default ACTIVE)
   - createdAt: DateTime (default now)
   - updatedAt: DateTime (updatedAt)
   - Relations: transferAsDebit (Transfer?), transferAsCredit (Transfer?).

9. Transfer (Table: transfers)
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - sourceAccountId: String
   - destinationAccountId: String
   - amount: BigInt (minor units)
   - txnDate: DateTime
   - description: String?
   - debitTransactionId: String (unique, foreign key to Transaction)
   - creditTransactionId: String (unique, foreign key to Transaction)
   - createdAt: DateTime (default now)

10. Budget (Table: budgets)
    - id: String (UUID, primary key)
    - userId: String (foreign key to User)
    - categoryId: String (foreign key to Category)
    - name: String
    - targetAmount: BigInt (minor units)
    - period: String (default MONTHLY)
    - periodStart: DateTime
    - status: RecordStatus (default ACTIVE)
    - createdAt: DateTime (default now)
    - updatedAt: DateTime (updatedAt)

11. Goal (Table: goals)
    - id: String (UUID, primary key)
    - userId: String (foreign key to User)
    - name: String
    - targetAmount: BigInt (minor units)
    - currentAmount: BigInt (default 0, minor units)
    - targetDate: DateTime?
    - status: RecordStatus (default ACTIVE)
    - createdAt: DateTime (default now)
    - updatedAt: DateTime (updatedAt)

12. RecurringTransaction (Table: recurring_transactions)
    - id: String (UUID, primary key)
    - userId: String (foreign key to User)
    - type: TxnType
    - accountId: String (foreign key to Account)
    - categoryId: String? (foreign key to Category)
    - amount: BigInt (minor units)
    - description: String?
    - scheduleFreq: String (DAILY, WEEKLY, MONTHLY, YEARLY)
    - scheduleInterval: Int (default 1)
    - nextOccurrence: DateTime
    - status: RecurringStatus (default ACTIVE)
    - createdAt: DateTime (default now)
    - updatedAt: DateTime (updatedAt)

13. Notification (Table: notifications)
    - id: String (UUID, primary key)
    - userId: String (foreign key to User)
    - title: String
    - message: String
    - type: String
    - read: Boolean (default false)
    - createdAt: DateTime (default now)

14. Reminder (Table: reminders)
    - id: String (UUID, primary key)
    - userId: String (foreign key to User)
    - type: String (RECURRING_EXPENSE, RECURRING_INVESTMENT, MONTH_END)
    - timingConfig: Json
    - enabled: Boolean (default true)
    - createdAt: DateTime (default now)
    - updatedAt: DateTime (updatedAt)

15. AuditLog (Table: audit_logs)
    - id: String (UUID, primary key)
    - actorUserId: String? (foreign key to User)
    - action: String (e.g. AUTH_LOGIN, ADMIN_CATEGORY_CREATE, PROFILE_FINANCE_UPDATE)
    - targetUserId: String? (foreign key to User)
    - details: Json?
    - ipAddress: String?
    - createdAt: DateTime (default now)

16. AppSetting (Table: app_settings)
    - key: String (primary key, e.g. session_timeout, max_failed_attempts, base_currency, maintenance_mode)
    - value: Json
    - updatedAt: DateTime (updatedAt)
    - updatedBy: String?

17. UserSettings (Table: user_settings)
    - id: String (UUID, primary key)
    - userId: String (unique foreign key to User, cascade delete)
    - currency: String (default INR)
    - timezone: String (default Asia/Kolkata)
    - financialMonthStartDay: Int (default 1)
    - quickAddEnabled: Boolean (default true)
    - dashboardDonutsConfig: Json
    - createdAt: DateTime (default now)
    - updatedAt: DateTime (updatedAt)

## 2. Balance Invariants & Execution Rules

1. Single Mutation Path:
   - All balance adjustments are performed exclusively through balanceService.
   - Every balance alteration executes inside a database transaction ($transaction).
2. Balance Invariant Formula:
   - currentBalance = openingBalance + SUM(all active CREDIT transactions) - SUM(all active DEBIT transactions).
3. Transfer Atomicity:
   - Transfers create exactly two linked transaction records (one DEBIT on source account, one CREDIT on destination account) and one Transfer record atomically.
4. Soft Deletes:
   - Deleting a transaction triggers an atomic balance adjustment reversing its original financial effect.
