# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

All services located in `lib/services/` (29 services):

1. **`pilot-service.ts`** - Pilot CRUD operations, captain qualifications
2. **`certification-service.ts`** - Certification tracking and management
3. **`leave-service.ts`** - Leave request CRUD operations
4. **`leave-bid-service.ts`** - Annual leave bid submissions and management
5. **`leave-eligibility-service.ts`** - Complex leave eligibility logic (rank-separated)
6. **`leave-stats-service.ts`** - Leave statistics and reporting
7. **`expiring-certifications-service.ts`** - Certification expiry calculations
8. **`dashboard-service.ts`** - Dashboard metrics aggregation
9. **`dashboard-service-v3.ts`** - Enhanced dashboard with materialized views
10. **`dashboard-service-v4.ts`** - Redis-cached dashboard (production)
11. **`analytics-service.ts`** - Analytics data processing
12. **`pdf-service.ts`** - PDF report generation
13. **`cache-service.ts`** - Performance caching with TTL
14. **`audit-service.ts`** - Audit logging for all CRUD operations
15. **`admin-service.ts`** - System settings and admin operations
16. **`user-service.ts`** - User management and role assignment
17. **`pilot-portal-service.ts`** - Pilot-facing portal operations
18. **`certification-renewal-planning-service.ts`** - Certification renewal planning
19. **`check-types-service.ts`** - Check type definitions management
20. **`disciplinary-service.ts`** - Disciplinary action tracking
21. **`flight-request-service.ts`** - Flight request submissions
22. **`logging-service.ts`** - Better Stack (Logtail) logging integration
23. **`pilot-leave-service.ts`** - Pilot-specific leave request operations
24. **`pilot-flight-service.ts`** - Pilot flight request operations
25. **`pilot-feedback-service.ts`** - Pilot feedback submission operations
26. **`renewal-planning-pdf-service.ts`** - Renewal plan PDF generation
27. **`retirement-forecast-service.ts`** - Retirement planning and forecasting
28. **`succession-planning-service.ts`** - Succession planning for key positions
29. **`task-service.ts`** - Task management operations
30. **`notification-service.ts`** - In-app notification management
31. **`feedback-service.ts`** - Admin feedback management (view, respond, export)

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
│   ├── services/                 # ⭐ Service layer (CRITICAL - 27 services)
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

### Main Tables
- `pilots` (27 records) - Pilot profiles, qualifications, seniority
- `pilot_checks` (607 records) - Certification records
- `check_types` (34 records) - Check type definitions
- `leave_requests` - Leave request system
- `an_users` - **Pilot portal authentication** (separate from Supabase Auth)
- `contract_types` (3 records) - Contract type definitions
- `flight_requests` - Flight request submissions
- `disciplinary_actions` - Disciplinary record tracking
- `tasks` - Task management system
- `notifications` - In-app notification system

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

### 6. Leave Requests vs Leave Bids

**IMPORTANT**: These are two DIFFERENT features with different purposes:

#### Leave Requests
- **Purpose**: Individual time-off requests (sick leave, RDO, SDO, annual leave, etc.)
- **Workflow**: Submit → Manager Review → Approve/Deny
- **Timing**: Submitted as needed, ideally 21+ days in advance
- **Service**: `lib/services/pilot-leave-service.ts` and `lib/services/leave-service.ts`
- **API**: `/api/portal/leave-requests`
- **Table**: `leave_requests`
- **Types**: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE

#### Leave Bids
- **Purpose**: Annual leave preference submissions (bidding on preferred leave dates for the year)
- **Workflow**: Submit annual preferences → Admin processes → Approve/Reject based on seniority/availability
- **Timing**: Submitted once per year, typically for planning next year's roster
- **Service**: `lib/services/leave-bid-service.ts`
- **API**: `/api/portal/leave-bids`
- **Tables**: `leave_bids` and `leave_bid_options`
- **Features**:
  - Pilots submit up to 10 preferred leave periods (priority ranked 1-10)
  - Admin reviews all bids together
  - Allocates leave based on seniority and operational requirements
  - Status: PENDING → PROCESSING → APPROVED/REJECTED

**Key Distinction**: Leave requests are for specific needed time off; leave bids are for annual planning and preference allocation.

## Component Development

### Adding shadcn/ui Components

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

Components install to `components/ui/` and are fully customizable.

### Storybook Stories

Every new UI component should have a Storybook story:

```tsx
// components/pilots/pilot-card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { PilotCard } from './pilot-card'

const meta = {
  title: 'Pilots/PilotCard',
  component: PilotCard,
  tags: ['autodocs'],
} satisfies Meta<typeof PilotCard>

export default meta
type Story = StoryObj<typeof meta>

export const Captain: Story = {
  args: {
    pilot: {
      id: '1',
      name: 'John Doe',
      rank: 'Captain',
      status: 'active',
    },
  },
}
```

