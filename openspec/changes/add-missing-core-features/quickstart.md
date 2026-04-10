# Quickstart: Missing Core Features Implementation

**Feature**: 001-missing-core-features
**Phase**: Phase 1 - Implementation Guide
**Date**: 2025-10-22
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

---

## Overview

This guide provides step-by-step instructions for implementing the 7 core missing features. Follow this workflow to ensure consistency with the Fleet Management V2 architecture and constitution.

**Estimated Implementation Time**: 8-10 weeks (2 developers working full-time)

**Implementation Order**: Features are ordered by dependencies and priority (US1 → US8)

---

## Prerequisites

### Development Environment

**Required**:

- Node.js 18+ and npm 9+
- Supabase CLI installed (`npm install -g supabase`)
- Git for version control
- Code editor (VS Code recommended)

**Recommended Extensions** (VS Code):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Playwright Test for VSCode

### Project Setup

```bash
# Clone repository
cd /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# Start development server
npm run dev
# Server runs on http://localhost:3000
```

### Database Access

**Supabase Project**: `wgdmgvonqysflwdiiols`
**Local Supabase** (optional):

```bash
supabase init
supabase start
```

---

## Implementation Workflow

### Phase 1: Database Migration (Week 1)

**Objective**: Create all 10 new database tables

#### Step 1.1: Create Migration File

```bash
# Create new migration
supabase migration new add_missing_core_features

# File created at: supabase/migrations/YYYYMMDDHHMMSS_add_missing_core_features.sql
```

#### Step 1.2: Add DDL from data-model.md

Copy the complete migration SQL from `data-model.md` section "Migration File" into the new migration file.

**Key sections**:

1. Utility functions (`update_updated_at_column`, `audit_log_trigger`)
2. Table creation (10 tables in dependency order)
3. Indexes and constraints
4. RLS policies
5. Triggers
6. Seed data (feedback_categories)

#### Step 1.3: Deploy Migration

**Local testing**:

```bash
# Reset local database (destroys data)
supabase db reset

# Apply migrations
supabase migration up
```

**Production deployment**:

```bash
# Deploy to production (Supabase dashboard)
# Go to https://app.supabase.com/project/wgdmgvonqysflwdiiols/editor
# Run SQL query from migration file
```

#### Step 1.4: Generate TypeScript Types

```bash
# Generate types from database schema
npm run db:types

# Verify types/supabase.ts updated with new tables
```

#### Validation

```sql
-- Run validation queries from data-model.md
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pilot_registrations', 'pilot_notifications', ...)
ORDER BY table_name;
-- Expected: 10 rows
```

---

### Phase 2: Service Layer Implementation (Week 2-3)

**Objective**: Create 9 new service files following service-layer architecture (NON-NEGOTIABLE)

#### Step 2.1: Service Template Pattern

**File**: `lib/services/pilot-portal-service.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type PilotPortal = Database['public']['Tables']['pilot_notifications']['Row']
type PilotPortalInsert = Database['public']['Tables']['pilot_notifications']['Insert']

/**
 * Service: Pilot Portal
 * Purpose: Pilot authentication and dashboard operations
 * Constitution: Service-layer architecture (Principle I)
 */

/**
 * Get pilot by user ID
 * @param userId - Supabase Auth user ID
 * @returns Pilot record or null
 */
export async function getPilotByUserId(userId: string): Promise<Pilot | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from('pilots').select('*').eq('user_id', userId).single()

  if (error) {
    console.error('Error fetching pilot by user ID:', error)
    return null
  }

  return data
}

/**
 * Get pilot dashboard data
 * @param pilotId - Pilot UUID
 * @returns Dashboard metrics and alerts
 */
export async function getPilotDashboardData(pilotId: string) {
  const supabase = await createClient()

  // Fetch certifications with expiry status
  const { data: certs } = await supabase
    .from('pilot_checks')
    .select(
      `
      *,
      check_types (
        name,
        category,
        expiry_days
      )
    `
    )
    .eq('pilot_id', pilotId)
    .order('expiry_date', { ascending: true })

  // Fetch recent leave requests
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('pilot_id', pilotId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch unread notifications count
  const { count: unreadCount } = await supabase
    .from('pilot_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('pilot_id', pilotId)
    .eq('read', false)

  return {
    certifications: certs || [],
    leaveRequests: leaveRequests || [],
    unreadNotifications: unreadCount || 0,
  }
}
```

