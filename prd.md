# ============================================================ FINANCE TRACKER FULL PROJECT PRD FRONTEND + BACKEND + SQLITE + ADMIN + SECURITY

## DOCUMENT PURPOSE

Build, complete, modernize and productionize the existing Finance Tracker
application.

The project is an existing full-stack application.

CURRENT BACKEND:

- Node.js
- Existing backend/API implementation
- Existing authentication and business logic
- Existing SQLite database

PRIMARY OBJECTIVE: Create a complete, production-quality Finance Tracker web
application with a highly polished mobile-app-style frontend while preserving
and reusing the existing backend, APIs, SQLite database, authentication,
business rules and already-configured functionality.

IMPORTANT: THIS IS NOT A BACKEND REWRITE.

The existing backend and SQLite database are the source of truth.

Do not replace:

- Node.js backend
- SQLite
- existing database
- existing authentication system
- existing API architecture
- existing business rules
- existing configured functionality

unless an actual bug or missing integration makes a change absolutely necessary.

============================================================

1. CORE DEVELOPMENT RULES
   ============================================================

## 1.1 EXISTING SYSTEM FIRST

Before changing code:

1. Inspect the entire existing project.
2. Understand the existing frontend.
3. Understand the existing Node.js backend.
4. Inspect all API routes.
5. Inspect controllers/services.
6. Inspect authentication.
7. Inspect authorization.
8. Inspect SQLite schema.
9. Inspect migrations if present.
10. Inspect existing database relationships.
11. Inspect existing validation.
12. Inspect existing configuration.
13. Inspect all existing features.
14. Identify which frontend screens already consume backend data.
15. Reuse existing functionality wherever possible.

Do not assume database fields or API routes.

Use the actual existing implementation.

If an existing endpoint already performs a function, consume that endpoint
instead of creating a duplicate endpoint.

## 1.2 NO DUMMY DATA

Absolutely no dummy/mock/demo data in the production UI.

Never create:

const users = [...] const transactions = [...] const accounts = [...] const
reports = [...]

to simulate backend data.

All displayed financial information must come from the real backend.

Do not hardcode:

- account balances
- transaction amounts
- usernames
- email addresses
- reports
- analytics
- notification records
- audit records
- user counts
- FAM scores
- dates
- financial values

except for genuine static UI labels and configuration values.

## 1.3 NO LOCALSTORAGE AS DATABASE

Do not use localStorage as a replacement for SQLite.

Temporary frontend state is allowed, but persistent application data must remain
in the existing backend/database.

## 1.4 BACKEND SOURCE OF TRUTH

The backend remains authoritative for:

- authentication
- users
- authorization
- accounts
- balances
- transactions
- categories
- budgets
- goals
- financial profiles
- investments
- recurring transactions
- notifications
- security questions
- reports
- analytics calculations where already implemented
- audit logs
- admin actions

# ============================================================ 2. PRODUCT

PRODUCT NAME: Finance Tracker

PRODUCT TYPE: Personal finance management application.

PRIMARY USERS:

- Regular users
- Administrators

CORE PURPOSE: Allow users to manage personal finances, track income and
expenses, manage investments, monitor accounts, create budgets/goals, analyze
financial performance and receive reminders.

# ============================================================ 3. TECHNOLOGY REQUIREMENTS

BACKEND:

- Existing Node.js application
- Reuse existing backend framework and architecture
- Reuse existing middleware
- Reuse existing authentication
- Reuse existing API contracts wherever possible

DATABASE:

- Existing SQLite database
- Do not migrate to another database
- Preserve existing tables
- Preserve existing relationships
- Preserve existing data
- Preserve existing IDs
- Preserve existing constraints

FRONTEND:

- Use the existing frontend technology already present in the project.
- Do not introduce an unnecessary framework migration.
- Build reusable components.
- Keep the architecture maintainable.

ICONS:

- SVG icons only
- Use a proper icon library or existing SVG system
- No emoji icons
- No Unicode emoji used as interface icons

# ============================================================ 4. UI/UX PRODUCT DIRECTION

The application must feel like a premium native mobile finance app.

Although technically a web application, the visual result must NOT look like a
traditional desktop website.

DESIGN CHARACTERISTICS:

- modern
- clean
- compact
- professional
- polished
- trustworthy
- financial-product quality
- light mode
- subtle shadows
- rounded cards
- clean typography
- clear hierarchy
- controlled spacing
- minimal visual noise
- strong primary actions

PRIMARY COLOR: Use the existing blue brand direction where appropriate.

SEMANTIC COLORS:

- Income: green
- Expense: red
- Investment: purple
- Transfer: blue
- Warning: amber/orange
- Danger: red
- Neutral: slate/gray

Do not overuse colors.

# ============================================================ 5. MOBILE-FIRST APPLICATION SHELL

The application must be designed around a mobile viewport.

MOBILE:

- full-width application
- top system-safe area
- compact application header
- scrollable content
- fixed bottom navigation

DESKTOP: The application must remain visually equivalent to a mobile app.

Do NOT stretch the application into a full-width desktop dashboard.

On desktop:

- center the mobile application
- maintain mobile-like proportions
- maintain mobile spacing
- maintain bottom navigation
- maintain card hierarchy
- prevent huge empty horizontal layouts

The desktop should look like a polished mobile application displayed inside a
desktop viewport.

# ============================================================ 6. SYSTEM CONTEXT / STATUS BAR

The application must use a standard mobile-app system context.

Do not create an oversized fake status bar.

System context should be:

- compact
- standard
- unobtrusive
- consistent

Where the browser/device provides system status UI, do not unnecessarily
recreate it inside the application.

Application header must not become excessively tall.

# ============================================================ 7. GLOBAL HEADER

Header may contain:

- back button
- page title
- optional subtitle
- contextual action

For the main application:

- logo
- Finance Tracker
- welcome message
- notification indicator
- profile/avatar

Keep header compact.

Do not repeat unnecessary branding on every nested screen.

# ============================================================ 8. GLOBAL BOTTOM NAVIGATION

