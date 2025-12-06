# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Rules (MANDATORY)

**These rules govern how Claude Code works on ALL tasks in this repository:**

1. **PLAN FIRST**: Think through the problem, read relevant codebase files, and write a plan to `tasks/todo.md`
2. **CREATE CHECKLIST**: The plan must have a list of todo items that can be checked off as completed
3. **GET APPROVAL**: Before beginning work, check in with the user to verify the plan
4. **TRACK PROGRESS**: Work through todo items, marking each complete as you go
5. **COMMUNICATE CLEARLY**: At every step, provide a high-level explanation of changes made
6. **SIMPLICITY IS KING**: Make every task and code change as simple as possible
   - Avoid massive or complex changes
   - Every change should impact as little code as possible
   - Everything is about simplicity
7. **DOCUMENT COMPLETION**: Add a review section to `tasks/todo.md` with a summary of changes and relevant information
8. **NO LAZINESS**: Never be lazy. Find the root cause of bugs and fix them properly. No temporary fixes. You are a senior developer.
9. **MINIMAL IMPACT**: All fixes and code changes must be as simple as humanly possible
   - Only impact code relevant to the task
   - Impact as little code as possible
   - Goal: Introduce zero bugs
   - It's all about simplicity

---

## Quick Start for New Developers

### First Time Setup (5 minutes)
```bash
# 1. Clone and install dependencies
npm install

# 2. Copy environment template and add your Supabase credentials
cp .env.example .env.local
# Edit .env.local with your Supabase URL and keys

# 3. Generate TypeScript types from database schema
npm run db:types

# 4. Start development server
npm run dev
# Visit http://localhost:3000

# 5. Verify setup by running tests
npm test
```

### Your First Feature
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. ALWAYS implement service layer first (if database operations needed)
touch lib/services/my-feature-service.ts

# 3. Add validation schema
touch lib/validations/my-feature-schema.ts

# 4. Create API route (must use service layer!)
touch app/api/my-feature/route.ts

# 5. Build UI components
# Add shadcn component if needed: npx shadcn@latest add dialog

# 6. Write E2E test
touch e2e/my-feature.spec.ts

# 7. Run quality checks before commit
npm run validate
npm run validate:naming
```

## Project Overview

**Fleet Management V2** is a modern B767 Pilot Management System built with Next.js 16, React 19, and TypeScript 5.7. This connects to a production Supabase database (`wgdmgvonqysflwdiiols`) containing 27 pilots, 607 certifications, and 34 check types.

**Critical**: This is a **service-layer architecture**. All database operations MUST go through service functions in `lib/services/`. Never make direct Supabase calls from API routes or components.

## Key Commands

### Development
```bash
npm run dev               # Start dev server (http://localhost:3000)
npm run build             # Production build with Turbopack
npm run start             # Start production server
npm run validate          # Run type-check + lint + format:check (pre-commit)
npm run validate:naming   # Validate naming conventions across codebase
```

### Testing
```bash
npm test                  # Run all Playwright E2E tests
npm run test:ui           # Open Playwright UI mode
npm run test:headed       # Run tests with visible browser
npm run test:debug        # Debug mode
npx playwright test e2e/auth.spec.ts  # Run single test file
npx playwright show-report             # View HTML test report
```

### Database
```bash
npm run db:types          # Generate TypeScript types from Supabase schema
npm run db:migration      # Create new database migration
npm run db:deploy         # Deploy migrations to production
node test-connection.mjs  # Test Supabase connection
```

### Storybook
```bash
npm run storybook         # Start component dev server (http://localhost:6006)
npm run build-storybook   # Build static Storybook site
```

### Code Quality
```bash
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run type-check        # TypeScript validation (strict mode)
npm run format            # Format code with Prettier
npm run format:check      # Check formatting only
```

## Common Development Workflows

### Adding a New API Endpoint
```bash
# 1. Create service function
touch lib/services/my-feature-service.ts

# 2. Add validation schema
touch lib/validations/my-feature-schema.ts

