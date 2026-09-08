# Architecture

## 1. System overview

```
                         ┌─────────────────────┐
                         │   Nginx (reverse     │
                         │   proxy + TLS term)  │
                         └─────────┬────────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
        ┌────────▼───────┐ ┌───────▼────────┐ ┌──────▼───────┐
        │  Web (React +  │ │  Backend API   │ │  Socket.IO   │
        │  TS + Vite)    │ │  (Express+TS)  │ │  gateway     │
        │  static build  │ │  /api/v1       │ │  (same proc  │
        └────────────────┘ └───────┬────────┘ │  or split)   │
                                   │           └──────┬───────┘
        ┌────────────────┐         │                  │
        │  Mobile (React │◄────────┴──────────────────┘
        │  Native + TS)  │        REST + WebSocket
        └────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
      ┌───────▼───────┐   ┌────────▼────────┐   ┌────────▼────────┐
      │ PostgreSQL     │   │ Redis           │   │ BullMQ workers  │
      │ (primary DB)   │   │ (cache, rate-   │   │ (recurring txns,│
      │                │   │ limit, refresh- │   │ reminders, CSV  │
      │                │   │ token/session   │   │ import, report  │
      │                │   │ store, pub/sub) │   │ export, notifs) │
      └────────────────┘   └─────────────────┘   └────────┬────────┘
                                                            │
                                                   ┌────────▼────────┐
                                                   │ S3-compatible    │
                                                   │ object storage   │
                                                   │ (avatars, CSV,   │
                                                   │ exported files)  │
                                                   └──────────────────┘
```

Cross-cutting: structured JSON logging, error tracking, and metrics
(Prometheus-style) are wired into the API process and the BullMQ workers
(see §7). CI/CD via GitHub Actions builds, tests, and deploys all of the
above (see §8).

## 2. Confirmed technology stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Web frontend | React + TypeScript + Vite |
| Mobile | React Native + TypeScript |
| Database | PostgreSQL |
| Cache | Redis |
| Queue / background jobs | BullMQ + Redis |
| Auth | Short-lived access tokens + rotating refresh tokens |
| API style | REST (`/api/v1`), versioned |
| Realtime | Socket.IO, used only where it adds real value |
| Reverse proxy | Nginx |
| Process management / deployment | Docker + orchestration |
| File storage | S3-compatible object storage |
| Monitoring | Structured logs + error tracking + metrics |
| CI/CD | GitHub Actions |
| DB migrations | Prisma (or Drizzle) migrations |
| Testing | Unit + integration + API + end-to-end |

## 3. Repository layout (monorepo)

```
finance-tracker/
├─ apps/
│  ├─ backend/        Express + TS API, BullMQ workers, Socket.IO gateway
│  ├─ web/             React + TS + Vite
│  └─ mobile/          React Native + TS
├─ packages/
│  ├─ shared-types/     API request/response types, enums, zod schemas
│  ├─ shared-ui-tokens/ Design tokens (colors, spacing, radii) shared by web+mobile
│  └─ api-client/       Typed REST client (axios/fetch) + Socket.IO client wrapper
├─ infra/
│  ├─ docker/           Dockerfiles per app
│  ├─ nginx/            Reverse proxy config
│  └─ compose/          docker-compose.yml (local dev), compose.prod.yml
├─ .github/workflows/   CI/CD pipelines
└─ prisma/ (or drizzle/) schema + migrations (see database.md)
```

Package manager: pnpm workspaces (fast, disk-efficient, first-class
monorepo support). Node LTS pinned via `.nvmrc`.

## 4. API versioning

- Every route lives under `/api/v1/...`. This contract is frozen once Phase
  0 of `implementation-plan.md` completes; no in-place breaking changes to
  it afterward.
- **Non-breaking (no bump needed):** new optional fields, new endpoints, new
  optional query params, new enum values old clients won't produce.
- **Breaking (requires `/api/v2`):** removing/renaming a field, changing a
  field's type or unit, changing required inputs, changing auth
  requirements, changing error semantics.
- Response header `X-API-Version: 1` lets clients detect drift.
- `v2`, if ever needed, is additive alongside a still-functioning `v1`, with
  an announced sunset date before `v1` is retired — never a hard cutover.
- Web and mobile both pin their API client (`packages/api-client`) to a
  single version constant, so a bump is a one-line change.

## 5. Authentication & session strategy

- **Access token:** JWT, short-lived (10–15 min), signed with a rotating
  signing key (kid header), carries `sub` (user id), `role`, `iat`, `exp`.
  Sent as `Authorization: Bearer`.
- **Refresh token:** long-lived (e.g. 30 days), opaque random value, stored
  **hashed** in PostgreSQL (`refresh_tokens` table) with device/user-agent
  metadata, delivered to the client as an `httpOnly`, `Secure`, `SameSite=
  Strict` cookie (web) / secure storage (mobile).