PRIMARY NAVIGATION:

1. Dashboard
2. Transactions
3. Planning
4. Analytics
5. Investments
6. Menu

Each item:

- real SVG icon
- label
- active state
- inactive state
- accessible name

The active navigation item must be visually obvious.

Bottom navigation:

- fixed
- safe-area aware
- compact
- clean
- consistent

Nested pages may preserve the global navigation where appropriate.

# ============================================================ 9. AUTHENTICATION

Authentication must use the existing backend.

FEATURES:

- Sign up
- Login
- Logout
- Session handling
- Password reset/change where already supported
- Authentication errors
- Account lock behavior where configured

Never implement authentication only on the frontend.

Backend authorization remains authoritative.

# ============================================================ 10. SIGN UP

Signup is a separate onboarding experience.

FIELDS:

- First Name
- Last Name
- Mobile Number
- Email Address
- Password
- Confirm Password

VALIDATION:

- required fields
- valid email
- valid mobile
- password rules
- password confirmation
- duplicate account detection
- backend validation

UX:

- clear field labels
- inline errors
- password visibility toggle
- loading state
- submit state
- success handling
- backend error handling

Do not make signup look identical to the authenticated application dashboard.

# ============================================================ 11. FINANCIAL ONBOARDING

After signup, the user should complete the financial profile.

SECTION: PERSONAL DETAILS

Fields:

- First Name
- Last Name
- Mobile Number
- Email Address
- Date of Birth
- Address

SECTION: MONTHLY FINANCE PROFILE

Fields:

- Monthly Income
- Monthly Expense Budget
- Monthly Investment Target

SECTION: FINANCIAL PROFILE

Fields:

- Income Range
- Savings Target
- Investment Experience
- Risk Appetite
- Investment Horizon

INCOME RANGE:

- Below INR 25K
- INR 25K-INR 50K
- INR 50K-INR 1L
- INR 1L-INR 2L
- INR 2L-INR 5L
- Above INR 5L

INVESTMENT EXPERIENCE:

- Beginner
- Intermediate
- Advanced

RISK APPETITE:

- Conservative
- Moderate
- Aggressive

INVESTMENT HORIZON:

- Short Term
- Medium Term
- Long Term

All values must persist through the existing backend.

# ============================================================ 12. DASHBOARD

Dashboard is the primary financial overview.

HEADER:

- logo
- Finance Tracker
- welcome message
- notification icon
- unread notification indicator
- user avatar

FINANCIAL ALLOCATION METER: Display:

- FAM Score
- income target
- expense target
- investment target
- actual progress
- overall score/progress

Do not fake FAM values.

SECURITY REMINDER: If security questions are not configured: show a compact
reminder.

If configured: do not show unnecessary reminder.

EXPENSE OVERVIEW:

- target
- actual
- progress
- percentage

INCOME OVERVIEW:

- target
- actual
- progress
- percentage

INVESTMENT OVERVIEW:

- target
- actual
- progress
- percentage

ACCOUNT SUMMARY:

- total balance
- active account count
- account-wise balances

RECENT TRANSACTIONS: Load actual backend transactions.

EMPTY STATE: If there are no transactions, explain how to add the first
transaction.

# ============================================================ 13. ACCOUNTS MODULE

Accounts are a CORE feature.

LIST: Display:

- Total Balance
- Active Account Count
- account cards

Each account card may display:

- account name
- institution/bank
- account type
- balance
- status

The exact fields must follow the existing database model.

ADD ACCOUNT: Create an Add Account modal/page.

Use actual supported backend fields.

Possible fields:

- Account Name
- Bank/Institution
- Account Type
- Opening Balance
- Account Identifier
- Status

Do not invent fields that do not exist in the current backend.

EDIT ACCOUNT: Separate Edit Account modal/page.

The edit form must:

- load actual data
- prefill fields
- validate
- update backend
- refresh UI

ACCOUNT DETAILS: Show:

- account information
- current balance
- related transactions
- account activity

ACCOUNT BALANCE: Balance must remain consistent with backend transaction rules.

ACCOUNT DEACTIVATION: Use existing backend behavior.

Do not permanently delete financial records if the existing backend uses soft
deletion/deactivation.

# ============================================================ 14. TRANSACTIONS

Transaction types:

- Income
- Expense
- Investment
- Transfer

TRANSACTION LIST: Support:

- All
- Income
- Expense
- Investment
- Transfer

SEARCH: Search:

- description
- reference
- supported transaction fields

FILTER: Support backend-supported:

- transaction type
- account
- category
- date
- amount
- status

Pagination should be used when transaction volume becomes large.

# ============================================================ 15. CENTRALIZED TRANSACTION FORM SYSTEM

Transaction forms must be centralized.

The system should support:

Transaction Type | +-- Income +-- Expense +-- Investment +-- Transfer | +-- Add
+-- Edit

Field configuration should be reusable.

Validation should be centralized.

However:

IMPORTANT: ADD AND EDIT MODALS MUST BE SEPARATE EXPERIENCES.

Do NOT create a confusing single modal titled: "Add/Edit Transaction"

Instead:

- Add Income
- Edit Income
- Add Expense
- Edit Expense
- Add Investment
- Edit Investment
- Add Transfer
- Edit Transfer

can use shared underlying components while maintaining separate modal states and
clear titles/actions.

# ============================================================ 16. ADD INCOME

MODAL TITLE: Add Income

FIELDS:

- Amount (INR )
- Description (optional)
- Date
- Account
- Category
- Direction

DIRECTION:

- Credit (in)
- Debit (out)

PRIMARY ACTION: Save Income

SECONDARY: Cancel

MODAL:

- compact
- mobile width
- centered
- rounded
- proper backdrop
- close icon
- loading state
- validation
- backend error state

# ============================================================ 17. EDIT INCOME

IMPORTANT: Edit Income must be a separate edit experience.

TITLE: Edit Income

LOAD: Existing transaction data from backend.

FIELDS:

- Amount
- Description
- Date
- Account
- Category
- Direction

