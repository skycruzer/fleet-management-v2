# Architecture

**Analysis Date:** 2026-03-14

## Pattern Overview

**Overall:** Multi-tier service-oriented architecture with strict separation between admin portal (Supabase Auth) and pilot portal (custom session auth).

**Key Characteristics:**

- Service layer intermediates ALL database access (no direct Supabase calls in components/routes)
- Dual authentication systems running in parallel (never mixed)
- API routes follow mandatory middleware pipeline (CSRF → Auth → RateLimit → RoleCheck → Logic)
- Redis-backed caching for dashboard metrics and session management
- TypeScript with strict mode enforced across all code
- Monolithic application with feature-scoped component organization

## Layers

**Presentation Layer:**

- Purpose: Server and Client Components rendering UI for two separate portals
- Location: `app/dashboard/*` (admin), `app/portal/(protected)/*` (pilots), `app/portal/(public)/*` (auth pages)
- Contains: Page components, layouts, error boundaries, page transitions
- Depends on: Services (via TanStack Query), hooks, utilities, Supabase client
- Used by: End users (browsers)

**API Routes Layer:**

- Purpose: RESTful endpoints for client mutations and admin operations
- Location: `app/api/*` (admin), `app/api/portal/*` (pilot-specific)
- Contains: Route handlers (GET, POST, PUT, PATCH, DELETE) with standardized response format
- Depends on: Services, middleware pipeline, validation schemas, utilities
- Used by: Client-side mutations (React Hook Form, TanStack Query), third-party integrations

**Middleware Layer:**

- Purpose: Cross-cutting concerns for API routes (security, rate limiting, auth, caching)
- Location: `lib/middleware/`
- Contains: `csrf-middleware.ts`, `admin-auth-helper.ts`, `rate-limit-middleware.ts`, `authorization-middleware.ts`
- Depends on: Rate limit client (Upstash), Supabase clients, services
- Used by: All mutation API routes

**Service Layer:**

- Purpose: Business logic, database operations, domain calculations
- Location: `lib/services/` (55+ services)
- Contains: Pilot management, certifications, requests (leave/flight), dashboards, reports, auth, email
- Depends on: Supabase clients (server, admin, service-role), types, utilities, validation
- Used by: API routes, server components, other services

**Data Access Layer:**

- Purpose: Supabase client initialization and configuration
- Location: `lib/supabase/`
- Contains: `server.ts` (Server Components/API), `client.ts` (Client Components), `admin.ts` (service operations), `service-role.ts` (RLS bypass), `middleware.ts` (session handling)
- Depends on: Supabase SDK, environment variables
- Used by: Services, API routes, middleware

**Type System Layer:**

- Purpose: TypeScript definitions and validation
- Location: `types/supabase.ts` (auto-generated), `lib/types/`, `lib/validations/`
- Contains: Database types, Zod validation schemas, custom types (ServiceResponse, etc.)
- Depends on: Supabase schema
- Used by: All other layers

**Utilities & Helpers:**

- Purpose: Cross-cutting functions (date handling, formatting, calculations)
- Location: `lib/utils/`, `lib/hooks/`
- Contains: 40+ utility modules (roster-utils, certification-status, api-response-helper, etc.), 24 custom hooks
- Depends on: Types, validation
- Used by: All layers

**Client-Side State Management:**

- Purpose: Server state caching, UI state, CSRF tokens
- Location: `lib/react-query/`, `lib/providers/`
- Contains: TanStack Query client config, theme provider, CSRF provider, nuqs adapter
- Depends on: React Query, next-themes, nuqs
- Used by: All client components via provider wrapper

## Data Flow

**Admin Portal Request Flow:**

1. User navigates to `/dashboard/page`
2. Server Component calls service layer (e.g., `getPilots()`)
3. Service uses Supabase client (`lib/supabase/server.ts`) to fetch data
4. Component renders with data, wrapped in `<Providers>` for TanStack Query
5. User interaction triggers API mutation (e.g., `POST /api/pilots`)
6. API route validates CSRF, checks admin auth, rate limits, then calls service
7. Service updates database and returns response
8. API route calls `revalidatePath()` to invalidate cache
9. Client receives response, TanStack Query updates cache, UI refreshes

