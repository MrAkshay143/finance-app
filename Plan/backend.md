# Backend Specifications

Node.js + Express + TypeScript API server, Prisma ORM (PostgreSQL and MySQL support), Redis, BullMQ, Socket.IO. REST API mounted at /api/v1.

## 1. Folder Structure

```
apps/backend/
+-- src/
|   +-- server.ts               HTTP server + Socket.IO entrypoint
|   +-- worker.ts               BullMQ background workers entrypoint
|   +-- app.ts                  Express app assembly (middleware + route mounting)
|   +-- config/                 Zod-validated environment config loader (env.ts)
|   +-- routes/                 Resource routes mounted under /api/v1
|   |   +-- auth.routes.ts
|   |   +-- profile.routes.ts
|   |   +-- accounts.routes.ts
|   |   +-- transactions.routes.ts
|   |   +-- categories.routes.ts
|   |   +-- merchants.routes.ts
|   |   +-- budgets.routes.ts
|   |   +-- goals.routes.ts
|   |   +-- recurringTransactions.routes.ts
|   |   +-- admin.routes.ts
|   |   +-- ...
|   +-- controllers/            Request parsing, authorization, service dispatch
|   +-- services/               Business logic layer
|   |   +-- balanceService.ts   Atomic balance mutations and invariant enforcement
|   |   +-- famService.ts       Financial Activity Metric (FAM) calculation
|   |   +-- auditService.ts     Immutable security event logger
|   |   +-- kbaService.ts       Security questions verification and management
|   |   +-- adminService.ts     User directory, settings, categories, reports
|   +-- middleware/             auth, requireAdmin, maintenance, rateLimiter, error
|   +-- lib/                    Prisma client, Redis client, JWT helpers, Pino logger
+-- prisma/
|   +-- schema.prisma           PostgreSQL schema specification
|   +-- schema.mysql.prisma     MySQL production schema specification
|   +-- migrations/             Database migration histories
+-- test/                       Vitest unit, integration, and regression test suites
```

## 2. Middleware Pipeline (In Execution Order)

1. requestId: Attaches unique correlation UUID to req.id and response header.
2. helmet: Enforces secure HTTP headers.
3. cors: Validates request origin against CORS_ALLOWED_ORIGINS.
4. express.json(): Parses JSON payloads with reasonable size limits.
5. requestLogger: Structured logging via Pino HTTP.
6. rateLimiter: Redis-backed rate limiting on auth endpoints and global routes.
7. maintenanceMiddleware: Intercepts non-admin requests when maintenance_mode is enabled; allows admin bypass.
8. Route-level: validate(zodSchema) -> authenticate -> requireAdmin (for admin routes).
9. errorHandler: Centralized error translation, maps exceptions to API error responses, logs details server-side.

## 3. API Response Contract

```json
// Success Response
{
  "success": true,
  "data": { ... }
}

// Paginated Success Response
{
  "success": true,
  "data": {
    "items": [...],
    "page": 1,
    "pageSize": 15,
    "total": 42
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email or password format."
  }
}
```

Standard error codes: VALIDATION_ERROR (400/422), UNAUTHENTICATED (401), FORBIDDEN (403), NOT_FOUND (404), CONFLICT (409), RATE_LIMITED (429), SERVER_ERROR (500).

## 4. Route Groups Overview (/api/v1/...)

### Authentication & Profile
- POST /auth/signup: Register new user account, hash password with bcrypt.
- POST /auth/login: Authenticate credentials, enforce account lockout, issue JWT pair.
- POST /auth/refresh: Rotate refresh token, verify family id, issue fresh access token.
- POST /auth/logout: Revoke refresh token and invalidate active access token.
- POST /auth/forgot-password: Initiate recovery flow via email.
- POST /auth/reset-password: Reset password after verification.
- GET/PUT /profile: Retrieve and update user personal information.
- GET/POST/DELETE /security-questions: Manage and verify KBA security questions.

### Financial Management
- GET/POST /accounts: List accounts and create new accounts (Savings, Bank, Cash, etc.).
- GET/PUT/DELETE /accounts/:id: Account details, balance updates, and archival.
- POST /transfers: Atomic dual-entry fund transfers between two accounts.
- GET/POST /transactions: List filtered transactions with pagination and record new entries.
- GET/PUT/DELETE /transactions/:id: Transaction details, modifications, and soft-delete.
- GET/POST /categories: User category management with default system category fallback.
- GET/POST /merchants: Merchant directory and auto-complete suggestions.
- GET/POST /budgets: Category budgets with monthly limit tracking.
- GET/POST /goals: Savings goals with target amounts and contribution history.
- GET/POST /recurring-transactions: Recurring schedules with auto-posting.

### Platform Dashboards & Analytics
- GET /dashboard/summary: Net worth, monthly cash flow, and FAM health score.
- GET /analytics/cash-flow: Timeframe-based cash flow aggregation (7d, 30d, 90d, 1y).
- GET /analytics/categories: Category-wise spending breakdown for donut charts.
- POST /import/csv: Statement CSV parser and batch transaction creator.
- GET /export/json and /export/csv: Full transactional data export.

### Administrative Platform (/admin/...)
- GET /admin/dashboard: Platform metrics (Total Users, Active, Suspended, Admins).
- GET /admin/users: Complete user directory with pagination, search, and status filters.
- PATCH /admin/users/:id: Toggle user status (ACTIVE / SUSPENDED) or role (USER / ADMIN).
- POST /admin/users/:id/reset-password: Generate secure temporary password.
- POST /admin/users/:id/reset-kba: Clear user security questions.
- DELETE /admin/users/:id: Soft-delete user account.
- GET/PUT /admin/categories: Dedicated management of default system categories with sort order and KPI metrics.
- GET/PUT /admin/app-settings: Platform parameters (session timeout, lockout limit, base currency, maintenance mode).
- GET /admin/analytics: Platform GTV, liquidity breakdown, user progression funnel, activity index.
- GET /admin/audit-logs: System security audit trail with client device parsing.
- POST /admin/cache/clear: Purge temporary system caches.
- POST /admin/recurring/run: Manually invoke recurring transaction materializer.

## 5. Core Services

1. balanceService:
   - Single authoritative code path for mutating Account.currentBalance.
   - Executes inside database transactions ($transaction).
   - Invariant: currentBalance = initialBalance + SUM(credits) - SUM(debits).
   - Handles reversal math on transaction edits and deletions.

2. famService:
   - Computes the Financial Activity Metric (FAM) score based on savings rate, budget discipline, and liquidity coverage.
   - Emits visual grade (A+, A, B, C, D) and component percentages.

3. auditService:
   - Records immutable audit events for login, logout, password changes, admin updates, and data exports.
   - Stores actor id, target id, event category, IP address, user agent, and metadata.

4. kbaService:
   - Hashes security question answers using bcrypt.
   - Enforces verification before allowing password resets.
