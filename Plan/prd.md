# Product Requirements Document (PRD v2)

Finance Tracker is an enterprise-grade personal finance application and administrative platform delivering a unified, mobile-first experience.

## 1. Product Summary

- Product Name: Finance Tracker
- Domain: Personal finance management (income, expense, investment, accounts, budgets, goals, recurring schedules, reports, admin controls).
- Primary Platform: Mobile-first Progressive Web App (PWA) with desktop centered container (~390-430px).
- Companion Mobile App: React Native mobile application (@finance/mobile).
- Production URL: https://finance.imakshay.in
- User Personas:
  1. Standard Consumer: Tracks day-to-day finances, manages multiple accounts, monitors budgets and savings goals, imports bank statements, and analyzes cash flow trends.
  2. System Administrator: Manages platform users, configures default system taxonomy categories, inspects telemetry reports, tracks security audit logs, and controls system parameters.

## 2. Core Non-Negotiable Principles

1. Zero Dummy Data: Every value on screen originates from authoritative backend REST API responses.
2. Zero Placeholder Copy: Banned phrases (such as "Coming soon", "Preview", "Beta", "TODO", "Sample data") are strictly prohibited from shipped code.
3. Backend as Source of Truth: All balances, FAM scores, category shares, and platform GTV figures are computed server-side.
4. Clean Vector SVG Icons: 100% Lucide React SVG icons. Zero text emojis or Unicode character hacks.
5. Standard ASCII Compliance: Technical documentation and copy must use standard ASCII characters without AI-generated em-dashes or curly quotes.

## 3. Functional Requirements

### Consumer Modules
- Authentication: Secure login, signup, forgot password via KBA recovery, and JWT token refresh.
- Account Management: Bank accounts, cash balances, credit cards, investments with atomic dual-entry fund transfers.
- Transaction Tracking: Income, Expense, Investment tagging, merchant metadata, and centralized dynamic pagination.
- Budgets & Goals: Category monthly expenditure caps with visual warnings (Safe, 80% Warning, 100% Exceeded) and savings goals.
- Analytics & Reports: Interactive cash flow trends, spending donut charts, dynamic currency formatting based on user preference, and CSV import/export.
- PWA Features: Offline service worker caching, standalone web manifest, and custom app icon.

### Administrative Modules
- User Directory (/admin): Searchable user listing with status toggle (Active/Suspended), role promotion, temporary password generation, and KBA reset.
- Dedicated Category Management (/admin/categories): Centralized system taxonomy editor with real-time KPI cards (Total, Expense, Income, Invest share %), filter pills, and pagination.
- Platform Reports (/admin/reports): Platform Gross Transaction Volume (GTV), system liquidity breakdown, user progression funnel, and activity index with zero hardcoded currency.
- Security Audit Trail (/admin/audit): Immutable security event log with friendly action formatters and client device detection.
- Platform Settings (/admin/settings): Session timeouts, lockout thresholds, system base currency, cache clearing, and audit log purge horizons.
- Admin Profile (/admin/profile): Credential management, session revocation, and 5-point password validation parity.

## 4. Non-Functional Requirements

- Performance: Sub-200ms API response latency on standard database queries; sub-1.5s initial page load time.
- Security: Bcrypt password hashing, short-lived JWT access tokens (15m), sliding refresh tokens, 5-attempt account lockout, parameterized SQL queries via Prisma.
- Resilience: Centralized ErrorBoundary with user-friendly guidance, platform maintenance interceptor with admin bypass, and lazy chunk load retries.
- Compatibility: Modern web browsers (Chrome, Safari, Firefox, Edge) on mobile and desktop platforms.