**Pilot Portal Request Flow:**

1. User logs in at `/pilot/login` (custom session auth, NOT Supabase)
2. Credentials validated against `an_users` table via `pilot-portal-service.ts`
3. Session stored in Redis via `redis-session-service.ts` with `pilot-session` cookie
4. Middleware checks cookie and refreshes session on each request
5. User navigates to `/portal/(protected)/page`
6. Server Component checks session validity via `getCurrentPilot()`
7. If valid, component calls service layer for data
8. User submits form, API route at `/api/portal/*` validates CSRF and session
9. Service updates database, cache invalidated, UI refreshes

**Certification Status Flow:**

1. Certification records fetched from `pilot_checks` table
2. `getCertificationStatus()` utility compares expiry date vs. today
3. Status assigned: RED (expired, days < 0), YELLOW (expiring, days ≤ 30), GREEN (current, days > 30)
4. Dashboard service caches status in Redis for performance
5. Renewal planning service identifies which checks need renewal in current RP

**Leave Eligibility Flow:**

1. Leave request submitted via `/api/requests` endpoint
2. `leave-eligibility-service.ts` checks minimum crew availability
3. Seniority number ranked (lower = higher priority)
4. Rank separation enforced: Captains and First Officers evaluated independently
5. Minimum 10 Captains + 10 First Officers required to be available
6. Request approved/denied based on eligibility

## Key Abstractions

**ServiceResponse<T>:**

- Purpose: Standardized error handling and success responses for service layer
- Examples: `lib/types/service-response.ts`
- Pattern: Returns object with `success: boolean`, `data?: T`, `error?: string`, `errorCode?: string`
- Usage: All new services should return ServiceResponse; legacy services wrapped by `executeAndRespond()`
- Benefits: Consistent error handling, type-safe, supports validation errors and metadata

**Unified Requests:**

- Purpose: Single source of truth for ALL leave and flight requests
- Examples: `lib/services/unified-request-service.ts`
- Pattern: `pilot_requests` table with `request_category` field (LEAVE/FLIGHT)
- Usage: Replaces deprecated `leave_requests` and `flight_requests` tables
- Benefits: Simplified queries, unified approval workflow, easier reporting

**Roster Period (RP1-RP13):**

- Purpose: 28-day scheduling cycle for crew planning
- Examples: `lib/utils/roster-utils.ts`, `lib/services/roster-period-service.ts`
- Pattern: Annual cycle: RP1-RP13 (13 × 28 = 364 days), anchor date RP13/2025 = 2025-11-08
- Usage: All requests, certifications, and planning tied to current/future RP
- Benefits: Predictable scheduling, certification renewals planned by RP, leave bidding cycles

**Dashboard Cache Layer:**

- Purpose: Redis-backed memoization of expensive dashboard computations
- Examples: `lib/services/dashboard-service-v4.ts`
- Pattern: Query service, serialize result, cache in Redis with TTL
- Usage: Dashboard metrics loaded once per user, invalidated on mutations
- Benefits: 60%+ reduction in dashboard load time, reduced database load

**Optimistic Updates:**

- Purpose: Client-side UI updates before server confirmation
- Examples: `lib/hooks/use-optimistic-mutation.ts`, `use-optimistic-certification.ts`
- Pattern: Update local state immediately, revert on error, sync with server on success
- Usage: Forms, table mutations, list operations
- Benefits: Perceived instant feedback, smoother UX, graceful degradation

## Entry Points

**Web Application:**

- Location: `app/layout.tsx`
- Triggers: Browser navigation to any route
- Responsibilities: Initialize root layout, wrap app in Providers (QueryClientProvider → ThemeProvider → NuqsAdapter → CsrfProvider), render error boundary, offline indicator, accessibility components

**Admin Portal:**