- **Rotation:** every refresh exchanges the old token for a new one and
  invalidates the old one immediately (reuse of an already-rotated token
  revokes the entire token family — standard refresh-token theft defense).
- **Revocation:** logout, password change, and admin "disable user" all
  revoke the user's active refresh tokens; Redis holds a short-lived
  access-token denylist for the rare immediate-revocation case (e.g. admin
  disabling a user mid-session).
- **Rate limiting:** Redis-backed (`rate-limiter-flexible` or
  `express-rate-limit` + Redis store) on auth endpoints and globally.

## 6. Realtime (Socket.IO) — used only where it adds real value

- **Namespace `/notifications`:** pushes new-notification events and
  unread-count updates to connected clients (web/mobile), authenticated via
  the access token on connection.
- **Namespace `/dashboard`:** optional live refresh signal after a
  transaction mutation from another device/session, so an open dashboard
  updates without a manual pull-to-refresh.
- Everything else (CRUD, lists, reports) stays plain REST — Socket.IO is not
  used as a general data-fetching transport.
- Horizontal scaling: Socket.IO Redis adapter, so multiple API instances
  share presence/broadcast state.

## 7. Background jobs (BullMQ + Redis)

| Queue | Job | Trigger |
|---|---|---|
| `recurring-transactions` | Materialize due recurring transactions into real transactions | Scheduled (cron-like repeatable job, daily) |
| `reminders` | Evaluate due-date reminders, create notifications | Scheduled (daily / configurable) |
| `notifications-dispatch` | Push notification to connected sockets / (future) email/push | On notification creation |
| `csv-import` | Parse, validate, and import an uploaded CSV | On file upload |
| `report-export` | Generate a PDF/Excel report or full data export | On user request |
| `audit-log-write` | Optional: async, non-blocking audit log writes for high-volume actions | On qualifying action |

Workers run as a separate Node process (`apps/backend` built with a worker
entrypoint) so they scale independently of the HTTP API.

## 8. CI/CD (GitHub Actions)

Pipeline stages on every PR:
1. Install (pnpm, cached)
2. Lint + typecheck (eslint, tsc --noEmit) for backend/web/mobile/packages
3. Unit tests (Jest/Vitest)
4. Integration/API tests against an ephemeral Postgres+Redis (via Actions
   services or Testcontainers)
5. Build (backend, web, mobile bundle where applicable)
6. E2E tests (Playwright for web against a preview build; Detox/Maestro for
   mobile on a schedule/nightly, not necessarily every PR)

On merge to `main`: build and push Docker images (tagged with git SHA +
`latest`), run DB migrations against staging, deploy staging, run smoke
tests, manual/approval gate to promote to production.

## 9. Deployment & process management

- Each app (`backend`, worker, `web`, `nginx`) has its own Dockerfile
  (multi-stage builds, minimal runtime images).
- `infra/compose/docker-compose.yml` for local dev (Postgres, Redis,
  backend, worker, web, nginx, Mailhog-equivalent if needed).
- Production: containers run under an orchestrator (Docker Swarm or
  Kubernetes, whichever the target infra supports) with health checks,
  rolling deploys, and horizontal scaling of the API/worker services
  independent of Postgres/Redis.
- Nginx terminates TLS, serves the web static build, proxies `/api/*` and
  the Socket.IO upgrade path to the backend service, and applies
  gzip/br compression and basic request size limits.
- Object storage (S3-compatible — AWS S3, MinIO, DigitalOcean Spaces, etc.)
  holds avatars, CSV uploads, and generated export files, referenced from
  Postgres by key, never stored in the DB itself.

## 10. Monitoring & observability

- **Logs:** structured JSON (pino), one line per request/job with
  correlation id, shipped to a log aggregator (e.g. Loki/ELK/hosted).
- **Error tracking:** Sentry (or equivalent) on backend, web, and mobile,
  capturing stack traces with release/version tagging.
- **Metrics:** Prometheus-format `/metrics` endpoint (request latency/rate/
  error-rate, queue depth/processing time, DB pool stats), visualized in
  Grafana; alerting on error-rate and queue-backlog thresholds.
- **Health checks:** `/healthz` (liveness) and `/readyz` (readiness,
  checking DB/Redis connectivity) on the backend, used by the orchestrator.

## 11. Security baseline

- Helmet (secure headers), CORS locked to known origins, input validation
  (zod) on every endpoint, parameterized queries only (via ORM), server-side
  ownership checks on every user-scoped resource, server-side role checks
  on every admin endpoint, secrets via environment variables / secret
  manager (never committed), dependency scanning in CI, rate limiting,
  audit logging of security-relevant actions.

## 12. Environments

`local` (docker-compose) → `staging` (mirrors prod topology, seeded test
data) → `production`. Configuration via environment variables per app,
validated at boot (zod-parsed env schema) so misconfiguration fails fast
instead of silently.
