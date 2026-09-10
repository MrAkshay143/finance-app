# Finance Tracker Monorepo

Enterprise-grade personal finance application and administrative platform engineered across Web (React 18, Vite, Tailwind CSS), Backend API (Node.js, Express, TypeScript, Prisma ORM, PostgreSQL and MySQL support, Redis, BullMQ), and Mobile-first PWA architecture.

---

## Table of Contents

1. [Overview and System Architecture](#overview-and-system-architecture)
2. [Documentation and Technical Plans](#documentation-and-technical-plans)
3. [Comprehensive Feature List](#comprehensive-feature-list)
   - [Consumer Financial Features](#consumer-financial-features)
   - [Administrative Platform Features](#administrative-platform-features)
   - [Security and Resilience Features](#security-and-resilience-features)
4. [Tech Stack](#tech-stack)
5. [Monorepo Structure](#monorepo-structure)
6. [Prerequisites](#prerequisites)
7. [Local Setup and Installation](#local-setup-and-installation)
   - [Step 1: Clone Repository and Install Dependencies](#step-1-clone-repository-and-install-dependencies)
   - [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
   - [Step 3: Database Setup and Migrations](#step-3-database-setup-and-migrations)
   - [Step 4: Seed Database](#step-4-seed-database)
   - [Step 5: Run Services Locally](#step-5-run-services-locally)
8. [Running with Docker Compose](#running-with-docker-compose)
9. [Default Test Credentials](#default-test-credentials)
10. [Testing and Quality Assurance](#testing-and-quality-assurance)
11. [Production Build and Deployment](#production-build-and-deployment)

---

## Overview and System Architecture

Finance Tracker is built with a monorepo topology managed by pnpm workspaces. It delivers a mobile-first responsive web client (centered container with desktop adaptivity) along with a robust REST API backend.

```
                           +------------------------+
                           |     Reverse Proxy      |
                           |  (Nginx / Cloudflare)  |
                           +-----------+------------+
                                       |
                 +---------------------+--------------------+
                 |                                          |
        +--------v--------+                        +--------v--------+
        |   Web Client    |                        |   Backend API   |
        |  (React + Vite) |                        | (Node + Express)|
        |    Port 3000    |                        |    Port 4000    |
        +-----------------+                        +--------+--------+
                                                            |
                 +---------------------+--------------------+
                 |                     |                    |
        +--------v--------+   +--------v--------+  +--------v--------+
        |   PostgreSQL/   |   |      Redis      |  | BullMQ Workers  |
        |      MySQL      |   | (Cache & Queue) |  | (Recurring tasks|
        |  (Prisma ORM)   |   |    Port 6379    |  |  & Reminders)   |
        +-----------------+   +-----------------+  +-----------------+
```

---

## Documentation and Technical Plans

Detailed technical specifications, domain models, and architecture design documents are maintained in the `Plan` directory:

- [Plan/architecture.md](Plan/architecture.md): Overall system architecture, infrastructure topology, network boundaries, caching tiers, and telemetry configuration.
- [Plan/backend.md](Plan/backend.md): Backend engineering design, Express REST API contracts (/api/v1), middleware pipelines, authentication mechanics, and background task processing.
- [Plan/database.md](Plan/database.md): Database schema models, table relations, foreign keys, composite indices, decimal arithmetic handling, and balance invariant rules.
- [Plan/frontend.md](Plan/frontend.md): Frontend application architecture, state stores (Zustand), TanStack Query caching strategies, route guards, design system tokens, and screen hierarchies.
- [Plan/implementation-plan.md](Plan/implementation-plan.md): Step-by-step engineering roadmap, phase completion milestones, test gates, and production readiness criteria.
- [Plan/prd.md](Plan/prd.md): Product Requirements Document defining business rationale, user personas, functional specifications, non-functional requirements, and user stories.
- [Plan/UI Snaps](Plan/UI%20Snaps): Visual design reference captures, screen wireframes, and design system inspiration.

---

## Comprehensive Feature List

### Consumer Financial Features

1. **Dashboard and Financial Summary:**
   - Real-time net worth calculation across all active financial accounts.
   - Monthly cash flow metrics (total income, total expenses, net savings).
   - Financial Activity Metric (FAM) health scoring with visual status indicator.
   - Quick action bar for rapid transaction entry, account creation, and transfers.
   - Recent transaction feed with transaction badges and category styling.

2. **Multi-Account Management:**
   - Support for multiple account types: Bank, Savings, Credit Card, Cash, Investment, Loan.
   - Account detail views with running balances and individual transaction history.
   - Dual-entry fund transfers between accounts with atomic balance updates and rollback safety.
   - Account status controls (Active, Archived, Hidden).

3. **Transaction Tracking and Taxonomy:**
   - Income, Expense, and Investment transaction classification.
   - Dynamic category allocation with custom user categories and default system categories.
   - Merchant tagging with automatic search and auto-complete suggestions.
   - Date picker, notes, and payment mode metadata.
   - Advanced search, date range filtering, and type filters.
   - Centralized app-style pagination that dynamically auto-hides when records fit on one page.

4. **Planning, Budgets and Savings Goals:**
   - Category-level monthly expenditure budgets with real-time progress bars.
   - Color-coded budget consumption alerts (Safe, Warning at 80%, Exceeded at 100%).
   - Target savings goals with target dates, visual progress rings, and contribution logs.

5. **Recurring Transactions and Automated Scheduling:**
   - Setup recurring incomes or expenses with customizable recurrence cycles (Daily, Weekly, Monthly, Yearly).
   - Automated processing via BullMQ workers with upcoming due date notifications.
   - Next occurrence calculation and auto-posting directly to target accounts.

6. **Analytics and Visual Reports:**
   - Cash flow trends over time with timeframe selectors (7 Days, 30 Days, 90 Days, 1 Year).
   - Category expenditure breakdown with interactive donut charts.
   - Zero hardcoded currencies: amounts dynamically render using the user's preferred currency setting.

7. **Data Portability (Import and Export):**
   - Bank statement CSV import wizard with column mapping and duplicate detection.
   - Complete data export utility generating structured JSON or CSV archives for external analysis.

8. **Progressive Web App (PWA):**
   - Offline-capable service worker with runtime asset caching.
   - Full web app manifest with standalone display mode.
   - Custom app icon designed for desktop and mobile home-screen installation.
   - Integrated in-app Chrome install banner with dismiss controls.

---

### Administrative Platform Features

1. **User Management Directory (/admin):**
   - Complete directory of registered platform users with pagination and search.
   - Real-time aggregate KPI metrics: Total Users, Active Users, Suspended Users, and Administrator counts.
   - User account status management: toggle Active or Suspended access.
   - Administrative role delegation: grant or revoke System Administrator privileges.
   - Administrative security actions: temporary password generation and KBA security questions reset.
   - Soft delete user workflow preserving database referential integrity.

2. **Dedicated System Category Management (/admin/categories):**
   - Standalone administrative interface for managing global taxonomy categories.
   - Interactive KPI overview cards: Total Categories, Expense Share, Income Share, Investment Share.
   - Category filtering by taxonomy type (All, Expense, Income, Investment).
   - Search by category name with clean instant filtering.
   - Category creation, edit modal, and protected deletion validation.
   - Dynamic centralized pagination.

3. **Platform Analytics and Telemetry (/admin/reports):**
   - Platform Gross Transaction Volume (GTV) aggregate monitoring over customizable time horizons.
   - System Liquidity Breakdown analyzing total balances held across all user accounts.
   - User Progression Funnel tracking onboarding completion rates.
   - Transaction volume velocity and activity index per user.
   - System health indicators and database connectivity telemetry.
   - Dynamic preferred currency formatting across all reports.

4. **Security Audit Trail (/admin/audit):**
   - Immutable security log tracking all critical administrative and user security events.
   - Human-readable action titles mapped from system enums via dedicated audit formatters.
   - Category badges distinguishing Authentication, Profile, Transactions, Administration, and System events.
   - Client device and IP address attribution parser.
   - Search and category filter controls.

5. **Platform Security Parameters (/admin/settings):**
   - Platform-wide session timeout policies.
   - Maximum consecutive failed login attempt limits before account lockout.
   - System base currency default selection.
   - One-click temporary system cache clearing.
   - Automated audit log retention policy with configurable purge horizon.

6. **Admin Profile (/admin/profile):**
   - Dedicated identity hero card displaying role credentials and active session info.
   - Full password validation parity matching consumer app requirements.
   - Session revocation controls to terminate all other active device tokens.

7. **Admin Navigation and Header Standardization:**
   - Dedicated 5-item bottom navigation menu: Users, Categories, Reports, Audit, Settings.
   - Cleaned header eliminating redundant Activity Audit icon button (accessible directly from bottom menu).
   - Standardized single-line Exit Admin pill and Log Out action buttons across all administrative screens.
   - Uniform card elevation tokens (shadow-card) and typography matching the consumer user panel.

---

### Security and Resilience Features

- **JWT Authentication with Secure Rotation:** Short-lived access tokens (15 minutes) combined with sliding refresh tokens stored securely.
- **Dedicated Token Storage Architecture:** Centralized tokenStorage.ts utility eliminating circular dependencies between auth stores and API clients, preventing page refresh redirect loops.
- **Account Lockout Defense:** Automatic temporary lockout triggered after 5 consecutive failed login attempts to safeguard against brute-force attacks.
- **Knowledge-Based Authentication (KBA):** 3-question recovery verification system for password resets and identity confirmation.
- **Password Strength and Validation Parity:** Real-time 5-point criteria checklist (8+ chars, uppercase, lowercase, number, special character) paired with an animated visual strength bar.
- **Platform Maintenance Mode:** Centralized maintenance screen interceptor with automatic admin bypass capability.
- **Friendly Error Boundaries:** React error boundary presenting plain-language user guidance instead of technical stack traces.
- **Lazy Module Retry Architecture:** Dynamic chunk loader with retry logic (lazyWithRetry.ts) preventing MIME-type or cache invalidation errors on newly deployed assets.

---

## Tech Stack

### Web Client (apps/web)
- React 18 with TypeScript
- Vite 6 bundler
- Tailwind CSS with centralized design tokens (@finance/shared-ui-tokens)
- Lucide React icon suite
- TanStack Query (React Query v5) for server state management
- Zustand for client auth and maintenance state
- React Hook Form and Zod validation

### Backend API (apps/backend)
- Node.js (v20+) with TypeScript
- Express 4 REST API
- Prisma ORM (supports PostgreSQL and MySQL)
- Redis 7 for caching and rate limiting
- BullMQ for recurring transactions and job queues
- Socket.IO for real-time notification broadcasts
- Pino and Pino-HTTP for structured JSON logging
- Prometheus metrics via prom-client

### Monorepo Packages (packages/*)
- @finance/shared-types: Unified TypeScript definitions for Auth, Admin, Transactions, Accounts, and Analytics.
- @finance/shared-ui-tokens: Centralized design system tokens, color palettes, and elevation shadows (shadow-card).
- @finance/api-client: Typed HTTP client with automated Bearer token injection and refresh interceptors.

---

## Monorepo Structure

```
.
+-- apps
|   +-- backend              # Express API server, Prisma schema, background workers
|   +-- web                  # React 18 Vite SPA frontend application
|   +-- mobile               # React Native 0.76 + Expo + NativeWind mobile application
+-- packages
|   +-- api-client           # Shared typed API client
|   +-- shared-types         # Shared data models and DTO interfaces
|   +-- shared-ui-tokens     # Centralized Tailwind design tokens
+-- infra
|   +-- compose              # Docker Compose definitions (dev and prod)
|   +-- docker               # Dockerfiles for backend and web
|   +-- nginx                # Nginx reverse proxy configurations
+-- Plan                     # Technical specifications, architecture docs, PRD
+-- scripts                  # Workspace quality scripts and verification utilities
+-- .env.example             # Environment variable template
+-- package.json             # Root workspace script definitions
+-- pnpm-workspace.yaml      # Monorepo package boundaries
```

---

## Prerequisites

Before running the application locally, ensure your system has:

- **Node.js**: Version 20.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **pnpm**: Version 9.0.0 or higher (run: npm install -g pnpm)
- **Database**: PostgreSQL (v15+) or MySQL (v8.0+), or Docker to run containers automatically
- **Redis** (Optional for local development, fallback is active in development mode): Version 7+

---

## Local Setup and Installation

### Step 1: Clone Repository and Install Dependencies

```bash
git clone https://github.com/MrAkshay143/finance-app.git
cd finance-app

# Install all workspace dependencies
pnpm install
```

### Step 2: Configure Environment Variables

Create a root .env file from the provided template:

```bash
# On Linux / macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

Review and adjust the .env settings to match your local setup:

```env
NODE_ENV=development
PORT=4000
LOG_LEVEL=info

# Database Connection (PostgreSQL example)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_tracker?schema=public"

# If using MySQL instead, set DATABASE_URL to your MySQL instance:
# DATABASE_URL="mysql://root:password@127.0.0.1:3306/finance_tracker"

# Security Secrets (replace with arbitrary strings for local development)
JWT_ACCESS_SECRET=local-development-jwt-access-secret-minimum-32-chars
JWT_REFRESH_SECRET=local-development-jwt-refresh-secret-minimum-32-chars
JWT_RESET_SECRET=local-development-jwt-reset-secret-minimum-32-chars

# Redis (optional for local development)
REDIS_URL="redis://localhost:6379"

# CORS Configuration
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:4000"

# Frontend API URL
VITE_API_URL="http://localhost:4000"
```

### Step 3: Database Setup and Migrations

Ensure your local PostgreSQL or MySQL database service is running, then apply the Prisma migrations:

```bash
# Generate Prisma Client
pnpm --filter @finance/backend prisma:generate

# Apply database migrations
pnpm db:migrate
```

Note: For MySQL environments, a dedicated schema is provided at apps/backend/prisma/schema.mysql.prisma. Copy it over schema.prisma if running on MySQL.

### Step 4: Seed Database

Populate your database with default platform categories, real-world financial accounts, sample transactions, and preconfigured test users:

```bash
pnpm db:seed
```

### Step 5: Run Services Locally

You can run the backend and web client in separate terminal windows:

#### Terminal 1: Backend API Server
```bash
pnpm dev:backend
```
The backend API server starts at http://localhost:4000. Health check is available at http://localhost:4000/healthz.

#### Terminal 2: Web Client
```bash
pnpm dev:web
```
The Vite development server starts at http://localhost:3000 with hot module replacement (HMR).

#### Terminal 3: Background Worker (Optional)
```bash
pnpm dev:worker
```
Runs BullMQ workers for recurring transaction posting and notification processing.

---

## Running with Docker Compose

If you prefer running the entire infrastructure (Database, Redis, Backend, Web, and Nginx) using Docker:

```bash
# Start all containers in the background
docker compose -f infra/compose/docker-compose.yml up -d

# Check running container status
docker compose -f infra/compose/docker-compose.yml ps

# View live logs
docker compose -f infra/compose/docker-compose.yml logs -f

# Stop and remove containers
docker compose -f infra/compose/docker-compose.yml down
```

Once started via Docker, the web application is accessible at http://localhost:3000 and the API at http://localhost:4000.

---

## Default Local Credentials
 
Initial test accounts can be configured via environment variables in your local `.env` file (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STANDARD_USER_EMAIL`, `STANDARD_USER_PASSWORD`):

| User Type | Configured Via (.env) | Default Local Testing Value | Default Redirect |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Configured in local `.env` | `/admin` (Admin Panel) |
| **Standard User** | `STANDARD_USER_EMAIL` / `STANDARD_USER_PASSWORD` | Configured in local `.env` | `/dashboard` (User Dashboard) |

The login page (/login) automatically routes authenticated users to either the Admin Panel or User Dashboard based on their assigned role.

---

## Testing and Quality Assurance

Run the comprehensive test suites across the monorepo:

```bash
# Run all web frontend unit and component integration tests (266 tests)
pnpm --filter @finance/web test

# Run backend unit and integration test suite
pnpm --filter @finance/backend test

# Run complete monorepo test suite
pnpm test

# Verify zero banned placeholder phrases or emoji regressions
pnpm check:placeholders

# Typecheck all packages and applications
pnpm typecheck
```

---

## Production Build and Deployment

To compile all applications and shared packages for production:

```bash
# Build all packages, backend, and web assets
pnpm build
```

The compiled web assets will be generated in apps/web/dist/, and backend JavaScript will be in apps/backend/dist/.

For detailed production deployment instructions, hosting configurations, and CI/CD pipelines, consult [DEPLOYMENT.md](DEPLOYMENT.md).
