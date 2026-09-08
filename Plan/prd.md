# Finance Tracker — Product Requirements Document (v2)

Supersedes the original `prd.md` and the earlier "Implementation Plan." This
version folds in the corrections found by comparing the original PRD against
the actual UI screenshots (`UI Snaps/`, 21 screens) and
expands scope to Web + Mobile per the confirmed technology stack (see
`architecture.md`).

## 1. Product

**Name:** Finance Tracker
**Type:** Personal finance management app — income, expenses, investments,
accounts, budgets, goals, analytics, reports, reminders, admin.
**Platforms:** Web (responsive, mobile-first) and native Mobile (iOS/Android
via React Native), sharing one backend API.
**Users:** Regular users; Administrators (same app, elevated permissions).
**Build approach:** Greenfield. There is no pre-existing codebase — build
everything described here from a clean repository (see
`implementation-plan.md` Phase 0).

## 2. Core product rules (apply everywhere, non-negotiable)

- **No dummy data.** Every number on screen comes from a real API response.
  No hardcoded arrays standing in for backend data, ever, in shipped code.
- **No placeholder screens.** The literal strings "Coming soon", "Coming in
  V2", "Preview", "Sample data", "Demo data", "TODO" must never appear in the
  shipped UI. If a feature isn't built for a release, its nav entry is
  removed entirely rather than shown as a stub. (This directly corrects one
  of the source screenshots — see §12.)
- **Backend is the single source of truth** for balances, FAM score,
  recurring-transaction schedules, report totals, and all financial
  calculations. Frontend (web or mobile) only formats and displays results —
  it never recomputes them independently.
- **Add and Edit are always separate UI states** with separate titles and
  button labels (e.g. "Save Income" vs "Update Income") — never a generic
  "Save" shared between both.
- **Every list has explicit loading / empty / error states.** No blank
  screens, no silent failures, no fake success messages.
- **Money** is handled as integer minor units (paise) end-to-end; UI formats
  as `₹1,00,000` (Indian grouping). See `database.md` for storage details.
- **API is versioned** (`/api/v1/...`) from day one; see `architecture.md`.

## 3. Information architecture (corrected against the UI snaps)

**Bottom navigation — 5 items with a raised center action, used identically
on every screen including Admin:**

`Home` · `Transactions` · **(+) Add** (opens Income/Expense/Investment/
Transfer picker) · `Reports` (shared slot — shows Analytics or Reports
depending on which is open) · `More`

Planning and Investments are reached from the Home dashboard and from
`More`, not from the bottom bar. (The original PRD specified a 6-item nav —
Dashboard/Transactions/Planning/Analytics/Investments/Menu — which does not
match the actual designs and is superseded by the above.)

**More / Menu contents:**
- **Account:** Profile, Settings
- **Insights & Analytics:** Reports, Audit Log, AI Analysis, Insights
- **Finance:** Accounts, Categories, Merchants
- **Data & Import:** Import CSV, Export Data
- **Support:** About, Help & Support
- **More:** Integrations
- Admin section (Admin Dashboard, Users, Manage User, App Settings, Activity
  Audit) appears here only for users with the ADMIN role. All features are fully delivered in V1.

## 4. Design system (summary — full spec in `frontend.md`)

- **Header:** dark navy branded block — app icon, "Finance Tracker" title +
  contextual subtitle, notification bell with unread badge, avatar with a
  two-tone progress ring. Nested pages show back-arrow + bold title +
  subtitle + optional right-aligned primary action underneath the same
  navy block.
- **Bottom nav:** as in §3, with a raised filled-blue center FAB.
- **Cards:** ~16–20px radius, subtle single drop shadow, soft-color icon
  chips per row.
- **Semantic colors:** income green, expense red, investment purple,
  transfer blue, warning amber, danger red — exact tokens in `frontend.md`.
- **Buttons:** pill-shaped, icon + label, primary = filled blue, danger =
  filled/outlined red.
