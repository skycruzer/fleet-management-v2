# Phase 0: Quick Wins - Implementation Roadmap

## Fleet Management V2 Modernization Initiative

**Phase**: Phase 0 (Quick Wins)
**Duration**: 1 Week (5 days, 40 hours)
**Goal**: Build momentum with immediate visible improvements
**Start Date**: October 24, 2025
**Target Completion**: October 30, 2025

---

## 🎯 Phase 0 Overview

### Objectives

1. **Eliminate blank screens** with skeleton loading states
2. **Enable error visibility** with Better Stack logging
3. **Create instant feedback** with optimistic UI patterns
4. **Build user confidence** with perceived performance improvements

### Success Criteria

- ✅ Skeleton screens on 3 key pages (Dashboard, Renewal Planning, Pilot List)
- ✅ Better Stack logging operational (80% error visibility)
- ✅ Zero console errors/warnings in production build
- ✅ Optimistic UI on 3 critical actions (leave requests, certifications, pilot edits)
- ✅ User feedback: "Feels faster" (qualitative survey)

### Expected Impact

- **Perceived Performance**: +50% (no more blank screens)
- **User Satisfaction**: +30% (instant feedback on actions)
- **Error Visibility**: 0% → 80% (production error tracking)
- **Professional Appearance**: Zero console warnings

---

## 📅 Day-by-Day Breakdown

### **Day 1 (Monday) - Skeleton Components** - 8 hours

#### Morning Session (4 hours)

**Task 1.1: Create DashboardSkeleton Component** (2 hours)

- **File**: `components/skeletons/dashboard-skeleton.tsx`
- **Requirements**:
  - Match Dashboard layout (header, metrics cards, upcoming checks)
  - Use Tailwind animate-pulse for loading effect
  - Responsive design (mobile/tablet/desktop)
- **Acceptance Criteria**:
  - [ ] Skeleton matches Dashboard structure
  - [ ] Smooth pulse animation
  - [ ] No layout shift when real data loads

**Code Template**:

```tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-6">
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Upcoming Checks Skeleton */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Task 1.2: Create RenewalPlanningSkeleton Component** (2 hours)

- **File**: `components/skeletons/renewal-planning-skeleton.tsx`
- **Requirements**:
  - Match Renewal Planning page layout (year selector, period cards)
  - 13 period card skeletons (RP1-RP13)
  - Progressive appearance (stagger animation)
- **Acceptance Criteria**:
  - [ ] Skeleton matches Renewal Planning structure
  - [ ] 13 period cards visible
  - [ ] Staggered animation effect

**Code Template**:

```tsx
export function RenewalPlanningSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header + Year Selector Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Period Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(13)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border bg-white p-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="mb-2 h-6 w-20 rounded bg-gray-200" />
            <div className="mb-3 h-4 w-32 rounded bg-gray-100" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Afternoon Session (4 hours)

**Task 1.3: Create PilotListSkeleton Component** (2 hours)

- **File**: `components/skeletons/pilot-list-skeleton.tsx`
- **Requirements**:
  - Match Pilot List table layout (27 rows + header)
  - Table structure with columns (Name, Rank, Status, Certifications)
  - Smooth row animations
- **Acceptance Criteria**:
  - [ ] Skeleton matches table structure
  - [ ] 27 row skeletons (matches pilot count)
  - [ ] Responsive on mobile (cards instead of table)

**Code Template**:

```tsx
export function PilotListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-lg border bg-white">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 border-b bg-gray-50 p-4">
          {['Name', 'Rank', 'Status', 'Certs'].map((col) => (
            <div key={col} className="h-4 animate-pulse rounded bg-gray-200" />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {[...Array(27)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 p-4">
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Task 1.4: Replace Loading Spinners with Skeletons** (2 hours)

- **Files to Update**:
  - `app/dashboard/page.tsx` → Use DashboardSkeleton
  - `app/dashboard/renewal-planning/page.tsx` → Use RenewalPlanningSkeleton
  - `app/dashboard/pilots/page.tsx` → Use PilotListSkeleton
- **Pattern**:

  ```tsx
  // Before
  {
    loading && <Spinner />
  }
  {
    data && <Dashboard data={data} />
  }

  // After
  {
    loading && <DashboardSkeleton />
  }
  {
    data && <Dashboard data={data} />
  }
  ```

- **Acceptance Criteria**:
  - [ ] All 3 pages use skeleton components
  - [ ] No layout shift on data load
  - [ ] Tested on localhost:3000

#### End of Day 1 Deliverables

- ✅ 3 skeleton components created
- ✅ Loading spinners replaced on 3 key pages
- ✅ No layout shift (visual regression tested)

---

### **Day 2 (Tuesday) - Better Stack Logging** - 8 hours

#### Morning Session (4 hours)

**Task 2.1: Install Better Stack SDK** (1 hour)

- **Command**: `npm install @logtail/node @logtail/browser`
- **Environment Variables**: Add to `.env.local`
  ```env
  LOGTAIL_SOURCE_TOKEN=your-token-here
  ```
- **Sign Up**: https://betterstack.com/logs (free tier: 1GB/month)
- **Acceptance Criteria**:
  - [ ] SDK installed successfully
  - [ ] Environment variable configured
  - [ ] Better Stack account created

**Task 2.2: Create Logging Service** (2 hours)

- **File**: `lib/services/logging-service.ts`
- **Requirements**:
  - Server-side logging (Node.js)
  - Client-side logging (Browser)
  - Error, warn, info, debug levels
  - Context object support (user, request, metadata)

**Code Template**:

```typescript
import { Logtail } from '@logtail/node'
import { Logtail as BrowserLogtail } from '@logtail/browser'

