# Frontend Specifications (Web & PWA)

React 18 + TypeScript + Vite 6 + Tailwind CSS. Optimized as a mobile-first Progressive Web App (centered ~390-430px frame on desktop) consuming the /api/v1 REST backend.

## 1. Core Principles

1. Mobile-First Application:
   - Primary viewport is mobile phone width (~390-430px).
   - On desktop, the interface is centered inside a clean app frame. The app never stretches into a wide multi-column layout.
2. Centralized Design System:
   - Reusable design tokens from @finance/shared-ui-tokens.
   - Standard card elevation: shadow-card (0 2px 12px rgba(0, 0, 0, 0.04)).
   - Standard card radius: rounded-2xl (20px).
   - Standard border: border-borderDefault.
   - Standard button styling: pill-shaped, single-line whitespace-nowrap.
3. Zero Emojis:
   - 100% vector SVG icons from Lucide React. Zero text emojis anywhere in the UI.
4. Authority of Backend Data:
   - All numbers, balances, categories, users, and audit logs come from authoritative REST API responses.
5. Dynamic Pagination:
   - Centralized app-style Pagination component that automatically hides when total items fit on 1 page (<= 15 items).
6. Token Storage & Refresh Resilience:
   - Dedicated tokenStorage.ts utility preventing circular dependencies and unwanted redirects on page refresh.
7. User-Friendly Error Resilience:
   - Friendly ErrorBoundary component with plain-language explanations.
   - Platform MaintenanceScreen interceptor with automatic administrator bypass.

## 2. Navigation Architecture

### Consumer Navigation
- AppHeader: Dark navy gradient (#0B1B3A to #132A5C), app icon, title, notifications bell, user avatar.
- Bottom Navigation (5 items):
  1. Home (/dashboard)
  2. Transactions (/transactions)
  3. Raised Action FAB (+) (Opens Add Transaction modal: Income, Expense, Investment, Transfer)
  4. Reports (/reports, shared with /analytics)
  5. More (/menu)

### Administrative Navigation
- AppHeader: Dark navy gradient with streamlined actions:
  - [Exit Admin] pill button: instant switch to personal consumer mode.
  - [Log Out] icon button: instant session termination.
  - Redundant header icon buttons (such as Activity Audit) removed to maintain a clean header.
- Admin Bottom Navigation (5 items):
  1. Users (/admin)
  2. Categories (/admin/categories)
  3. Reports (/admin/reports)
  4. Audit (/admin/audit)
  5. Settings (/admin/settings)

## 3. Screen Catalog (22 Screens)

1. Login (/login): Role-based automatic redirect (Admin -> /admin, User -> /dashboard), 5-attempt lockout countdown.
2. Signup (/signup): Account registration with password strength indicators.
3. Forgot Password (/forgot-password): KBA security question verification and password reset.
4. Onboarding (/onboarding): Initial profile setup, base currency selection, first account setup.
5. Dashboard (/dashboard): Net worth hero card, monthly cash flow, FAM score ring, quick action buttons, recent transactions.
6. Accounts (/accounts): Multi-account balances, account types, transfer modal launcher.
7. Account Details (/accounts/:id): Running balance, account status, and transaction history.
8. Transactions (/transactions): Filterable transaction feed, category tags, search, and dynamic pagination.
9. Planning & Budgets (/planning): Monthly spending limits, category budget bars, consumption warnings.
10. Savings Goals (/planning/goals): Target savings goals, contribution modal, progress percentage rings.
11. Analytics (/analytics): Cash flow trend lines (7d, 30d, 90d, 1y) and spending donut chart.
12. Reports (/reports): Monthly statements, income vs expense breakdowns, JSON/CSV export launcher.
13. Categories & Merchants (/categories): Custom user categories and merchant directory.
14. Recurring Transactions (/recurring): Recurring schedule list, frequency tags, next occurrence dates.
15. Notifications (/notifications): Unread notifications feed and alert preferences.
16. Profile & Settings (/profile, /settings): User personal details, currency preference, and session revocation.
17. Security Questions (/security/questions): Configure 3 KBA recovery questions.
18. About (/about): Feature checklist, calculation explanations, and version info.
19. Admin User Management (/admin, /admin/users/:id): Complete user directory, status toggle, role promotion, password reset.
20. Dedicated Admin Categories (/admin/categories): Global system category taxonomy, KPI cards (Total, Expense, Income, Invest share %), filter pills, search, and pagination.
21. Admin Platform Reports (/admin/reports): Platform GTV, liquidity breakdown, user progression funnel, zero hardcoded currency.
22. Admin Audit & Settings (/admin/audit, /admin/settings, /admin/profile): Immutable audit feed, session timeout policies, system controls, and admin profile with password validation parity.

## 4. Color & Design Tokens

| Token | CSS Class / Hex | Application |
|---|---|---|
| Primary | text-brand-primary / #2554EE | Action buttons, active navigation, links |
| Primary Soft | bg-blue-50 / #DCE7FF | Icon container backgrounds, selected pills |
| Navy Dark | #0B1B3A to #132A5C | Branded AppHeader background gradient |
| Success | text-emerald-600 / bg-emerald-50 | Income, active status, success badges |
| Danger | text-rose-600 / bg-rose-50 | Expenses, delete actions, suspended status |
| Investment | text-purple-600 / bg-purple-50 | Investment transactions and categories |
| Surface | bg-white | Cards, modal sheets, popovers |
| Background | bg-slate-50 / #F8FAFC | App background |
| Border | border-borderDefault / #E2E8F0 | Card outlines and dividers |
| Text Default | text-textDefault / #0F172A | Headings and primary values |
| Text Muted | text-textMuted / #64748B | Subtitles, helper text, captions |
| Card Shadow | shadow-card | Centralized card elevation token |
| Card Radius | rounded-2xl | Centralized 20px card corner radius |
