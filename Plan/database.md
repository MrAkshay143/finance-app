# Database Specifications

Relational architecture managed via Prisma ORM. Supports PostgreSQL 16+ (local development / container) and MySQL 8.0+ (Hostinger cloud production). All monetary amounts are stored as minor units (paise / cents) in integer fields to eliminate floating-point rounding errors.

## 1. Schema Definition

The Prisma schema supports both PostgreSQL and MySQL through dedicated schema files:
- apps/backend/prisma/schema.prisma (PostgreSQL)
- apps/backend/prisma/schema.mysql.prisma (MySQL)

### Core Enums
- UserRole: USER, ADMIN
- UserStatus: ACTIVE, SUSPENDED, DELETED
- TxnType: INCOME, EXPENSE, INVESTMENT
- TxnDirection: CREDIT, DEBIT
- AccountType: SAVINGS, CHECKING, CREDIT_CARD, CASH, INVESTMENT, LOAN
- RecordStatus: ACTIVE, DELETED
- RecurringStatus: ACTIVE, PAUSED, DELETED
- RecurrenceFrequency: DAILY, WEEKLY, MONTHLY, YEARLY

### Key Models & Relationships

1. User
   - id: String (UUID, primary key)
   - email: String (unique)
   - passwordHash: String
   - role: UserRole (default USER)
   - status: UserStatus (default ACTIVE)
   - failedLoginAttempts: Int (default 0)
   - lockedUntil: DateTime (optional)
   - onboardingCompleted: Boolean
   - Relations: FinanceProfile, UserSettings, SecurityQuestions, Accounts, Categories, Transactions, RefreshTokens, AuditLogs.

2. Account
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - name: String
   - type: AccountType
   - currency: String (default INR)
   - currentBalance: BigInt (stored in minor units, e.g. 100000 = 1000.00)
   - status: RecordStatus
   - Relations: Transactions, Transfers (as source and destination).

3. Transaction
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - accountId: String (foreign key to Account)
   - categoryId: String (foreign key to Category)
   - merchantId: String (optional foreign key to Merchant)
   - amount: BigInt (minor units)
   - type: TxnType (INCOME, EXPENSE, INVESTMENT)
   - direction: TxnDirection (CREDIT, DEBIT)
   - date: DateTime
   - status: RecordStatus (ACTIVE, DELETED)
   - notes: String (optional)

4. Transfer
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - sourceAccountId: String (foreign key to Account)
   - destinationAccountId: String (foreign key to Account)
   - amount: BigInt (minor units)
   - date: DateTime
   - status: RecordStatus

5. Category
   - id: String (UUID, primary key)
   - userId: String (optional, null for default system categories)
   - name: String
   - type: TxnType
   - isSystem: Boolean (default false; true for platform default categories)
   - sortOrder: Int (default 0)
   - status: RecordStatus

6. Budget & Goal
   - Budget: userId, categoryId, monthlyLimit (BigInt), month, year.
   - Goal: userId, name, targetAmount (BigInt), currentAmount (BigInt), targetDate, status.

7. RefreshToken
   - id: String (UUID, primary key)
   - userId: String (foreign key to User)
   - tokenHash: String (unique)
   - familyId: String
   - userAgent: String (optional)
   - ipAddress: String (optional)
   - expiresAt: DateTime
   - isRevoked: Boolean (default false)

8. AuditLog
   - id: String (UUID, primary key)
   - actorId: String (optional foreign key to User)
   - targetUserId: String (optional foreign key to User)
   - action: String (e.g. AUTH_LOGIN, ADMIN_USER_UPDATE, ADMIN_CATEGORY_CREATE)
   - category: String (AUTH, SECURITY, TRANSACTION, ADMIN, SYSTEM)
   - ipAddress: String (optional)
   - userAgent: String (optional)
   - details: Json (metadata)
   - createdAt: DateTime

9. AppSetting
   - key: String (primary key, e.g. session_timeout, max_failed_attempts, base_currency, maintenance_mode)
   - value: String
   - updatedAt: DateTime

## 2. Balance Invariants & Transactions

All balance mutations follow atomic dual-entry principles:
- Account creation: currentBalance initialized to initial balance amount.
- Transaction creation:
  - CREDIT increases Account.currentBalance.
  - DEBIT decreases Account.currentBalance.
- Transfer creation:
  - Decreases source account by transfer amount.
  - Increases destination account by transfer amount.
  - Both adjustments occur in a single database transaction.
- Soft delete: Reverses the original balance adjustment atomically.