// Server-side logger (API routes, Server Actions)
const serverLogger = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN || '')

// Client-side logger (Browser errors)
const clientLogger =
  typeof window !== 'undefined'
    ? new BrowserLogtail(process.env.NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN || '')
    : null

export const logger = {
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(message, context)
    if (typeof window === 'undefined') {
      serverLogger.error(message, context)
    } else {
      clientLogger?.error(message, context)
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(message, context)
    if (typeof window === 'undefined') {
      serverLogger.warn(message, context)
    } else {
      clientLogger?.warn(message, context)
    }
  },

  info: (message: string, context?: Record<string, unknown>) => {
    console.info(message, context)
    if (typeof window === 'undefined') {
      serverLogger.info(message, context)
    } else {
      clientLogger?.info(message, context)
    }
  },
}
```

**Task 2.3: Add Error Tracking to API Routes** (1 hour)

- **Files to Update**: All API routes in `app/api/`
- **Pattern**:

  ```typescript
  import { logger } from '@/lib/services/logging-service'

  export async function GET(request: Request) {
    try {
      // API logic
      const data = await getPilots()
      return NextResponse.json({ success: true, data })
    } catch (error) {
      logger.error('Failed to fetch pilots', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
      })
      return NextResponse.json({ success: false, error: 'Failed to fetch pilots' }, { status: 500 })
    }
  }
  ```

- **Acceptance Criteria**:
  - [ ] All API routes have error logging
  - [ ] Context includes: error message, stack trace, request URL
  - [ ] Tested with intentional error (verified in Better Stack)

#### Afternoon Session (4 hours)

**Task 2.4: Add Global Error Boundary** (2 hours)

- **File**: `app/error.tsx` (Next.js 15 global error boundary)
- **Requirements**:
  - Catch unhandled errors in React tree
  - Log errors to Better Stack
  - Show user-friendly error message
  - Reset button to recover

**Code Template**:

```tsx
'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/services/logging-service'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Better Stack
    logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-gray-600">We've been notified and are working on a fix.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