### Server vs Client Components

**Server Components** (default in Next.js 16):
```tsx
// app/dashboard/pilots/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function PilotsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Server-side data fetching
}
```

**Client Components** (for interactivity):
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function PilotForm() {
  const supabase = createClient()
  // Client-side mutations, real-time updates
}
```

## Form Handling Pattern

All forms use **React Hook Form + Zod validation**:

```typescript
// 1. Define Zod schema in lib/validations/
import { z } from 'zod'

export const PilotCreateSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  role: z.enum(['Captain', 'First Officer']),
})

// 2. Use in component
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(PilotCreateSchema),
  defaultValues: { first_name: '', last_name: '', role: 'Captain' }
})
```

## Email Notifications

### Resend Integration

Email notifications for certification renewals and alerts:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Fleet Management <no-reply@yourdomain.com>',
  to: pilot.email,
  subject: 'Certification Expiring Soon',
  html: emailTemplate
})
```

**Environment Variables**:
```env
RESEND_API_KEY=your-api-key
RESEND_FROM_EMAIL=no-reply@yourdomain.com
```

Used in `/app/api/renewal-planning/email/route.ts` for renewal plan notifications.

## Error Handling

### Standardized Error Messages

Use `lib/utils/error-messages.ts`:

```typescript
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

// In API routes
return NextResponse.json(
  formatApiError(ERROR_MESSAGES.PILOT.FETCH_FAILED, 500),
  { status: 500 }
)
```

### Database Constraint Errors

Use `lib/utils/constraint-error-handler.ts`:

```typescript
import { handleConstraintError } from '@/lib/utils/constraint-error-handler'

try {
  // Database operation
} catch (error) {
  const errorResponse = handleConstraintError(error)
  return NextResponse.json(errorResponse, { status: 400 })
}
```

## Testing Strategy

### E2E Testing with Playwright

Test files in `e2e/` directory:

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

## Performance Optimizations

### Build System
- **Turbopack**: Used for both dev and production builds
- Significantly faster than Webpack
- Near-instant Hot Module Replacement (HMR)

### Lazy Loading
```tsx
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/charts/analytics-chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Disable SSR for client-only components
})
```

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/pilot-photo.jpg"
  alt="Pilot"
  width={200}
  height={200}
  loading="lazy"
/>
```

Supported formats: WebP, AVIF (configured in `next.config.js`)

### Caching

Use `lib/services/cache-service.ts` for expensive operations:

```typescript
import { getCachedData, setCachedData } from '@/lib/services/cache-service'

const cacheKey = 'dashboard:metrics'
const cached = await getCachedData(cacheKey)
if (cached) return cached

const data = await expensiveCalculation()
await setCachedData(cacheKey, data, 300) // 5 minute TTL
return data
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:
- Authenticated users can read data
- Admins can insert/update/delete
- Managers have elevated permissions
- Pilots have read-only access to their own data

### Protected Routes

Middleware (`middleware.ts`) handles authentication:
- Public routes: `/`, `/auth/*`, `/portal/login`, `/portal/register`
- Protected routes: `/dashboard/*` (requires admin Supabase authentication)
- Admin routes: `/dashboard/admin/*` (requires admin role)
- Portal routes: `/portal/*` (requires pilot authentication via `an_users`)

**IMPORTANT**: Portal routes use custom authentication. Do not rely on Supabase Auth for `/portal/*` routes.

### Rate Limiting

API routes use Upstash Redis for rate limiting:

```typescript
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
  const { success } = await rateLimit.limit(identifier)

  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }

  // Process request
}
```

**Environment Variables**:
```env
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## Logging and Error Tracking

### Better Stack Integration

The application uses Better Stack (Logtail) for comprehensive error tracking:

**Server-side logging** (`lib/services/logging-service.ts`):
```typescript
import { log } from '@logtail/node'

log.info('Operation completed', { userId, action })
log.error('Operation failed', { error, context })
```

**Client-side logging**:
```typescript
import { log } from '@logtail/browser'