- **This same shell and component language applies to Admin screens too** —
  two of the source screenshots (Admin Dashboard, Manage User, Activity
  Audit, About) used an older plain-header/6-tab layout; that is corrected
  here to keep one consistent app experience for every role.

## 5. Feature requirements by module

### 5.1 Authentication
Signup (first/last name, mobile, email, password, confirm), login, logout,
short-lived access token + rotating refresh token (see `architecture.md`),
password reset/change, account lockout after configurable failed attempts,
friendly error states for every failure mode.

### 5.2 Onboarding
Personal details → Monthly finance profile (income/expense-budget/
investment-target) → Financial profile (income range, savings target,
investment experience, risk appetite, investment horizon). Persists via
backend; drives the Dashboard's FAM calculation.

### 5.3 Dashboard (Home)
FAM score ring (green/red/purple 3-segment donut), Income/Expense/Investment
overview cards with progress bars, Security Reminder banner (shown only if
KBA not configured), Expense Overview donut with per-category breakdown,
Account Summary (total balance, active count), Recent Transactions, empty
state with "Add Transaction" CTA when there's no data yet. This screen is
the literal reference implementation — matches the provided `dashbaord.png`.

**Financial Allocation Meter (FAM) Calculation Rules:**
The FAM compares actual transactions this financial month against monthly targets configured in Finance Profile:
- **Expense (lower is better)**: `spent ÷ expense target`
  - `≤ 80%` → **A+ · Excellent**
  - `81–100%` → **B · Good**
  - `> 100%` → **C · Poor**
- **Investment (higher is better)**: `invested ÷ investment target`
  - `≥ 100%` → **A+ · Excellent**
  - `70–99%` → **B · Good**
  - `< 70%` → **C · Poor**
- **Income (higher is better)**: `earned ÷ income target`
  - `≥ 100%` → **A+ · Excellent**
  - `70–99%` → **B · Good**
  - `< 70%` → **C · Poor**
- **Overall Grade**: The worst of the three area grades (if any is C → C · Poor; else if any is B → B · Good; else A+ · Excellent).
- **Progress Ring**: Displays overall progress computed as the average of each area's progress capped at 100%.
- **Not Available State**: FAM displays `—` (Not Available / NA) until the user has completed their basic profile, set the relevant monthly targets, and recorded at least one transaction in the current financial month.

### 5.4 Accounts
List (total balance, active count, account cards with name/institution/
type/balance/status and a per-card Transactions/Analytics/Settings
quick-action row), Add Account, Edit Account (separate modals), Account
Details (balance + related transactions), deactivate via status change
(soft, never a hard delete of a financial record).

### 5.5 Transactions
Types: Income, Expense, Investment, Transfer. List with All/Income/Expense/
Investment/Transfer pill filters, search, backend-driven filter (account,
category, date, amount, status), pagination. Centralized transaction form
system: shared field config and validation, but **Add Income / Edit Income /
Add Expense / Edit Expense / Add Investment / Edit Investment / Add
Transfer / Edit Transfer are separate modal states** with distinct titles
and primary-button labels. Balance recalculation always happens
server-side inside the same DB transaction as the mutation. Soft-delete with
confirmation where supported, with full downstream refresh (account balance,
dashboard, analytics, reports).

### 5.6 Categories
Tabs: All/Expense/Income/Investment. Add/Edit (separate modals), drag-handle
reorder, system categories protected from destructive edits, custom
categories editable per user.

### 5.7 Merchants
List with transaction counts; edit where the schema supports it. No invented
functionality beyond what's modeled.

### 5.8 Planning (Budgets & Goals)
Budgets: name/category, target amount, period, actual spend, remaining,
progress — Add/Edit as separate modals, delete with confirmation. Goals:
name, target amount, current amount, target date, progress — same Add/Edit/
Delete pattern. The hero copy on this screen may honestly reference a real
future roadmap item (e.g. "AI-powered insights coming later") as long as the
budgets/goals features on the same screen are fully functional today — that
is not the same thing as labeling an actually-built feature "coming soon."

