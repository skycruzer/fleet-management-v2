# Codebase Structure

**Analysis Date:** 2026-03-14

## Directory Layout

```
fleet-management-v2/
├── app/                           # Next.js App Router (Next.js 16)
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing page (/)
│   ├── providers.tsx              # Provider wrapper (QueryClient, Theme, CSRF)
│   ├── error.tsx                  # Global error boundary
│   ├── global-error.tsx           # Catch-all error handler
│   ├── not-found.tsx              # 404 page
│   ├── globals.css                # Tailwind v4 styles (40KB)
│   │
│   ├── api/                       # API routes (admin + portal)
│   │   ├── admin/                 # Admin-specific endpoints (dual auth)
│   │   ├── portal/                # Pilot portal endpoints (session auth)
│   │   ├── auth/                  # Auth endpoints (login, logout, etc.)
│   │   ├── cron/                  # Scheduled job handlers
│   │   ├── requests/              # Unified pilot requests (leave/flight)
│   │   ├── certifications/        # Certification management
│   │   ├── pilots/                # Pilot CRUD
│   │   ├── leave-bids/            # Annual leave bidding
│   │   ├── reports/               # Report generation (19 types)
│   │   ├── notifications/         # Bell notification endpoints
│   │   ├── feedback/              # Feedback submission
│   │   └── [feature]/             # One endpoint per feature area
│   │
│   ├── dashboard/                 # Admin portal (Supabase Auth)
│   │   ├── layout.tsx             # Dashboard layout (sidebar + header)
│   │   ├── page.tsx               # Dashboard home (/dashboard)
│   │   ├── pilots/                # Pilot management
│   │   │   ├── [id]/              # Pilot detail, edit, view
│   │   │   └── page.tsx           # Pilot list
│   │   ├── certifications/        # Certification tracking
│   │   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── requests/              # Leave & flight requests (tabbed: leave/flight)
│   │   ├── admin/                 # System administration
│   │   │   ├── users/
│   │   │   ├── settings/
│   │   │   ├── leave-bids/        # Leave bidding admin
│   │   │   └── check-types/
│   │   ├── reports/               # Report generation UI
│   │   ├── analytics/             # Dashboard metrics
│   │   ├── renewal-planning/      # Certification renewal
│   │   ├── tasks/                 # Task management
│   │   ├── disciplinary/          # Disciplinary records
│   │   ├── feedback/              # Feedback review
│   │   ├── audit-logs/            # Audit trail viewer
│   │   ├── help/                  # Help center
│   │   ├── settings/              # User preferences
│   │   └── [other-features]/
│   │
│   ├── portal/                    # Pilot portal (custom session auth)
│   │   ├── layout.tsx
│   │   ├── (public)/              # Public: login, register, password reset
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   └── (protected)/           # Protected: requires Redis session
│   │       ├── layout.tsx         # Session check
│   │       ├── page.tsx           # Pilot dashboard
│   │       ├── requests/          # Pilot request submission
│   │       ├── certifications/    # View own certifications
│   │       ├── feedback/          # Submit feedback
│   │       ├── settings/          # Pilot settings
│   │       └── [other-pages]/
│   │
│   ├── auth/                      # Admin authentication flows
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   │
│   ├── pilot/                     # Pilot auth endpoints (legacy path)
│   │   ├── login/
│   │   ├── logout/
│   │   └── register/
│   │
│   ├── docs/                      # Static docs pages
│   ├── privacy/                   # Privacy policy page
│   ├── terms/                     # Terms of service page
│   ├── offline/                   # PWA offline fallback
│   └── login/                     # Redirect to /auth/login
│
├── components/                    # React components (70+ UI, 30+ feature)
│   ├── ui/                        # shadcn/ui base components (70+)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── [other-primitives]/
│   │   └── *.stories.tsx          # Storybook stories colocated
│   │
│   ├── layout/                    # App chrome (navigation, sidebar, headers)
│   │   ├── professional-sidebar.tsx
│   │   ├── professional-header.tsx
│   │   ├── sidebar-collapse-provider.tsx
│   │   ├── dashboard-content-area.tsx
│   │   └── [other-layout]/
│   │
│   ├── dashboard/                 # Admin dashboard widgets and cards
│   │   ├── dashboard-content.tsx  # Main dashboard layout
│   │   ├── metrics-card.tsx
│   │   └── [feature-widgets]/
│   │
│   ├── navigation/                # Navigation components
│   │   ├── mobile-nav.tsx
│   │   ├── page-breadcrumbs.tsx
│   │   └── [nav-variants]/
│   │
│   ├── admin/                     # Admin portal features
│   │   ├── portal-users-table.tsx
│   │   ├── leave-bid-edit-form.tsx
│   │   ├── check-types-table.tsx
│   │   └── [admin-features]/
│   │
│   ├── pilots/                    # Pilot management components
│   │   ├── pilot-card.tsx
│   │   ├── pilot-form.tsx
│   │   └── [pilot-features]/
│   │
│   ├── certifications/            # Certification components
│   │   ├── certification-card.tsx
│   │   ├── certification-category-group.tsx
│   │   └── [cert-features]/
│   │
│   ├── requests/                  # Leave/flight request components
│   │   ├── request-form.tsx
│   │   ├── request-table.tsx
│   │   └── [request-features]/
│   │
│   ├── reports/                   # Report generation UI
│   │   ├── report-generator.tsx
│   │   ├── [report-type]-form.tsx (19 forms)
│   │   └── [report-features]/
│   │
│   ├── portal/                    # Pilot portal specific UI
│   │   ├── [portal-features]/
│   │   └── [portal-components]/
│   │
│   ├── forms/                     # Reusable form components
│   │   ├── auth-form.tsx
│   │   ├── [domain]-form.tsx
│   │   └── [form-utilities]/
│   │
│   ├── auth/                      # Auth UI (login shells, etc.)
│   │   ├── login-form.tsx
│   │   └── [auth-components]/
│   │
│   ├── shared/                    # Cross-portal components
│   │   ├── [shared-components]/
│   │   └── [utilities]/
│   │
│   ├── skeletons/                 # Loading state placeholders
│   │   ├── table-skeleton.tsx
│   │   ├── card-skeleton.tsx
│   │   └── [skeleton-variants]/
│   │
│   ├── error-boundary.tsx         # Global error UI wrapper
│   ├── error-boundaries.tsx       # Error boundary variants
│   ├── error-boundary.stories.tsx # Storybook example
│   └── [other-feature-dirs]/
│
├── lib/                           # Business logic and utilities
│   ├── services/                  # Service layer (55+ services)
│   │   ├── pilot-service.ts
│   │   ├── certification-service.ts
│   │   ├── pilot-leave-service.ts
│   │   ├── flight-request-service.ts
│   │   ├── unified-request-service.ts   # Single source of truth
│   │   ├── dashboard-service-v4.ts      # Redis-cached metrics
│   │   ├── admin-service.ts
│   │   ├── audit-service.ts
│   │   ├── notification-service.ts      # Bell notifications
│   │   ├── pilot-email-service.ts       # Email via Resend
│   │   ├── pilot-portal-service.ts      # Pilot auth
│   │   ├── session-service.ts
│   │   ├── redis-session-service.ts
│   │   ├── reports-service.ts           # 19 report generators
│   │   ├── pdf-service.ts               # PDF generation
│   │   ├── export-service.ts            # CSV/Excel export
│   │   ├── roster-period-service.ts     # RP1-RP13 management
│   │   ├── roster-report-service.ts
│   │   ├── retirement-forecast-service.ts
│   │   ├── succession-planning-service.ts
│   │   ├── certification-renewal-planning-service.ts
│   │   ├── leave-eligibility-service.ts
│   │   ├── cache-invalidation-helper.ts
│   │   ├── rate-limit-service.ts
│   │   ├── admin-auth-service.ts        # Bcrypt session validation
│   │   ├── base-service.ts
│   │   └── [other-services]/
│   │
│   ├── middleware/                # API route middleware
│   │   ├── csrf-middleware.ts           # Double-submit cookie
│   │   ├── admin-auth-helper.ts         # Dual auth check
│   │   ├── rate-limit-middleware.ts     # Upstash limits
│   │   ├── authorization-middleware.ts  # Role-based access
│   │   ├── cache-headers-middleware.ts
│   │   └── content-type-middleware.ts
│   │
│   ├── supabase/                  # Supabase client factories
│   │   ├── server.ts                    # Server Components/API
│   │   ├── client.ts                    # Client Components
│   │   ├── admin.ts                     # Bypass RLS
│   │   ├── service-role.ts              # System operations
│   │   └── middleware.ts                # Auth state
│   │
│   ├── auth/                      # Authentication helpers
│   │   ├── pilot-helpers.ts             # getCurrentPilot()
│   │   └── pilot-session.ts
│   │
│   ├── types/                     # TypeScript definitions
│   │   ├── supabase.ts                  # AUTO-GENERATED (run npm run db:types)
│   │   ├── service-response.ts          # Standard service response
│   │   └── [domain-types]/
│   │
│   ├── validations/               # Zod validation schemas
│   │   ├── pilot-schema.ts
│   │   ├── certification-schema.ts
│   │   ├── pilot-request-schema.ts
│   │   ├── flight-request-schema.ts
│   │   ├── leave-request-schema.ts
│   │   ├── pilot-feedback-schema.ts
│   │   └── [feature-schemas]/
│   │
│   ├── utils/                     # Utility functions (40+ modules)
│   │   ├── api-response-helper.ts       # HTTP response builders
│   │   ├── certification-status.ts      # RED/YELLOW/GREEN logic
│   │   ├── roster-utils.ts              # RP1-RP13 calculations
│   │   ├── roster-period-utils.ts
│   │   ├── date-utils.ts
│   │   ├── date-format.ts
│   │   ├── error-sanitizer.ts           # Remove sensitive data
│   │   ├── error-messages.ts
│   │   ├── logger.ts
│   │   ├── type-guards.ts
│   │   ├── export-utils.ts
│   │   ├── leave-calendar-utils.ts
│   │   ├── retirement-utils.ts
│   │   ├── qualification-utils.ts
│   │   ├── form-utils.ts
│   │   ├── filter-count.ts
│   │   ├── grace-period-utils.ts
│   │   ├── cache-headers.ts
│   │   └── [other-utilities]/
│   │
│   ├── hooks/                     # Custom React hooks (24 hooks)
│   │   ├── use-optimistic-mutation.ts       # Generic optimistic updates
│   │   ├── use-optimistic-certification.ts  # Domain-specific
│   │   ├── use-optimistic-leave-request.ts
│   │   ├── use-optimistic-pilot.ts
│   │   ├── use-table-state.ts               # Sorting, filtering, pagination
│   │   ├── use-filter-presets.ts            # Saved filters
│   │   ├── use-report-query.ts              # TanStack Query wrapper
│   │   ├── use-unsaved-changes.ts           # Dirty form tracking
│   │   ├── use-csrf-token.ts                # CSRF token management
│   │   ├── use-online-status.ts             # Offline detection
│   │   ├── use-keyboard-shortcuts.ts
│   │   ├── use-keyboard-nav.ts
│   │   ├── use-reduced-motion.ts            # a11y motion
│   │   ├── use-sidebar-collapse.ts
│   │   ├── use-sidebar-badges.ts
│   │   ├── use-deduplicated-submit.ts       # Prevent duplicate submissions
│   │   ├── use-card-density.ts
│   │   ├── use-persisted-view.ts
│   │   ├── use-retry-state.ts
│   │   ├── use-focus-management.ts
│   │   ├── use-touch.ts
│   │   └── [other-hooks]/
│   │
│   ├── react-query/               # TanStack Query configuration
│   │   ├── query-client.ts              # QueryClient factory
│   │   ├── query-provider.tsx           # Provider component
│   │   └── hooks/
│   │       ├── use-pilots.ts            # Query hooks
│   │       ├── use-certifications.ts
│   │       ├── use-dashboard.ts
│   │       └── index.ts                 # Export all hooks
│   │
│   ├── providers/                 # Context providers
│   │   └── csrf-provider.tsx            # CSRF token context
│   │
│   ├── constants/                 # Application constants
│   │   ├── auth.ts                      # Auth constants
│   │   ├── crew.ts                      # Crew/pilot constants
│   │   ├── email.ts                     # Email templates, subjects
│   │   ├── status-colors.ts             # Status → color mapping
│   │   └── [feature-constants]/
│   │
│   ├── animations/                # Motion and animation configs
│   │   └── motion-variants.ts           # Framer Motion variants
│   │
│   ├── security/                  # Security utilities
│   │   └── [security-helpers]/
│   │
│   ├── env.ts                     # Environment variable validation (Zod)
│   ├── error-logger.ts            # Better Stack integration (Logtail)
│   ├── rate-limit.ts              # Upstash rate limiter factory
│   ├── request-deduplication.ts   # Prevent duplicate requests
│   ├── design-tokens.ts           # Color, spacing, typography vars
│   └── utils.ts                   # Misc utilities
│
├── types/
│   └── supabase.ts                # AUTO-GENERATED — Run: npm run db:types
│
├── public/                        # Static assets
│   ├── icons/
│   ├── images/
│   └── [asset-dirs]/
│
├── e2e/                           # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── pilots.spec.ts
│   ├── certifications.spec.ts
│   ├── requests.spec.ts
│   └── [feature].spec.ts
│
├── scripts/                       # Build and development scripts
│   ├── validate-naming.mjs        # Enforce kebab-case files
│   └── [utility-scripts]/
│
├── supabase/                      # Supabase project config
│   ├── migrations/                # Database schema changes
│   │   ├── 20251028000001_*.sql
│   │   └── [migration-files]/
│   └── config.toml
│
├── .storybook/                    # Storybook configuration
│   ├── main.ts
│   └── preview.ts
│
├── tasks/                         # Project planning and notes
│   ├── todo.md
│   ├── codebase-review-report.md
│   └── [project-docs]/
│
├── .claude/                       # Claude Code context
│   └── settings.json
│
├── .planning/                     # Planning and analysis documents
│   ├── codebase/
│   │   ├── ARCHITECTURE.md        (THIS FILE)
│   │   ├── STRUCTURE.md           (THIS FILE)
│   │   └── [other-docs]/
│   └── [other-planning]/
│
├── tsconfig.json                  # TypeScript config (strict mode)
├── next.config.js                 # Next.js config (Webpack, CSP headers, redirects)
├── tailwind.config.ts             # Tailwind v4 config
├── eslint.config.js               # ESLint (Next.js + React rules)
├── .prettierrc                    # Prettier (single quotes, 100-char width)
├── playwright.config.ts           # Playwright E2E (port 3005, 1 worker)
├── vitest.config.mts              # Vitest unit test config
├── .env.example                   # Environment variable template
├── .env.local                     # Development secrets (gitignored)
├── .env.test.local                # Test env vars
├── package.json                   # Dependencies and scripts
├── package-lock.json              # Dependency lock file
├── CLAUDE.md                      # Claude Code project instructions
└── README.md
```

