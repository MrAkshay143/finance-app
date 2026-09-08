# Database

PostgreSQL, managed through Prisma (schema below; a Drizzle schema is
structurally equivalent if the team prefers it — table/column decisions
here are ORM-agnostic). All IDs are UUID (`gen_random_uuid()`). All money
columns are `BIGINT` storing paise (minor units) — see §4. All timestamps
are `TIMESTAMPTZ`. Soft-deletable financial tables use a `status` enum
rather than physical deletes.

## 1. Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum TxnType {
  INCOME
  EXPENSE
  INVESTMENT
}

enum TxnDirection {
  CREDIT
  DEBIT
}

enum RecordStatus {
  ACTIVE
  DELETED
}

enum AccountStatus {
  ACTIVE
  INACTIVE
}

enum RecurringStatus {
  ACTIVE
  PAUSED
  DELETED
}

model User {
  id                  String   @id @default(uuid())
  firstName           String
  lastName             String
  email                String   @unique
  mobileNumber         String
  passwordHash         String
  role                 UserRole @default(USER)
  status               UserStatus @default(ACTIVE)
  failedLoginAttempts  Int      @default(0)
  lockedUntil          DateTime?
  onboardingCompleted  Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  lastLoginAt          DateTime?

  financeProfile       FinanceProfile?
  userSettings         UserSettings?
  securityQuestions    SecurityQuestion[]
  accounts             Account[]
  categories           Category[]
  merchants            Merchant[]
  transactions         Transaction[]
  transfers            Transfer[]
  budgets              Budget[]
  goals                Goal[]
  recurringTxns        RecurringTransaction[]
  notifications        Notification[]
  reminders            Reminder[]
  refreshTokens        RefreshToken[]
  auditLogsAsActor     AuditLog[] @relation("ActorAuditLogs")
  auditLogsAsTarget    AuditLog[] @relation("TargetAuditLogs")
}

model RefreshToken {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  tokenHash    String   @unique
  familyId     String
  userAgent    String?
  ipAddress    String?
  revokedAt    DateTime?
  createdAt    DateTime @default(now())
  expiresAt    DateTime

  @@index([userId])
  @@index([familyId])
}

model SecurityQuestion {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  questionKey  String
  answerHash   String
  createdAt    DateTime @default(now())

  @@unique([userId, questionKey])
}

model FinanceProfile {
  id                        String   @id @default(uuid())
  userId                    String   @unique
  user                      User     @relation(fields: [userId], references: [id])
  dateOfBirth               DateTime?
  address                   String?
  monthlyIncome             BigInt   @default(0)
  monthlyExpenseBudget      BigInt   @default(0)
  monthlyInvestmentTarget   BigInt   @default(0)
  incomeRange               String?
  savingsTarget             BigInt?
  investmentExperience      String?
  riskAppetite              String?
  investmentHorizon         String?
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}

model Account {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  name              String
  institution       String?
  accountType       String
  accountIdentifier String?
  openingBalance    BigInt   @default(0)
  currentBalance    BigInt   @default(0)
  status            AccountStatus @default(ACTIVE)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  transactions      Transaction[]
  budgets           Budget[]
  recurringTxns     RecurringTransaction[]

  @@index([userId])
}

model Category {
  id        String   @id @default(uuid())
  userId    String?  // null = system category
  user      User?    @relation(fields: [userId], references: [id])
  name      String
  type      TxnType
  isSystem  Boolean  @default(false)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  transactions Transaction[]
  budgets      Budget[]
  recurringTxns RecurringTransaction[]

  @@index([userId])
}

model Merchant {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  createdAt DateTime @default(now())

  transactions Transaction[]

  @@index([userId])
}

model Transaction {
  id           String       @id @default(uuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  accountId    String
  account      Account      @relation(fields: [accountId], references: [id])
  categoryId   String?
  category     Category?    @relation(fields: [categoryId], references: [id])
  merchantId   String?
  merchant     Merchant?    @relation(fields: [merchantId], references: [id])
  type         TxnType
  direction    TxnDirection
  amount       BigInt
  description  String?
  txnDate      DateTime
  status       RecordStatus @default(ACTIVE)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  transferAsDebit  Transfer? @relation("DebitTxn")
  transferAsCredit Transfer? @relation("CreditTxn")

  @@index([userId, txnDate])
  @@index([accountId])
  @@index([categoryId])
}

model Transfer {
  id                     String   @id @default(uuid())
  userId                 String
  user                   User     @relation(fields: [userId], references: [id])
  sourceAccountId        String
  destinationAccountId   String
  amount                 BigInt
  txnDate                DateTime
  description            String?
  debitTransactionId     String   @unique
  debitTransaction       Transaction @relation("DebitTxn", fields: [debitTransactionId], references: [id])
  creditTransactionId    String   @unique
  creditTransaction      Transaction @relation("CreditTxn", fields: [creditTransactionId], references: [id])
  createdAt              DateTime @default(now())

  @@index([userId])
}

model Budget {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  name          String
  targetAmount  BigInt
  period        String   @default("MONTHLY")
  periodStart   DateTime
  status        RecordStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}

model Goal {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  name          String
  targetAmount  BigInt
  currentAmount BigInt   @default(0)
  targetDate    DateTime?
  status        RecordStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}

model RecurringTransaction {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  type           TxnType
  accountId      String
  account        Account  @relation(fields: [accountId], references: [id])
  categoryId     String?
  category       Category? @relation(fields: [categoryId], references: [id])
  amount         BigInt
  description    String?
  scheduleFreq   String   // DAILY | WEEKLY | MONTHLY | YEARLY
  scheduleInterval Int    @default(1)
  nextOccurrence DateTime
  status         RecurringStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId])
  @@index([nextOccurrence])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  message   String
  type      String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, read])
}

