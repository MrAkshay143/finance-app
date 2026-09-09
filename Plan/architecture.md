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

Cross-cutting: structured JSON logging (Pino), error boundaries, Prometheus metrics (/metrics), and health endpoints (/healthz, /readyz) are wired into the backend process.

## 2. Confirmed Technology Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js (v20+) + Express + TypeScript |
| Web Frontend | React 18 + TypeScript + Vite 6 + Tailwind CSS |
| Mobile Frontend | React Native 0.76 + NativeWind (@finance/mobile) |
| PWA Architecture | Service Worker + Web Manifest + Install Prompt |
| Database Engines | PostgreSQL 16+ (local/container) and MySQL 8.0+ (Hostinger cloud production) |
| Database ORM | Prisma ORM (schema.prisma and schema.mysql.prisma) |
| Cache & Message Broker | Redis 7+ (with automatic development in-memory fallback) |
| Queue / Background Jobs | BullMQ (recurringWorker, reminderWorker) |
| Authentication | Short-lived access tokens (15m) + sliding refresh tokens (30d) |
| API Style | REST (/api/v1), versioned |
| Realtime Gateway | Socket.IO namespaces (/notifications, /dashboard) |
| Reverse Proxy | Nginx / Hostinger Application Proxy |
| Monitoring | Structured JSON logs (Pino) + Prometheus metrics (/metrics) |
| Testing | Vitest + React Testing Library (39 test suites across backend, web, and mobile) |

## 3. Repository Layout (Monorepo)

```
finance-tracker/
+-- apps/
|   +-- backend/        Express + TS API, Prisma ORM, BullMQ workers, Socket.IO gateway
|   +-- web/            React 18 + TS + Vite SPA with PWA support
|   +-- mobile/         React Native 0.76 + NativeWind mobile application
+-- packages/
|   +-- shared-types/   API request/response types, DTOs, and schemas
|   +-- shared-ui-tokens/ Design tokens (colors, radii, shadow-card)
|   +-- api-client/     Typed REST client + token interceptors + Socket.IO client
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