#### Step 2.2: Create All 9 Services

**Services to implement** (in order):

1. **`pilot-portal-service.ts`**
   - `getPilotByUserId(userId)` → Pilot | null
   - `getPilotDashboardData(pilotId)` → DashboardData
   - `createPilotAccount(userId, registrationId)` → Pilot

2. **`pilot-registration-service.ts`**
   - `createRegistration(data)` → PilotRegistration
   - `getPendingRegistrations()` → PilotRegistration[]
   - `approveRegistration(id, adminId, notes)` → void
   - `denyRegistration(id, adminId, reason)` → void

3. **`pilot-notification-service.ts`**
   - `createNotification(pilotId, type, title, message, link?)` → Notification
   - `getUnreadNotifications(pilotId)` → Notification[]
   - `markAsRead(notificationId)` → void
   - `deleteOldNotifications()` → void (cron job)

4. **`flight-request-service.ts`**
   - `submitFlightRequest(pilotId, data)` → FlightRequest
   - `getFlightRequestsByPilot(pilotId)` → FlightRequest[]
   - `getAllFlightRequests(filters?)` → FlightRequest[]
   - `reviewFlightRequest(id, status, comments, reviewerId)` → FlightRequest

5. **`task-service.ts`**
   - `createTask(data, createdBy)` → Task
   - `getTasks(filters?)` → Task[]
   - `getTaskById(id)` → Task | null
   - `updateTask(id, data)` → Task
   - `deleteTask(id)` → void

6. **`disciplinary-service.ts`**
   - `createMatter(data, createdBy)` → DisciplinaryMatter
   - `getMatters(filters?)` → DisciplinaryMatter[]
   - `getMatterWithTimeline(id)` → MatterWithTimeline
   - `updateMatter(id, data)` → DisciplinaryMatter
   - `addAction(matterId, action, createdBy)` → DisciplinaryAction

7. **`feedback-service.ts`**
   - `createPost(pilotId, data)` → FeedbackPost
   - `getPosts(filters?)` → FeedbackPost[]
   - `getPostWithComments(id)` → PostWithComments
   - `upvotePost(postId, pilotId)` → void
   - `createComment(postId, pilotId, content, mentions?)` → Comment
   - `getCategories()` → Category[]

8. **`feedback-admin-service.ts`**
   - `pinPost(postId)` → void
   - `unpinPost(postId)` → void
   - `hidePost(postId, reason)` → void
   - `unhidePost(postId)` → void
   - `deleteComment(commentId)` → void

9. **`audit-log-service.ts`**
   - `logBusinessEvent(event)` → void
   - `getAuditLogs(filters?)` → AuditLog[]
   - `getAuditLogById(id)` → AuditLog | null
   - `exportAuditLogs(filters?, format)` → string (CSV)

**Constitution Compliance**:

- ✅ All database operations through services (Principle I)
- ✅ Explicit return types for type safety (Principle II)
- ✅ Error handling with try/catch and console.error logging

---

### Phase 3: Validation Schemas (Week 3)

**Objective**: Create Zod schemas for all user inputs

**File**: `lib/validations/flight-request-schema.ts`

```typescript
import { z } from 'zod'

export const FlightRequestSchema = z
  .object({
    request_type: z.enum(['additional_flight', 'route_change', 'schedule_swap', 'other']),
    route: z.string().min(1, 'Route is required').max(100),
    start_date: z.string().datetime('Invalid date format'),
    end_date: z.string().datetime('Invalid date format'),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000),
    additional_details: z.string().max(2000).optional(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  })

export type FlightRequestInput = z.infer<typeof FlightRequestSchema>
```