model Reminder {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  type          String   // RECURRING_EXPENSE | RECURRING_INVESTMENT | MONTH_END
  timingConfig  Json
  enabled       Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model AuditLog {
  id            String   @id @default(uuid())
  actorUserId   String?
  actor         User?    @relation("ActorAuditLogs", fields: [actorUserId], references: [id])
  action        String
  targetUserId  String?
  target        User?    @relation("TargetAuditLogs", fields: [targetUserId], references: [id])
  details       Json?
  ipAddress     String?
  createdAt     DateTime @default(now())

  @@index([actorUserId])
  @@index([action])
  @@index([createdAt])
}

model AppSetting {
  key         String   @id
  value       Json
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}

model UserSettings {
  id                       String   @id @default(uuid())
  userId                   String   @unique
  user                     User     @relation(fields: [userId], references: [id])
  currency                 String   @default("INR")
  timezone                 String   @default("Asia/Kolkata")
  financialMonthStartDay   Int      @default(1)
  quickAddEnabled          Boolean  @default(true)
  dashboardDonutsConfig    Json     @default("{\"income\":true,\"expense\":true,\"investment\":true}")
  featuresConfig           Json     @default("{\"investments\":true,\"recurring\":true}")
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
}
```

## 2. Relationships (summary)

```
User 1—1 FinanceProfile
User 1—1 UserSettings
User 1—N SecurityQuestion (max 3, unique per questionKey)
User 1—N RefreshToken
User 1—N Account, Category(custom), Merchant, Transaction, Transfer,
         Budget, Goal, RecurringTransaction, Notification, Reminder
Account 1—N Transaction, Budget(via Category), RecurringTransaction
Category 1—N Transaction, Budget, RecurringTransaction
Transaction 1—1 Transfer (as debit or credit leg)
User 1—N AuditLog (as actor and, separately, as target)
```

Foreign keys use `ON DELETE RESTRICT` for financial tables (a user/account/
category cannot be hard-deleted while referenced) and `ON DELETE CASCADE`
only for purely user-owned config rows (`UserSettings`, `SecurityQuestion`).

## 3. Balance invariant

```
account.currentBalance =
  account.openingBalance
  + Σ(amount WHERE direction = CREDIT AND status = ACTIVE)
  − Σ(amount WHERE direction = DEBIT  AND status = ACTIVE)
```

Enforced exclusively by a backend `balanceService`, recalculated inside the
same Postgres transaction as any insert/update/status-change of a
`Transaction` or `Transfer`. Never computed in Web or Mobile.

## 4. Money & precision

- Stored as `BIGINT` paise (₹1 = 100). Avoids floating-point error entirely
  and fits Postgres's native 64-bit integer type without a `NUMERIC`
  rounding-mode discussion.
- API layer converts to/from paise at the boundary; clients never see or
  send floating rupee values for amounts used in calculations.
- Display formatting (`₹1,00,000`, Indian digit grouping) is purely a
  frontend concern (`frontend.md`).

## 5. Indexing strategy

- All foreign keys indexed (Prisma does this by default for relations used
  in queries; explicit `@@index` added above for the hot paths: transaction
  list by user+date, notification unread lookups, recurring due-date scan,
  audit log search by actor/action/date).
- Composite index on `(userId, txnDate)` for the transaction list's default
  sort/filter.
- Full-text/`ILIKE` search on `Transaction.description`,
  `AuditLog.action`/`details`, and `User.email`/`name` is acceptable at
  expected data volumes; revisit with a `pg_trgm` index or dedicated search
  index only if profiling shows it's needed.

## 6. Migrations

- `prisma migrate dev` locally, `prisma migrate deploy` in CI/CD against
  staging/production — migrations are numbered, checked into version
  control, and never edited after being applied anywhere.
- No destructive migration (dropping a column/table with live data) without
  a reviewed backup + backward-compatible rollout plan.
- Seed script (`prisma/seed.ts`) creates the system `Category` rows shown in
  the UI snaps (Food & Dining, Groceries, Fuel, Bonds, Fixed Deposit, Gold,
  etc.) and default `AppSetting` rows (`session_timeout_minutes`,
  `max_failed_attempts`).

## 7. Caching (Redis) touching this data

- Dashboard summary and Analytics aggregates are cached per
  `user_id:period` with a short TTL and explicit invalidation on any
  transaction/transfer/account/budget/goal mutation for that user — cache
  is a performance layer only, never a second source of truth.
- Refresh-token family metadata and access-token denylist entries also live
  in Redis (see `architecture.md` §5), not in this schema.
