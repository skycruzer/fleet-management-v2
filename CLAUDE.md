# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Rules (MANDATORY)

1. **PLAN FIRST**: Write plan to `tasks/todo.md` with checkable todo items
2. **GET APPROVAL**: Check in with user before beginning work
3. **SIMPLICITY IS KING**: Minimal changes, minimal code impact, zero bugs introduced
4. **NO LAZINESS**: Find root causes, no temporary fixes

## Quick Start

```bash
npm install
cp .env.example .env.local  # Add Supabase credentials
npm run db:types            # Generate TypeScript types
npm run dev                 # http://localhost:3000 (uses Webpack, not Turbopack)
```

## Commands

**IMPORTANT: After every code change, validate the build succeeds.**

```bash
# Development
npm run dev                 # Start dev server (Webpack mode, port 3000)
npm run build               # Production build — run this to catch SSR/import errors
npm run storybook           # Component dev at http://localhost:6006

# Validation (pre-commit gate)
npm run validate            # type-check + lint + format:check
npm run validate:naming     # File naming conventions (kebab-case enforcement)
npm run lint:fix            # Auto-fix ESLint issues
npm run format              # Format code with Prettier

# Testing (Playwright E2E — uses port 3005, NOT 3000)
npm test                    # Run all tests (auto-starts dev server on :3005)
npm run test:ui             # Playwright UI mode
npm run test:headed         # Run with browser visible
npm run test:debug          # Debug mode
npx playwright test e2e/auth.spec.ts        # Single test file
npx playwright test --grep "leave request"  # Pattern match

# Database
npm run db:types            # Regenerate types after schema changes (REQUIRED)
npm run db:migration        # Create new database migration
npm run db:deploy           # Deploy migrations to production
```

### Testing Notes

- Tests run on **port 3005** (separate from dev server on 3000)
- Test env vars loaded from `.env.test.local` (not `.env.local`)
- Only Chromium enabled; workers set to 1 (sequential) to avoid database overload

### Pre-commit Hooks

Husky + lint-staged runs automatically on `git commit`:

- `*.{js,jsx,ts,tsx}` → ESLint --fix + Prettier
- `*.{json,md,mdx,css,yaml,yml}` → Prettier

---

## Architecture Overview

### Service Layer Pattern (MANDATORY)

**All database operations MUST go through `lib/services/`**. Never make direct Supabase calls.

```typescript
// CORRECT
import { getPilots } from '@/lib/services/pilot-service'
const pilots = await getPilots()

// WRONG - bypasses service layer
const { data } = await supabase.from('pilots').select('*')
```

### Key Services (55+ in `lib/services/`)

| Category    | Services                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Core Domain | `pilot-service`, `certification-service`, `pilot-leave-service`, `flight-request-service`, `unified-request-service` |
| Dashboard   | `dashboard-service-v4` (production, Redis-cached), `analytics-service`                                               |
| Auth        | `pilot-portal-service`, `session-service`, `account-lockout-service`, `admin-auth-service`                           |
| Reports     | `pdf-service`, `reports-service` (19 reports), `export-service`                                                      |
| Planning    | `retirement-forecast-service`, `succession-planning-service`, `certification-renewal-planning-service`               |
| Roster      | `roster-period-service`, `roster-report-service`, `roster-deadline-alert-service`                                    |

**Central Service**: `unified-request-service.ts` handles ALL leave and flight requests through the unified `pilot_requests` table.

### Dual Authentication Architecture

**Two completely separate auth systems — never mix them:**

|             | Admin Portal             | Pilot Portal              |
| ----------- | ------------------------ | ------------------------- |
| Routes      | `/dashboard/*`           | `/portal/*`               |
| API         | `/api/*` (non-portal)    | `/api/portal/*`           |
| Auth System | Supabase Auth            | Custom (`an_users` table) |
| Client      | `lib/supabase/server.ts` | `pilot-portal-service.ts` |
| Users       | Admin staff, managers    | Pilots                    |