# 3. Create API route
touch app/api/my-feature/route.ts

# 4. Test the endpoint
curl http://localhost:3000/api/my-feature
```

### Debugging Database Issues
```bash
# Check database connection
node test-connection.mjs

# Regenerate types after schema changes (REQUIRED)
npm run db:types

# Check Supabase logs for errors
# Visit: https://app.supabase.com/project/wgdmgvonqysflwdiiols/logs
```

### Testing a Specific Feature
```bash
# Run specific test file
npx playwright test e2e/leave-requests.spec.ts

# Run tests matching pattern
npx playwright test --grep "leave request"

# Debug mode with browser visible
npm run test:debug

# View test report
npx playwright show-report
```

### Working with Forms
```bash
# 1. Create Zod validation schema
# Edit: lib/validations/my-feature-schema.ts

# 2. Create form component using React Hook Form
# Use zodResolver for validation

# 3. Test form submission end-to-end
# Write Playwright test in e2e/
```

## Common Mistakes to Avoid

### ❌ DON'T: Direct Supabase Calls
```typescript
// ❌ WRONG - bypasses service layer
const { data } = await supabase.from('pilots').select('*')
```

### ✅ DO: Use Service Layer
```typescript
// ✅ CORRECT - uses service layer
import { getPilots } from '@/lib/services/pilot-service'
const pilots = await getPilots()
```

---

### ❌ DON'T: Mix Authentication Systems
```typescript
// ❌ WRONG - using admin auth for pilot portal
import { createClient } from '@/lib/supabase/server'
// in /app/api/portal/something/route.ts
```

### ✅ DO: Use Correct Auth for Each System
```typescript
// ✅ CORRECT - pilot portal uses custom auth
import { verifyPilotSession } from '@/lib/services/pilot-portal-service'
// in /app/api/portal/something/route.ts

// ✅ CORRECT - admin dashboard uses Supabase Auth
import { createClient } from '@/lib/supabase/server'
// in /app/api/pilots/route.ts
```

---

### ❌ DON'T: Forget to Regenerate Types
After any database schema change, you **MUST** run:
```bash
npm run db:types
```
Otherwise you'll get TypeScript errors about missing properties.

---

### ❌ DON'T: Use sync cookies() in Next.js 16
```typescript
// ❌ WRONG - Next.js 16 requires async
const cookieStore = cookies()
```

```typescript
// ✅ CORRECT - await cookies()
const cookieStore = await cookies()
```

---

### ❌ DON'T: Skip Validation
```typescript
// ❌ WRONG - no validation
export async function POST(request: Request) {
  const body = await request.json()
  // Directly use body without validation
}
```

```typescript
// ✅ CORRECT - validate with Zod
import { MySchema } from '@/lib/validations/my-schema'

export async function POST(request: Request) {
  const body = await request.json()
  const validated = MySchema.parse(body) // Throws if invalid
  // Use validated data
}
```

---

### ❌ DON'T: Hardcode URLs in E2E Tests
```typescript
// ❌ WRONG - hardcoded port
await page.goto('http://localhost:3000/dashboard/leave/new')
```

```typescript
// ✅ CORRECT - use baseURL from playwright.config.ts
await page.goto('/dashboard/leave/new')
```

**Why**: Tests may run against different ports (dev: 3000, production: 3003). The baseURL in `playwright.config.ts` handles this automatically.

---

### ❌ DON'T: Hardcode Environment Variables
```typescript
// ❌ WRONG - hardcoded URL
const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
```

```typescript
// ✅ CORRECT - use environment variables
import { env } from '@/lib/env'
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
```

---

### ❌ DON'T: Forget Cache Invalidation After Mutations
```typescript
// ❌ WRONG - no cache invalidation after update
export async function PUT(request: Request) {
  const data = await updateCertification(id, body)
  return NextResponse.json({ success: true, data })
}
```

```typescript
// ✅ CORRECT - revalidate paths after mutations
import { revalidatePath } from 'next/cache'

