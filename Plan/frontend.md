# Frontend (Web + Mobile)

Web: React + TypeScript + Vite + Tailwind CSS. Mobile: React Native +
TypeScript. Both consume the same `/api/v1` backend and share types/tokens
from `packages/shared-types` and `packages/shared-ui-tokens`.

---

## 1. Frontend Redesign & Production Implementation Principles

The frontend must be implemented and maintained according to strict production standards:

1. **Understand the Existing Architecture**:
   - Inspect the frontend structure, routing, components, layouts, styling system, icon library, state management, and API integration.
   - Reuse existing architecture, reusable components, and API service layers. Do not replace working functionality solely to achieve visual design.
2. **Reference Image as Visual Source of Truth**:
   - For every screen, the corresponding reference image in `UI Snaps/` is the authoritative visual benchmark.
   - Replicate the composition, width, content positioning, padding, margins, typography, font weights, font sizes, colors, cards, borders, corner radius, shadows, buttons, badges, icons, separators, navigation, and safe-area spacing so the screen visually matches the reference.
3. **Mobile App — Not a Responsive Website**:
   - Mobile is the primary target.
   - On desktop, keep the application inside a centered mobile-app viewport (~390–430px wide).
   - Do NOT stretch the UI across the desktop, introduce sidebars, convert bottom navigation into a desktop navbar, or create desktop-only wide layouts. The UI must look like a high-quality native mobile application running inside a desktop frame.
4. **Centralized Design System**:
   - Centralize all colors, typography, spacing, border radii, shadows, buttons, inputs, cards, badges, and layout widths into reusable design tokens.
   - Avoid duplicated CSS, inline styles, and one-off overrides.
5. **Real SVG Icons Only — Absolute Ban on Emojis**:
   - EVERY interface icon must be a proper SVG or vector icon from a consistent icon library.
   - STRICTLY ZERO emojis (🔍, ⚙️, 🔔, 🗑️, 🔑, etc.), Unicode symbols, or text characters masquerading as icons.
   - Maintain uniform stroke weight, fill style, size, alignment, and color behavior.
6. **Existing Backend Must Remain Untouched**:
   - This is a frontend-focused implementation. Preserve backend code, database schema, API contracts, authentication, authorization, business logic, and validation.
   - No mock APIs, fake responses, or simulated data flow.
7. **Preserve All Existing Functionality**:
   - Maintain all routing, forms, validations, modals, filters, search, pagination, loading states, empty states, error states, and permissions.
8. **Real Data Only**:
   - All displayed financial information, balances, FAM scores, user names, and transaction records must come from authoritative backend responses.
   - No dummy records, fake users, hardcoded transaction arrays, or placeholder statistics.
9. **UI Quality & Restraint**:
   - Maintain clean hierarchy, precise alignment, comfortable touch targets, subtle borders and shadows, restrained colors, and accessible contrast.
   - Avoid excessive gradients, clutter, and oversized typography.
10. **Responsive & Mobile Viewport Implementation**:
    - Ensure fluid scrolling, proper keyboard interaction without breaking modal viewports, safe-area inset handling, and fixed bottom navigation.
11. **Code Quality & Component Reuse**:
    - Build reusable UI components (Button, Modal, Input, Card, SegmentedControl, FormSection, etc.) and shared finance components (TransactionForm, FamRing, AccountCard).
12. **Final Element-by-Element Visual Validation**:
    - Verify header, back button, title, cards, typography, buttons, badges, icons, spacing, borders, radius, shadows, scrolling, and bottom navigation against the reference screenshot.

---

## 2. Mobile-App Visual Specification & Design Tokens

### Header
Dark navy branded block (gradient `#0B1B3A` → `#132A5C`), rounded bottom corners, sits above the device status bar rather than recreating one.
- **Root pages (Home/Dashboard)**: Square rounded app icon → "Finance Tracker" bold title + one-line grey subtitle → notification bell with red unread-count badge → circular avatar with a two-tone green/blue progress ring.
- **Nested/detail pages**: Back-chevron + bold page title + grey subtitle + optional right-aligned primary action button, retaining the same navy block.
- **Uniform Application**: This header treatment is used across every screen without exception (including Admin, Manage User, Activity Audit, and About), establishing visual consistency throughout the product.

### Bottom Navigation
Fixed, white background, top hairline border, exactly 5 items:
`Home` · `Transactions` · **raised center filled-blue FAB (+)** · `Reports` (shared slot with Analytics — label reflects whichever is open) · `More`.
- **Active tab**: Brand-blue icon + label.
- **FAB**: Opens the Add-transaction type picker (Income / Expense / Investment / Transfer).