```

**Task 2.5: Configure Better Stack Dashboard** (2 hours)

- **Actions**:
  - Create alerts for error rate >5%
  - Set up email notifications
  - Configure log retention (30 days)
  - Create dashboard widgets:
    - Error count (last 24 hours)
    - Top 5 error messages
    - Error rate trend (7 days)
- **Acceptance Criteria**:
  - [ ] Alerts configured and tested
  - [ ] Dashboard shows real-time errors
  - [ ] Email notification received for test error

#### End of Day 2 Deliverables

- ✅ Better Stack SDK installed and configured
- ✅ Logging service created (server + client)
- ✅ All API routes have error tracking
- ✅ Global error boundary implemented
- ✅ Better Stack dashboard operational

---

### **Day 3 (Wednesday) - Console Cleanup** - 8 hours

#### Morning Session (4 hours)

**Task 3.1: Audit Browser Console** (1 hour)

- **Actions**:
  - Open app in Chrome DevTools
  - Navigate to all major pages:
    - Dashboard
    - Pilots List
    - Renewal Planning
    - Leave Requests
    - Certifications
  - Document all errors and warnings
- **Create Checklist**: `console-errors-checklist.md`

  ```markdown
  ## Console Errors & Warnings Audit

  ### Errors (Critical)

  - [ ] Error 1: Description
  - [ ] Error 2: Description

  ### Warnings (Medium)

  - [ ] Warning 1: Description
  - [ ] Warning 2: Description

  ### Info/Debug (Low)

  - [ ] Info 1: Description
  ```

**Task 3.2: Fix React Warnings** (3 hours)

- **Common Issues to Fix**:
  1. **Missing Key Props** (in .map() loops)

     ```tsx
     // Before
     {
       items.map((item) => <div>{item.name}</div>)
     }

     // After
     {
       items.map((item) => <div key={item.id}>{item.name}</div>)
     }
     ```

  2. **Deprecated APIs** (React 19 deprecations)

     ```tsx
     // Before
     useEffect(() => {
       /* ... */
     }, [])

     // After (if async needed)
     useEffect(() => {
       const fetchData = async () => {
         /* ... */
       }
       fetchData()
     }, [])
     ```

  3. **Uncontrolled to Controlled Input** (form fields)

     ```tsx
     // Before
     <input value={value} />

     // After
     <input value={value || ''} />
     ```

  4. **Hydration Mismatches** (server/client differences)

     ```tsx
     // Before
     ;<div>{new Date().toLocaleString()}</div>

     // After
     const [mounted, setMounted] = useState(false)
     useEffect(() => setMounted(true), [])
     {
       mounted && <div>{new Date().toLocaleString()}</div>
     }
     ```

- **Acceptance Criteria**:
  - [ ] All React warnings fixed
  - [ ] No hydration mismatches
  - [ ] Forms work correctly (controlled inputs)

#### Afternoon Session (4 hours)

**Task 3.3: Remove Debug Logs** (2 hours)

- **Search Pattern**: `console.log`, `console.debug`, `console.warn` (exclude intentional logs)
- **Tool**: Use global search in VS Code
  ```bash
  # Search for console.log (excluding comments)
  Ctrl+Shift+F → Search: "console\.(log|debug|warn)"
  ```
- **Keep**:
  - Intentional error logs in catch blocks
  - Production-safe info logs
- **Remove**:
  - Debug logs from development
  - "Test" or "TODO" console logs
  - Commented-out console logs

**Task 3.4: Verify Production Build** (2 hours)

- **Commands**:
  ```bash
  npm run build
  npm run start
  # Open http://localhost:3000
  # Check console for errors/warnings
  ```
- **Acceptance Criteria**:
  - [ ] Production build completes successfully
  - [ ] Zero console errors in production mode
  - [ ] Zero console warnings in production mode
  - [ ] All pages load correctly

#### End of Day 3 Deliverables

- ✅ Console errors audit complete
- ✅ All React warnings fixed
- ✅ Debug logs removed
- ✅ Production build clean (0 errors, 0 warnings)

---

### **Day 4 (Thursday) - Optimistic UI** - 8 hours

#### Morning Session (4 hours)

**Task 4.1: Add Optimistic UI to Leave Requests** (3 hours)

- **File**: `components/forms/leave-request-form.tsx`
- **Pattern**: TanStack Query optimistic updates
- **Code Template**:

  ```tsx
  import { useMutation, useQueryClient } from '@tanstack/react-query'

  export function LeaveRequestForm() {
    const queryClient = useQueryClient()

    const mutation = useMutation({
      mutationFn: async (data: LeaveRequestInput) => {
        const res = await fetch('/api/leave-requests', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to submit')
        return res.json()
      },

      // Optimistic update
      onMutate: async (newRequest) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['leave-requests'] })

        // Snapshot previous value
        const previousRequests = queryClient.getQueryData(['leave-requests'])

        // Optimistically update
        queryClient.setQueryData(['leave-requests'], (old: any) => {
          return [
            ...(old || []),
            {
              ...newRequest,
              id: 'temp-' + Date.now(),
              status: 'pending',
            },
          ]
        })

        // Show success toast immediately
        toast.success('Leave request submitted!')

        return { previousRequests }
      },

      // Rollback on error
      onError: (err, newRequest, context) => {
        queryClient.setQueryData(['leave-requests'], context?.previousRequests)
        toast.error('Failed to submit leave request')
      },

      // Refetch on success
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      },
    })

    // Form submission
    const onSubmit = (data: LeaveRequestInput) => {
      mutation.mutate(data)
      form.reset() // Instant form reset
    }
  }
  ```

- **Acceptance Criteria**:
  - [ ] Form shows "Submitted!" immediately on submit
  - [ ] Request appears in list instantly (temp ID)
  - [ ] If server fails, request is removed + error shown
  - [ ] If server succeeds, temp ID replaced with real ID

**Task 4.2: Test Leave Request Optimistic UI** (1 hour)

- **Test Scenarios**:
  1. Happy path: Submit → Instant success → Server confirms
  2. Error path: Submit → Instant success → Server fails → Rollback
  3. Network delay: Submit → Instant success → 5s server delay → Confirmed
- **Acceptance Criteria**:
  - [ ] All 3 scenarios work correctly
  - [ ] No UI flicker or layout shift
  - [ ] Error messages are user-friendly

#### Afternoon Session (4 hours)

**Task 4.3: Add Optimistic UI to Certification Updates** (2 hours)

- **File**: `components/forms/certification-update-form.tsx`
- **Pattern**: Similar to leave requests (optimistic mutation)
- **Optimistic Changes**:
  - Update certification date instantly in table
  - Show "Saved!" checkmark animation
  - Rollback if server fails
- **Acceptance Criteria**:
  - [ ] Table updates instantly on save
  - [ ] Checkmark animation appears
  - [ ] Rollback on error works

**Task 4.4: Add Optimistic UI to Pilot Edits** (2 hours)

- **File**: `components/forms/pilot-edit-form.tsx`
- **Pattern**: Optimistic mutation with instant UI update
- **Optimistic Changes**:
  - Close modal instantly
  - Update pilot card in list
  - Rollback if server fails
- **Acceptance Criteria**:
  - [ ] Modal closes instantly (no waiting)
  - [ ] Pilot card updates in background
  - [ ] Rollback on error works

#### End of Day 4 Deliverables

- ✅ Optimistic UI on leave requests
- ✅ Optimistic UI on certification updates
- ✅ Optimistic UI on pilot edits
- ✅ All rollback scenarios tested

---

### **Day 5 (Friday) - Testing & Deployment** - 8 hours

#### Morning Session (4 hours)

**Task 5.1: Implement Error Rollback Logic** (3 hours)

- **Review All Optimistic Mutations**:
  - Leave requests
  - Certification updates
  - Pilot edits
- **Add Comprehensive Error Handling**:

  ```tsx
  onError: (error, variables, context) => {
    // 1. Rollback optimistic update
    queryClient.setQueryData(queryKey, context?.previousData)

    // 2. Log error to Better Stack
    logger.error('Mutation failed', {
      mutation: 'leave-request',
      error: error.message,
      variables,
    })

    // 3. Show user-friendly error
    toast.error('Failed to submit request. Please try again.')

    // 4. Optional: Retry logic
    if (error.message.includes('timeout')) {
      toast.info('Retrying...')
      // Retry after 2s
    }
  }
  ```

- **Acceptance Criteria**:
  - [ ] All mutations have error rollback
  - [ ] Errors logged to Better Stack
  - [ ] User-friendly error messages
  - [ ] No partial state (all-or-nothing updates)

**Task 5.2: Test All Optimistic UI Flows** (1 hour)

- **Test Matrix**:
  | Feature | Happy Path | Server Error | Network Delay | Rollback |
  |---------|------------|--------------|---------------|----------|
  | Leave Requests | ✅ | ✅ | ✅ | ✅ |
  | Cert Updates | ✅ | ✅ | ✅ | ✅ |
  | Pilot Edits | ✅ | ✅ | ✅ | ✅ |

- **Test Each Scenario**:
  1. Happy path (instant success)
  2. Server error (rollback)
  3. Network delay (5s timeout)
  4. Rollback correctness (state matches before)

#### Afternoon Session (4 hours)

**Task 5.3: Deploy to Staging** (1 hour)

- **Commands**:
  ```bash
  git add .
  git commit -m "feat: Phase 0 Quick Wins - skeleton UI, logging, optimistic updates"
  git push origin main
  # Vercel auto-deploys to staging
  ```
- **Verify Staging Deployment**:
  - Visit staging URL (Vercel preview)
  - Test all 3 skeleton screens
  - Test optimistic UI flows
  - Check Better Stack logs (staging environment)
- **Acceptance Criteria**:
  - [ ] Staging deployment successful
  - [ ] All features work on staging
  - [ ] Better Stack receiving logs from staging

**Task 5.4: User Feedback Session** (2 hours)

- **Participants**:
  - Fleet Manager (Sarah Thompson persona)
  - IT Manager (David Rodriguez persona)
  - 1-2 Pilots (Michael Chen persona)
- **Feedback Form**:

  ```markdown
  ## Phase 0 Quick Wins Feedback

  ### Performance Perception

  1. Does the app feel faster? (1-5 scale)
  2. Do you notice the skeleton loading screens? (Y/N)
  3. Do instant updates (optimistic UI) feel more responsive? (Y/N)

  ### User Experience

  4. Are error messages clear and helpful? (1-5 scale)
  5. Do you feel more confident using the app? (Y/N)
  6. Any frustrations or issues? (Free text)

  ### Overall Satisfaction

  7. Overall satisfaction with improvements? (1-5 scale)
  8. Would you recommend these changes? (Y/N)
  ```

- **Target Metrics**:
  - Performance perception: ≥4.0/5.0
  - User confidence: ≥80% "Yes"
  - Overall satisfaction: ≥4.0/5.0

**Task 5.5: Phase 0 Retrospective** (1 hour)

- **Review**:
  - What went well?
  - What could be improved?
  - Lessons learned for Phase 1
- **Metrics Review**:
  - Perceived performance: Target +50%
  - User satisfaction: Target +30%
  - Error visibility: Target 80%
  - Console cleanliness: Target 0 errors/warnings
- **Document Learnings**: `docs/PHASE-0-RETROSPECTIVE.md`

#### End of Day 5 Deliverables

- ✅ All error rollback logic implemented
- ✅ All optimistic UI flows tested (3×4 = 12 test scenarios)
- ✅ Deployed to staging environment
- ✅ User feedback collected (≥4.0/5.0 satisfaction)
- ✅ Phase 0 retrospective complete

---

## 📊 Success Metrics Tracking

### Quantitative Metrics

| Metric                    | Baseline | Target                   | Actual    | Status |
| ------------------------- | -------- | ------------------------ | --------- | ------ |
| **Dashboard Load Time**   | 500ms    | 500ms (perceived <100ms) | \_\_\_ ms | ⏳     |
| **Renewal Planning Load** | 8000ms   | 8000ms (perceived <2s)   | \_\_\_ ms | ⏳     |
| **Error Visibility**      | 0%       | 80%                      | \_\_\_%   | ⏳     |
| **Console Errors**        | \_\_\_   | 0                        | \_\_\_    | ⏳     |
| **Console Warnings**      | \_\_\_   | 0                        | \_\_\_    | ⏳     |
| **User Satisfaction**     | 3.5/5    | 4.0/5                    | \_\_\_ /5 | ⏳     |

### Qualitative Metrics

- **User Feedback**: "Does it feel faster?" (collect 10+ responses)
- **Perceived Performance**: Skeleton screens eliminate blank screen anxiety
- **Confidence**: Optimistic UI provides instant feedback (no waiting)
- **Professional Appearance**: Zero console errors/warnings

---

## 🚀 Next Steps After Phase 0

### Option 1: Phase 1 (Performance Optimization) - Recommended

- **Duration**: 2 weeks
- **Focus**: Dashboard <100ms, Renewal Planning <1s (actual, not perceived)
- **Tasks**: Redis caching, database indexes, Server Components

### Option 2: Phase 3 (Monitoring) - Parallel Track

- **Duration**: 1 week (can run parallel with Phase 1)
- **Focus**: Vercel Analytics, Better Stack dashboards, alerts
- **Tasks**: Performance monitoring, error tracking, uptime monitoring

### Option 3: Refine Phase 0

- **Duration**: 2-3 days
- **Focus**: Incorporate user feedback, polish skeleton designs
- **Tasks**: Adjust animations, improve error messages, add more optimistic UI

---

## 📝 Daily Standup Template

Use this template for daily progress updates:

```markdown
## Day X Standup

**Date**: October XX, 2025

### What I Completed Yesterday

- ✅ Task 1
- ✅ Task 2

### What I'm Working on Today

- 🔄 Task 3
- 🔄 Task 4

### Blockers

- ⚠️ Blocker 1 (if any)

### Metrics Update

- Console errors: \_\_\_ (target: 0)
- Error visibility: \_\_\_% (target: 80%)
- User satisfaction: \_\_\_ /5 (target: 4.0/5)
```

---

## 📚 Resources

### Documentation

- **Better Stack Docs**: https://betterstack.com/docs/logs/
- **TanStack Query Optimistic Updates**: https://tanstack.com/query/latest/docs/react/guides/optimistic-updates
- **Next.js Error Handling**: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- **React 19 Best Practices**: https://react.dev/blog/2024/12/05/react-19

### Tools

- **Better Stack Dashboard**: https://logs.betterstack.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Chrome DevTools**: For console audit and performance testing

### Support

- **Better Stack Support**: support@betterstack.com
- **Phase 0 Questions**: Maurice (Skycruzer)

---

**Phase 0 Quick Wins Roadmap**
_Fleet Management V2 Modernization Initiative_
_Created: October 24, 2025_
