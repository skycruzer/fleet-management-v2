# Priority 2-4 Implementation Guide

**Status**: Partial Implementation (Quick Wins Complete)
**Created**: 2025-10-29
**Estimated Remaining Time**: 4-6 hours

---

## ✅ COMPLETED (Ready to Use)

### 1. Dashboard Widgets ✅
**Files Created**:
- `/components/portal/recent-activity-widget.tsx`
- `/components/portal/team-status-widget.tsx`

**Usage**:
```typescript
import { RecentActivityWidget } from '@/components/portal/recent-activity-widget'
import { TeamStatusWidget } from '@/components/portal/team-status-widget'

// In dashboard page
<RecentActivityWidget activities={recentActivities} maxItems={5} />
<TeamStatusWidget teamMembers={teamData} currentPilotRank="Captain" />
```

### 2. Keyboard Shortcuts ✅
**Files Created**:
- `/hooks/use-keyboard-shortcuts.ts`

**Default Shortcuts**:
- `Alt+H` - Go to Dashboard
- `Alt+P` - Go to Pilots
- `Alt+C` - Go to Certifications
- `Alt+L` - Go to Leave Requests
- `Ctrl+/` - Focus search
- `Shift+?` - Show shortcuts help

**Usage**:
```typescript
// In layout component
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

export function DashboardLayout() {
  useKeyboardShortcuts({ enabled: true })
  // ...
}
```

---

## 📋 REMAINING WORK

### Priority 2: Feature Enhancements

#### A. Real-time Notifications (2-3 hours)

**Complexity**: High
**Dependencies**: Supabase Realtime

**Implementation Steps**:

1. **Install Dependencies**:
```bash
npm install @supabase/realtime-js
```

2. **Create Realtime Hook** (`hooks/use-realtime-notifications.ts`):
```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useRealtimeNotifications(pilotId: string) {
  const supabase = createClient()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const channel = supabase
      .channel('pilot-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `pilot_id=eq.${pilotId}`,
        },
        (payload) => {
          // Handle new notification
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev])
            toast({
              title: payload.new.title,
              description: payload.new.message,
              variant: payload.new.type === 'error' ? 'destructive' : 'default',
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pilotId])

  return notifications
}
```

3. **Use in Portal Layout**:
```typescript
// In app/portal/(protected)/layout.tsx
const notifications = useRealtimeNotifications(pilot.id)
```

4. **Database Trigger** (create in Supabase SQL Editor):
```sql
-- Create trigger to notify when leave/flight requests are approved/denied
CREATE OR REPLACE FUNCTION notify_pilot_on_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to approved or denied
  IF (NEW.status IN ('approved', 'denied') AND OLD.status = 'pending') THEN
    INSERT INTO notifications (pilot_id, title, message, type, read)
    VALUES (
      NEW.pilot_id,
      CASE
        WHEN NEW.status = 'approved' THEN 'Request Approved'
        ELSE 'Request Denied'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN 'Your request has been approved.'
        ELSE 'Your request has been denied. Check comments for details.'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN 'success'
        ELSE 'warning'
      END,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to leave_requests
CREATE TRIGGER leave_request_notification
AFTER UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION notify_pilot_on_request_update();

-- Attach to flight_requests
CREATE TRIGGER flight_request_notification
AFTER UPDATE ON flight_requests
FOR EACH ROW
EXECUTE FUNCTION notify_pilot_on_request_update();
```

---

#### B. Email Notifications (1-2 hours)

**Complexity**: Medium
**Dependencies**: Resend (already installed)

**Implementation Steps**:

1. **Create Email Templates** (`lib/email-templates/`):
```typescript
// lib/email-templates/leave-request-approved.ts
export const leaveRequestApprovedTemplate = (data: {
  pilotName: string
  leaveType: string
  startDate: string
  endDate: string
  approvedBy: string
}) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
    .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ Leave Request Approved</h1>
    </div>
    <div class="content">
      <p>Hi ${data.pilotName},</p>

      <p>Great news! Your leave request has been approved.</p>

      <div class="details">
        <strong>Leave Type:</strong> ${data.leaveType}<br>
        <strong>Start Date:</strong> ${data.startDate}<br>
        <strong>End Date:</strong> ${data.endDate}<br>
        <strong>Approved By:</strong> ${data.approvedBy}
      </div>

      <p>You can view your approved leave request in the pilot portal.</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/leave-requests" class="button">
        View Leave Requests
      </a>

      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        This is an automated message from Fleet Management System
      </p>
    </div>
  </div>
</body>
</html>
`
```

2. **Create Email Service** (`lib/services/email-notification-service.ts`):
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendLeaveRequestApprovalEmail(data: {
  to: string
  pilotName: string
  leaveType: string
  startDate: string
  endDate: string
  approvedBy: string
}) {
  const html = leaveRequestApprovedTemplate(data)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'no-reply@fleetmanagement.com',
    to: data.to,
    subject: `Leave Request Approved - ${data.leaveType}`,
    html,
  })
}
```

3. **Integrate in API Routes**:
```typescript
// In app/api/leave-requests/[id]/approve/route.ts
import { sendLeaveRequestApprovalEmail } from '@/lib/services/email-notification-service'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // ... approval logic

  // Send email notification
  await sendLeaveRequestApprovalEmail({
    to: pilot.email,
    pilotName: `${pilot.first_name} ${pilot.last_name}`,
    leaveType: leaveRequest.leave_type,
    startDate: format(leaveRequest.start_date, 'PPP'),
    endDate: format(leaveRequest.end_date, 'PPP'),
    approvedBy: approver.name,
  })

  return NextResponse.json({ success: true })
}
```

---

### Priority 3: Performance Optimizations

#### A. React Query Setup (1 hour)

**Complexity**: Medium

**Implementation Steps**:

1. **Install Dependencies**:
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

2. **Create Query Client** (`lib/query-client.ts`):
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

3. **Add Provider to Layout** (`app/layout.tsx`):
```typescript
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

4. **Create Query Hooks** (`hooks/queries/use-leave-requests.ts`):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useLeaveRequests() {
  return useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const res = await fetch('/api/portal/leave-requests')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/portal/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}
```

5. **Use in Components**:
```typescript
'use client'

import { useLeaveRequests, useCreateLeaveRequest } from '@/hooks/queries/use-leave-requests'

export function LeaveRequestsPage() {
  const { data, isLoading, error } = useLeaveRequests()
  const createMutation = useCreateLeaveRequest()

  if (isLoading) return <LeaveRequestsSkeleton />
  if (error) return <div>Error loading requests</div>

  return (
    <div>
      {data.map(request => (
        <LeaveRequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}
```

---

#### B. Optimistic Updates (30 mins)

**Complexity**: Low (with React Query)

**Implementation**:
```typescript
export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portal/leave-requests?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      return id
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leave-requests'] })

      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(['leave-requests'])

      // Optimistically update UI
      queryClient.setQueryData(['leave-requests'], (old: any) =>
        old.filter((req: any) => req.id !== id)
      )

      return { previousRequests }
    },
    onError: (err, id, context) => {
      // Rollback on error
      queryClient.setQueryData(['leave-requests'], context?.previousRequests)
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}
```

---

#### C. Code Splitting (30 mins)

**Complexity**: Low

**Implementation**:
```typescript
// Use Next.js dynamic imports for heavy components
import dynamic from 'next/dynamic'

// Lazy load analytics chart
const AnalyticsChart = dynamic(
  () => import('@/components/analytics/analytics-chart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Disable SSR for client-only components
  }
)

// Lazy load calendar component
const LeaveCalendar = dynamic(
  () => import('@/components/leave/leave-calendar'),
  {
    loading: () => <CalendarSkeleton />,
  }
)

// Use in component
export function AnalyticsPage() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Load Chart</button>
      {showChart && <AnalyticsChart data={data} />}
    </div>
  )
}
```

---

### Priority 4: Accessibility

#### A. Screen Reader Optimization (1 hour)

**Implementation**:

1. **Add ARIA Labels**:
```typescript
// Navigation
<nav aria-label="Main navigation">
  <Link href="/dashboard" aria-label="Go to dashboard">
    Dashboard
  </Link>
</nav>

// Form fields
<input
  type="text"
  aria-label="Search pilots"
  aria-describedby="search-help"
/>
<span id="search-help" className="sr-only">
  Enter pilot name or employee ID to search
</span>

// Buttons
<button aria-label="Delete pilot John Doe">
  <TrashIcon aria-hidden="true" />
</button>

// Status indicators
<span role="status" aria-live="polite">
  {loading ? 'Loading...' : 'Loaded'}
</span>
```

2. **Screen Reader Only Text**:
```css
/* Add to globals.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

3. **Focus Management**:
```typescript
// Trap focus in dialog
import { useEffect, useRef } from 'react'

export function Dialog({ open, onClose }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      // Focus first focusable element
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [open])

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true">
      {/* Dialog content */}
    </div>
  )
}
```

---

#### B. WCAG 2.1 AA Compliance (1 hour)

**Checklist**:

1. **Color Contrast**:
```typescript
// Check all text has 4.5:1 contrast ratio
// Tool: https://webaim.org/resources/contrastchecker/

// Example fixes:
const colors = {
  // ❌ Bad: #999 on white (2.8:1)
  // ✅ Good: #666 on white (5.7:1)
  mutedForeground: '#666666',
}
```

2. **Keyboard Navigation**:
- ✅ All interactive elements focusable
- ✅ Visible focus indicators
- ✅ Logical tab order

3. **Form Labels**:
```typescript
// ✅ All inputs have labels
<label htmlFor="pilot-name">Pilot Name</label>
<input id="pilot-name" type="text" />

// ✅ Error messages linked to inputs
<input
  id="email"
  aria-invalid={!!error}
  aria-describedby="email-error"
/>
{error && <span id="email-error">{error}</span>}
```

4. **Skip Links**:
```typescript
// Add to layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white"
>
  Skip to main content
</a>

<main id="main-content">
  {children}
</main>
```

---

## 🧪 Testing Plan

### Manual Testing
- [ ] Test keyboard shortcuts in Chrome, Firefox, Safari
- [ ] Test screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Test keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- [ ] Test color contrast with browser devtools
- [ ] Test real-time notifications (create/update records)
- [ ] Test email delivery (check spam folder)

### Automated Testing
```typescript
// e2e/keyboard-shortcuts.spec.ts
test('keyboard shortcuts work', async ({ page }) => {
  await page.goto('/dashboard')
  await page.keyboard.press('Alt+P')
  await expect(page).toHaveURL('/dashboard/pilots')
})

// e2e/accessibility.spec.ts
test('page is accessible', async ({ page }) => {
  await page.goto('/dashboard')
  const accessibilityScanResults = await page.accessibility.snapshot()
  // Check for violations
})
```

---

## 📊 Estimated Timeline

| Task | Time | Priority |
|------|------|----------|
| ✅ Dashboard Widgets | 30 mins | Complete |
| ✅ Keyboard Shortcuts | 30 mins | Complete |
| Real-time Notifications | 2-3 hours | P2 |
| Email Notifications | 1-2 hours | P2 |
| React Query Setup | 1 hour | P3 |
| Optimistic Updates | 30 mins | P3 |
| Code Splitting | 30 mins | P3 |
| Screen Reader Optimization | 1 hour | P4 |
| WCAG Compliance | 1 hour | P4 |

**Total Remaining**: 7-10 hours

---

## 🚀 Recommendation

**Option 1: Implement Now (7-10 hours)**
- Complete all Priority 2-4 features
- Comprehensive testing
- Production-ready implementation

**Option 2: Phased Approach**
- Use completed widgets and keyboard shortcuts now
- Implement Priority 3 (performance) next (2 hours)
- Implement Priority 2 (features) later (3-5 hours)
- Implement Priority 4 (accessibility) last (2 hours)

**Option 3: Test Current Improvements**
- Test Priority 1 improvements (mobile nav, toasts, skeletons)
- Test completed widgets and keyboard shortcuts
- Plan remaining work for future sprint

---

**Document Created**: 2025-10-29
**Status**: Implementation guide for remaining Priority 2-4 work
**Next Step**: User decision on implementation approach