export async function PUT(request: Request) {
  const data = await updateCertification(id, body)

  // Revalidate all affected paths
  revalidatePath('/dashboard/certifications')
  revalidatePath(`/dashboard/certifications/${id}`)

  return NextResponse.json({ success: true, data })
}
```

**Why**: Next.js 16 has aggressive caching. Without `revalidatePath()`, users see stale data even after successful updates.

---

### ❌ DON'T: Navigate Before Refreshing Cache
```typescript
// ❌ WRONG - navigate away before refresh
router.push('/dashboard/certifications')
router.refresh()  // Too late - already navigated!
```

```typescript
// ✅ CORRECT - refresh before navigating
router.refresh()
await new Promise(resolve => setTimeout(resolve, 100))
router.push('/dashboard/certifications')
```

**Why**: Calling `router.push()` before `router.refresh()` means the cache invalidation never takes effect.

## File Naming Conventions

This project follows strict naming conventions (enforced by `npm run validate:naming`):

### Components
- **UI Components**: `kebab-case.tsx` (e.g., `pilot-card.tsx`)
- **Page Components**: `page.tsx` (Next.js convention)
- **Layout Components**: `layout.tsx` (Next.js convention)

### Services
- **Pattern**: `{feature}-service.ts`
- **Examples**: `pilot-service.ts`, `leave-service.ts`, `notification-service.ts`

### Validation Schemas
- **Pattern**: `{feature}-schema.ts` or `{feature}-validation.ts`
- **Examples**: `pilot-validation.ts`, `flight-request-schema.ts`

### E2E Tests
- **Pattern**: `{feature}.spec.ts`
- **Examples**: `pilots.spec.ts`, `leave-requests.spec.ts`, `auth.spec.ts`

### API Routes
- **Pattern**: `app/api/{feature}/route.ts`
- **Examples**: `app/api/pilots/route.ts`, `app/api/leave-requests/route.ts`

## Pre-Deployment Checklist

Before deploying to production, complete ALL items:

**Code Quality**
- [ ] Run full validation: `npm run validate`
- [ ] Run naming validation: `npm run validate:naming`
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`

**Environment & Configuration**
- [ ] All environment variables set in Vercel dashboard
- [ ] Database types are up to date: `npm run db:types`
- [ ] No `.env.local` or secrets committed to Git

**Database & Migrations**
- [ ] Database migrations tested (if any)
- [ ] Row Level Security (RLS) policies verified
- [ ] Database indexes optimized for queries

**Testing & Quality**
- [ ] Manual testing completed on staging
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsive testing (iOS/Android)
- [ ] Accessibility checks pass: `npx playwright test --grep accessibility`

**Monitoring & Logging**
- [ ] Better Stack (Logtail) logging configured and working
- [ ] Error tracking tested in production environment
- [ ] Security audit logs reviewed

**PWA & Performance**
- [ ] PWA manifest and service worker verified
- [ ] Service worker caching strategies tested
- [ ] Image optimization configured
- [ ] Performance metrics acceptable (Lighthouse score)

**Security**
- [ ] Security headers configured in `next.config.js`
- [ ] Rate limiting tested on public endpoints
- [ ] Authentication flows tested (admin + pilot portal)
- [ ] No exposed API keys or secrets

**Documentation**
- [ ] README updated (if needed)
- [ ] CLAUDE.md updated (if architecture changed)
- [ ] API documentation updated
- [ ] Deployment notes documented

## Architecture Overview

### Service Layer Pattern (MANDATORY)

**Rule #1**: All database operations MUST use service functions. Never call Supabase directly.

```typescript
// ✅ CORRECT - Use service layer
import { getPilots } from '@/lib/services/pilot-service'

export async function GET() {
  const pilots = await getPilots()
  return NextResponse.json({ success: true, data: pilots })
}

// ❌ WRONG - Direct Supabase call
const { data } = await supabase.from('pilots').select('*')
```

### Implemented Services

All services located in `lib/services/` (50 services). Key services:

**Core Domain Services**:
- `pilot-service.ts` - Pilot CRUD, captain qualifications
- `certification-service.ts` - Certification tracking and management
- `leave-service.ts` - Leave request CRUD operations
- `leave-bid-service.ts` - Annual leave bid submissions
- `leave-eligibility-service.ts` - Complex leave eligibility logic (rank-separated)
- `flight-request-service.ts` - Flight request submissions
- `unified-request-service.ts` - Unified request handling (leave + flight)

**Dashboard & Analytics**:
- `dashboard-service.ts` - Dashboard metrics aggregation
- `dashboard-service-v4.ts` - Redis-cached dashboard (production)
- `analytics-service.ts` - Analytics data processing
- `retirement-forecast-service.ts` - Retirement planning and forecasting
- `succession-planning-service.ts` - Succession planning

**Caching**:
- `cache-service.ts` - Performance caching with TTL
- `redis-cache-service.ts` - Redis-based caching
- `unified-cache-service.ts` - Unified cache management

**PDF & Reports**:
- `pdf-service.ts` - PDF report generation
- `reports-service.ts` - Unified reports (19 reports across 5 categories)
- `renewal-planning-pdf-service.ts` - Renewal plan PDF generation
- `leave-bids-pdf-service.ts` - Leave bids PDF export
- `roster-pdf-service.ts` - Roster PDF generation
- `export-service.ts` - General export functionality

**Authentication & Security**:
- `pilot-portal-service.ts` - Pilot-facing portal operations
- `session-service.ts` - Session management
- `account-lockout-service.ts` - Account lockout protection
- `password-validation-service.ts` - Password security
- `account-deletion-service.ts` - Account deletion workflow

**Supporting Services**:
- `audit-service.ts` - Audit logging for all CRUD operations
- `logging-service.ts` - Better Stack (Logtail) logging
- `notification-service.ts` - In-app notification management
- `feedback-service.ts` - Admin feedback management

### Dual Authentication Architecture

This application has **two separate authentication systems**:

#### 1. Admin Portal Authentication
- **Location**: `/dashboard/*` routes
- **Auth System**: Supabase Auth (default)
- **Client**: `lib/supabase/server.ts` and `lib/supabase/client.ts`
- **Users**: Admin staff, managers, system administrators
- **Access**: Full CRUD operations, analytics, reporting, settings

#### 2. Pilot Portal Authentication
- **Location**: `/portal/*` routes
- **Auth System**: Custom authentication using `an_users` table
- **Service**: `lib/services/pilot-portal-service.ts`
- **Users**: Pilots (linked to `pilots` table via employee_number)
- **Access**: Read-only personal data, submit leave/flight requests, view notifications
- **Login Flow**: `/portal/login` → credential validation → session creation
- **Special Features**:
  - Aviation-themed UI with friendly crew terminology
  - Registration requires admin approval (`pending_approval` status)
  - Completely isolated from admin authentication

**IMPORTANT**: Never mix these authentication systems. API routes under `/api/portal/*` use pilot authentication, while `/api/*` (non-portal) use admin Supabase authentication.

### Supabase Client Architecture

Three client types for different execution contexts:

1. **Browser Client** (`lib/supabase/client.ts`):
   - Use in Client Components (`'use client'`)
   - Cookie-based session management
   - Real-time subscriptions

2. **Server Client** (`lib/supabase/server.ts`):
   - Use in Server Components, Server Actions, Route Handlers
   - SSR-compatible with Next.js 16 async cookies (`await cookies()`)
   - Automatic session refresh

3. **Middleware Client** (`lib/supabase/middleware.ts`):
   - Handles authentication state across requests
   - Session refresh and cookie management
   - Protected route enforcement

### Project Structure

