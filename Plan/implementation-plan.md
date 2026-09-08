# Implementation Plan (End-to-End Orchestration)

Greenfield build across the monorepo described in `architecture.md`. Each phase ends with an exit checklist tied to `prd.md` §7. No phase starts writing UI before the schema/API contract it depends on is frozen.

All implementation work is executed by specialized sub-agents (`database-agent`, `backend-agent`, `frontend-web-agent`, `mobile-agent`, `devops-agent`, `qa-agent`) governed by strict concurrency gates.

---

## 1. Sub-Agent Roles & Ownership

- **`database-agent`** — Owns `database.md`. PostgreSQL setup, Prisma schema, migrations, seed script. Nothing else touches the schema directly.
- **`backend-agent`** — Owns `backend.md`. Express + TypeScript API (`/api/v1`), auth (access/refresh rotation), services (`balanceService`, `famService`, `recurringService`, `reportService`, `notificationService`, `auditService`), BullMQ workers, Socket.IO namespaces. Depends on `database-agent` schema.
- **`frontend-web-agent`** — Owns the web app in `frontend.md`. React + TS + Vite + Tailwind, matching the 21-screen table and visual spec in `frontend.md` §1–§2 against `UI Snaps/`. Desktop centered mobile container (~390–430px). Depends on `backend-agent` API contracts.
- **`mobile-agent`** — Owns the React Native app in `frontend.md` §5. Mirrors `frontend-web-agent` screens using shared design tokens and API client packages.
- **`devops-agent`** — Owns `architecture.md` infra: Docker Compose, Dockerfiles, Nginx reverse proxy, GitHub Actions CI/CD, monitoring, env validation.
- **`qa-agent`** — Cross-cutting: runs test pyramid (`backend.md` §12, `frontend.md` §6), visual validation against all 21 `UI Snaps/` images, and automated grep gate for banned placeholder copy.

---

## 2. Risk & Ambiguity Flags (Design Discrepancies)

1. **Header & Status Bar Discrepancy on Admin Screens**:
   - `Modern Admin User Dashboard.png`, `Manage User Dashboard UI.png`, `Modern Manage User Mobile Dashboard.png`, `Admin Settings Dashboard with User Controls.png`, `Activity Audit Dashboard UI.png`, and `Finance Tracker About Screen.png` in `UI Snaps/` exhibit bare OS status bars and plain white headers.
   - *Resolution*: Override bare headers. All 21 screens without exception use the unified branded dark navy header block (`#0B1B3A` → `#132A5C`) per `frontend.md` §2 and `prd.md` §4.
2. **Bottom Navigation Discrepancy**:
   - Several screenshots display an older 6-item bottom bar (`Dashboard`, `Transactions`, `Planning`, `Analytics`, `Invest`, `Menu`) or omit the center action button.
   - *Resolution*: Standardized across every screen to the unified 5-item bar: `Home` · `Transactions` · **(+) Raised Center Action FAB** · `Reports` · `More`. Admin features live inside `More` for authorized users.
3. **Typo in Screenshot Title**:
   - `Manage User Dashboard UI.png` titles the screen `"Mannage User"`. In implementation, this is corrected to `"Manage User"`.
4. **Distinct Add vs. Edit Modals**:
   - Add and Edit are strictly separate modal flows with distinct titles (`Add Income`, `Edit Income`, etc.) and contextual primary button labels (`Save Income`, `Update Income`).

---

## 3. Scope Clarification & Open Questions

1. **AI Analysis & Roadmap Scope (Confirmed by Product Owner)**:
   - **All features are delivered in V1**. There is no "Coming in V2" or "Beta (V2)" or placeholder copy.
   - AI Analysis (Monthly Analysis, Forward Projections, Smart Allocation Advice) is delivered in V1 powered by `aiService`.
   - The About Screen provides a full 6-step "How to use" guide, complete FAM calculation breakdown, and feature deliverables list in V1.
2. **Push Notification Provider (`backend.md` §9)**:
   - FCM confirmed for Android. APNs / multi-platform push abstraction for iOS.
3. **Object Storage Target (`architecture.md` §9)**:
   - MinIO used in `docker-compose.yml` for local dev behind standard S3 API. AWS S3 / Cloudflare R2 / MinIO for production.

---

## 4. Phase Breakdown & Concrete Task List