- Location: `app/dashboard/layout.tsx`
- Triggers: Authenticated admin accessing `/dashboard/*`
- Responsibilities: Check dual auth (Supabase Auth OR admin-session cookie), render sidebar + header, manage sidebar collapse state, render page content with transitions

**Pilot Portal:**

- Location: `app/portal/(protected)/layout.tsx`
- Triggers: Authenticated pilot accessing `/portal/(protected)/*`
- Responsibilities: Check Redis session validity via `getCurrentPilot()`, prevent access if session expired/invalid

**API Routes:**

- Location: `app/api/[feature]/route.ts`
- Triggers: Client mutations (POST/PUT/PATCH/DELETE) or data fetches (GET)
- Responsibilities: Validate request, apply middleware pipeline, call service, return response, invalidate cache

**Cron Jobs:**

- Location: `app/api/cron/*`
- Triggers: Vercel cron schedule (configured in `vercel.json`)
- Responsibilities: Run scheduled tasks (deadline alerts, email notifications, cache warmup)
- Auth: Validates `CRON_SECRET` header to prevent unauthorized execution

## Error Handling

**Strategy:** Multi-layer error capture with sanitization before client exposure.

**Patterns:**

**Service Layer:**

- Return `ServiceResponse.error(message, error, errorCode)`
- Log via `logError()` with context (severity, metadata)
- Never throw; always return structured response
- Validation errors collected and returned in `validationErrors[]`

**API Routes:**

- Wrap service calls with `executeAndRespond(fn, options)` for legacy services
- Catch JSON parse errors, validation errors separately
- Map error codes to HTTP status codes (401, 403, 404, 409, 429, 500)
- Sanitize errors via `sanitizeError()` before returning to client
- Return 500 for unhandled errors with generic message "An error occurred"

**Components:**

- Render `<ErrorBoundary>` at page level
- Display toasts via Sonner for user-facing errors
- Log to Better Stack (Logtail) for observability

**Error Codes:**

- `UNAUTHORIZED`: Missing or invalid auth
- `FORBIDDEN`: Auth valid but insufficient permissions
- `NOT_FOUND`: Resource doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `CONFLICT`: Duplicate record or business rule violation
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Cross-Cutting Concerns

**Logging:** Better Stack (Logtail) integration via `@logtail/node` and `@logtail/browser`. Structured logs include severity (INFO, WARNING, ERROR), source, metadata. Use `logError()`, `logInfo()`, `logWarning()` from `lib/error-logger.ts`.

**Validation:** Zod schemas in `lib/validations/`. All API inputs validated with `safeParse()`. React Hook Form uses Zod resolvers on client side. Custom validation rules for business logic (e.g., roster period constraints).

**Authentication:** Dual systems with explicit routing:

- Admin: Supabase Auth (JWT tokens)
- Pilots: Custom session (Redis + bcrypt + `pilot-session` cookie)
- Middleware checks both; services use appropriate client

**Authorization:** Role-based access control (RBAC) via `requireRole()` middleware. Roles: ADMIN, MANAGER, PILOT. Row-level security (RLS) policies in Supabase for data isolation.

**CSRF Protection:** Double-submit cookie pattern. Middleware extracts token from request header, compares to cookie value. All mutations require valid token via `validateCsrf()`.

**Rate Limiting:** Upstash Redis-backed distributed limits:

- `/api/auth/*`: 5 per minute per IP
- Password reset: 3 per hour per IP
- Feedback/requests: 3-5 per minute
- Mutations: General limit per user

**Caching:**

- Server-side: `unstable_cache()` + `revalidatePath()` for data revalidation
- Client-side: TanStack Query with 5-minute stale time defaults
- Redis: Dashboard metrics, sessions, rate limit counters

**Email Notifications:**

- Service: `pilot-email-service.ts` (uses Resend API)
- Pattern: Fire-and-forget background job (don't await)
- Triggers: Leave/flight request state changes, certification expiration warnings

**CORS & Security Headers:**

- CSP (Content Security Policy): Restricts scripts, styles, images
- HSTS: Enforces HTTPS (63072000 seconds = 2 years)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---

_Architecture analysis: 2026-03-14_
