# Backend Specifications

Node.js (v20+) + Express + TypeScript API server, Prisma ORM (PostgreSQL 16+ and MySQL 8.0+ engines), Redis cache & message broker, BullMQ background workers, and Socket.IO realtime gateway. All REST endpoints are mounted under /api/v1.

## 1. Directory Structure

apps/backend/
+-- src/
|   +-- server.ts               HTTP server, Socket.IO gateway, system category and admin bootstrapping
|   +-- worker.ts               BullMQ background workers entrypoint (recurringWorker, reminderWorker)
|   +-- app.ts                  Express app assembly, middleware chain, Prometheus metrics, SPA static server
|   +-- seed-realworld.ts       Authoritative real-world database seed script
|   +-- config/
|   |   +-- env.ts              Zod-validated environment configuration loader
|   +-- routes/
|   |   +-- index.ts            Central router mounting all 24 route groups under /api/v1
|   |   +-- auth.routes.ts
|   |   +-- profile.routes.ts
|   |   +-- securityQuestions.routes.ts
|   |   +-- accounts.routes.ts
|   |   +-- categories.routes.ts
|   |   +-- merchants.routes.ts
|   |   +-- transactions.routes.ts
|   |   +-- transfers.routes.ts
|   |   +-- budgets.routes.ts
|   |   +-- goals.routes.ts
|   |   +-- recurringTransactions.routes.ts
|   |   +-- dashboard.routes.ts
|   |   +-- analytics.routes.ts
|   |   +-- reports.routes.ts
|   |   +-- aiAnalysis.routes.ts
|   |   +-- investments.routes.ts
|   |   +-- notifications.routes.ts
|   |   +-- reminders.routes.ts
|   |   +-- userSettings.routes.ts
|   |   +-- accountActions.routes.ts
|   |   +-- audit.routes.ts
|   |   +-- import.routes.ts
|   |   +-- export.routes.ts
|   |   +-- admin.routes.ts
|   +-- controllers/            Request parsing, schema validation, service orchestration
|   +-- services/               Business logic implementations
|   |   +-- balanceService.ts   Authoritative balance mutation and invariant enforcement
|   |   +-- famService.ts       Financial Activity Metric (FAM) calculation
|   |   +-- auditService.ts     Immutable security event logging
|   |   +-- kbaService.ts       Security questions verification
|   |   +-- categoryService.ts   System default category auto-provisioning
|   |   +-- adminService.ts     Admin user management, system categories, reports
|   +-- middleware/             requestId, metrics, cors, requestLogger, rateLimiter, auth, requireAdmin, maintenance, error
|   +-- lib/                    prisma.js, redis.js, jwt.js, logger.js, metrics.js, sentry.js
|   +-- sockets/                socketGateway.ts with /notifications and /dashboard namespaces
|   +-- jobs/                   recurringWorker.ts, reminderWorker.ts
+-- prisma/
|   +-- schema.prisma           PostgreSQL 16+ database schema
|   +-- schema.mysql.prisma     MySQL 8.0+ production schema for Hostinger cloud
|   +-- migrations/             Database migration histories
+-- test/                       17 Vitest test suites covering all routes, services, and E2E journeys

## 2. Middleware Pipeline (In Execution Order)

1. requestId: Attaches unique correlation UUID to req.id and response header X-Request-Id.
2. metricsMiddleware: Tracks request durations, statuses, and paths for Prometheus metrics.
3. helmet: Sets secure HTTP headers (CSP disabled to allow Vite bundled assets).
4. corsMiddleware: Validates request origin against CORS_ALLOWED_ORIGINS.
5. express.json({ limit: '10mb' }): Parses JSON payloads with 10MB limit for base64 uploads.
6. requestLogger: Pino structured request logging.
7. rateLimiter: Redis-backed rate limiting with in-memory fallback.
8. optionalAuthenticate: Attaches user token context if present.
9. maintenanceMiddleware: Intercepts non-admin requests when maintenance_mode is enabled; allows admin bypass.
10. Route Level: validateBody(schema) -> authenticate -> requireAdmin (for admin endpoints).
11. errorHandler: Centralized error handling mapping exceptions to standard API error responses.