### Color Tokens

| Token | Hex | Use |
|---|---|---|
| `--primary` | `#2554EE` | Primary actions, active nav, FAB, links |
| `--primary-soft` | `#DCE7FF` | Info banners, selected pill backgrounds |
| `--navy-header-start` | `#0B1B3A` | Header gradient start |
| `--navy-header-end` | `#132A5C` | Header gradient end |
| `--success` | text `#1F9D55` / bg `#DFF5E6` | Income, active status, success states |
| `--danger` | text `#E23D3D` / bg `#FDE7E7` | Expense, delete, danger zone |
| `--investment` | text `#7C4DE0` / bg `#EFE7FB` | Investment |
| `--transfer` | text `#2554EE` / bg `#E3ECFF` | Transfer |
| `--warning` | text `#E68A2E` / bg `#FCEFD9` | Reminders, KBA warnings |
| `--surface` | `#FFFFFF` | Cards, modals, sheets |
| `--background` | `#F3F6FC` | Page background |
| `--border` | `#E7ECF5` | Hairline dividers and borders |
| `--text` | `#101828` | Primary headings and text |
| `--text-muted` | `#667085` | Subtitles, captions, helper text |

### Component Guidelines
- **Cards**: ~16–20px corner radius, single subtle drop shadow, soft-color icon chips per row.
- **Buttons**: Pill-shaped, icon + label; primary = filled `--primary`; danger = filled/outlined `--danger`; secondary = light/outlined.
- **Segmented Pill Tabs**: Selected pill filled in semantic/primary color; unselected pills outlined grey.
- **Progress Elements**: 3-segment donut ring for FAM score; thin rounded horizontal bars for budget/target progress.
- **Modals**: Centered, rounded, dimmed backdrop, icon + title + subtitle header, close (×) top-right, soft-grey rounded sub-sections, footer with Cancel (grey) and primary action (blue).
- **Empty States**: Centered line-art illustration in brand-blue tones + bold title + concise supporting copy + primary CTA button.
- **Typography**: Single sans-serif family (Inter or equivalent); page titles bold ~24–28px; section group labels uppercase/small/muted/letter-spaced.
- **Icons**: Line-style SVG only, consistent stroke weight, zero emoji.

### Desktop (Web Only)
No desktop-specific chrome or layout transformation. The mobile shell is centered in a fixed ~390–430px column on wider viewports; the app never stretches into a full-width desktop dashboard.

---

## 3. Screen-by-Screen UI Reference Mapping (from `UI Snaps/`)

Every screen in the application is directly tied to an authoritative visual reference image located in `UI Snaps/`:

| # | Screen / Feature | UI Reference Image Path | Primary Route | Key Visual Elements & Content |
|---|---|---|---|---|
| 1 | **Home / Dashboard** | `UI Snaps/dashbaord.png` | `/` or `/dashboard` | Branded navy header, user avatar with progress ring, FAM 3-segment ring, Income/Expense/Investment target overview cards with progress bars, Security Reminder banner, Expense Overview donut with category breakdown, Account Summary card, Recent Transactions list with empty state CTA. |
| 2 | **Transactions List** | `UI Snaps/transactions.png` | `/transactions` | Header with total count, pill filter tabs (All, Income, Expense, Investment, Transfer), search bar, transaction cards with semantic chips, amounts, and dates, Add Transaction launcher. |
| 3 | **Planning (Budgets & Goals)** | `UI Snaps/plan.png` | `/planning` | Monthly budget cards with progress meters and remaining amounts, Financial Goals with target dates and amounts, Add Budget and Add Goal actions. |
| 4 | **Reports** | `UI Snaps/Finance Reports Dashboard – September 2026.png` | `/reports` | Month selector dropdown, Export PDF action button, FAM performance summary card, Target vs. Actual financial breakdown table, Key improvement areas callout card. |
| 5 | **Analytics** | `UI Snaps/Finance Tracker Analytics Dashboard.png` | `/analytics` | Period selector, 6-month spending trends chart, income vs. expense comparison, category spending breakdown, savings rate meter. |
| 6 | **Accounts Dashboard** | `UI Snaps/Finance Tracker Accounts Dashboard.png` | `/accounts` | Total balance hero card, active account counter, individual bank/institution account cards with balances, status badges, and quick-action row (Transactions, Analytics, Settings), Add Account button. |
| 7 | **Categories Management** | `UI Snaps/Modern Finance Tracker Categories UI.png` | `/categories` | Filter tabs (All, Expense, Income, Investment), System vs. Custom badges, drag reorder affordance, Add/Edit Category modal triggers. |
| 8 | **Audit Log (User)** | `UI Snaps/Modern Finance Audit Log UI.png` | `/audit` | User-scoped audit history, search bar (action/details), category filter pills (Login, Transactions, Profile, Settings, Security), date-grouped event cards with actor and relative timestamps. |
| 9 | **More / Menu Dashboard** | `UI Snaps/Finance Tracker Menu Dashboard.png` | `/menu` or `/more` | Grouped navigation sections: Account (Profile, Settings), Insights & Analytics (Reports, Audit Log, AI Analysis, Insights), Finance (Accounts, Categories, Merchants), Data & Import (Import CSV, Export Data), Support (About, Help), Admin section (for ADMIN role). |
| 10 | **Notifications & Reminders** | `UI Snaps/Finance Tracker Notifications Dashboard.png` | `/notifications` | Combined screen: Due-date reminders configuration card (toggle + reminder days slider) at top; notification list with filter pills (All, Unread, Read), relative timestamps, and "Mark All Read" button below. |
| 11 | **Security Questions (KBA)** | `UI Snaps/Modern Security Questions Setup Screen.png` | `/security/questions` | 3-step setup stepper (Step 1 of 3), question select dropdowns, secure answer inputs, security advisory callout, Back and Continue/Save actions. |
| 12 | **Profile Screen** | `UI Snaps/Finance Tracker Profile Screen.png` | `/profile` | User avatar, name, email, FAM score badge, profile completion progress card, navigation links to Basic Profile, Finance Profile, Accounts, Categories, and Merchants. |
| 13 | **Profile Settings / Finance Profile** | `UI Snaps/Finance Tracker Profile Settings.png` | `/profile/settings` | Monthly finance profile inputs (Income, Expense Budget, Investment Target), Income Range picker, Savings Target, Risk Appetite, Investment Horizon. |
| 14 | **Settings Screen** | `UI Snaps/Modern Finance Tracker Settings Screen.png` | `/settings` | Preferences (Currency, Timezone, Financial Month Start Day), Quick-Add toggle, Dashboard Donut toggles, Feature toggles (Investments, Recurring), Security navigation, Danger Zone (Reset Profile, Delete Account, Log Out). |
| 15 | **Admin Dashboard & Users** | `UI Snaps/Modern Admin User Dashboard.png` | `/admin` or `/admin/users` | Metric summary cards (Total Users, Active Users, Suspended Users, Admins), search input, role & status filters, user table/cards with status badges. |
| 16 | **Manage User Overview** | `UI Snaps/Manage User Dashboard UI.png` | `/admin/users/:id` | Header user card, joined date, last login timestamp, onboarding status, status toggle (Enable/Disable), quick action buttons. |
| 17 | **Manage User (3 Tabs)** | `UI Snaps/Modern Manage User Mobile Dashboard.png` | `/admin/users/:id/manage` | Three-tab sub-navigation: Overview, Permissions, and Security. Manage admin privileges, reset password action, reset KBA action, delete account button. |
| 18 | **Admin App Settings** | `UI Snaps/Admin Settings Dashboard with User Controls.png` | `/admin/settings` | Session timeout in minutes, Maximum failed login attempts threshold, system policy controls, Save Settings button. |
| 19 | **Activity Audit (Admin)** | `UI Snaps/Activity Audit Dashboard UI.png` | `/admin/audit` | System-wide audit log across all users, actor search, action filter, IP address display, timestamp, detailed metadata modal. |
| 20 | **AI Analysis Dashboard** | `UI Snaps/Finance Tracker AI Analysis Dashboard.png` | `/ai-analysis` | Select Month dropdown, Monthly Analysis card (income/expense/investment allocations), Forward Projection chart (savings growth), Suggestions cards (expense optimization, investment growth). Fully functional in V1 with no "Coming in V2" or placeholder copy. |
| 21 | **About & Support Screen** | `UI Snaps/Finance Tracker About Screen.png` | `/about` | Full About view: Application overview, 6-step interactive "How to use Finance Tracker" guide (1. Basic Profile & KBA, 2. Monthly Budget & Targets, 3. Regular Money Items, 4. Record Transactions, 5. Check FAM Score, 6. Plan Ahead & Review Reports), complete FAM score calculation explanation (Expense, Investment, Income grading and overall worst-of-three rule), and comprehensive V1 deliverables list. |