```
fleet-management-v2/
├── app/                          # Next.js 16 App Router
│   ├── api/                      # API routes (use services!)
│   │   ├── pilots/route.ts       # Pilot endpoints
│   │   ├── certifications/route.ts
│   │   ├── leave-requests/route.ts
│   │   ├── analytics/route.ts
│   │   └── portal/               # Pilot portal API (separate auth)
│   ├── dashboard/                # Admin dashboard (Supabase Auth)
│   ├── portal/                   # Pilot portal (Custom Auth via an_users)
│   │   ├── (public)/            # Public portal pages (login, register)
│   │   └── (protected)/         # Protected portal pages (dashboard, profile)
│   └── auth/                     # Admin authentication pages
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── portal/                   # Pilot portal components
│   ├── forms/                    # Form components
│   └── layout/                   # Layout components
│
├── lib/                          # Core utilities
│   ├── services/                 # ⭐ Service layer (CRITICAL - 32 services)
│   ├── supabase/                 # Supabase clients
│   ├── utils/                    # Utility functions
│   │   ├── roster-utils.ts       # 28-day roster period logic
│   │   ├── certification-utils.ts # FAA color coding
│   │   ├── error-messages.ts     # Standardized error messages
│   │   └── constraint-error-handler.ts
│   └── validations/              # Zod schemas (14 validation files)
│
├── types/                        # TypeScript definitions
│   └── supabase.ts               # Generated database types (2000+ lines)
│
└── e2e/                          # Playwright E2E tests
```

## Database Schema

**Connected to**: Supabase Project `wgdmgvonqysflwdiiols`

### Main Tables (v2.0.0 Architecture - Updated Nov 16, 2025)

**Primary Tables** (Active Use):
- `pilots` (27 records) - Pilot profiles, qualifications, seniority
- `pilot_checks` (607 records) - Certification records
- `check_types` (34 records) - Check type definitions
- `pilot_requests` ⭐ **UNIFIED REQUEST TABLE** - ALL leave and flight requests
  - `request_category = 'LEAVE'` - Leave requests (~20 records)
  - `request_category = 'FLIGHT'` - Flight requests
  - Sources: Pilot portal + Admin portal
  - Field: `workflow_status` (not `status`)
- `leave_bids` - **Separate** annual leave preference bidding system (2 records)
  - Different purpose from leave_requests
  - Has sub-table: `leave_bid_options`
- `an_users` - **Pilot portal authentication** (separate from Supabase Auth)
- `contract_types` (3 records) - Contract type definitions
- `disciplinary_actions` - Disciplinary record tracking
- `tasks` - Task management system
- `notifications` - In-app notification system

**Deprecated Tables** (Do Not Use):
- `leave_requests` 📚 **DEPRECATED** - Read-only archive (use `pilot_requests` instead)
  - Migration: `mark_legacy_tables_deprecated.sql`
  - RLS: SELECT allowed, INSERT/UPDATE/DELETE blocked
- `flight_requests` 🗑️ **DEPRECATED** - Empty, safe to drop (use `pilot_requests` instead)
  - Migration: `mark_legacy_tables_deprecated.sql`
  - RLS: SELECT allowed, INSERT/UPDATE/DELETE blocked

**See**: `FINAL-ARCHITECTURE.md` for complete table structure and migration details

### Database Views (Read-Only)
- `expiring_checks` - Simplified expiring certifications
- `detailed_expiring_checks` - Detailed certification expiry data
- `compliance_dashboard` - Fleet-wide compliance metrics
- `pilot_report_summary` - Comprehensive pilot summaries
- `captain_qualifications_summary` - Captain qualification tracking
- `dashboard_metrics` - Real-time dashboard statistics

### Database Functions
- `calculate_years_to_retirement(pilot_id)` - Retirement calculations
- `calculate_years_in_service(pilot_id)` - Service time calculations
- `get_fleet_compliance_summary()` - Fleet compliance percentage
- `get_fleet_expiry_statistics()` - Expiry distribution stats
- `get_pilot_dashboard_metrics()` - Pilot-specific metrics

### Type Generation

After any database schema changes:
```bash
npm run db:types
```

All Supabase clients are typed with `Database` from `@/types/supabase`.

## Critical Business Rules

### 1. Roster Period System (28-Day Cycles)