PRIMARY ACTION: Update Income

SECONDARY: Cancel

ON UPDATE:

1. validate
2. send existing transaction ID
3. call existing backend API
4. update SQLite through backend
5. refresh transaction list
6. refresh account balance if affected
7. refresh dashboard values
8. refresh analytics/report data where applicable

Never simply change frontend state and pretend it was saved.

# ============================================================ 18. ADD EXPENSE

TITLE: Add Expense

FIELDS:

- Amount
- Description
- Date
- Account
- Category
- Direction where supported

PRIMARY: Save Expense

Use expense semantic color carefully.

# ============================================================ 19. EDIT EXPENSE

Separate Edit Expense modal.

Load existing record.

PRIMARY: Update Expense

All changes must persist to backend.

# ============================================================ 20. ADD INVESTMENT

TITLE: Add Investment

FIELDS based on actual backend model.

Possible:

- Amount
- Description
- Date
- Account
- Category
- Direction

PRIMARY: Save Investment

# ============================================================ 21. EDIT INVESTMENT

Separate Edit Investment modal.

Load actual backend record.

PRIMARY: Update Investment

# ============================================================ 22. TRANSFERS

Transfer supports:

- Source Account
- Destination Account
- Amount
- Date
- Description/Reference

Rules:

- source and destination must differ
- amount must be valid
- backend remains responsible for balance updates
- transaction consistency must be maintained

# ============================================================ 23. TRANSACTION DELETE

If delete is supported by existing backend:

1. Ask for confirmation.
2. Clearly explain consequence.
3. Call backend.
4. Refresh affected data.

Never delete only from frontend.

Use soft delete if existing backend architecture requires it.

# ============================================================ 24. CATEGORIES

CATEGORY LIST:

Tabs:

- All
- Expense
- Income
- Investment

Actions:

- Add
- Edit
- Reorder if supported

Each category:

- name
- type
- system/custom status
- action

SYSTEM CATEGORIES: Do not allow destructive modification if backend prevents it.

CUSTOM CATEGORIES: Allow modification according to backend permissions.

# ============================================================ 25. MERCHANTS

If already supported by backend:

Display:

- merchant name
- transaction count
- related transaction information
- edit/management controls if supported

Do not invent unsupported merchant functionality.

# ============================================================ 26. PLANNING

PLANNING CONTAINS:

- Budgets
- Goals

---

## 26.1 BUDGETS

Budget:

- name/category
- target amount
- period
- actual spending
- remaining
- progress

ADD BUDGET: Separate Add Budget modal.

EDIT BUDGET: Separate Edit Budget modal.

DELETE: Use confirmation and backend operation.

---

## 26.2 GOALS

Goal:

- name
- target amount
- current amount
- target date
- progress

ADD GOAL EDIT GOAL DELETE GOAL

Use backend-supported fields only.

# ============================================================ 27. ANALYTICS

Analytics must display REAL data.

No: "Coming in V2" "Preview" "Dummy chart" "Sample data"

unless a feature genuinely does not exist in the backend.

CORE ANALYTICS:

- Income
- Expenses
- Investments
- Savings
- Savings Rate
- Spending Trend
- Category Breakdown
- Monthly Trend
- Target vs Actual

DATE FILTER:

- current month
- previous month
- custom range if supported

Charts must be readable on mobile.

Do not overcrowd charts.

# ============================================================ 28. REPORTS

REPORT TYPES:

- Monthly
- Year in Review

MONTHLY REPORT:

Display:

- report month
- FAM score
- income
- expenses
- investments
- savings
- target vs actual
- improvement areas

YEAR IN REVIEW: Display annual financial summary using actual data.

Do not show fake "V2" placeholders when the backend already supports the
functionality.

If backend truly does not implement a requested calculation, show a professional
unavailable state rather than fake data.

# ============================================================ 29. FAM SCORE

FAM Score must use the application's existing backend/business logic.

Do not independently invent a different scoring algorithm in frontend.

Display:

- score
- percentage
- relevant contributing values
- improvement guidance where available

If FAM calculation is backend-defined, frontend must display backend result.

# ============================================================ 30. INVESTMENTS

Investment module supports existing configured investment features.

Display:

- total investment
- investment transactions
- categories
- investment target
- progress
- related analytics

If investment portfolio functionality exists in backend, expose it through the
UI.

Do not invent unsupported portfolio accounting.

# ============================================================ 31. RECURRING TRANSACTIONS

If enabled in existing system:

Support:

- recurring income
- recurring expense
- recurring investment

Fields according to backend model:

- amount
- description
- account
- category
- schedule
- next occurrence
- status

Actions:

- Add
- Edit
- Enable/Disable
- Delete if supported

# ============================================================ 32. NOTIFICATIONS

NOTIFICATIONS PAGE:

Display:

- unread count
- notifications
- relative timestamp
- title
- message
- read/unread state

Actions:

- mark read
- mark all read

NOTIFICATION SETTINGS:

- due-date reminders
- reminder timing

Notifications must be based on real application state.

# ============================================================ 33. REMINDERS

Reminder functionality may include:

- recurring expense reminder
- recurring investment reminder
- financial month-end reminder

Reminder timing must use configured financial month.

Do not hardcode month-end logic in frontend if backend already defines it.

# ============================================================ 34. SECURITY QUESTIONS / KBA

Security Questions flow:

STEP 1: Question 1 Answer

STEP 2: Question 2 Answer

STEP 3: Question 3 Answer

STEP 4: Save

Requirements:

- exactly backend-supported number of questions
- prevent duplicate questions if backend requires uniqueness
- secure answer handling
- clear validation
- progress indicator
- next/back behavior where appropriate

Never expose stored answers.

# ============================================================ 35. CHANGE PASSWORD

Fields:

- Current Password
- New Password
- Confirm New Password

Requirements:

- backend validation
- password strength
- confirmation
- loading
- success
- error
- logout/session behavior according to backend

# ============================================================ 36. PROFILE

PROFILE OVERVIEW:

Display:

- name
- email
- FAM Score
- profile completion
- financial profile completion