---

## 4. Web App Structure (`apps/web`)

```
src/
├─ app/                 routing (React Router), route guards (auth/admin)
├─ pages/               one folder per screen mapped in Section 3
├─ components/
│  ├─ ui/               Button, Modal, Input, Select, DateInput, Toggle,
│  │                     SegmentedControl, EmptyState, Skeleton, Toast,
│  │                     Card, FormSection, ErrorBanner
│  └─ finance/           TransactionForm (shared field config, used by all
│                        8 Add/Edit variants), AccountCard, FamRing,
│                        CategoryChip, ...
├─ features/            per-domain hooks + local state (transactions/,
│                        accounts/, planning/, analytics/, admin/, ...)
├─ services/
│  ├─ apiClient.ts       thin wrapper over packages/api-client, pinned to
│                        /api/v1, attaches access token, handles 401→refresh
│  └─ socket.ts          Socket.IO client wrapper (notifications/dashboard)
├─ store/                Zustand stores: auth/session, ui (toasts/modals)
├─ hooks/                data-fetching hooks (React Query) per resource
└─ styles/               Tailwind config + design tokens from
                         packages/shared-ui-tokens
```

- **Data Fetching & Server State**: React Query (TanStack Query) for all server state — handles loading/error states, cache invalidation on mutation, and background refetch triggered by `/dashboard` socket events. Zustand is strictly reserved for local UI state (auth session, open modals); server data is never duplicated into Zustand.
- **Forms & Validation**: `react-hook-form` + `zod` resolvers using shared schemas from `packages/shared-types`, ensuring zero drift between client and server validation.
- **Add vs. Edit Modals**: Implemented as a reusable `<TransactionFormModal mode="add"|"edit" type="income"|"expense"|"investment"|"transfer">`, but rendered with distinct titles ("Add Income" vs. "Edit Income") and primary action buttons ("Save Income" vs. "Update Income"). Never present a confusing generic "Save/Edit" modal.

---

## 5. Mobile App Structure (`apps/mobile`)

```
src/
├─ navigation/           React Navigation: bottom tab navigator (Home,
│                        Transactions, Add [modal stack], Reports, More)
│                        matching the 5-item nav, nested stack
│                        navigators per tab for detail screens
├─ screens/               mirrors apps/web/pages 1:1 by feature
├─ components/            same component inventory as web, built with RN
│                        primitives (View/Text/Pressable) + NativeWind
│                        (Tailwind for RN) so the same design tokens apply
├─ services/              same apiClient/socket wrappers as web, using
│                        secure storage (Keychain/Keystore via
│                        react-native-keychain) instead of cookies for the
│                        refresh token
├─ store/                 Zustand (same pattern as web)
└─ hooks/                 React Query (same pattern as web)
```

- **Code Sharing**: `packages/shared-types` (API types + zod schemas), `packages/api-client` (REST + socket wrapper), and `packages/shared-ui-tokens` (colors, spacing, radii) are shared directly.
- **Offline & Poor-Connectivity**: Never claim a save succeeded before the API confirms it. On failure, preserve unsent form input and show a retry affordance rather than discarding data.
- **Push Notifications**: Mobile push (FCM/APNs) is additive to the in-app Socket.IO notification channel.

---

## 6. Testing Strategy

- **Web Unit / Component**: Vitest + React Testing Library — shared components (TransactionFormModal Add-vs-Edit rendering, validation wiring), custom hooks.
- **Mobile Unit / Component**: Jest + React Native Testing Library.
- **Web E2E**: Playwright — full user journeys (signup → onboarding → add account → add income → dashboard updates; admin management flows) against running services.
- **Mobile E2E**: Detox or Maestro — critical flows on a simulator/emulator.
- **Visual Regression**: Snapshot testing of key screens (Dashboard, Transactions, Reports, Accounts) against design tokens to prevent unintended visual drift.

---

## 7. Production-Readiness Rules

- **Zero Banned Placeholders**: Literal strings "coming soon", "coming in v2", "preview", "sample data", "demo data", "lorem ipsum" must not exist in shipped copy — verified by a CI grep gate.
- **Complete States**: Every screen has explicit loading (skeleton), empty (illustration + CTA), and error (retry banner) states wired to real API calls.
- **Clean Navigation**: Any feature not yet built is omitted from navigation rather than shown as a disabled or dummy entry.