## Directory Purposes

**app/**

- Purpose: Next.js App Router with all page routes and API endpoints
- Contains: Server and Client Components, layouts, API route handlers
- Key files: `layout.tsx` (root), `providers.tsx` (provider setup), `page.tsx` (routes)
- Key subdirs: `dashboard/` (admin), `portal/` (pilots), `api/` (endpoints), `auth/` (admin auth)

**components/**

- Purpose: Reusable React components organized by scope and UI layer
- Contains: shadcn/ui primitives (70+), feature-scoped components (30+), layout chrome
- Key files: `error-boundary.tsx` (global error handling), `*.stories.tsx` (Storybook)
- Organization: `ui/` (primitives), `layout/` (navigation), `[feature]/` (domain logic)

**lib/services/**

- Purpose: All business logic, database operations, and domain calculations
- Contains: 55+ services for pilots, certifications, requests, reports, email, auth
- Mandatory: ALL database calls go through services, never directly from components/routes
- Central service: `unified-request-service.ts` (leave + flight requests)
- Key pattern: Return `ServiceResponse<T>` for type-safe error handling

**lib/middleware/**

- Purpose: Request validation and security checks for API routes
- Contains: CSRF validation, admin auth check, rate limiting, role-based access
- Mandatory pipeline: CSRF → Auth → RateLimit → RoleCheck → Service Call
- Key files: `csrf-middleware.ts`, `admin-auth-helper.ts`, `rate-limit-middleware.ts`

**lib/supabase/**

- Purpose: Supabase client initialization with context-specific behavior
- Contains: Server client (Server Components/API), client client (Client Components), service-role (RLS bypass)
- Key pattern: Import from `@/lib/supabase/server` in services, `@/lib/supabase/client` in Client Components

**lib/types/**

- Purpose: TypeScript definitions and type safety
- Contains: `supabase.ts` (AUTO-GENERATED from schema), `service-response.ts`, domain types
- Mandatory: Run `npm run db:types` after schema changes to regenerate `supabase.ts`

**lib/validations/**

- Purpose: Zod schemas for input validation at API and form layer
- Contains: Schemas for pilots, certifications, requests, feedback
- Pattern: Use `schema.safeParse(input)` for consistent error handling
- Used by: React Hook Form (client) + API routes (server)

**lib/utils/**

- Purpose: Reusable utility functions (40+ modules)
- Contains: Date helpers, certification status logic, roster period calculations, error sanitizers
- Key modules: `certification-status.ts`, `roster-utils.ts`, `api-response-helper.ts`
- Pattern: Pure functions, no side effects, testable

**lib/hooks/**

- Purpose: Custom React hooks for state management and UI patterns
- Contains: 24 hooks for optimistic updates, table state, form handling, accessibility
- Pattern: Encapsulate complex logic, expose simple interfaces
- Key hooks: `use-optimistic-mutation.ts`, `use-table-state.ts`, `use-unsaved-changes.ts`

**lib/react-query/**

- Purpose: TanStack Query configuration and server state management
- Contains: QueryClient factory, hooks for data fetching (pilots, certifications, dashboard)
- Pattern: Centralized query keys, consistent stale time (5 minutes default)
- Used by: Client Components for auto-caching and synchronization

**lib/constants/**

- Purpose: Application-level constants (auth, crew, email)
- Contains: Role definitions, crew constants, email templates, status colors
- Pattern: Avoid magic strings; reference constants

**public/**

- Purpose: Static assets served at root (images, icons, manifest)
- Contains: Favicon, manifest.json (PWA), app icons, placeholder images
- Pattern: Use `<Image>` from next/image for optimization

**e2e/**

- Purpose: Playwright end-to-end tests (runs on port 3005)
- Contains: Test suites for auth, pilots, certifications, requests
- Pattern: One `.spec.ts` file per feature
- Run: `npm test` (headless) or `npm run test:ui` (interactive)

**supabase/**

- Purpose: Supabase project configuration and migrations
- Contains: Database migration files (SQL), config.toml
- Pattern: One migration per schema change, sequential numbering

**tasks/**

- Purpose: Project planning, notes, and documentation
- Contains: `todo.md` (working notes), project audits, implementation plans
- Pattern: Markdown files, checked manually

**.planning/codebase/**

- Purpose: GSD-generated architecture and quality analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Pattern: Reference by `/gsd:plan-phase` and `/gsd:execute-phase` commands

## Key File Locations

**Entry Points:**

- `app/layout.tsx`: Root layout, initializes Providers
- `app/page.tsx`: Landing page (`/`)
- `app/dashboard/layout.tsx`: Admin portal layout (auth check)
- `app/portal/(protected)/layout.tsx`: Pilot portal layout (session check)
- `app/providers.tsx`: QueryClient, Theme, CSRF, nuqs wrappers

**Configuration:**

- `tsconfig.json`: TypeScript strict mode, path aliases (`@/*`)
- `next.config.js`: Image optimization, CSP headers, redirects, Webpack/Turbopack
- `tailwind.config.ts`: Tailwind v4 with custom tokens
- `.prettierrc`: Single quotes, 2-space indent, 100-char width
- `eslint.config.js`: Next.js + React rules

**Core Logic:**

- `lib/services/unified-request-service.ts`: Leave and flight requests
- `lib/services/pilot-service.ts`: Pilot CRUD and seniority
- `lib/services/certification-service.ts`: Check tracking and status
- `lib/services/dashboard-service-v4.ts`: Cached dashboard metrics
- `lib/services/pilot-portal-service.ts`: Custom pilot authentication

**Utilities:**

- `lib/utils/certification-status.ts`: RED/YELLOW/GREEN logic (30-day threshold)
- `lib/utils/roster-utils.ts`: RP1-RP13 calculations and roster period helpers
- `lib/utils/api-response-helper.ts`: HTTP response builders
- `lib/error-logger.ts`: Better Stack (Logtail) logging

**Testing:**

- `playwright.config.ts`: E2E test config (port 3005, Chromium)
- `e2e/auth.spec.ts`: Login/logout tests
- `vitest.config.mts`: Unit test runner

**Documentation:**

- `CLAUDE.md`: Project instructions for Claude Code (MANDATORY READ)
- `.planning/codebase/ARCHITECTURE.md`: Architecture overview
- `lib/docs/`: Connection error handling, request deduplication guides

## Naming Conventions

**Files:**

- `kebab-case.tsx` for components (e.g., `pilot-card.tsx`, `leave-request-form.tsx`)
- `kebab-case.ts` for utilities and helpers
- `{feature}-service.ts` for services (e.g., `pilot-service.ts`)
- `{feature}-schema.ts` for validations (e.g., `flight-request-schema.ts`)
- `{feature}.spec.ts` for E2E tests (e.g., `pilots.spec.ts`)
- `*.stories.tsx` for Storybook stories (colocated with component)
- Enforcement: `npm run validate:naming` checks all files

**Directories:**

- `kebab-case/` for feature directories (e.g., `admin/`, `portal/`, `certifications/`)
- CamelCase for Next.js special dirs: `(protected)`, `(public)`, `[id]`, `[[...slug]]`

**Functions & Variables:**

- camelCase for functions: `getPilots()`, `validateRequest()`
- camelCase for variables: `pilotId`, `isCertified`
- UPPER_SNAKE_CASE for constants: `RATE_LIMIT_WINDOW`, `HTTP_STATUS`
- PascalCase for React components: `PilotCard`, `LeaveRequestForm`

**Database/Types:**

- snake_case for tables and columns (Supabase convention)
- UPPER_SNAKE_CASE for enum values (e.g., `request_category` → LEAVE, FLIGHT)

## Where to Add New Code

**New Feature (e.g., add task management):**

1. Create service: `lib/services/task-service.ts`
2. Create validation: `lib/validations/task-schema.ts`
3. Create API routes: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`
4. Create components: `components/tasks/task-card.tsx`, `components/tasks/task-form.tsx`
5. Create pages: `app/dashboard/tasks/page.tsx`, `app/dashboard/tasks/[id]/page.tsx`
6. Add E2E tests: `e2e/tasks.spec.ts`

**New Component/Module:**

- Co-located components: `components/[feature]/component-name.tsx`
- Storybook story: `components/[feature]/component-name.stories.tsx`
- Tests: `components/__tests__/component-name.test.tsx` (if unit tested)

**Utilities & Helpers:**

- Shared helpers: `lib/utils/feature-utils.ts`
- Custom hooks: `lib/hooks/use-feature.ts`
- Custom hooks for domain logic: `lib/hooks/use-optimistic-[entity].ts`

**API Endpoints:**

- Admin endpoints: `app/api/[feature]/route.ts` with dual auth
- Pilot endpoints: `app/api/portal/[feature]/route.ts` with session auth
- Include middleware pipeline: CSRF → Auth → RateLimit → RoleCheck

**Database Migrations:**

1. Make schema change in Supabase dashboard or via SQL
2. Create migration: `npm run db:migration`
3. Write SQL in generated file (e.g., `20260314000001_add_field.sql`)
4. Deploy: `npm run db:deploy` or manually via Supabase dashboard
5. Regenerate types: `npm run db:types` → updates `types/supabase.ts`

## Special Directories

**node_modules/**

- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

**.next/**

- Purpose: Next.js build cache and compiled output
- Generated: Yes (via `npm run build` or `npm run dev`)
- Committed: No (in .gitignore)

**playwright-report/**

- Purpose: E2E test results and videos
- Generated: Yes (via `npm test`)
- Committed: No (in .gitignore)

**storybook-static/**

- Purpose: Built Storybook output
- Generated: Yes (via `npm run build-storybook`)
- Committed: No (in .gitignore)

**.env.local, .env.test.local**

- Purpose: Environment variables and secrets
- Generated: Manual (copy from `.env.example`)
- Committed: No (in .gitignore, contains secrets)

**supabase/migrations/**

- Purpose: Database schema changes (version control)
- Generated: Manual (via `npm run db:migration` or direct SQL)
- Committed: Yes (track all migrations in git)

**.planning/codebase/**

- Purpose: Generated codebase analysis documents
- Generated: Yes (via `/gsd:map-codebase` command)
- Committed: Yes (useful for planning phases)

---

_Structure analysis: 2026-03-14_