### API Route Security Pipeline (`lib/middleware/`)

All mutation API routes (POST/PUT/PATCH/DELETE) follow this standard pipeline:

```typescript
// 1. CSRF validation
const csrfError = await validateCsrf(request)
if (csrfError) return csrfError

// 2. Admin authentication (tries Supabase Auth, then admin-session cookie)
const auth = await getAuthenticatedAdmin()
if (!auth.authenticated) return unauthorizedResponse()

// 3. Rate limiting
const { success } = await authRateLimit.limit(auth.userId!)
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

// 4. Role-based authorization (for destructive operations)
const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
if (!roleCheck.authorized) return forbiddenResponse('Insufficient permissions')

// 5. Business logic via service layer
// 6. revalidatePath() for affected routes
```

| Middleware                            | File                          | Purpose                                           |
| ------------------------------------- | ----------------------------- | ------------------------------------------------- |
| `validateCsrf(request)`               | `csrf-middleware.ts`          | Double-submit cookie CSRF protection              |
| `getAuthenticatedAdmin()`             | `admin-auth-helper.ts`        | Dual-auth: Supabase Auth → admin-session fallback |
| `authRateLimit` / `mutationRateLimit` | `rate-limit-middleware.ts`    | Per-user or per-IP rate limiting                  |
| `requireRole(request, roles[])`       | `authorization-middleware.ts` | Role check for destructive operations             |

### Notification Pattern

Admin-facing notifications use two channels fired in parallel (fire-and-forget):

```typescript
// Bell notification (in-app)
notifyAllAdmins(title, message, type, linkUrl).catch(console.error)
// Email notification
sendAdminRequestNotificationEmail({ pilotName, requestCategory, ... }).catch(console.error)
```

Services: `notification-service.ts` (bell) + `pilot-email-service.ts` (email via Resend)

### App Route Structure

| Route Group                               | Purpose                                           |
| ----------------------------------------- | ------------------------------------------------- |
| `/dashboard/*`                            | Admin portal (Supabase Auth protected)            |
| `/portal/(protected)/*`                   | Pilot portal authenticated pages (Redis sessions) |
| `/portal/(public)/*`                      | Pilot login, register, forgot/reset-password      |
| `/auth/*`, `/login`                       | Admin auth flows                                  |
| `/pilot/*`                                | Pilot-facing auth (login, register, logout)       |
| `/api/*`                                  | API routes (see API Routes Structure below)       |
| `/docs`, `/privacy`, `/terms`, `/offline` | Static/utility pages                              |

The portal uses **Next.js route groups** for auth enforcement — `(protected)` pages require a valid Redis session, `(public)` pages do not.

### Supabase Clients

| Client       | File                           | Use Case                                   |
| ------------ | ------------------------------ | ------------------------------------------ |
| Browser      | `lib/supabase/client.ts`       | Client Components, real-time subscriptions |
| Server       | `lib/supabase/server.ts`       | Server Components, API routes              |
| Admin        | `lib/supabase/admin.ts`        | Service operations (pilot portal auth)     |
| Service Role | `lib/supabase/service-role.ts` | Bypasses RLS for system operations         |
| Middleware   | `lib/supabase/middleware.ts`   | Auth state, session refresh, rate limiting |

### Rate Limiting (`lib/rate-limit.ts`)

Distributed rate limiting via Upstash Redis, enforced in `lib/supabase/middleware.ts` for `/api/auth/*` and in services for actions:

| Endpoint / Action     | Limit              |
| --------------------- | ------------------ |
| Login/signin          | 5 per minute / IP  |
| Password reset        | 3 per hour / IP    |
| General auth          | 10 per minute / IP |
| Feedback submissions  | 5 per minute       |
| Leave/flight requests | 3 per minute       |
| Feedback votes        | 30 per minute      |

Falls back to no-op in development when Redis credentials are not configured.

### Client-Side Provider Stack

The app wraps all pages in this provider chain (`app/providers.tsx`):