## 3. Complete Route Inventory (/api/v1/...)

### Authentication (/api/v1/auth)
- POST /auth/signup: Register account with email, password, name, phone, country.
- POST /auth/login: Authenticate credentials, enforce account lockout, issue JWT pair.
- POST /auth/refresh: Rotate refresh token, verify family id, issue fresh access token.
- POST /auth/forgot-password/initiate: Check user exists and has KBA configured.
- POST /auth/forgot-password/verify: Verify KBA answers and issue password reset token.
- POST /auth/reset-password: Reset password using reset token.
- POST /auth/logout: Revoke active refresh token.
- GET /auth/me: Retrieve current authenticated user record.
- GET /auth/sessions: List active session tokens with client device info.
- POST /auth/sessions/revoke-others: Revoke all refresh tokens except current session.

### Profile & Settings (/api/v1/profile, /api/v1/user-settings)
- GET /profile: Retrieve user profile details.
- PUT/PATCH /profile/basic: Update basic personal info (name, phone, country).
- GET /profile/finance: Retrieve financial profile (monthly income, targets, risk appetite).
- PUT/PATCH /profile/finance: Update financial profile parameters.
- POST /profile/avatar: Upload profile picture (stored in uploads/avatars or base64).
- DELETE /profile/avatar: Remove profile picture.
- GET /user-settings: Retrieve user preferences (currency, timezone, donut charts).
- PATCH /user-settings: Update user preferences.

### Security Questions (/api/v1/security-questions)
- GET /security-questions/available: Public list of available security questions.
- GET /security-questions: Retrieve configured questions for authenticated user.
- POST /security-questions/setup: Configure 3 security questions with bcrypt hashed answers.
- POST /security-questions/verify: Verify security answers for authenticated user.
- POST /security-questions/verify-public: Verify answers during forgot-password recovery.

### Accounts & Transfers (/api/v1/accounts, /api/v1/transfers)
- GET /accounts: List all financial accounts with current balances.
- POST /accounts: Create account (Savings, Checking, Credit Card, Cash, Investment, Loan).
- GET /accounts/:id: Retrieve single account details and transaction history.
- PUT /accounts/:id: Update account metadata.
- PATCH /accounts/:id/status: Toggle status (ACTIVE, INACTIVE, CLOSED).
- GET /transfers: List fund transfers.
- POST /transfers: Atomic dual-entry transfer between two accounts.
- GET /transfers/:id: Transfer details.
- DELETE /transfers/:id: Reversal of transfer with balance rollback.

### Categories & Merchants (/api/v1/categories, /api/v1/merchants)
- GET /categories: List categories (user custom categories + default system categories).
- POST /categories: Create custom category.
- PATCH /categories/reorder: Update category display order.
- GET /categories/:id: Category details.
- PUT /categories/:id: Update category.
- DELETE /categories/:id: Remove category.
- GET /merchants: List merchants with usage metrics.
- POST /merchants: Create merchant.
- GET/PUT/DELETE /merchants/:id: Merchant management.

### Transactions (/api/v1/transactions)
- GET /transactions: Filtered list of transactions (search, accountId, categoryId, type, dates, pagination).
- POST /transactions: Record transaction with balanceService atomic balance update.
- GET /transactions/:id: Transaction details.
- PUT /transactions/:id: Update transaction with balance adjustment difference math.
- DELETE /transactions/:id: Soft-delete transaction with balance reversal.

### Planning, Budgets & Goals (/api/v1/budgets, /api/v1/goals)
- GET /budgets: List monthly category budgets with current spend calculation.
- POST /budgets: Create category budget limit.
- GET/PUT/DELETE /budgets/:id: Budget management.
- GET /goals: List savings goals with target amounts, dates, and progress.
- POST /goals: Create savings goal.
- GET/PUT/DELETE /goals/:id: Goal management and contribution logging.

