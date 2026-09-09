# Architecture

## 1. System Overview

```
                         +---------------------+
                         |    Reverse Proxy    |
                         | (Nginx / Cloudflare)|
                         +----------+----------+
                                    |
                 +------------------+------------------+
                 |                                     |
        +--------v-------+                    +--------v-------+
        |   Web Client   |                    |  Backend API   |
        | (React + Vite) |                    | (Express + TS) |
        |  static build  |                    |    /api/v1     |
        +----------------+                    +--------+-------+
                                                       |
                 +-------------------------------------+------------------------------------+
                 |                                     |                                    |
        +--------v-------+                    +--------v-------+                   +--------v-------+
        |   Database     |                    |     Redis      |                   | BullMQ Workers |
        | (PostgreSQL /  |                    | (Cache, Queue, |                   | (Recurring tx, |
        |     MySQL)     |                    |  Rate-limit)   |                   |  reminders)    |
        +----------------+                    +----------------+                   +----------------+
```

Cross-cutting: structured JSON logging (Pino), error boundaries, Prometheus metrics (/metrics), and health endpoints (/healthz) are wired into the backend process.

## 2. Confirmed Technology Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js (v20+) + Express + TypeScript |
| Web Frontend | React 18 + TypeScript + Vite 6 + Tailwind CSS |
| PWA Architecture | Service Worker + Web Manifest + Install Prompt |
| Database Engines | PostgreSQL 16+ (local/container) and MySQL 8.0+ (Hostinger cloud production) |
| Database ORM | Prisma ORM (schema.prisma and schema.mysql.prisma) |
| Cache & Message Broker | Redis 7+ (with automatic development fallback) |
| Queue / Background Jobs | BullMQ |
| Authentication | Short-lived access tokens (15m) + sliding refresh tokens |
| API Style | REST (/api/v1), versioned |
| Realtime Gateway | Socket.IO namespaces (/notifications, /dashboard) |
| Reverse Proxy | Nginx / Hostinger Application Proxy |
| Monitoring | Structured JSON logs + Prometheus metrics |
| CI / CD | GitHub Actions + Hostinger deployment pipeline |
| Testing | Vitest + React Testing Library (266 web tests, 210 backend tests) |

## 3. Repository Layout (Monorepo)

```
finance-tracker/
+-- apps/
|   +-- backend/        Express + TS API, Prisma ORM, BullMQ workers, Socket.IO gateway
|   +-- web/            React 18 + TS + Vite SPA with PWA support
+-- packages/
|   +-- shared-types/   API request/response types, DTOs, and schemas
|   +-- shared-ui-tokens/ Design tokens (colors, radii, shadow-card)
|   +-- api-client/     Typed REST client + token interceptors
+-- infra/
|   +-- docker/         Dockerfiles for backend and web
|   +-- nginx/          Reverse proxy configurations
|   +-- compose/        docker-compose.yml, docker-compose.prod.yml
+-- Plan/               Technical specifications, PRD, architecture, database schemas
+-- scripts/            Workspace quality gates and verification tools
```

Package manager: pnpm workspaces. Node LTS pinned via .nvmrc.

## 4. API Versioning

- Every route lives under /api/v1/...
- Non-breaking changes: new optional fields, new endpoints, new query parameters.
- Breaking changes (would require /api/v2): renaming/removing fields, changing input formats, altering error response contracts.
- Response header X-API-Version: 1 allows clients to detect drift.

## 5. Authentication and Session Strategy

- Access Token: JWT, short-lived (15 min), signed with JWT_ACCESS_SECRET, carries sub (user id), role, iat, exp. Sent via Authorization: Bearer.
- Refresh Token: Long-lived (30 days), opaque random value, stored hashed in database (RefreshToken table) with device metadata. Sent via body and httpOnly cookie.
- Token Persistence Resilience: Dedicated tokenStorage.ts utility completely eliminates circular dependencies between Zustand stores and API clients, preventing page refresh redirect loops.
- Rotation: Every refresh request issues a new token pair and revokes the previous token row with familyId linkage. Replay of a revoked token invalidates the family.
- Account Lockout: Automatic lockout triggered after 5 consecutive failed login attempts to protect against brute-force attacks.
- Knowledge-Based Authentication (KBA): 3-question recovery verification system for password resets.

## 6. Realtime (Socket.IO)

- Namespace /notifications: Pushes real-time notification events and unread badge updates.
- Namespace /dashboard: Live refresh signal upon remote transaction mutations.
- Standard CRUD remains strictly REST.

## 7. Background Jobs (BullMQ + Redis)

| Queue | Job | Trigger |
|---|---|---|
| recurring-transactions | Materialize due recurring transactions | Scheduled (daily / manual trigger) |
| reminders | Evaluate due-date reminders and notifications | Scheduled (daily) |
| notifications-dispatch | Dispatch real-time socket events | On notification creation |
| csv-import | Parse and ingest bank statement CSV uploads | On file upload |
| report-export | Generate structured data exports (JSON / CSV) | On user request |
| audit-log-write | Non-blocking audit record creation | On critical action |

## 8. Frontend Layout & PWA

- Primary Viewport: Mobile-first responsive layout centered in a ~390-430px container on desktop viewports.
- Progressive Web App: Custom app icon, standalone display manifest, and offline service worker caching.
- Navigation:
  - Consumer: AppHeader (dark navy) + 5-item bottom bar (Home, Transactions, Center FAB, Reports, More).
  - Admin: AppHeader (with Exit Admin and Log Out) + 5-item bottom bar (Users, Categories, Reports, Audit, Settings).
- Design Tokens: shadow-card elevation, rounded-2xl radii, and border-borderDefault borders used uniformly across all screens.

## 9. Security Baseline

- Helmet headers, CORS restricted to permitted origins, input validation (Zod) on every endpoint.
- Parameterized database queries exclusively via Prisma ORM.
- Server-side user ownership checks on all private resources.
- Server-side role checks on all /admin/* endpoints.
- Rate limiting on authentication routes.
- Immutable security audit logging.

## 10. Environments

- local: Local PostgreSQL/MySQL, Redis, Vite dev server, Express backend.
- production: Live Hostinger cloud deployment (finance.imakshay.in) running bundled Node 20 backend with Express static asset hosting and cloud MySQL database.