```
QueryClientProvider → ThemeProvider → NuqsAdapter → CsrfProvider
```

- **TanStack Query**: Server state caching and mutations (config in `lib/react-query/`)
- **next-themes**: Dark/light mode with `class` attribute strategy
- **nuqs**: URL-based state management (used for tab state, filters, pagination via query params)
- **CSRF**: Token management for form submissions

### Session Management

Pilot portal sessions use Redis-backed sessions via `redis-session-service.ts`:

- Cookie name: `pilot-session`
- Sessions stored in Redis with DB audit logging
- Managed via `session-service.ts` → `redis-session-service.ts`

### Redis Caching Layer

| Feature       | Service                        | Purpose                           |
| ------------- | ------------------------------ | --------------------------------- |
| Dashboard     | `dashboard-service-v4.ts`      | Cached metrics, faster page loads |
| Rate Limiting | `@upstash/ratelimit`           | API and auth endpoint protection  |
| Sessions      | `redis-session-service.ts`     | Pilot portal auth                 |
| Invalidation  | `cache-invalidation-helper.ts` | Clear stale data after mutations  |

### Validation Schemas

All Zod schemas live in `lib/validations/`. Always validate API inputs:

```typescript
import { PilotRequestSchema } from '@/lib/validations/pilot-request-schema'
const validated = PilotRequestSchema.parse(body)
```

Forms use **React Hook Form** with Zod resolvers for client-side validation.

### Error Handling Contract (Standardized Jan 2026)

Services should return `ServiceResponse<T>` for new/migrated code:

```typescript
import { ServiceResponse } from '@/lib/types/service-response'

async function getItem(id: string): Promise<ServiceResponse<Item>> {
  try {
    const item = await fetchItem(id)
    if (!item) return ServiceResponse.notFound('Item not found')
    return ServiceResponse.success(item)
  } catch (error) {
    return ServiceResponse.error('Failed to fetch item', error)
  }
}
```

API routes use `api-response-helper.ts` utilities:

```typescript
import { executeAndRespond, unauthorizedResponse } from '@/lib/utils/api-response-helper'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) return unauthorizedResponse()

  return executeAndRespond(async () => await getData(), {
    operation: 'getData',
    endpoint: '/api/data',
  })
}
```

| Utility                                | Purpose                             |
| -------------------------------------- | ----------------------------------- |
| `ServiceResponse.success(data)`        | Successful service response         |
| `ServiceResponse.error(msg, err)`      | Error service response              |
| `ServiceResponse.notFound(msg)`        | 404 response                        |
| `executeAndRespond(fn, opts)`          | Wrap legacy services for API routes |
| `unauthorizedResponse()`               | 401 response helper                 |
| `validationErrorResponse(msg, errors)` | 400 validation error                |

**Migration status**: New services must use `ServiceResponse<T>`. Existing services may throw errors (wrapped by `executeAndRespond`).

### Component Organization

| Directory               | Purpose                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `components/ui/`        | shadcn/ui base components (70+). Storybook stories colocated as `*.stories.tsx`                   |
| `components/layout/`    | App shell, sidebar, navigation chrome                                                             |
| `components/dashboard/` | Admin dashboard widgets and cards                                                                 |
| `components/portal/`    | Pilot portal UI components                                                                        |
| `components/shared/`    | Cross-cutting components used in both portals                                                     |
| `components/{feature}/` | Feature-scoped components (e.g., `certifications/`, `requests/`, `reports/`, `leave/`, `pilots/`) |
| `components/skeletons/` | Loading state placeholders                                                                        |
| `components/forms/`     | Reusable form components                                                                          |

### Custom Hooks (`lib/hooks/`)

Check existing hooks before writing new state logic. Key patterns:

- **Optimistic mutations**: `use-optimistic-mutation` (generic), plus domain-specific variants for pilots, certifications, leave requests
- **Table state**: `use-table-state` (sorting, pagination, filters), `use-filter-presets` (saved configurations)
- **UX**: `use-unsaved-changes`, `use-keyboard-shortcuts`, `use-keyboard-nav`, `use-reduced-motion`
- **Data fetching**: `use-report-query` (TanStack Query wrapper for reports), `use-sidebar-badges`
- **Security**: `use-csrf-token`, `use-online-status`
- **Destructive actions**: `useConfirm()` from `components/ui/confirm-dialog` — renders `<ConfirmDialog />` and exposes `confirm({ title, description, confirmText, variant })` returning a Promise<boolean>

---

## Route Consolidation (Redirects)

Old routes redirect to consolidated tabbed views (configured in `next.config.js`). Always use the **new** paths:

| Old Route                            | Redirects To                                  |
| ------------------------------------ | --------------------------------------------- |
| `/dashboard/certifications/expiring` | `/dashboard/certifications?tab=attention`     |
| `/dashboard/leave/approve`           | `/dashboard/requests?tab=leave`               |
| `/dashboard/leave/calendar`          | `/dashboard/requests?tab=leave&view=calendar` |
| `/dashboard/leave`                   | `/dashboard/requests?tab=leave`               |
| `/dashboard/faqs`                    | `/dashboard/help`                             |

**Dedicated pages** (no redirects): `/dashboard/admin/leave-bids`, `/dashboard/admin/settings`, `/dashboard/admin/check-types`, `/dashboard/admin/pilot-registrations`

---

## Database Schema

**Supabase Project**: `wgdmgvonqysflwdiiols`

### Primary Tables

| Table            | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `pilots`         | Pilot profiles, qualifications, seniority                   |
| `pilot_checks`   | Certification records                                       |
| `check_types`    | Check type definitions                                      |
| `pilot_requests` | **UNIFIED** — ALL leave and flight requests                 |
| `leave_bids`     | Annual leave bidding (separate system)                      |
| `an_users`       | Pilot portal authentication (also aliased as `pilot_users`) |

### Unified Requests Table (`pilot_requests`)

```sql
-- Leave requests
WHERE request_category = 'LEAVE' AND workflow_status = 'PENDING'

-- Flight requests
WHERE request_category = 'FLIGHT'
```

**Field**: Use `workflow_status` (not `status`)

### Deprecated Tables (Read-Only)

- `leave_requests` — Use `pilot_requests` instead
- `flight_requests` — Use `pilot_requests` instead

### Generated Types

`types/supabase.ts` is **auto-generated** — never edit manually. Regenerate after schema changes with `npm run db:types`.

---

## Critical Business Rules

### 1. Roster Periods (28-Day Cycles)

- RP1-RP13 annual cycle (13 x 28 = 364 days)
- Anchor: **RP13/2025 starts 2025-11-08**
- Utils: `lib/utils/roster-utils.ts`

### 2. Certification Compliance (FAA)

```
Red:    Expired (days < 0)
Yellow: Expiring (days <= 30)
Green:  Current (days > 30)
```

### 3. Leave Eligibility (Rank-Separated)

- Captains and First Officers evaluated **independently**
- Minimum: **10 Captains + 10 First Officers** available
- Priority: Seniority number (lower = higher priority)
- Service: `lib/services/leave-eligibility-service.ts`

### 4. Leave Requests vs Leave Bids

| Leave Requests            | Leave Bids                   |
| ------------------------- | ---------------------------- |
| Immediate time-off needs  | Annual preference planning   |
| Submit > Review > Approve | Batch processed by seniority |
| `pilot_requests` table    | `leave_bids` table           |

---

## Common Mistakes to Avoid

### Next.js 16 Async Cookies

```typescript
// WRONG
const cookieStore = cookies()

// CORRECT
const cookieStore = await cookies()
```

### Cache Invalidation After Mutations

```typescript
import { revalidatePath } from 'next/cache'

export async function PUT(request: Request) {
  const data = await updateCertification(id, body)
  revalidatePath('/dashboard/certifications')
  return NextResponse.json({ success: true, data })
}
```