Leave requests operate on 28-day roster periods (RP1-RP13 annual cycle):
- Known anchor: **RP12/2025 starts 2025-10-11**
- After RP13/YYYY → automatically rolls to RP1/(YYYY+1)
- All leave requests must align to roster period boundaries
- Utility functions in `lib/utils/roster-utils.ts`

### 2. Certification Compliance (FAA Standards)

**Color Coding** (`lib/utils/certification-utils.ts`):
- 🔴 **Red**: Expired (days_until_expiry < 0)
- 🟡 **Yellow**: Expiring soon (days_until_expiry ≤ 30)
- 🟢 **Green**: Current (days_until_expiry > 30)

**Alert Thresholds**:
- Critical: Expired certifications
- Warning: ≤60 days until expiry
- Notice: ≤90 days until expiry

### 3. Leave Eligibility Logic (Rank-Separated)

**CRITICAL**: Captains and First Officers are evaluated **independently**.

**Minimum Crew Requirements**:
- Must maintain **10 Captains available** (per rank)
- Must maintain **10 First Officers available** (per rank)

**Approval Priority** (within same rank):
1. Seniority number (lower = higher priority, e.g., #1 beats #5)
2. Request submission date (earlier beats later)

**Approval Algorithm** (`lib/services/leave-eligibility-service.ts`):
- If single pilot requests dates → Approve if remaining crew ≥ 10
- If multiple pilots request same dates → Approve all if remaining ≥ 10, else approve by seniority until minimum reached

**Special Alerts**:
- **Eligibility Alert**: Shows when 2+ pilots of same rank request overlapping dates
- **Final Review Alert**: Appears 22 days before next roster period starts (only when pendingCount > 0)

### 4. Captain Qualifications

Stored in JSONB column `qualifications`:
- **Line Captain**: Standard captain qualification
- **Training Captain**: Authorized to conduct training
- **Examiner**: Authorized to conduct check rides
- **RHS Captain Expiry**: Right-hand seat captain currency tracking

Utilities in `lib/utils/qualification-utils.ts`

### 5. Seniority System

Based on `commencement_date` field:
- Earlier date = lower seniority number = higher priority
- Seniority numbers 1-27 (unique)
- Used for leave request prioritization

### 6. Leave Requests vs Leave Bids (v2.0.0 Architecture)

**IMPORTANT**: These are two SEPARATE systems with different purposes:

#### Leave Requests ⭐ (Unified Table)
- **Purpose**: Individual time-off requests (sick leave, RDO, SDO, annual leave, etc.)
- **Workflow**: Submit → Manager Review → Approve/Deny
- **Timing**: Submitted as needed, ideally 21+ days in advance
- **Service**: `lib/services/pilot-leave-service.ts` and `lib/services/leave-service.ts`
- **API**: `/api/portal/leave-requests` (pilot) and `/api/leave-requests` (admin)
- **Table**: `pilot_requests` ✅ **UNIFIED TABLE**
  - Filter: `request_category = 'LEAVE'`
  - Status field: `workflow_status` (not `status`)
  - Sources: Pilot portal AND Admin portal
- **Types**: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE

#### Flight Requests ⭐ (Same Unified Table)
- **Purpose**: Flight request submissions
- **Workflow**: Submit → Manager Review → Approve/Deny
- **Service**: `lib/services/pilot-flight-service.ts`
- **API**: `/api/portal/flight-requests` (pilot) and `/api/flight-requests` (admin)
- **Table**: `pilot_requests` ✅ **SAME UNIFIED TABLE**
  - Filter: `request_category = 'FLIGHT'`
  - Status field: `workflow_status`

#### Leave Bids ✅ (Separate System)
- **Purpose**: Annual leave preference submissions (bidding on preferred leave dates for the year)
- **Workflow**: Submit annual preferences → Admin batch processes → Approve/Reject based on seniority/availability
- **Timing**: Submitted once per year, typically for planning next year's roster
- **Service**: `lib/services/leave-bid-service.ts`
- **API**: `/api/portal/leave-bids`
- **Tables**: `leave_bids` and `leave_bid_options` ✅ **SEPARATE TABLES**
- **Features**:
  - Pilots submit up to 10 preferred leave periods (priority ranked 1-10)
  - Admin reviews all bids together
  - Allocates leave based on seniority and operational requirements
  - Status: PENDING → PROCESSING → APPROVED/REJECTED

**Key Distinctions**:
1. **Leave Requests** = Immediate time-off needs → `pilot_requests` table
2. **Flight Requests** = Flight request submissions → `pilot_requests` table (same table!)
3. **Leave Bids** = Annual planning/preferences → `leave_bids` table (different purpose)

**Architecture Decision (Nov 16, 2025)**: Leave and flight requests use unified `pilot_requests` table because they share the same workflow and approval process. Leave bids remain separate because they have a different business purpose (annual planning vs. immediate requests) and different schema requirements (multiple options vs. single request).

## Testing Strategy

### E2E Testing with Playwright

Test files in `e2e/` directory (40 test files):

```typescript
import { test, expect } from '@playwright/test'

test.describe('Pilot Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/pilots')
  })

  test('should display pilot list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pilots' })).toBeVisible()
    const rows = page.getByRole('row')
    await expect(rows).toHaveCount(28) // 27 pilots + header
  })
})
```

**Run specific tests**:
```bash
npx playwright test e2e/pilots.spec.ts
npx playwright test --grep "should display pilot list"
```

**Test Configuration** (`playwright.config.ts`):
- Default port: 3000 (dev server)
- Production testing: Update `baseURL` to `http://localhost:3003`
- Sequential execution: `workers: 1` (prevents database conflicts)
- Max failures: `--max-failures=10` (stops early if threshold reached)
- Reporters: HTML + line + JSON

### Known Test Issues

**Port Configuration**:
- Some tests hardcode `http://localhost:3000` instead of using `baseURL`
- Production server runs on port 3003
- **Fix**: Replace hardcoded URLs with relative paths (`/dashboard/...`)

**Accessibility Tests**:
- Some tests use invalid CSS selectors (e.g., `button:has(svg):not(:has-text(/./))`)
- **Fix**: Replace with Playwright locators (e.g., `page.getByRole('button')`)

## Environment Variables

Required in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Service Role (server-only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Logging (Better Stack/Logtail)
LOGTAIL_SOURCE_TOKEN=your-server-token
NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN=your-client-token

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Email (Resend)
RESEND_API_KEY=your-api-key
RESEND_FROM_EMAIL=no-reply@yourdomain.com
```

Get Supabase credentials from:
https://app.supabase.com/project/wgdmgvonqysflwdiiols/settings/api

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.1 | App framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.7.3 | Type safety (strict mode) |
| Turbopack | Built-in | Build system |
| Tailwind CSS | 4.1.0 | Styling |
| Supabase | 2.75.1 | Backend (PostgreSQL + Auth + Storage) |
| TanStack Query | 5.90.2 | Server state management |
| React Hook Form | 7.65.0 | Form handling |
| Zod | 4.1.12 | Schema validation |
| Playwright | 1.56.1 | E2E testing |
| Storybook | 8.5.11 | Component development |

## Troubleshooting

### Common Issues

**TypeScript errors about Supabase types**
```bash
npm run db:types
```

**Middleware errors with cookies**
Ensure using `await cookies()` in Next.js 16 (async cookies API).

**Playwright tests failing**
```bash
npx playwright install  # Install browsers
```

**Playwright tests connecting to wrong port**
Update `playwright.config.ts` baseURL or use relative URLs in tests (preferred).

**Husky hooks not running**
```bash
npm run prepare
```

**Supabase connection fails**
```bash
node test-connection.mjs  # Diagnose connection issues
```

**Build fails with type errors**
Check that `types/supabase.ts` is up to date with the database schema.

**Portal authentication not working**
Verify `/api/portal/*` endpoints are using `pilot-portal-service.ts` and NOT Supabase Auth.

---

**Version**: 2.6.0
**Last Updated**: December 5, 2025
**Maintainer**: Maurice (Skycruzer)