**Schemas to create**:

- `pilot-portal-schema.ts` - Login, registration
- `flight-request-schema.ts` - Flight request submission
- `task-schema.ts` - Task creation/update
- `disciplinary-schema.ts` - Disciplinary matter creation
- `feedback-schema.ts` - Post/comment creation

---

### Phase 4: API Routes (Week 4-5)

**Objective**: Implement ~30 API endpoints following contracts/

#### Pattern: Thin HTTP Adapters

**File**: `app/api/pilot/flight-requests/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'
import {
  submitFlightRequest,
  getFlightRequestsByPilot,
} from '@/lib/services/flight-request-service'
import { getPilotByUserId } from '@/lib/services/pilot-portal-service'
import { createNotification } from '@/lib/services/pilot-notification-service'
import { logBusinessEvent } from '@/lib/services/audit-log-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

// GET /api/pilot/flight-requests - Get pilot's flight requests
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Get pilot by user ID
    const pilot = await getPilotByUserId(user.id)
    if (!pilot) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PILOT.NOT_FOUND, 404), { status: 404 })
    }

    // Use service layer
    const requests = await getFlightRequestsByPilot(pilot.id)

    return NextResponse.json({
      success: true,
      data: requests,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    })
  } catch (error) {
    console.error('Error fetching flight requests:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.SERVER.INTERNAL_ERROR, 500), {
      status: 500,
    })
  }
}

// POST /api/pilot/flight-requests - Submit new flight request
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    const pilot = await getPilotByUserId(user.id)
    if (!pilot) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PILOT.NOT_FOUND, 404), { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = FlightRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.format(),
          },
        },
        { status: 400 }
      )
    }

    // Use service layer to create request
    const flightRequest = await submitFlightRequest(pilot.id, validationResult.data)

    // Log business event for audit trail
    await logBusinessEvent({
      action: 'flight_request_submitted',
      entity_type: 'flight_request',
      entity_id: flightRequest.id,
      description: `Pilot ${pilot.first_name} ${pilot.last_name} submitted flight request for ${validationResult.data.route}`,
      metadata: {
        pilot_id: pilot.id,
        route: validationResult.data.route,
        request_type: validationResult.data.request_type,
      },
    })

    // Notify admins (optional: implement later)
    // await createNotification(adminId, 'flight_request_submitted', ...)

    return NextResponse.json(
      {
        success: true,
        data: flightRequest,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting flight request:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.SERVER.INTERNAL_ERROR, 500), {
      status: 500,
    })
  }
}
```

**API routes to implement** (~30 files total):

- Pilot routes (7 routes)
- Admin dashboard routes (15 routes)
- Admin-specific routes (8 routes)

**Constitution Compliance**:

- ✅ API routes are thin HTTP adapters (Principle I)
- ✅ All logic in service layer
- ✅ Zod validation for all inputs (Principle II)

---

### Phase 5: UI Components (Week 6-7)

**Objective**: Build ~50 React components using shadcn/ui

#### Component Pattern: Server Components by Default

**File**: `app/pilot/dashboard/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPilotByUserId, getPilotDashboardData } from '@/lib/services/pilot-portal-service'
import { PilotDashboardContent } from '@/components/pilot/PilotDashboardContent' // Client Component

export default async function PilotDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/pilot/login')
  }

  const pilot = await getPilotByUserId(user.id)
  if (!pilot) {
    redirect('/pilot/login')
  }

  const dashboardData = await getPilotDashboardData(pilot.id)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {pilot.first_name}!</h1>
      <PilotDashboardContent pilot={pilot} data={dashboardData} />
    </div>
  )
}
```

**File**: `components/pilot/PilotDashboardContent.tsx` (Client Component)