SECTIONS:

PROFILE:

- Basic Profile
- Finance Profile

FINANCE:

- Accounts
- Categories
- Merchants

MORE:

- Integrations if already supported

# ============================================================ 37. BASIC PROFILE

Fields:

- First Name
- Last Name
- Mobile Number
- Email Address
- Date of Birth
- Address

Email may be read-only if existing backend requires it.

Use existing backend permissions.

# ============================================================ 38. FINANCE PROFILE

Display/edit:

- monthly income
- expense budget
- investment target
- income range
- savings target
- investment experience
- risk appetite
- investment horizon

# ============================================================ 39. SETTINGS

GROUPS:

PREFERENCES

- Currency
- Timezone
- Financial Month Start

QUICK ACTIONS

- Quick-add button

DASHBOARD DONUTS

- Income donut
- Expense donut
- Investment donut

FEATURES

- Investments
- Recurring Transactions

NOTIFICATIONS

- Notifications
- Reminders

SECURITY

- Change Password
- Security Questions

DANGER ZONE

- Reset Profile
- Delete My Account
- Log Out

# ============================================================ 40. QUICK-ADD

If enabled:

A floating "+" action should be available from Dashboard or configured
locations.

Quick actions:

- Add Income
- Add Expense
- Add Investment
- Transfer

It must use the same centralized transaction form system.

# ============================================================ 41. RESET PROFILE

Reset Profile must be treated as a destructive action.

Before execution:

- show confirmation
- explain what will be reset
- distinguish profile reset from account deletion

Call backend.

Do not perform destructive database operations from frontend.

# ============================================================ 42. DELETE MY ACCOUNT

Danger Zone action.

Requirements:

- strong confirmation
- clear warning
- backend authorization
- backend deletion/soft deletion rules
- logout after successful deletion

Never delete directly from SQLite in frontend.

# ============================================================ 43. LOGOUT

Logout must use existing authentication/session mechanism.

After logout:

- clear appropriate frontend state
- redirect to login
- prevent protected-page access

# ============================================================ 44. AUDIT LOG

Audit Log is an important security/admin feature.

Display actual audit records.

SEARCH:

- email
- action
- details

Each record:

- action
- actor
- email/user
- timestamp
- relevant details

Examples:

- Login
- Logout
- Password change
- User update
- Account action
- Transaction action
- Admin action

Do not fabricate audit events.

Timestamps must come from backend.

# ============================================================ 45. ADMIN PANEL

Admin is part of the same application ecosystem.

Admin screens must use the same modern mobile-app design language.

ADMIN DASHBOARD:

Metrics:

- Total Users
- Active Users
- Suspended Users
- Admins

Use actual backend values.

# ============================================================ 46. ADMIN USER LIST

Display:

- avatar/initial
- name
- email
- role
- status

Search:

- name
- email

Filters:

- role
- status

Pagination where needed.

# ============================================================ 47. MANAGE USER

USER SUMMARY:

- avatar
- name
- email
- role
- status

ACCOUNT INFORMATION:

- joined date
- last login
- onboarding status
- user ID

ACTIONS:

- Disable
- Enable where supported
- Make Admin
- Remove Admin where supported
- Reset Password
- Reset KBA

DANGER:

- Delete Account

Every action must call the existing backend.

# ============================================================ 48. ADMIN APP SETTINGS

Existing application-level settings may include:

- session timeout
- maximum failed attempts

Display current backend configuration.

Allow modification only if authorized.

Save through existing backend API.

Do not hardcode current values.

# ============================================================ 49. DATABASE REQUIREMENTS

DATABASE: SQLite.

IMPORTANT: Do not replace the database.

Before implementation: inspect actual SQLite schema.

Identify actual tables for:

- users
- sessions/authentication if applicable
- profiles
- finance profiles
- accounts
- transactions
- categories
- merchants
- budgets
- goals
- investments
- recurring transactions
- notifications
- reminders
- security questions/KBA
- audit logs
- admin settings
- application settings

The exact names must be taken from the existing database.

DO NOT assume table names.

# ============================================================ 50. DATABASE RELATIONSHIPS

Maintain existing relationships.

Typical relationships may include:

User | +-- Profile +-- Finance Profile +-- Accounts | | | +-- Transactions | +--
Transactions | | | +-- Category | +-- Merchant | +-- Budgets +-- Goals +--
Notifications +-- Audit Logs +-- Security Configuration

Use the actual existing schema.

Do not create duplicate relationships.

# ============================================================ 51. DATABASE INTEGRITY

Maintain:

- foreign keys
- unique constraints
- required fields
- indexes
- transaction integrity
- soft-delete rules
- timestamps

If SQLite foreign key enforcement is already configured, preserve it.

Any migration must be backward compatible.

Do not destroy existing user data.

# ============================================================ 52. MONEY / FINANCIAL DATA

Never rely on floating-point arithmetic carelessly for monetary calculations.

Use the existing backend's established money representation.

If existing backend stores amounts in integer minor units, preserve it.

If existing backend stores decimal values, follow the current system.

Frontend formatting:

- Indian Rupee formatting
- INR 
- Indian number grouping where appropriate

Example: INR 1,00,000

Do not change stored representation merely for UI.

# ============================================================ 53. DATE / TIME

Use backend-defined date formats.

Respect:

- user timezone
- configured timezone
- financial month start

Frontend must not silently convert dates incorrectly.

Display dates in user-friendly Indian/local format where configured.

# ============================================================ 54. API ARCHITECTURE

The frontend must communicate through the existing API layer.

Create/use a centralized frontend service layer.

Conceptually:

frontend | API service | existing Node.js API | existing business logic | SQLite

Do not scatter raw fetch calls across dozens of components.

# ============================================================ 55. API DISCOVERY

Before implementing a screen:

1. Find existing API endpoint.
2. Find request schema.
3. Find response schema.
4. Find authentication requirements.
5. Find authorization requirements.
6. Find error format.
7. Find pagination behavior.
8. Find filtering behavior.
9. Find validation rules.

