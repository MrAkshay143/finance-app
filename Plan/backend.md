# Backend

Node.js + Express + TypeScript, PostgreSQL via Prisma, Redis, BullMQ,
Socket.IO. REST API under `/api/v1`.

## 1. Folder structure

```
apps/backend/
├─ src/
│  ├─ server.ts               entrypoint (HTTP + Socket.IO)
│  ├─ worker.ts                separate entrypoint for BullMQ workers
│  ├─ app.ts                   Express app assembly (middleware + routes)
│  ├─ config/                  env schema (zod) + typed config loader
│  ├─ routes/                  one file per resource, mounted under /api/v1
│  ├─ controllers/             request → service call → response mapping
│  ├─ services/                business logic (balanceService, famService,
│  │                            recurringService, reportService, ...)
│  ├─ repositories/             thin Prisma query wrappers per model
│  ├─ middleware/               auth, requireAdmin, errorHandler, rateLimiter,
│  │                            requestLogger, validate(zodSchema)
│  ├─ jobs/                     BullMQ queue + worker definitions
│  ├─ sockets/                  Socket.IO namespaces/handlers
│  ├─ validation/               zod schemas per resource (request bodies/query)
│  ├─ lib/                      prisma client, redis client, s3 client, logger
│  └─ utils/
├─ prisma/                      schema.prisma + migrations (see database.md)
├─ test/
│  ├─ unit/
│  ├─ integration/               Supertest + ephemeral Postgres/Redis
│  └─ fixtures/
├─ Dockerfile
└─ package.json
```

## 2. Middleware stack (in order)

1. `requestId` — attach correlation id for logging
2. `helmet` — secure headers
3. `cors` — allow-list of known origins (web, mobile via app scheme)
4. `express.json()` with a sane body-size limit
5. `requestLogger` (pino) — structured request/response log line
6. `rateLimiter` (Redis-backed) — global + stricter limits on
   `/auth/*`
7. Route-level: `validate(schema)` (zod) → `authenticate` (verifies access
   token) → `requireAdmin` where applicable → controller
8. `errorHandler` (last) — maps thrown errors to the standard error shape,
   never leaks stack traces to the client, logs full detail server-side

## 3. Response contract