### Phase 0 — Foundations

#### Exit Checklist
- [ ] `docker-compose up` boots Postgres, Redis, MinIO, backend (API + Worker), web, and Nginx cleanly.
- [ ] Prisma schema matches `database.md` and seed script populates system data.
- [ ] Every route in `backend.md` §4 exists as an authenticated stub (`501`) under `/api/v1`.
- [ ] Web and Mobile both render an empty app shell matching `frontend.md` §2 on a phone-width viewport.
- [ ] CI pipeline runs linting, type-checking, unit tests, and the banned-copy grep gate.

#### Tasks
- **`TASK-0.1` [devops-agent] Scaffold Monorepo & Workspaces**
  - *Source*: `architecture.md` §3.
  - *Dependencies*: None.
  - *Verification*: `pnpm install` succeeds across all workspaces (`apps/backend`, `apps/web`, `apps/mobile`, `packages/shared-types`, `packages/shared-ui-tokens`, `packages/api-client`, `infra/`).
- **`TASK-0.2` [devops-agent] Local Docker Compose Stack**
  - *Source*: `architecture.md` §9.
  - *Dependencies*: `TASK-0.1`.
  - *Verification*: `docker compose up -d` boots Postgres, Redis, MinIO, API, Worker, Web, and Nginx in healthy state.
- **`TASK-0.3` [database-agent] Prisma Schema, Migrations & System Seed Script**
  - *Source*: `database.md` §1–§6.
  - *Dependencies*: `TASK-0.1`, `TASK-0.2`.
  - *Verification*: `prisma migrate dev` applies all 16 models; `prisma db seed` populates system categories and default app settings.
- **`TASK-0.4` [backend-agent] Express Skeleton, Middleware & Versioned Route Stubs**
  - *Source*: `backend.md` §1–§4.
  - *Dependencies*: `TASK-0.3`.
  - *Verification*: Express server boots; `GET /healthz` returns `200`; all `/api/v1/*` route stubs return `501`.
- **`TASK-0.5` [frontend-web-agent] Web Shell, Shared Tokens & App Navigation**
  - *Source*: `frontend.md` §2, §4.
  - *Dependencies*: `TASK-0.1`.
  - *Verification*: Centered mobile container (~390–430px) and fixed 5-tab bottom navigation with raised blue FAB render cleanly.
- **`TASK-0.6` [mobile-agent] Mobile Shell & Bottom Tab Navigation**
  - *Source*: `frontend.md` §5.
  - *Dependencies*: `TASK-0.1`, `TASK-0.5`.
  - *Verification*: React Native app boots in simulator showing matching 5-item bottom tabs.
- **`TASK-0.7` [qa-agent] CI Pipeline & Zero-Placeholder Grep Gate**
  - *Source*: `frontend.md` §7, `backend.md` §12.
  - *Dependencies*: `TASK-0.1` to `TASK-0.6`.
  - *Verification*: GitHub Actions runs lint, typecheck, unit tests, and rejects banned copy/emojis in UI code.
- **`TASK-0.8` [qa-agent] Phase 0 Exit Verification**
  - *Source*: `implementation-plan.md` Phase 0 checklist.
  - *Dependencies*: `TASK-0.1` to `TASK-0.7`.
  - *Verification*: All Phase 0 exit checklist items verified and documented.

---

### Phase 1 — Auth, Onboarding & Profile Core

#### Exit Checklist
- [x] Signup → Onboarding → Authenticated Dashboard Shell flow works end-to-end on Web and Mobile.
- [x] Refresh token rotation, token family theft revocation, and account lockout after N failed attempts verified by automated tests.
- [x] 3-question KBA setup persists hashed answers; no security answer is ever returned via API.
- [x] Basic Profile and Finance Profile update and persist to PostgreSQL with BigInt paise conversions.

#### Tasks
- **`TASK-1.1` [backend-agent] Authentication Service & Session Strategy**
  - *Source*: `backend.md` §5, `architecture.md` §5.
  - *Dependencies*: Phase 0.
  - *Verification*: Supertest tests verify token rotation, token family revocation on reuse, and lockout after max failed attempts.
- **`TASK-1.2` [backend-agent] Onboarding, Profile & KBA Endpoints**
  - *Source*: `backend.md` §4, §6, `prd.md` §5.2, §5.14, §5.16.
  - *Dependencies*: `TASK-1.1`.
  - *Verification*: API tests verify answer hashes are never exposed in responses.