### 5.9 Analytics
Income/Expenses/Investments/Savings/Savings-Rate, 6-month spending trend,
category breakdown, monthly trend, target-vs-actual, with an explicit date
range shown on screen at all times. Real data only; a "not enough data yet"
empty state is fine when a period genuinely has none.

### 5.10 Reports
Monthly and Year-in-Review, same source-of-truth data as Analytics/
Dashboard for the same period, Export PDF action, FAM score, target-vs-
actual, category summary table, improvement-area callout.

### 5.11 Investments
Totals, transactions, category split, target/progress, related analytics —
scoped strictly to what the backend actually models; no invented portfolio
accounting.

### 5.12 Recurring Transactions
Add/Edit/Enable-Disable/Delete, next-occurrence computed server-side from
the configured financial-month rules (BullMQ scheduled job — see
`backend.md`).

### 5.13 Notifications & Reminders — single combined screen
Corrects the original PRD's two-screen design: one screen with a "Due-date
reminders" settings panel (toggle + "remind me N days before" selector) at
the top, and the notification list (All/Unread/Read filter, mark-read/
mark-all-read, relative timestamps) below it. Realtime unread-count updates
pushed via WebSocket where the client is connected; falls back to normal
fetch/poll otherwise.

### 5.14 Security Questions (KBA)
Exactly 3 questions, uniqueness enforced, stepper UI (Question 1 of 3 →
2 → 3 → Save), answers hashed and never returned by any API.

### 5.15 Change Password
Current/new/confirm, backend validation, strength rules, session behavior
per backend policy (typically: revoke other sessions on change).

### 5.16 Profile
Overview (name, email, FAM score, profile completion %), Basic Profile
(personal details, email read-only if policy requires), Finance Profile
(monthly targets + financial profile fields), links to Accounts/Categories/
Merchants and Integrations.

### 5.17 Settings
Preferences (currency, timezone, financial month start), Notifications &
Reminders links, Quick-add toggle, Dashboard donut toggles (income/expense/
investment), Feature toggles (Investments, Recurring Transactions), Security
(Change Password, Security Questions), Danger Zone (Reset Profile, Delete My
Account, Log Out) — every destructive action requires explicit confirmation
and executes server-side only.

### 5.18 Audit Log (user-scoped) and Activity Audit (admin, all users)
User-scoped: search + filter (Login/Transactions/Profile/Settings/Security),
grouped by date. Admin: same pattern plus an "Admin" filter and cross-user
search by email/action/details. Real backend records and timestamps only.

### 5.19 Admin
Dashboard (Total/Active/Suspended Users, Admins — real counts), User List
(search/filter/pagination), **Manage User as three tabs — Overview,
Permissions, Security** (disable/enable, make/remove admin, reset password,
reset KBA, delete, all server-authorized), App Settings (session timeout,
max failed attempts, loaded from and saved to the backend), Activity Audit.
Uses the exact same app shell as the rest of the product (§4).

### 5.20 Import / Export
Import CSV: file select → validate → preview → map → import → duplicate
handling → result, always processed backend-side (queued job for large
files — see `backend.md`). Export Data: request a full data export,
generated async, delivered as a downloadable file from object storage.

### 5.21 AI Analysis (Full V1 Feature)
AI-powered financial intelligence is delivered as a core V1 feature:
- **Select Month**: View AI analysis across any past or current financial month.
- **Monthly Analysis**: Analyzes income, expenses, and investment allocations against targets.
- **Forward Projection**: Visualizes projected savings growth and potential milestone achievement.
- **Personalized Suggestions**: Actionable recommendations for optimizing category budgets and growing investments.
- **No Placeholder Copy**: Zero instances of "Coming in V2", "Beta (V2)", or "Not Configured". Powered by backend `aiService` with built-in heuristic financial intelligence and configurable LLM integration.