### Navigation Order

```typescript
// WRONG - navigate before refresh
router.push('/dashboard/certifications')
router.refresh()

// CORRECT - refresh first, then navigate
router.refresh()
await new Promise((resolve) => setTimeout(resolve, 100))
router.push('/dashboard/certifications')
```

### Dev Server Uses Webpack (Not Turbopack)

The `dev` script runs `next dev --webpack`. Turbopack is disabled due to path alias resolution issues. The `next.config.js` has a `turbopack.root` workaround but Webpack remains the default.

### Server Actions Body Limit

`serverActions.bodySizeLimit` is set to `2mb` in `next.config.js`. File uploads exceeding this will fail silently.

---

## File Naming Conventions

Enforced by `npm run validate:naming`:

| Type        | Pattern                | Example                    |
| ----------- | ---------------------- | -------------------------- |
| Components  | `kebab-case.tsx`       | `pilot-card.tsx`           |
| Services    | `{feature}-service.ts` | `pilot-service.ts`         |
| Validations | `{feature}-schema.ts`  | `flight-request-schema.ts` |
| E2E Tests   | `{feature}.spec.ts`    | `pilots.spec.ts`           |

---

## Technology Stack

| Tech            | Purpose                              |
| --------------- | ------------------------------------ |
| Next.js 16+     | App Router, React Compiler enabled   |
| React 19+       | UI library                           |
| TypeScript 5.9  | Strict mode                          |
| Tailwind CSS v4 | Styling (via `@tailwindcss/postcss`) |
| Supabase        | PostgreSQL + Auth + RLS              |
| TanStack Query  | Server state management              |
| React Hook Form | Form state with Zod resolvers        |
| nuqs            | URL-based state (tabs, filters)      |
| Playwright      | E2E testing                          |
| Redis (Upstash) | Sessions, caching, rate limits       |
| shadcn/ui       | Component library (Radix-based)      |
| Framer Motion   | Animations                           |
| Storybook       | Component development                |

Path alias: `@/*` maps to project root. Node engine: `>=18.18.0 <25`.

Formatting: Single quotes, 2-space indent, 100-char line width, Tailwind class sorting via `prettier-plugin-tailwindcss`.

---

## Environment Variables

| Variable                        | Required | Description                                  |
| ------------------------------- | -------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key                       |
| `NEXT_PUBLIC_APP_URL`           | Optional | Application base URL (defaults to localhost) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server   | Service role key (bypasses RLS)              |
| `UPSTASH_REDIS_REST_URL`        | Yes      | Redis URL for sessions/cache                 |
| `UPSTASH_REDIS_REST_TOKEN`      | Yes      | Redis authentication token                   |
| `RESEND_API_KEY`                | Server   | Email service (Resend) API key               |
| `RESEND_FROM_EMAIL`             | Server   | Email sender address                         |
| `CRON_SECRET`                   | Server   | Vercel cron job auth token                   |
| `LOGTAIL_SOURCE_TOKEN`          | Server   | Better Stack logging token                   |

Copy `.env.example` to `.env.local` for development. Tests use `.env.test.local`.

**Validated at startup** by `lib/env.ts` (Zod schema). Access env vars via `import { env } from '@/lib/env'` instead of `process.env` directly — this ensures type safety and early failure on missing vars.

---

## API Routes Structure

| Path             | Purpose                             |
| ---------------- | ----------------------------------- |
| `/api/*`         | Admin portal API endpoints          |
| `/api/portal/*`  | Pilot portal API endpoints          |
| `/api/reports/*` | Report generation (19 report types) |
| `/api/cron/*`    | Scheduled job endpoints             |
| `/api/auth/*`    | Authentication endpoints            |

Admin and pilot portal APIs use different auth systems. Never mix authentication methods between these route groups.

---

**Version**: 4.1.0
**Last Updated**: February 2026
**Maintainer**: Maurice (Skycruzer)