- **`TASK-1.3` [frontend-web-agent] Web Auth, Onboarding Wizard & KBA Setup**
  - *Source*: `frontend.md` §3 (Screens #11, #12, #13), `UI Snaps/Modern Security Questions Setup Screen.png`, `UI Snaps/Finance Tracker Profile Screen.png`, `UI Snaps/Finance Tracker Profile Settings.png`.
  - *Dependencies*: `TASK-1.1`, `TASK-1.2`.
  - *Verification*: Playwright test verifies signup → onboarding → profile update.
- **`TASK-1.4` [mobile-agent] Mobile Auth & Profile Screens**
  - *Source*: `frontend.md` §5.
  - *Dependencies*: `TASK-1.3`.
  - *Verification*: Signup and login flow completed on mobile emulator.
- **`TASK-1.5` [qa-agent] Auth & Security Verification Suite**
  - *Source*: `backend.md` §12, `frontend.md` §6.
  - *Dependencies*: `TASK-1.1` to `TASK-1.4`.
  - *Verification*: 100% of auth test matrix passes.

---

### Phase 2 — Accounts & Centralized Transaction System

#### Exit Checklist
- [x] `balanceService` correctly calculates account balances inside a single DB transaction.
- [x] Critical transaction scenarios (Add/Edit/Delete Income, Expense, Transfer) verified against PostgreSQL, Account Balance, and Dashboard summaries.
- [x] Centralized `TransactionFormModal` operates seamlessly across all 8 Add/Edit variants.
- [x] Soft deletion functions with confirmation dialogs and downstream cache updates.

#### Tasks
- **`TASK-2.1` [backend-agent] `balanceService` & Transaction/Transfer Engine**
  - *Source*: `backend.md` §6, `database.md` §3, §4.
  - *Dependencies*: Phase 1.
  - *Verification*: Invariant verified: `currentBalance = openingBalance + credits - debits` in BigInt paise inside Prisma `$transaction`.
- **`TASK-2.2` [backend-agent] Accounts & Transactions CRUD Endpoints**
  - *Source*: `backend.md` §4, `prd.md` §5.4, §5.5.
  - *Dependencies*: `TASK-2.1`.
  - *Verification*: Supertest suite covering full CRUD, soft-deletes, and ownership filtering.
- **`TASK-2.3` [frontend-web-agent] Accounts Dashboard Screen**
  - *Source*: `frontend.md` §3 (Screen #6), `UI Snaps/Finance Tracker Accounts Dashboard.png`.
  - *Dependencies*: `TASK-2.2`.
  - *Verification*: Matches `Finance Tracker Accounts Dashboard.png`; balances update live.
- **`TASK-2.4` [frontend-web-agent] Centralized Transaction System & Modals**
  - *Source*: `frontend.md` §3 (Screen #2), `UI Snaps/transactions.png`.
  - *Dependencies*: `TASK-2.2`.
  - *Verification*: 8 distinct modal states (`Add Income`, `Edit Income`, `Add Expense`, `Edit Expense`, `Add Investment`, `Edit Investment`, `Add Transfer`, `Edit Transfer`) operate with clear titles and button labels.
- **`TASK-2.5` [mobile-agent] Mobile Accounts & Transactions**
  - *Source*: `frontend.md` §5.
  - *Dependencies*: `TASK-2.3`, `TASK-2.4`.
  - *Verification*: Mobile parity verified on emulator.
- **`TASK-2.6` [qa-agent] Transaction Invariant & Balance Regression Suite**
  - *Source*: `prd.md` §88, `backend.md` §12.
  - *Dependencies*: `TASK-2.1` to `TASK-2.5`.
  - *Verification*: All 18 critical transaction test scenarios from `prd.md` §88 pass.

---

### Phase 3 — Dashboard, Planning, Categories & Merchants

#### Exit Checklist
- [x] Dashboard metrics and FAM score match database records and agree with Planning numbers.
- [x] Redis caching active for dashboard summary (`user_id:period`) and invalidates on any transaction write.
- [x] Budgets and Goals CRUD operations round-trip through PostgreSQL with live progress bars.
- [x] System categories are protected from deletion; custom categories support add, edit, and drag reorder.

#### Tasks
- **`TASK-3.1` [backend-agent] `famService` & Dashboard Summary API with Redis Cache**
  - *Source*: `backend.md` §6, `database.md` §7, `prd.md` §5.3.
  - *Dependencies*: Phase 2.
  - *Verification*: Cache invalidation verified by test that mutates data and re-reads dashboard.
- **`TASK-3.2` [backend-agent] Planning (Budgets & Goals), Categories & Merchants APIs**
  - *Source*: `backend.md` §4, `prd.md` §5.6, §5.7, §5.8.
  - *Dependencies*: `TASK-3.1`.
  - *Verification*: Category protection and budget/goal progress calculation verified by API tests.
- **`TASK-3.3` [frontend-web-agent] Dashboard Screen Implementation**
  - *Source*: `frontend.md` §3 (Screen #1), `UI Snaps/dashbaord.png`.
  - *Dependencies*: `TASK-3.1`.
  - *Verification*: Exact element-by-element visual match with `dashbaord.png`.
- **`TASK-3.4` [frontend-web-agent] Planning Screen (Budgets & Goals)**
  - *Source*: `frontend.md` §3 (Screen #3), `UI Snaps/plan.png`.
  - *Dependencies*: `TASK-3.2`.
  - *Verification*: Visual match with `plan.png`; progress meters reflect real transactions.
- **`TASK-3.5` [frontend-web-agent] Categories & Merchants Screens**
  - *Source*: `frontend.md` §3 (Screen #7), `UI Snaps/Modern Finance Tracker Categories UI.png`.
  - *Dependencies*: `TASK-3.2`.
  - *Verification*: Drag-handle reordering persists `sortOrder`; system categories cannot be deleted.
- **`TASK-3.6` [mobile-agent] Mobile Dashboard, Planning & Categories**
  - *Source*: `frontend.md` §5.
  - *Dependencies*: `TASK-3.3` to `TASK-3.5`.
  - *Verification*: Parity verified on iOS/Android emulators.
- **`TASK-3.7` [qa-agent] Dashboard Math & Visual Audit**
  - *Source*: `backend.md` §12, `frontend.md` §6.
  - *Dependencies*: `TASK-3.1` to `TASK-3.6`.
  - *Verification*: Calculations align to the single rupee across dashboard and planning.

---

### Phase 4 — Analytics, Reports, Investments, Recurring, Notifications & Realtime

#### Exit Checklist
- [x] Analytics and Monthly / Year-in-Review Reports show real aggregated data with explicit date ranges.
- [x] BullMQ repeatable jobs (`recurring-transactions`, `reminders`) execute on schedule and materialize due records.
- [x] Socket.IO pushes unread notification count and dashboard refresh events without requiring manual reload.
- [x] Zero placeholder strings ("Coming in V2", "Beta (V2)", "Coming soon", "preview", "TODO", "sample data", "demo data", "lorem ipsum") in production build.

#### Tasks
- **`TASK-4.1` [backend-agent] Analytics & Reports Aggregation Services**
  - *Source*: `backend.md` §6, `prd.md` §5.9, §5.10.
  - *Dependencies*: Phase 3.
  - *Verification*: Report totals match analytics and dashboard for the identical period.
- **`TASK-4.2` [backend-agent] BullMQ Scheduled Workers & Job Definitions**
  - *Source*: `backend.md` §9, `architecture.md` §7.
  - *Dependencies*: `TASK-4.1`.
  - *Verification*: Test simulates financial-month boundary and verifies due recurring transactions materialize.
- **`TASK-4.3` [backend-agent] Realtime Socket.IO Gateway**
  - *Source*: `backend.md` §10, `architecture.md` §6.
  - *Dependencies*: `TASK-4.2`.
  - *Verification*: Socket client receives live `notification:unread-count` and `dashboard:refresh`.
- **`TASK-4.4` [backend-agent] AI Financial Intelligence Service (`aiService`)**
  - *Source*: `backend.md` §6, `prd.md` §5.21.
  - *Dependencies*: `TASK-4.1`.
  - *Changes*: Implement `aiService` and `/api/v1/ai-analysis` endpoint returning structured monthly allocations, forward projections, and smart allocation advice with zero placeholder copy.
  - *Verification*: `GET /api/v1/ai-analysis?month=YYYY-MM` returns valid analysis JSON.
- **`TASK-4.5` [frontend-web-agent] Analytics & Reports Screens**
  - *Source*: `frontend.md` §3 (Screens #4, #5), `UI Snaps/Finance Reports Dashboard – September 2026.png`, `UI Snaps/Finance Tracker Analytics Dashboard.png`.
  - *Dependencies*: `TASK-4.1`.
  - *Verification*: Visual match with reference screenshots; date ranges displayed clearly.
- **`TASK-4.6` [frontend-web-agent] Combined Notifications & Reminders Screen**
  - *Source*: `frontend.md` §3 (Screen #10), `UI Snaps/Finance Tracker Notifications Dashboard.png`.
  - *Dependencies*: `TASK-4.2`, `TASK-4.3`.
  - *Verification*: Visual match with `Finance Tracker Notifications Dashboard.png`; unread badge increments live.
- **`TASK-4.7` [frontend-web-agent] Investments & Recurring Transactions Screens**
  - *Source*: `frontend.md` §3, `prd.md` §5.11, §5.12.
  - *Dependencies*: `TASK-4.2`.
  - *Verification*: Schedules and investment transactions update live.
- **`TASK-4.8` [frontend-web-agent] AI Analysis Dashboard Implementation**
  - *Source*: `frontend.md` §3 (Screen #20), `UI Snaps/Finance Tracker AI Analysis Dashboard.png`, `prd.md` §5.21.
  - *Dependencies*: `TASK-4.4`.
  - *Output*: Month selector, Monthly Analysis card (income/expense/investment allocations), Forward Projection chart, and Suggestions cards. Powered by `aiService` without placeholder copy.
  - *Verification*: CI grep gate confirms zero placeholder copy; analysis renders real calculations.
- **`TASK-4.9` [mobile-agent] Mobile Analytics, Reports, Notifications & Sockets**
  - *Source*: `frontend.md` §5.
  - *Dependencies*: `TASK-4.5` to `TASK-4.8`.
  - *Verification*: Live notifications received on mobile simulator.
- **`TASK-4.10` [qa-agent] Realtime, Scheduling & Placeholder Audit**
  - *Source*: `frontend.md` §7, `backend.md` §12.
  - *Dependencies*: `TASK-4.1` to `TASK-4.9`.
  - *Verification*: Grep audit returns zero matches; recurring transactions materialize accurately.

---

### Phase 5 — Settings, Danger Zone, Admin, Audit & Import/Export

#### Exit Checklist
- [x] Non-admin access to any `/api/v1/admin/*` endpoint is rejected with `403 Forbidden`.
- [x] Every administrative and sensitive action produces an unalterable `AuditLog` record.
- [x] Admin screens adhere strictly to the unified navy header and 5-tab bottom navigation shell.
- [x] CSV import and data export run and parse transactions without corrupting balances (balance invariant maintained).

#### Tasks
- **`TASK-5.1` [backend-agent] Settings, Danger Zone & User Audit APIs**
  - *Source*: `backend.md` §4, `prd.md` §5.17, §5.18.
  - *Dependencies*: Phase 4.
  - *Verification*: Reset profile and delete account actions require confirmation, wipe data cleanly, and log audit events.
- **`TASK-5.2` [backend-agent] Admin Suite APIs & Authorization Enforcement**
  - *Source*: `backend.md` §4, §5, `prd.md` §5.19.
  - *Dependencies*: `TASK-5.1`.
  - *Verification*: Non-admin requests to `/api/v1/admin/*` return `403 Forbidden`.
- **`TASK-5.3` [backend-agent] Object Storage Workers: CSV Import & Data Export**
  - *Source*: `backend.md` §8, `prd.md` §5.20.
  - *Dependencies*: `TASK-5.1`.
  - *Verification*: CSV upload parses and populates transactions in database without corrupting balances.
- **`TASK-5.4` [frontend-web-agent] Menu / More Dashboard & Full About Screen**
  - *Source*: `frontend.md` §3 (Screens #9, #21), `UI Snaps/Finance Tracker Menu Dashboard.png`, `UI Snaps/Finance Tracker About Screen.png`, `prd.md` §5.22.
  - *Dependencies*: `TASK-5.1`.
  - *Output*: Menu screen with grouped navigation. Full About screen featuring app overview, 6-step interactive "How to use" guide (Basic Profile & KBA, Monthly Budget & Targets, Regular Items, Transactions, FAM Score, Planning & Reports), complete FAM score calculation rules, and full V1 deliverables list.
  - *Verification*: Visual match with reference screenshots; admin section renders only for ADMIN users.
- **`TASK-5.5` [frontend-web-agent] Settings Screen & User Audit Log**
  - *Source*: `frontend.md` §3 (Screens #8, #14), `UI Snaps/Modern Finance Tracker Settings Screen.png`, `UI Snaps/Modern Finance Audit Log UI.png`.
  - *Dependencies*: `TASK-5.1`.
  - *Verification*: Settings toggles persist; audit entries reflect actual user operations.
- **`TASK-5.6` [frontend-web-agent] Admin Management Suite Screens**
  - *Source*: `frontend.md` §3 (Screens #15, #16, #17, #18, #19), `UI Snaps/Modern Admin User Dashboard.png`, `UI Snaps/Manage User Dashboard UI.png`, `UI Snaps/Modern Manage User Mobile Dashboard.png`, `UI Snaps/Admin Settings Dashboard with User Controls.png`, `UI Snaps/Activity Audit Dashboard UI.png`.
  - *Dependencies*: `TASK-5.2`.
  - *Verification*: Visual match with reference layouts while enforcing unified navy header and 5-item bottom nav.
- **`TASK-5.7` [frontend-web-agent] CSV Import & Data Export Interfaces**
  - *Source*: `frontend.md` §3, `prd.md` §5.20.
  - *Dependencies*: `TASK-5.3`.
  - *Verification*: CSV upload parses cleanly; report export download functions.
- **`TASK-5.8` [mobile-agent] Mobile Settings, Admin, Audit & Import/Export**
  - *Source*: `frontend.md` §5.
  - *Dependencies*: `TASK-5.4` to `TASK-5.7`.
  - *Verification*: Parity verified across all views.
- **`TASK-5.9` [qa-agent] Security, Admin Authorization & Audit Verification**
  - *Source*: `backend.md` §12, `frontend.md` §6.
  - *Dependencies*: `TASK-5.1` to `TASK-5.8`.
  - *Verification*: 100% of admin security and audit trail checks pass.

---

### Phase 6 — Production Hardening & Mobile Parity

#### Exit Checklist
- [ ] Full regression against the complete `prd.md` §7 acceptance checklist passes.
- [ ] Element-by-element visual validation against all 21 `UI Snaps/` reference images complete.
- [ ] End-to-end Playwright (Web) and Detox/Maestro (Mobile) suites execute cleanly.
- [ ] Structured logging, Sentry error tracking, Prometheus metrics, and Nginx reverse proxy verified.

#### Tasks
- **`TASK-6.1` [frontend-web-agent & mobile-agent] Accessibility & Mobile Polish Pass**
  - *Source*: `frontend.md` §1, `prd.md` §6.
  - *Verification*: Lighthouse accessibility score ≥ 95 on web; accessibility inspector clean on mobile.
- **`TASK-6.2` [devops-agent] Observability, Metrics & Nginx Production Config**
  - *Source*: `architecture.md` §1, §9, §10.
  - *Verification*: Prometheus `/metrics` scrapes cleanly; Sentry logs errors without leaking secrets.
- **`TASK-6.3` [devops-agent] Staging & Production Deployment Pipelines**
  - *Source*: `architecture.md` §8.
  - *Verification*: Local production build (`compose.prod.yml`) boots and serves cleanly.
- **`TASK-6.4` [qa-agent] End-to-End Automated Regression Suite**
  - *Source*: `backend.md` §12, `frontend.md` §6.
  - *Verification*: Full user journey (Signup → Onboarding → Accounts → Transactions → Dashboard → Reports → Admin) passes.
- **`TASK-6.5` [qa-agent] Visual Fidelity Audit & Final PRD §7 Checklist Verification**
  - *Source*: `prd.md` §7, `frontend.md` §1, §3.
  - *Verification*: Formal sign-off report confirming zero defects, zero placeholder text, zero dummy data, and 100% visual and functional compliance.

---

## 5. Execution Sequencing & Concurrency Graph

```mermaid
graph TD
    subgraph Phase 0: Foundations
        T01[TASK-0.1: Monorepo Scaffold] --> T02[TASK-0.2: Docker Compose Stack]
        T01 --> T03[TASK-0.3: Prisma Schema & Seeds]
        T02 --> T03
        T03 --> T04[TASK-0.4: Backend Skeleton & Stubs]
        T01 --> T05[TASK-0.5: Web Shell & Design Tokens]
        T05 --> T06[TASK-0.6: Mobile Shell & Tabs]
        T04 & T05 & T06 --> T07[TASK-0.7: CI & Grep Gate]
        T07 --> T08[TASK-0.8: Phase 0 Verification]
    end

    subgraph Phase 1: Auth & Onboarding
        T08 --> T11[TASK-1.1: Auth & Token Services]
        T11 --> T12[TASK-1.2: Profile & KBA Endpoints]
        T11 & T12 --> T13[TASK-1.3: Web Auth & Onboarding Views]
        T13 --> T14[TASK-1.4: Mobile Auth & Profile Views]
        T13 & T14 --> T15[TASK-1.5: Auth QA & Security Tests]
    end

    subgraph Phase 2: Accounts & Transactions
        T15 --> T21[TASK-2.1: balanceService & Invariants]
        T21 --> T22[TASK-2.2: Accounts/Txns CRUD APIs]
        T22 --> T23[TASK-2.3: Accounts Dashboard Web]
        T22 --> T24[TASK-2.4: Centralized Txn Modals Web]
        T23 & T24 --> T25[TASK-2.5: Accounts & Txns Mobile]
        T25 --> T26[TASK-2.6: Critical Transaction QA Suite]
    end

    subgraph Phase 3: Dashboard & Planning
        T26 --> T31[TASK-3.1: Dashboard API & FAM Cache]
        T26 --> T32[TASK-3.2: Planning & Categories APIs]
        T31 --> T33[TASK-3.3: Web Dashboard Screen]
        T32 --> T34[TASK-3.4: Web Planning Screen]
        T32 --> T35[TASK-3.5: Web Categories Screen]
        T33 & T34 & T35 --> T36[TASK-3.6: Mobile Dashboard & Planning]
        T36 --> T37[TASK-3.7: Dashboard Math & Visual QA]
    end

    subgraph Phase 4: Analytics, Realtime & AI Analysis
        T37 --> T41[TASK-4.1: Analytics & Reports Services]
        T37 --> T42[TASK-4.2: BullMQ Scheduled Workers]
        T42 --> T43[TASK-4.3: Socket.IO Gateway]
        T41 --> T44[TASK-4.4: AI Intelligence Service]
        T41 --> T45[TASK-4.5: Web Analytics & Reports]
        T43 --> T46[TASK-4.6: Web Notifications Screen]
        T42 --> T47[TASK-4.7: Web Investments & Recurring]
        T44 --> T48[TASK-4.8: AI Analysis Dashboard Web]
        T45 & T46 & T47 & T48 --> T49[TASK-4.9: Mobile Analytics, Realtime & AI]
        T49 --> T410[TASK-4.10: Realtime & Scheduling QA]
    end

    subgraph Phase 5: Admin & Import/Export
        T410 --> T51[TASK-5.1: Settings, Danger Zone & Audit APIs]
        T51 --> T52[TASK-5.2: Admin APIs & Guard]
        T51 --> T53[TASK-5.3: CSV Import & Export Workers]
        T51 --> T54[TASK-5.4: Web Menu & About Screens]
        T51 --> T55[TASK-5.5: Web Settings & User Audit]
        T52 --> T56[TASK-5.6: Web Admin Suite Screens]
        T53 --> T57[TASK-5.7: Web CSV Import/Export Views]
        T54 & T55 & T56 & T57 --> T58[TASK-5.8: Mobile Admin & Settings]
        T58 --> T59[TASK-5.9: Admin Security & Audit QA]
    end

    subgraph Phase 6: Hardening & Parity
        T59 --> T61[TASK-6.1: Accessibility Pass]
        T59 --> T62[TASK-6.2: Observability & Nginx Config]
        T62 --> T63[TASK-6.3: Staging/Prod Deployment Pipelines]
        T61 & T63 --> T64[TASK-6.4: Playwright & Detox E2E Suite]
        T64 --> T65[TASK-6.5: Visual Fidelity & Acceptance Sign-off]
    end
```