log.error('UI error occurred', { component, error })
```

**Environment Variables**:
```env
LOGTAIL_SOURCE_TOKEN=your-token-here  # Server-side token
NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN=your-token-here  # Client-side token
```

All CRUD operations, authentication events, and errors are automatically logged for production debugging.

## Development Workflow

### Feature Development Process

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Implement Service Layer First** (if database operations needed):
   ```bash
   # Create or update service file
   touch lib/services/new-feature-service.ts
   ```

3. **Add Types** (if new tables/columns):
   ```bash
   npm run db:types
   ```

4. **Build API Routes** (use services):
   ```bash
   # Create API route
   touch app/api/new-feature/route.ts
   ```

5. **Build UI Components**:
   ```bash
   # Add shadcn component if needed
   npx shadcn@latest add dialog
   # Create custom component + Storybook story
   ```

6. **Write E2E Tests**:
   ```bash
   touch e2e/new-feature.spec.ts
   npm test
   ```

7. **Run Quality Checks**:
   ```bash
   npm run validate
   npm run validate:naming
   ```

8. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

### Pre-Commit Hooks

Husky + lint-staged automatically runs:
- ESLint with auto-fix
- Prettier with auto-format
- TypeScript type checking

If checks fail, commit is blocked.

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

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.0 | App framework with App Router |
| React | 19.1.0 | UI library |
| TypeScript | 5.7.3 | Type safety (strict mode) |
| Turbopack | Built-in | Build system |
| Tailwind CSS | 4.1.0 | Styling |
| Supabase | 2.75.1 | Backend (PostgreSQL + Auth + Storage) |
| TanStack Query | 5.90.2 | Server state management |
| React Hook Form | 7.65.0 | Form handling |
| Zod | 4.1.12 | Schema validation |
| Playwright | 1.55.0 | E2E testing |
| Storybook | 8.5.11 | Component development |

## Progressive Web App (PWA) Support

Fleet Management V2 is a Progressive Web App that works offline and can be installed on mobile devices.

### PWA Features

- **Offline Support**: View previously loaded data when offline
- **Mobile Installation**: Install app on iOS and Android devices
- **Intelligent Caching**: Smart caching strategies for performance
- **Offline Indicator**: Visual feedback when connectivity is lost
- **Service Worker**: Auto-generated with Serwist

### Caching Strategies

The app uses different caching strategies for different resource types:

| Resource Type | Strategy | Cache Duration | Purpose |
|--------------|----------|----------------|---------|
| **Fonts** | CacheFirst | 1 year | Fonts rarely change |
| **Images** | StaleWhileRevalidate | 24 hours | Balance freshness and speed |
| **API Calls** | NetworkFirst | 1 minute | Always try fresh data first |
| **Supabase API** | NetworkFirst | 1 minute | Fallback to cache if offline |

### Offline Functionality

**What works offline:**
- ✅ View previously loaded pages
- ✅ Access cached pilot information
- ✅ Review certification data
- ✅ Navigate between cached pages

**What requires online connection:**
- ❌ Create/update/delete operations
- ❌ Upload documents
- ❌ Sync new data
- ❌ Real-time updates

### Installation

**Android (Chrome):**
1. Visit the app in Chrome
2. Tap "Install" prompt or menu → "Install app"
3. App appears on home screen

**iOS (Safari):**
1. Visit the app in Safari
2. Tap Share button → "Add to Home Screen"
3. App appears on home screen with custom icon

### PWA Configuration

**Service Worker**: `/public/sw.js` (auto-generated, do not edit)

**Manifest**: `/public/manifest.json`
```json
{
  "name": "Fleet Management V2 - B767 Pilot Management System",
  "short_name": "Fleet Mgmt",
  "start_url": "/",
  "display": "standalone"
}
```

**Build Configuration**: `next.config.js`
```javascript
const withSerwist = require('@serwist/next').default({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development'
})
```

### Development vs Production

**Development** (PWA disabled):
- No service worker registration
- No caching (hot reload works normally)
- Offline indicator still functional

**Production** (PWA enabled):
- Service worker auto-generated during build
- Intelligent caching active
- Offline fallback page available

### Updating the Service Worker

When deploying new versions:

1. Build generates new service worker with updated hash
2. Users get update notification on next visit
3. Refresh page to activate new service worker
4. Old caches automatically invalidated

### Clear Service Worker Cache

If needed (troubleshooting):

```javascript
// Open DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister())
})
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
```

Then refresh the page.

### PWA Icons

Icons located in `/public/icons/`:
- `icon-192x192.png` - Android home screen
- `icon-512x512.png` - Android splash screen
- `apple-touch-icon.png` - iOS home screen
- `favicon-32x32.png` - Browser tab
- `favicon-16x16.png` - Browser bookmark

**Generate icons**: `node scripts/generate-pwa-icons.mjs`

For production, replace with professionally designed icons.

### Troubleshooting PWA

**Service worker not registering:**
- Check browser console for errors
- Verify HTTPS (required for PWA)
- Ensure `public/sw.js` exists after build

**Offline indicator not showing:**
- Check DevTools → Network → Set to "Offline"
- Verify OfflineIndicator component in layout

**Stale data showing:**
- Service worker may be caching aggressively
- Clear service worker cache (see above)
- Check cache expiration times in `app/sw.ts`

**Install prompt not showing:**
- PWA criteria may not be met
- Check manifest.json is valid
- Verify service worker is active
- Android: Check Chrome flags

---

**Version**: 2.5.0
**Last Updated**: October 27, 2025
**Maintainer**: Maurice (Skycruzer)