Then integrate.

If an endpoint is missing for an already-existing backend feature, determine
whether an equivalent endpoint exists before creating a new one.

# ============================================================ 56. API ERROR HANDLING

Handle:

- 400 validation
- 401 authentication
- 403 authorization
- 404 not found
- 409 conflict
- 422 validation where applicable
- 429 rate limit if applicable
- 500 server error
- network failure
- timeout

Show user-friendly messages.

Never expose raw stack traces.

# ============================================================ 57. FRONTEND STATE

Centralize important server state.

Avoid:

- duplicated transaction state
- duplicated account balances
- inconsistent dashboard calculations

After mutations:

- invalidate/refetch affected resources OR
- update centralized state consistently

Backend remains source of truth.

# ============================================================ 58. LOADING STATES

Every backend-connected screen needs a proper loading state.

Use:

- skeleton cards
- skeleton rows
- disabled buttons
- progress indicators

Do not display blank screens during loading.

# ============================================================ 59. EMPTY STATES

Every list requires an intentional empty state.

Example:

No transactions yet

Add your first transaction to start tracking your finances.

Provide appropriate CTA.

Do not show fake records.

# ============================================================ 60. ERROR STATES

Example:

Unable to load accounts

Please try again.

[Retry]

Error UI should be:

- compact
- clear
- non-technical
- actionable

# ============================================================ 61. SUCCESS FEEDBACK

After successful mutations:

Use subtle:

- toast
- inline confirmation
- modal close + confirmation

Do not use browser alert() for normal application feedback.

# ============================================================ 62. FORM VALIDATION

Use centralized validation where possible.

Every form should support:

- required
- min/max
- format
- numeric validation
- date validation
- backend validation

Errors must appear near the relevant field.

# ============================================================ 63. MODAL SYSTEM

All modals must use a common component.

STANDARD:

Backdrop + Centered modal + Header + Content + Actions

HEADER:

- small accent/status marker where appropriate
- title
- close icon

ACTIONS:

- Cancel
- Primary action

Do not make modals excessively tall.

On mobile:

- fit within viewport
- allow internal scrolling if necessary
- respect keyboard

# ============================================================ 64. ADD VS EDIT MODALS

MANDATORY:

Add and Edit are separate UX states.

Examples:

Add Income Edit Income

Add Expense Edit Expense

Add Investment Edit Investment

Add Account Edit Account

Add Category Edit Category

Add Budget Edit Budget

Add Goal Edit Goal

Do not confuse users with: "Save" when editing.

Use:

- Save Income
- Update Income

etc.

# ============================================================ 65. CENTRALIZED FORM COMPONENTS

Create reusable:

- TextInput
- NumberInput
- DateInput
- Select
- SearchInput
- SegmentedControl
- Toggle
- Radio
- Button
- Modal
- FormSection
- ErrorMessage
- EmptyState
- Skeleton
- Toast

But each page should remain semantically clear.

# ============================================================ 66. DESIGN SYSTEM

Create centralized design tokens.

TOKENS:

- primary
- primary-soft
- success
- danger
- warning
- investment
- background
- surface
- border
- text
- muted text

SPACING: Use a consistent spacing scale.

RADIUS: Use consistent card/input/button radii.

SHADOW: Use subtle elevation.

TYPOGRAPHY: Use a modern readable sans-serif system.

Do not randomly use different font sizes.

# ============================================================ 67. ICON SYSTEM

ZERO EMOJIS.

Use SVG icons for:

- Dashboard
- Transactions
- Planning
- Analytics
- Investments
- Menu
- Search
- Filter
- Add
- Edit
- Delete
- Back
- Close
- Account
- Category
- Calendar
- Notification
- Reminder
- Security
- Password
- Audit
- Admin
- User
- Transfer
- Income
- Expense
- Goal
- Budget
- Settings

Icons must have consistent stroke/visual weight.

# ============================================================ 68. ACCESSIBILITY

Implement:

- semantic HTML
- accessible labels
- keyboard navigation
- focus states
- proper button semantics
- modal focus handling
- accessible toggles
- accessible select controls
- readable contrast
- screen-reader labels

Do not rely on color alone.

# ============================================================ 69. RESPONSIVE BEHAVIOR

PRIMARY TARGET: Mobile.

SUPPORTED:

- small phones
- large phones
- tablets
- desktop

Desktop must preserve mobile-app appearance.

Avoid:

- giant cards
- giant whitespace
- stretched navigation
- desktop-only tables where mobile cards are more appropriate

For dense data:

- use horizontal scrolling only when necessary
- use cards/rows where appropriate

# ============================================================ 70. PERFORMANCE

Optimize:

- API calls
- rendering
- list rendering
- search
- charts
- images
- bundle size

Use pagination for large records.

Search should be debounced where backend search is used.

Do not repeatedly request the same data unnecessarily.

# ============================================================ 71. SECURITY

Frontend:

- never expose secrets
- never expose database credentials
- never expose private server configuration
- never trust frontend role checks alone

Backend:

- authentication
- authorization
- input validation
- secure password handling
- session management
- rate limiting where existing
- audit logging

Admin permissions must be enforced server-side.

# ============================================================ 72. USER DATA ISOLATION

A normal user must only access their own:

- accounts
- transactions
- categories where user-scoped
- budgets
- goals
- finance profile
- notifications
- reports
- analytics
- security configuration

Never rely only on frontend filtering.

Backend must enforce ownership.

# ============================================================ 73. ADMIN DATA ACCESS

Admins may access administrative user information only according to existing
authorization rules.

Do not grant admin privileges simply because a frontend route is accessible.

# ============================================================ 74. AUDITABILITY

Important actions should be auditable according to the existing backend
implementation.

Examples:

- login
- logout
- password changes
- admin actions
- user status changes
- transaction modifications
- account modifications
- destructive operations

Do not fake audit records.

# ============================================================ 75. NOTIFICATION LOGIC

Notification generation should happen according to existing backend logic.

Frontend displays notification state.

Do not create duplicate notification-generation logic in frontend.