### Recurring Transactions & Reminders (/api/v1/recurring-transactions, /api/v1/reminders)
- GET /recurring-transactions: List recurring schedules (Daily, Weekly, Monthly, Yearly).
- POST /recurring-transactions: Create recurring schedule.
- GET/PUT/DELETE /recurring-transactions/:id: Recurring schedule management.
- PATCH /recurring-transactions/:id/status: Toggle status (ACTIVE, PAUSED).
- GET /reminders: List scheduled reminders.
- POST /reminders: Create reminder.
- GET/PUT/DELETE /reminders/:id: Reminder management.
- PATCH /reminders/:id/status: Toggle reminder enabled state.

### Dashboards, Analytics & Reports (/api/v1/dashboard, /api/v1/analytics, /api/v1/reports)
- GET /dashboard: Net worth, monthly cash flow, recent activity, budget summary.
- GET /dashboard/fam: Financial Activity Metric (FAM) score, grade, and factors.
- GET /analytics: Timeframe cash flow trends and category spending distribution.
- GET /reports: Monthly income, expense, and investment report.
- GET /reports/annual: Year-to-date financial summary.
- GET /reports/custom: Date range statement with category breakdowns.
- POST /reports/export: Generate downloadable report.

### AI Analysis & Investments (/api/v1/ai-analysis, /api/v1/investments)
- GET /ai-analysis: Financial health evaluation, spending anomalies, budget insights.
- GET /investments: List investment holdings and allocation.
- GET /investments/summary: Portfolio valuation and category breakdown.

### Notifications & Audit (/api/v1/notifications, /api/v1/audit)
- GET /notifications: Notification feed.
- GET /notifications/unread-count: Badge counter.
- PATCH /notifications/:id/read: Mark single notification read.
- POST /notifications/mark-all-read: Mark all notifications read.
- GET /audit: Current user security and transaction audit log.

### Import & Export (/api/v1/import, /api/v1/export)
- POST /import/csv: Ingest bank statement CSV records.
- GET /export/data: Export user data (JSON or CSV format).

### Administrative Suite (/api/v1/admin)
- GET /admin/dashboard: Platform metrics (total users, active, suspended, admins).
- GET /admin/reports/analytics: Platform GTV, liquidity breakdown, user progression funnel.
- GET /admin/reports/users/export: Export user directory as CSV.
- GET /admin/system/health: System telemetry, memory usage, uptime, database latency.
- GET /admin/users: Searchable user list with pagination and role/status filters.
- GET /admin/users/:id: Full user inspection with accounts, balances, and login history.
- PATCH /admin/users/:id: Update user status (ACTIVE/SUSPENDED) or role (USER/ADMIN).
- GET /admin/users/:id/sessions: Inspect active sessions for a specific user.
- POST /admin/users/:id/sessions/revoke-all: Terminate all sessions for a user.
- POST /admin/users/:id/reset-password: Issue temporary password for a user.
- POST /admin/users/:id/reset-kba: Clear user security questions.
- DELETE /admin/users/:id: Soft-delete user account.
- GET/PATCH /admin/settings and /admin/app-settings: Platform configuration (session timeout, lockout limit, base currency, maintenance mode).
- POST /admin/maintenance/clear-cache: Purge system Redis caches.
- POST /admin/maintenance/run-recurring: Trigger recurring transaction materializer manually.
- GET /admin/audit and /admin/audit-logs: System-wide immutable audit trail.
- GET /admin/audit/export: Export system audit trail as CSV.
- POST /admin/audit/purge and /admin/maintenance/purge-audit-logs: Purge audit logs older than retention horizon.
- GET /admin/categories: List system taxonomy categories with share metrics.
- POST /admin/categories: Create global system category.
- PUT/PATCH /admin/categories/:id: Update system category name, type, or sort order.
- DELETE /admin/categories/:id: Delete system category.

## 4. Observability & Health Endpoints

- GET /healthz: Basic liveness probe returning { status: 'ok' }.
- GET /readyz: Readiness probe verifying live database connectivity via SELECT 1.
- GET /metrics: Prometheus metrics registry covering HTTP request durations, memory, and status codes.
