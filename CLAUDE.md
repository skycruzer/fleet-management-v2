# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Rules (MANDATORY)

1. **PLAN FIRST**: Write plan to `tasks/todo.md` with checkable todo items
2. **GET APPROVAL**: Check in with user before beginning work
3. **SIMPLICITY IS KING**: Minimal changes, minimal code impact, zero bugs introduced
4. **NO LAZINESS**: Find root causes, no temporary fixes

---

## Quick Start

```bash
npm install
cp .env.example .env.local  # Add Supabase credentials
npm run db:types            # Generate TypeScript types
npm run dev                 # http://localhost:3000
```

## Key Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Production build
npm run validate            # type-check + lint + format:check (pre-commit)
npm run validate:naming     # Validate naming conventions

# Testing
npm test                    # Run all Playwright E2E tests
npm run test:ui             # Playwright UI mode
npx playwright test e2e/auth.spec.ts        # Single test file
npx playwright test --grep "leave request"  # Pattern match

# Database
npm run db:types            # Regenerate types after schema changes (REQUIRED)

# Storybook
npm run storybook           # http://localhost:6006
```

---

## Architecture Overview

### Service Layer Pattern (MANDATORY)

**All database operations MUST go through `lib/services/`**. Never make direct Supabase calls.

```typescript
// ✅ CORRECT
import { getPilots } from '@/lib/services/pilot-service'
const pilots = await getPilots()

// ❌ WRONG - bypasses service layer
const { data } = await supabase.from('pilots').select('*')
```

### Key Services (50 total in `lib/services/`)

| Category    | Services                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| Core Domain | `pilot-service`, `certification-service`, `leave-service`, `flight-request-service`, `unified-request-service` |
| Dashboard   | `dashboard-service-v4` (production, Redis-cached), `analytics-service`                                         |
| Auth        | `pilot-portal-service`, `session-service`, `account-lockout-service`                                           |
| Reports     | `pdf-service`, `reports-service` (19 reports), `export-service`                                                |

### Dual Authentication Architecture

**Two completely separate auth systems - never mix them:**

|             | Admin Portal             | Pilot Portal              |
| ----------- | ------------------------ | ------------------------- |
| Routes      | `/dashboard/*`           | `/portal/*`               |
| API         | `/api/*` (non-portal)    | `/api/portal/*`           |
| Auth System | Supabase Auth            | Custom (`an_users` table) |
| Client      | `lib/supabase/server.ts` | `pilot-portal-service.ts` |
| Users       | Admin staff, managers    | Pilots                    |

### Supabase Clients

- **Browser** (`lib/supabase/client.ts`): Client Components, real-time
- **Server** (`lib/supabase/server.ts`): Server Components, API routes
- **Middleware** (`lib/supabase/middleware.ts`): Auth state, session refresh

---

## Database Schema

**Supabase Project**: `wgdmgvonqysflwdiiols`

### Primary Tables

| Table               | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `pilots`            | Pilot profiles, qualifications, seniority   |
| `pilot_checks`      | Certification records                       |
| `check_types`       | Check type definitions                      |
| `pilot_requests` ⭐ | **UNIFIED** - ALL leave and flight requests |
| `leave_bids`        | Annual leave bidding (separate system)      |
| `an_users`          | Pilot portal authentication                 |

### Unified Requests Table (`pilot_requests`)

```sql
-- Leave requests
WHERE request_category = 'LEAVE' AND workflow_status = 'PENDING'

-- Flight requests
WHERE request_category = 'FLIGHT'
```

**Field**: Use `workflow_status` (not `status`)

### Deprecated Tables (Read-Only)

- `leave_requests` - Use `pilot_requests` instead
- `flight_requests` - Use `pilot_requests` instead

---

## Critical Business Rules

### 1. Roster Periods (28-Day Cycles)

- RP1-RP13 annual cycle
- Anchor: **RP12/2025 starts 2025-10-11**
- Utils: `lib/utils/roster-utils.ts`

### 2. Certification Compliance (FAA)

```
🔴 Red:    Expired (days < 0)
🟡 Yellow: Expiring (days ≤ 30)
🟢 Green:  Current (days > 30)
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
| Submit → Review → Approve | Batch processed by seniority |
| `pilot_requests` table    | `leave_bids` table           |

---

## Common Mistakes to Avoid

### Next.js 16 Async Cookies

```typescript
// ❌ WRONG
const cookieStore = cookies()

// ✅ CORRECT
const cookieStore = await cookies()
```

### Cache Invalidation After Mutations

```typescript
// ✅ CORRECT - revalidate after update
import { revalidatePath } from 'next/cache'

export async function PUT(request: Request) {
  const data = await updateCertification(id, body)
  revalidatePath('/dashboard/certifications')
  return NextResponse.json({ success: true, data })
}
```

### Navigation Order

```typescript
// ❌ WRONG - navigate before refresh
router.push('/dashboard/certifications')
router.refresh()

// ✅ CORRECT - refresh first
router.refresh()
await new Promise((resolve) => setTimeout(resolve, 100))
router.push('/dashboard/certifications')
```

### Validation Required

```typescript
// ✅ CORRECT - always validate with Zod
import { MySchema } from '@/lib/validations/my-schema'

export async function POST(request: Request) {
  const body = await request.json()
  const validated = MySchema.parse(body)
  // Use validated data
}
```

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

| Tech           | Version | Purpose              |
| -------------- | ------- | -------------------- |
| Next.js        | 16.0.7  | App framework        |
| React          | 19.2.0  | UI library           |
| TypeScript     | 5.7.3   | Type safety (strict) |
| Tailwind CSS   | 4.1.0   | Styling              |
| Supabase       | 2.75.1  | PostgreSQL + Auth    |
| TanStack Query | 5.90.2  | Server state         |
| Playwright     | 1.56.1  | E2E testing          |

---

**Version**: 3.0.0
**Last Updated**: December 2025
**Maintainer**: Maurice (Skycruzer)