```typescript
'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCertificationColor } from '@/lib/utils/certification-utils'
import type { Pilot } from '@/types/supabase'

interface PilotDashboardContentProps {
  pilot: Pilot
  data: {
    certifications: any[]
    leaveRequests: any[]
    unreadNotifications: number
  }
}

export function PilotDashboardContent({ pilot, data }: PilotDashboardContentProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Certification Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.certifications.slice(0, 5).map(cert => (
              <div key={cert.id} className="flex justify-between items-center">
                <span className="text-sm">{cert.check_types.name}</span>
                <Badge variant={getCertificationColor(cert.days_until_expiry)}>
                  {cert.days_until_expiry > 0 ? `${cert.days_until_expiry}d` : 'Expired'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {data.leaveRequests.length > 0 ? (
            <div className="space-y-2">
              {data.leaveRequests.map(request => (
                <div key={request.id} className="flex justify-between">
                  <span className="text-sm">RP{request.roster_period}/2025</span>
                  <Badge>{request.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent requests</p>
          )}
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data.unreadNotifications}</p>
          <p className="text-sm text-muted-foreground">Unread notifications</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Components to create** (~50 total):

- Pilot portal components (15)
- Task management components (8)
- Disciplinary components (6)
- Feedback components (10)
- Audit log components (6)
- Shared UI components (5)

**shadcn/ui components to install**:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add button
npx shadcn@latest add textarea
npx shadcn@latest add select
```

---

### Phase 6: Testing (Week 8)

**Objective**: Write E2E tests for all 8 user stories (constitution requirement)

**File**: `e2e/pilot-portal.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Pilot Portal Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pilot/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pilot Login' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use test pilot account
    await page.fill('input[name="email"]', 'test.pilot@airniugini.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/pilot/dashboard')
    await expect(page.getByText('Welcome,')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@airniugini.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })
})

test.describe('Pilot Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/pilot/login')
    await page.fill('input[name="email"]', 'test.pilot@airniugini.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/pilot/dashboard')
  })

  test('should display dashboard with certifications', async ({ page }) => {
    await expect(page.getByText('Certification Status')).toBeVisible()
    await expect(page.getByText('Leave Requests')).toBeVisible()
    await expect(page.getByText('Notifications')).toBeVisible()
  })

  test('should navigate to leave request page', async ({ page }) => {
    await page.click('a[href="/pilot/leave"]')
    await expect(page).toHaveURL('/pilot/leave')
    await expect(page.getByText('Submit Leave Request')).toBeVisible()
  })
})
```

**Test files to create** (7 files):

- `e2e/pilot-portal.spec.ts` - Authentication and dashboard
- `e2e/pilot-leave.spec.ts` - Leave request submission
- `e2e/flight-requests.spec.ts` - Flight request workflow
- `e2e/tasks.spec.ts` - Task management and Kanban
- `e2e/disciplinary.spec.ts` - Disciplinary matter tracking
- `e2e/audit-logs.spec.ts` - Audit log viewing
- `e2e/feedback.spec.ts` - Feedback posts and comments

**Run tests**:

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test e2e/pilot-portal.spec.ts

# Run with UI
npm run test:ui

# Debug mode
npm run test:debug
```

**Constitution requirement**: 70% minimum test coverage on critical paths (Principle III)

---

### Phase 7: Documentation & Deployment (Week 9-10)

#### Update CLAUDE.md

Add new services and patterns to `CLAUDE.md`:

```markdown
### Implemented Services

All services located in `lib/services/`:

1. **`pilot-service.ts`** - Pilot CRUD operations, captain qualifications
   ... (existing services)