```json
// success
{ "success": true, "data": { ... } }
// paginated
{ "success": true, "data": { "items": [...], "page": 1, "pageSize": 20, "total": 137 } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

Standard error codes: `VALIDATION_ERROR (400/422)`, `UNAUTHENTICATED (401)`,
`FORBIDDEN (403)`, `NOT_FOUND (404)`, `CONFLICT (409)`, `RATE_LIMITED (429)`,
`SERVER_ERROR (500)`.

## 4. Route groups (`/api/v1/...`)

`auth`, `profile`, `security-questions`, `accounts`, `categories`,
`merchants`, `transactions`, `transfers`, `budgets`, `goals`,
`recurring-transactions`, `dashboard`, `analytics`, `reports`,
`ai-analysis`, `investments`, `notifications`, `reminders`, `user-settings`,
`account-actions` (reset-profile/delete-account), `import` (CSV),
`export` (data export), `admin/*` (dashboard, users, app-settings,
audit-logs). Each group: list/detail/create/update/status-patch endpoints
as required by `prd.md` §5, all requiring `authenticate`; `admin/*`
additionally requires `requireAdmin`.

## 5. Authentication implementation

- `POST /auth/signup` — validate, hash password (bcrypt/argon2), create
  `User`, issue access + refresh token pair.
- `POST /auth/login` — verify credentials, check `lockedUntil`, on success
  reset `failedLoginAttempts`, issue token pair; on failure increment
  `failedLoginAttempts` and set `lockedUntil` once the configured
  `max_failed_attempts` (from `AppSetting`) is reached.
- `POST /auth/refresh` — verify refresh cookie against `RefreshToken`
  (hash compare), check not revoked/expired, **rotate**: issue new pair,
  mark old token row revoked, keep `familyId` linkage; if a revoked token
  is presented again, revoke the entire family (theft detected) and force
  re-login.
- `POST /auth/logout` — revoke the current refresh token (and optionally
  the whole family), add current access token's `jti` to the Redis
  denylist until its natural expiry.
- `authenticate` middleware — verifies JWT signature/expiry, checks the
  Redis denylist, attaches `req.user = { id, role }`.
- `requireAdmin` middleware — 403 unless `req.user.role === 'ADMIN'`.

## 6. Core services (business logic lives here, not in controllers)

- **balanceService** — the only code path allowed to mutate
  `Account.currentBalance`; wraps transaction/transfer create/update/void in
  a single Prisma `$transaction`.
- **famService** — computes the Financial Allocation Meter (FAM) score, grade,
  and progress comparing actual transactions against `FinanceProfile` monthly targets:
  - *Expense (lower is better)*: `spent / expense_target`. `≤ 80%` → A+ (Excellent); `81–100%` → B (Good); `> 100%` → C (Poor).
  - *Investment (higher is better)*: `invested / investment_target`. `≥ 100%` → A+ (Excellent); `70–99%` → B (Good); `< 70%` → C (Poor).
  - *Income (higher is better)*: `earned / income_target`. `≥ 100%` → A+ (Excellent); `70–99%` → B (Good); `< 70%` → C (Poor).
  - *Overall Grade*: Worst of the three areas (if any is C → C · Poor; else if any is B → B · Good; else A+ · Excellent).
  - *Overall Progress Ring*: Average of the three areas with each area capped at 100%.
  - *Not Available State (`—` / `NA`)*: Returned until the user has completed basic profile, set relevant monthly targets, and recorded at least one transaction this month.
- **aiService** — provides AI-powered monthly spending analysis, forward projections, and smart allocation advice in V1 (with built-in financial heuristics and configurable LLM integration).
- **recurringService** — used by the `recurring-transactions` BullMQ job to
  materialize due `RecurringTransaction` rows into real `Transaction`s and
  advance `nextOccurrence`, respecting `financialMonthStartDay`.
- **reportService** — builds Monthly/Year-in-Review report payloads and
  triggers async PDF/export generation via the `report-export` queue.
- **notificationService** — creates `Notification` rows and enqueues
  `notifications-dispatch` for realtime push.
- **auditService** — writes `AuditLog` rows for every security-relevant
  action (login, logout, password change, admin action, transaction/
  account mutation, destructive operations).

## 7. Validation

Zod schemas per endpoint, shared with the frontend via
`packages/shared-types` (the zod schema is the single source of truth for
both server-side validation and generated TypeScript types consumed by
web/mobile). Validation failures return `422 VALIDATION_ERROR` with a
field-level error map.

## 8. File uploads & object storage

- CSV import and avatar upload go through a pre-signed S3-compatible URL
  flow: client requests a signed upload URL, uploads directly to storage,
  then notifies the backend with the object key to kick off processing
  (`csv-import` job) or attach the avatar.
- Generated exports (`report-export`, full data export) are written to
  object storage by the worker and served back to the client as a signed,
  time-limited download URL — never streamed through the API process for
  large files.

## 9. Background jobs (BullMQ) — see also `architecture.md` §7

Each queue has: a producer (enqueue call from a controller/service or a
repeatable/cron schedule), a worker with a bounded concurrency and retry/
backoff policy, and a dead-letter/failure log surfaced in monitoring.
Idempotency keys are used where a job could otherwise double-apply (e.g.
recurring-transaction materialization keyed on
`(recurringTransactionId, occurrenceDate)`).

## 10. Realtime (Socket.IO)

- Auth on connection via the access token (same JWT verification as REST).
- `/notifications` namespace: server emits `notification:new` and
  `notification:unread-count` to the connected user's room
  (`user:{userId}`).
- `/dashboard` namespace: server emits `dashboard:refresh` after a
  transaction/transfer/account mutation, so other open sessions for the
  same user can re-fetch instead of polling.
- Redis adapter (`@socket.io/redis-adapter`) so this works across multiple
  API instances.

## 11. Logging & error tracking

- `pino` structured logs, one line per request (method, path, status,
  duration, requestId, userId if authenticated) and per job
  (queue, jobId, duration, outcome).
- Sentry (or equivalent) initialized in `server.ts` and `worker.ts`,
  capturing unhandled exceptions and rejected promises with release
  tagging; PII (passwords, KBA answers, tokens) explicitly scrubbed before
  any log line or error report is emitted.

## 12. Testing

- **Unit:** services and pure logic (`famService`, `balanceService`
  calculations, validation schemas) — Jest, no DB.
- **Integration:** repositories and services against a real ephemeral
  Postgres (Testcontainers or a CI service container) — verifies Prisma
  queries and transaction behavior.
- **API tests:** Supertest against the fully assembled Express app,
  covering every route group in `prd.md` §5, including the auth/ownership
  matrix (user A cannot access user B's data; non-admin cannot hit
  `admin/*`) and the critical transaction scenarios (add/edit/delete
  income/expense/investment/transfer with balance verification).
- **Job tests:** BullMQ worker functions invoked directly with fixture data
  (no need to spin up a real queue for unit-level coverage); a smaller set
  of integration tests runs jobs against a real Redis to verify scheduling/
  retry behavior.
- **End-to-end:** covered from the frontend side (Playwright) hitting a
  fully running stack (docker-compose) including backend + Postgres +
  Redis + workers.

## 13. Environment variables (validated at boot via zod)

`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET` (or key pair),
`JWT_ACCESS_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `S3_ENDPOINT`, `S3_BUCKET`,
`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `CORS_ALLOWED_ORIGINS`, `SENTRY_DSN`,
`LOG_LEVEL`, `NODE_ENV`. Boot fails fast with a clear error if any required
variable is missing or malformed — never silently defaults a security-
relevant value.