# ============================================================ 76. SEARCH

Search must work against real backend data.

Do not fake filtering by only hiding already-loaded records when the dataset can
be large.

For large datasets: backend search/filter/pagination should be used.

# ============================================================ 77. FILTER SYSTEM

Filters should be contextual.

Transactions:

- type
- account
- category
- date
- amount

Users:

- role
- status

Categories:

- type

Reports:

- period

Analytics:

- period

Do not show irrelevant filters.

# ============================================================ 78. PAGINATION

For large datasets:

- transactions
- audit logs
- users
- notifications

Use existing backend pagination.

Frontend should show:

- current results
- loading
- next/previous if supported
- empty result state

# ============================================================ 79. ACCOUNT + TRANSACTION CONSISTENCY

This is critical.

When a transaction affects an account:

Backend must remain responsible for balance calculation.

Example:

Add Income v Backend saves transaction v Account balance updated according to
existing rules v Frontend refreshes account v Dashboard refreshes v
Analytics/report refreshes

Same applies to:

- expense
- investment
- transfer
- edit
- delete

Do not independently calculate conflicting balances in frontend.

# ============================================================ 80. DASHBOARD DATA REFRESH

After transaction mutation, update all affected UI:

- transaction list
- account balance
- dashboard
- allocation meter
- income
- expenses
- investments
- analytics
- reports

Use centralized cache/state invalidation where appropriate.

# ============================================================ 81. OFFLINE BEHAVIOR

Do not claim transactions were saved when the backend request failed.

If offline:

- show connection/error state
- preserve unsent form input where safe
- allow retry

Do not silently lose financial data.

# ============================================================ 82. DATABASE MIGRATIONS

No destructive migration.

If migration is genuinely required:

1. backup strategy
2. migration script
3. backward compatibility
4. test existing data
5. verify relationships
6. verify production database

Never drop tables just to simplify frontend development.

# ============================================================ 83. BACKEND CODE QUALITY

Maintain separation of:

- routes
- controllers
- services
- database/repositories
- validation
- authentication
- authorization
- utilities

Follow existing project conventions.

Do not rewrite functioning backend modules without reason.

# ============================================================ 84. FRONTEND CODE QUALITY

Avoid giant files.

Avoid:

- one 3000-line component
- duplicated forms
- duplicated API logic
- duplicated validation
- duplicated styles

Use:

- reusable components
- hooks
- service layer
- centralized state
- feature-oriented organization where suitable

# ============================================================ 85. ENVIRONMENT CONFIGURATION

Do not expose secrets in frontend.

Keep backend configuration server-side.

Use existing environment variables.

Do not commit:

- database secrets
- authentication secrets
- API keys
- production credentials

# ============================================================ 86. LOGGING

Backend logs should be useful for:

- errors
- authentication events where configured
- database failures
- API failures

Do not log:

- passwords
- KBA answers
- sensitive tokens
- unnecessary personal information

# ============================================================ 87. TESTING

TEST BACKEND:

- authentication
- authorization
- user ownership
- accounts
- transactions
- categories
- budgets
- goals
- investments
- notifications
- security
- admin
- audit

TEST FRONTEND:

- navigation
- forms
- validation
- modals
- loading
- empty states
- error states
- responsive behavior

# ============================================================ 88. CRITICAL TRANSACTION TEST CASES

Test:

1. Add income.
2. Verify SQLite record.
3. Verify account balance.
4. Verify dashboard.
5. Verify transaction list.

6. Edit income.
7. Verify original transaction changed.
8. Verify balance recalculated.
9. Verify dashboard changed.

10. Add expense.
11. Verify account balance.

12. Edit expense.
13. Verify balance.

14. Add transfer.
15. Verify source account.
16. Verify destination account.

17. Delete transaction if supported.
18. Verify related values.

# ============================================================ 89. AUTHENTICATION TEST CASES

Test:

- valid signup
- duplicate email
- invalid email
- invalid password
- valid login
- invalid login
- logout
- protected route
- expired session
- password change
- failed-attempt lock
- admin access

# ============================================================ 90. ADMIN TEST CASES

Test:

- user list
- search
- filter
- manage user
- disable
- enable
- make admin
- reset password
- reset KBA
- delete user
- audit logging

All actions must be authorized server-side.

# ============================================================ 91. UI QUALITY CHECK

Every screen must be reviewed for:

- alignment
- spacing
- typography
- icon consistency
- button sizing
- card radius
- shadows
- responsive behavior
- keyboard behavior
- modal behavior
- loading
- empty state
- errors
- accessibility

# ============================================================ 92. NO "V2" PLACEHOLDERS

Do not display:

- Coming in V2
- Coming soon
- Preview
- Future release
- Sample data
- Demo data

if the corresponding feature already exists in the backend.

The redesigned frontend must expose the existing implemented functionality.

If a feature truly does not exist:

- do not fake it
- inspect backend first
- if impossible without backend work, show a professional unavailable state only
  where necessary

# ============================================================ 93. NO BACKEND BREAKING CHANGES

Do not change:

- API response contracts unnecessarily
- authentication behavior
- database structure unnecessarily
- existing business rules
- existing routes
- existing calculations

If frontend requires an adjustment: prefer adapting the frontend to the existing
backend.

# ============================================================ 94. API CONTRACT PRESERVATION

Before changing any API:

Determine:

- who consumes it
- request shape
- response shape
- authentication
- existing frontend usage
- admin usage
- integrations

Do not break existing clients.

# ============================================================ 95. DATA MIGRATION SAFETY

Before database changes:

- inspect current database
- create backup
- understand data
- test migration
- verify counts
- verify foreign keys
- verify transaction records
- verify account balances

# ============================================================ 96. FINAL APPLICATION INFORMATION ARCHITECTURE

MAIN:

Dashboard Transactions Planning Analytics Investments Menu

TRANSACTIONS:

- All
- Income
- Expense
- Investment
- Transfer

PLANNING:

- Budgets
- Goals

PROFILE:

- Basic Profile
- Finance Profile

FINANCE:

- Accounts
- Categories
- Merchants

MORE:

- Integrations

MENU: ACCOUNT

- Profile
- Settings

INSIGHTS

- Reports
- Audit Log
- AI Analysis
- Insights

IMPORT

- Import CSV if already supported

NOTIFICATIONS:

- Notifications
- Reminders

SECURITY:

- Change Password
- Security Questions

DANGER ZONE:

- Reset Profile
- Delete My Account
- Log Out

ADMIN:

- Admin Dashboard
- Users
- Manage User
- App Settings
- Activity Audit

# ============================================================ 97. IMPORT CSV

If existing backend supports CSV import:

Support:

- file selection
- validation
- preview
- mapping if supported
- import
- duplicate handling
- success/error result

Never directly write CSV records into SQLite from frontend.

Use backend import functionality.

# ============================================================ 98. AI ANALYSIS

If AI analysis is already implemented in backend:

Frontend must expose actual AI-generated insights.

Potential outputs:

- spending analysis
- unusual spending
- savings suggestions
- investment suggestions
- forward projection

Do not fake AI responses.

If backend AI functionality is not configured: show a clean
configuration/unavailable state.

Do not label an already-existing feature as "Coming in V2".

# ============================================================ 99. INSIGHTS

Insights should be based on actual user data.

Examples:

- spending changes
- category increases
- savings rate
- budget risk
- investment progress

Only display calculations actually supported by backend/business rules.

# ============================================================ 100. REPORT DATA

Reports must use the same source-of-truth data as dashboard/analytics.

Avoid situations where:

Dashboard = INR 50,000 Reports = INR 45,000 Analytics = INR 52,000

unless the date/filter definitions genuinely differ.

Date ranges must be clearly communicated.

# ============================================================ 101. DATE RANGE CONSISTENCY

Every analytics/report screen must clearly show:

- selected period
- timezone/financial month rules if relevant

Example:

September 2026 or 01 Sep 2026 - 30 Sep 2026

Do not silently use different periods.

# ============================================================ 102. FINANCIAL MONTH

The configured Financial Month Start must be respected throughout:

- dashboard
- FAM
- reports
- reminders
- analytics
- planning

Use backend logic if already implemented.

# ============================================================ 103. MOBILE KEYBOARD UX

When keyboard opens:

- modal must remain usable
- focused input must remain visible
- primary action should not be permanently hidden
- scrolling must work
- no content should become inaccessible

# ============================================================ 104. TOUCH TARGETS

Interactive controls must have comfortable touch areas.

Avoid tiny:

- icons
- close buttons
- navigation controls
- filter buttons

# ============================================================ 105. BUTTON SYSTEM

PRIMARY: Blue filled button.

SECONDARY: Light/outlined.

DANGER: Red.

SUCCESS: Green only when semantically appropriate.

Examples:

- Save Income
- Update Income
- Save Expense
- Update Expense
- Add Account
- Update Account
- Delete Account

Button text must describe the action.

# ============================================================ 106. INPUT SYSTEM

Inputs:

- compact
- readable
- consistent height
- visible focus
- clear placeholder
- accessible label

Never use placeholder as the only label for important fields.

# ============================================================ 107. SELECT SYSTEM

Selects should clearly display:

Select account... Select category... Select question...

Use proper accessible controls.

# ============================================================ 108. DATE INPUT

Use a proper date control.

Display:

- user-friendly date

Store:

- backend-compatible format

Do not create ambiguous date formats.

# ============================================================ 109. CURRENCY

Default currency according to current application configuration.

Current configured example: INR

Display: INR 500 INR 20,000 INR 1,00,000

Respect settings if multiple currencies are supported.

# ============================================================ 110. USER EXPERIENCE PRINCIPLE

Every action should have an obvious result.

Example:

Tap: Add Income

-> modal opens

-> enter amount

-> choose account

-> choose category

-> save

-> backend saves

-> modal closes

-> success feedback

-> list refreshes

-> account balance updates

-> dashboard updates

# ============================================================ 111. DATA REFRESH PRINCIPLE

Never require the user to manually refresh the browser after normal CRUD
operations.

Successful mutations should automatically update affected UI.

# ============================================================ 112. NO DUPLICATE BUSINESS LOGIC

If backend determines:

- FAM
- account balance
- recurring dates
- report totals
- financial calculations

frontend must not create a conflicting second calculation.

Frontend can format/display backend results.

# ============================================================ 113. ADMIN UI DESIGN

Admin must look like part of the same application.

Do not build an unrelated traditional desktop admin template.

Use:

- same typography
- same cards
- same buttons
- same navigation
- same modal system
- same SVG icons
- same mobile viewport approach

# ============================================================ 114. ADMIN APP SETTINGS MODAL

Compact modal:

App Settings

Session timeout [ current value ]

Maximum failed attempts [ current value ]

Cancel Save

Values loaded from backend.

Save through backend.

Show validation errors.

# ============================================================ 115. AUDIT UI DESIGN

Audit cards should be compact.

Example structure:

ACTION Actor/email Details Relative time

Use real backend timestamps.

Avoid huge cards.

# ============================================================ 116. PRODUCTION READINESS

Before declaring complete:

- no console errors
- no broken routes
- no broken API calls
- no dummy data
- no placeholder data
- no emoji icons
- no dead buttons
- no fake success
- no broken modals
- no unhandled API errors
- no missing loading states
- no missing empty states
- no accidental backend changes
- no SQLite data loss

# ============================================================ 117. BUILD / DEPLOYMENT

Respect existing deployment architecture.

Do not introduce unnecessary infrastructure.

Verify:

- production build
- environment variables
- API URL
- SQLite path
- authentication/session configuration
- static assets
- routing
- error handling

# ============================================================ 118. SECURITY BEFORE DEPLOYMENT

Verify:

- production secrets are not committed
- database is not publicly exposed
- admin endpoints are protected
- authentication is enforced
- authorization is enforced
- input validation exists
- destructive endpoints are protected
- sensitive information is not returned unnecessarily