### 5.22 About the Application & How to Use (V1 Feature)
Full dedicated screen matching `UI Snaps/Finance Tracker About Screen.png` reachable via `Menu → Support → About`:
- **About the Application**: "Finance Tracker is a personal finance companion that helps you understand where your money goes and how well you're allocating it. Track income, expenses, and investments in one place, set monthly targets, and get a clear picture of your financial health through the Financial Allocation Meter (FAM)."
- **How to Use Finance Tracker (6-Step Interactive Guide)**:
  1. *Set up your basic profile*: Go to `Menu → Profile → Basic Profile` and fill in personal details, then set security questions (KBA) for password recovery. Enable Investments in `Menu → Settings → Features`.
  2. *Set your monthly budget & targets*: In `Profile → Finance Profile`, set monthly income, expense budget, and investment target.
  3. *Tell the app your regular money items*: Select regular items (salary, rent, SIP, FD...) and enter amounts. Unallocated amounts show as Miscellaneous.
  4. *Record your transactions*: Whenever money moves, add it under `Transactions` (Income, Expense, Investment, Transfer).
  5. *Check your FAM score*: Dashboard displays your monthly grade (Excellent / Good / Poor) comparing actual spending, investing, and income against targets.
  6. *Plan ahead & review reports*: Use `Planning` for category budgets and goals. Use `Menu → Reports` for planned vs actual breakdowns, monthly FAM, and Year-in-Review.
- **What It Delivers in V1**:
  - Income, expenses, investments & transfers tracking across multiple accounts.
  - Financial Allocation Meter (FAM) monthly health grade.
  - Planned vs. Actual breakdowns with interactive donut charts.
  - Budgets and long-term financial goals.
  - Analytics (savings rate, category/merchant breakdowns, 6-month spending trends).
  - Due-date reminders for recurring expenses & investments.
  - Audit trail of recorded transactions.
  - Account balances and net-worth views.
  - Automated CSV data import & export.
  - AI-powered insights, forward projections, and smart allocation advice.
  - Security Questions (KBA) and robust account management.
  - Realtime notification push and multi-session synchronization.

## 6. Non-functional requirements

- **Accessibility:** semantic HTML/RN equivalents, labeled controls,
  keyboard and screen-reader support on web, accessible touch targets and
  labels on mobile.
- **Performance:** paginated lists, debounced search, cached read-heavy
  aggregates (Redis) with invalidation on writes.
- **Security:** ownership enforced server-side on every resource, admin
  authorization enforced server-side, rate limiting, structured audit
  logging, no secrets in client bundles.
- **Realtime:** WebSocket used only where it adds real value (live unread
  notification count, live account-balance refresh after a mutation from
  another device); everything else is plain request/response.
- **Observability:** structured logs, error tracking, and metrics from day
  one — see `architecture.md`.

## 7. Acceptance checklist (condensed)

- [ ] Auth (signup/login/logout/refresh/lockout/password change) works end-to-end
- [ ] Onboarding persists to the real profile
- [ ] Dashboard, Accounts, Transactions (all 4 types + transfer), Categories,
      Merchants fully CRUD against the real API with correct balance updates
- [ ] Budgets & Goals CRUD
- [ ] Analytics and Reports agree with Dashboard for the same period
- [ ] Investments, Recurring Transactions, Notifications & Reminders working
      end-to-end, including scheduled/queued jobs
- [ ] Security Questions, Change Password, Profile, Settings complete
- [ ] Admin (unified shell), Manage User (3 tabs), App Settings, Audit Log
      (user) and Activity Audit (admin) complete and server-authorized
- [ ] Import CSV / Export Data working via background jobs
- [ ] No placeholder/banned copy anywhere; no dummy data anywhere
- [ ] Web and Mobile both consume the same versioned API and design system