2. **`pilot-portal-service.ts`** - Pilot-facing portal operations (NEW)
3. **`flight-request-service.ts`** - Flight request management (NEW)
4. **`task-service.ts`** - Task management operations (NEW)
5. **`disciplinary-service.ts`** - Disciplinary matter tracking (NEW)
6. **`feedback-service.ts`** - Community feedback operations (NEW)
7. **`feedback-admin-service.ts`** - Feedback moderation (NEW)
8. **`pilot-notification-service.ts`** - Pilot notifications (NEW)
9. **`pilot-registration-service.ts`** - Registration approval (NEW)
```

#### Production Deployment

1. **Merge PR**:

```bash
git checkout main
git merge 001-missing-core-features
git push origin main
```

2. **Deploy Migration to Production**:
   - Go to Supabase dashboard
   - Run migration SQL in SQL editor
   - Verify tables created correctly

3. **Deploy to Vercel**:
   - Automatic deployment on merge to main
   - Monitor deployment logs
   - Verify environment variables set

4. **Post-Deployment Checks**:
   - ✅ All pages load without errors
   - ✅ Pilot can register and login
   - ✅ Admin can approve registrations
   - ✅ Flight requests workflow works
   - ✅ Task Kanban board functional
   - ✅ Audit logs capturing events

5. **Monitor**:
   - Check Vercel logs for errors
   - Monitor Supabase logs for database issues
   - Review error tracking (if enabled)

---

## Common Patterns

### Pattern 1: Service-Layer API Route

```typescript
// app/api/resource/route.ts
import { createClient } from '@/lib/supabase/server'
import { getResource } from '@/lib/services/resource-service' // SERVICE LAYER

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const data = await getResource(user.id) // USE SERVICE
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(formatApiError(...), { status: 500 })
  }
}
```

### Pattern 2: Form with Validation

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'

export function FlightRequestForm() {
  const form = useForm({
    resolver: zodResolver(FlightRequestSchema),
    defaultValues: {
      request_type: 'additional_flight',
      route: '',
      start_date: '',
      end_date: '',
      reason: ''
    }
  })

  const onSubmit = async (data) => {
    const response = await fetch('/api/pilot/flight-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    // Handle response...
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

### Pattern 3: Real-time Notifications

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell({ pilotId }: { pilotId: string }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('pilot-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pilot_notifications',
        filter: `pilot_id=eq.${pilotId}`
      }, () => setUnreadCount(prev => prev + 1))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pilotId])

  return <Badge>{unreadCount}</Badge>
}
```

---

## Troubleshooting

### Migration Fails

**Error**: Foreign key constraint violation

**Solution**: Check dependency order. Tables must be created in order (e.g., `pilots` before `pilot_notifications`)

### TypeScript Type Errors

**Error**: Property 'pilot_notifications' does not exist

**Solution**: Regenerate types: `npm run db:types`

### RLS Policy Blocks Access

**Error**: "new row violates row-level security policy"

**Solution**: Verify RLS policies allow operation. Test with service role key temporarily to confirm.

### Real-time Not Working

**Error**: Supabase Realtime not receiving updates

**Solution**:

1. Enable Realtime in Supabase dashboard for table
2. Verify channel subscription code
3. Check browser console for connection errors

---

## Checklist

### Pre-Implementation

- [ ] Read plan.md, spec.md, research.md, data-model.md, contracts/
- [ ] Setup development environment
- [ ] Create feature branch `001-missing-core-features`

### Implementation

- [ ] Deploy database migration (10 tables)
- [ ] Generate TypeScript types
- [ ] Create 9 service files
- [ ] Create 5 Zod schema files
- [ ] Create ~30 API routes
- [ ] Create ~50 UI components
- [ ] Write 7 E2E test files
- [ ] Update CLAUDE.md with new services

### Testing

- [ ] Run validation queries (database)
- [ ] Run `npm run validate` (type-check + lint)
- [ ] Run `npm test` (E2E tests pass)
- [ ] Manual testing of all user stories

### Deployment

- [ ] Merge PR to main
- [ ] Deploy migration to production
- [ ] Verify Vercel deployment successful
- [ ] Post-deployment smoke tests
- [ ] Monitor logs for errors

---

**Quickstart Complete**: Implementation guide ready
**Next Phase**: Begin implementation (Phase 2: /speckit.tasks for detailed task breakdown)

---

**Created**: 2025-10-22
**Maintained By**: Fleet Management V2 Team
**Status**: Ready for implementation