# ============================================================ 119. FINAL ACCEPTANCE CHECKLIST

AUTH: [ ] Signup [ ] Login [ ] Logout [ ] Session [ ] Password handling [ ]
Account lock

ONBOARDING: [ ] Personal profile [ ] Monthly finance profile [ ] Financial
profile

DASHBOARD: [ ] FAM [ ] Income [ ] Expense [ ] Investment [ ] Accounts [ ] Recent
transactions [ ] Security reminder

ACCOUNTS: [ ] List [ ] Add [ ] Edit [ ] Details [ ] Balance [ ]
Deactivate/delete according to backend

TRANSACTIONS: [ ] All [ ] Income [ ] Expense [ ] Investment [ ] Transfer [ ]
Search [ ] Filter [ ] Add Income [ ] Edit Income [ ] Add Expense [ ] Edit
Expense [ ] Add Investment [ ] Edit Investment [ ] Transfer [ ] Delete if
supported

CATEGORIES: [ ] List [ ] Add [ ] Edit [ ] Filter [ ] Reorder if supported

PLANNING: [ ] Budgets [ ] Add Budget [ ] Edit Budget [ ] Goals [ ] Add Goal [ ]
Edit Goal

ANALYTICS: [ ] Real data [ ] Income [ ] Expense [ ] Investment [ ] Savings [ ]
Trends [ ] Category analysis [ ] Date filtering

REPORTS: [ ] Monthly [ ] Year in Review [ ] Actual data [ ] FAM [ ] Targets [ ]
Improvement

INVESTMENTS: [ ] Real data [ ] Targets [ ] Progress [ ] Transactions

RECURRING: [ ] List [ ] Add [ ] Edit [ ] Enable/disable [ ] Reminders

NOTIFICATIONS: [ ] List [ ] Unread count [ ] Mark read [ ] Mark all read [ ]
Settings

REMINDERS: [ ] Due-date reminders [ ] Financial month-end behavior

SECURITY: [ ] Change password [ ] Security questions [ ] KBA [ ] Account
protection

PROFILE: [ ] Profile [ ] Basic Profile [ ] Finance Profile [ ] Accounts [ ]
Categories [ ] Merchants

SETTINGS: [ ] Currency [ ] Timezone [ ] Financial month [ ] Quick add [ ]
Dashboard donuts [ ] Investments [ ] Recurring [ ] Notifications [ ] Reminders [
] Security [ ] Danger Zone

AUDIT: [ ] Search [ ] Real records [ ] Real timestamps

ADMIN: [ ] Dashboard [ ] User list [ ] Search [ ] Filter [ ] Manage User [ ]
Disable [ ] Make Admin [ ] Reset Password [ ] Reset KBA [ ] Delete [ ] App
Settings [ ] Audit

# ============================================================ 120. FINAL IMPLEMENTATION INSTRUCTION

DO NOT START BY REWRITING THE PROJECT.

FIRST:

1. Inspect existing source code.
2. Inspect existing frontend.
3. Inspect Node.js backend.
4. Inspect API routes.
5. Inspect SQLite schema.
6. Inspect authentication.
7. Inspect authorization.
8. Inspect existing business logic.
9. Inspect all existing screens.
10. Map existing functionality to this PRD.

THEN: 11. Build a frontend feature map. 12. Identify reusable components. 13.
Identify reusable API services. 14. Identify existing backend endpoints. 15.
Identify missing integrations. 16. Implement the redesigned frontend. 17.
Connect every screen to real backend data. 18. Verify all CRUD operations. 19.
Verify SQLite persistence. 20. Verify account/transaction consistency. 21.
Verify authentication. 22. Verify admin authorization. 23. Verify notifications.
24. Verify audit logging. 25. Test responsive behavior. 26. Test desktop
mobile-app viewport. 27. Remove dummy/placeholder data. 28. Remove "Coming in
V2" placeholders where functionality already exists. 29. Fix all console/API
errors. 30. Perform final regression testing.

# ============================================================ 121. MOST IMPORTANT CONSTRAINT

THE EXISTING BACKEND MUST BE PRESERVED.

Use the existing:

Node.js + Existing API + Existing business logic + Existing SQLite + Existing
authentication + Existing database records

as the foundation.

The redesign should primarily transform and complete the frontend experience.

DO NOT:

- replace SQLite
- rewrite the backend unnecessarily
- create a fake backend
- create mock data
- hardcode financial values
- create duplicate business logic
- create fake analytics
- create fake reports
- create fake transactions
- create fake users
- use emoji icons
- create a desktop-only dashboard
- show unnecessary "Coming Soon" placeholders
- break existing APIs
- delete existing data

# ============================================================ 122. DEFINITION OF DONE

The project is considered COMPLETE only when:

1. Existing backend works unchanged or with only necessary compatibility fixes.

2. Existing SQLite database remains intact.

3. Existing data displays correctly.

4. All major existing backend features have frontend interfaces.

5. All CRUD operations work against the real backend.

6. Add and Edit operations have separate modal experiences.

7. Forms use centralized reusable architecture.

8. Dashboard displays actual data.

9. Accounts and transaction balances remain consistent.

10. Analytics use actual data.

11. Reports use actual data.

12. Notifications use actual application state.

13. Security functionality works.

14. Admin functionality works.

15. Audit logs display actual backend records.

16. No dummy data exists.

17. No emoji icons exist.

18. All icons are proper SVG icons.

19. Mobile UI is polished and compact.

20. Desktop still behaves visually like a mobile app.

21. Loading states exist.

22. Empty states exist.

23. Error states exist.

24. Validation exists.

25. Authentication is secure.

26. Authorization is server-side.

27. No sensitive data is exposed.

28. No unnecessary database migration occurs.

29. No unnecessary backend rewrite occurs.

30. No console errors remain.

31. No broken API requests remain.

32. No dead buttons remain.

33. No "Coming in V2" placeholders remain for functionality that already exists.

34. The entire product feels like ONE coherent professional finance application
    rather than a collection of separately designed pages.

# ============================================================ END OF PRD
