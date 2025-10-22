# Research: Missing Core Features

**Feature**: 001-missing-core-features
**Phase**: Phase 0 - Research & Design Decisions
**Date**: 2025-10-22
**Prerequisites**: plan.md, spec.md

---

## Purpose

This document addresses design decisions, best practices research, and technical unknowns for implementing 7 core feature areas: Pilot Portal, Flight Requests, Task Management, Disciplinary Tracking, Feedback Community, Audit Logging, and Registration Approval.

**Scope**: Research focuses on Next.js 15 + React 19 + Supabase patterns that align with existing fleet-management-v2 architecture.

---

## Research Questions Answered

### RQ1: Pilot Authentication - Separate vs Shared Login?

**Question**: Should pilots use a separate authentication system from admins, or share the Supabase Auth system with role differentiation?

**Research**:
- Existing system uses Supabase Auth with `an_users` table
- Current admin authentication via email/password
- No pilot-facing authentication exists yet

**Decision**: ✅ **Shared Supabase Auth with role-based routing**

**Rationale**:
- Single source of truth for authentication (no dual user systems)
- Leverage existing Supabase Auth infrastructure
- Role-based routing handles separation (`/pilot/*` vs `/dashboard/*`)
- RLS policies enforce data access control per role
- Simplifies user management for admins

**Implementation**:
```typescript
// Add role field to an_users table (or use Supabase metadata)
// Route protection in middleware.ts:
if (user.role === 'pilot' && !path.startsWith('/pilot')) {
  return NextResponse.redirect('/pilot/dashboard')
}
if (user.role === 'admin' && !path.startsWith('/dashboard')) {
  return NextResponse.redirect('/dashboard')
}
```

---

### RQ2: Real-time Notifications - Supabase Realtime vs Polling?

**Question**: How should pilot notifications work? Real-time subscriptions or periodic polling?

**Research**:
- Supabase Realtime supports PostgreSQL change events (CDC)
- Next.js 15 Server Components don't support real-time by default
- Need Client Component for subscriptions

**Decision**: ✅ **Hybrid approach - Supabase Realtime for notifications + polling fallback**

**Rationale**:
- Real-time subscriptions for instant updates (leave approvals, task assignments)
- Polling fallback for offline scenarios (PWA support)
- Unread count badge updates immediately
- Server Components for initial load, Client Component for real-time updates

**Implementation**:
```typescript
// Client Component: components/pilot/NotificationBell.tsx
'use client'
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pilot_notifications' },
        () => setUnreadCount(prev => prev + 1)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return <Badge>{unreadCount}</Badge>
}
```

---

### RQ3: Task Management - Kanban Library vs Custom Implementation?

**Question**: Should we use a library like `react-beautiful-dnd` or build a custom Kanban board?

**Research**:
- `react-beautiful-dnd` - 30K stars, but maintenance concerns (last update 2021)
- `@dnd-kit/core` - Modern alternative, 12K stars, active maintenance
- `@hello-pangea/dnd` - Fork of react-beautiful-dnd with TypeScript fixes
- Custom implementation with HTML5 Drag & Drop API

**Decision**: ✅ **Use `@dnd-kit/core` for Kanban implementation**

**Rationale**:
- Modern, actively maintained (2024 updates)
- Excellent TypeScript support
- Accessibility-first design (keyboard navigation, screen readers)
- Framework-agnostic (works with React 19)
- Performance optimized for large lists
- Mobile touch support built-in

**Implementation**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

```typescript
// components/tasks/TaskKanbanView.tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export function TaskKanbanView({ tasks }: { tasks: Task[] }) {
  const handleDragEnd = (event) => {
    // Update task status via API
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4">
        <TaskColumn status="TODO" tasks={todoTasks} />
        <TaskColumn status="IN_PROGRESS" tasks={inProgressTasks} />
        <TaskColumn status="DONE" tasks={doneTasks} />
      </div>
    </DndContext>
  )
}
```

---

### RQ4: Feedback Community - Nested Comments vs Flat Thread?

**Question**: Should feedback comments support nested replies (Reddit-style) or flat threads (Twitter-style)?

**Research**:
- Nested comments require recursive component rendering
- Flat threads easier to implement, better mobile UX
- Aviation use case: Quick feedback and suggestions (not deep discussions)
- Database complexity: Nested requires `parent_comment_id` self-reference

**Decision**: ✅ **Flat comment threads with @mentions**

**Rationale**:
- Simpler database schema (`feedback_comments` with `post_id` only)
- Better mobile experience (less scrolling)
- Faster rendering (no recursion)
- @mentions provide reply context without nesting
- Aviation context favors quick, actionable feedback over long discussions

**Implementation**:
```typescript
// Database schema (data-model.md will detail this)
feedback_comments:
  - id (uuid)
  - post_id (uuid) → feedback_posts.id
  - pilot_id (uuid) → pilots.id
  - content (text)
  - mentions (text[]) // Array of mentioned pilot IDs
  - created_at (timestamp)

// UI Component: FeedbackCommentList.tsx
{comments.map(comment => (
  <CommentCard
    key={comment.id}
    comment={comment}
    mentions={comment.mentions.map(id => pilots.find(p => p.id === id))}
  />
))}
```

---

### RQ5: Audit Logging - Trigger-based vs Application-level?

**Question**: Should audit logs be generated via PostgreSQL triggers or application-level code?

**Research**:
- **Database triggers**: Automatic, can't be bypassed, but harder to customize messages
- **Application-level**: More control over what gets logged, can add context (user IP, session ID)
- Supabase supports both approaches

**Decision**: ✅ **Hybrid: Database triggers for data changes + Application-level for business events**

**Rationale**:
- Database triggers ensure ALL data mutations are logged (safety net)
- Application-level logs add business context ("Leave request approved by Manager X")
- Critical operations get double-logged (data + business event)
- Compliance requirement satisfied with triggers alone (complete audit trail)

**Implementation**:
```sql
-- Database trigger for auto-logging (created in migration)
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, operation, old_values, new_values, user_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to critical tables
CREATE TRIGGER pilot_checks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON pilot_checks
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
```

```typescript
// Application-level logging (service layer)
// lib/services/audit-log-service.ts
export async function logBusinessEvent(event: {
  action: string
  entity_type: string
  entity_id: string
  description: string
  metadata?: Record<string, any>
}) {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    ...event,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    created_at: new Date().toISOString()
  })
}

// Usage in leave-service.ts
await logBusinessEvent({
  action: 'leave_request_approved',
  entity_type: 'leave_request',
  entity_id: request.id,
  description: `Leave request for ${pilot.name} approved for RP${period}/2025`,
  metadata: { period, pilot_id: request.pilot_id, approved_by: user.id }
})
```

---

### RQ6: Disciplinary Actions - Timeline vs Table View?

**Question**: What's the best UI pattern for displaying disciplinary matter history?

**Research**:
- **Timeline view**: Chronological events with visual flow (like GitHub issue history)
- **Table view**: Sortable, filterable grid (easier for bulk review)
- Use case: Track investigation → warning → resolution with dates and actions

**Decision**: ✅ **Primary: Timeline view | Secondary: Table view toggle**

**Rationale**:
- Timeline shows progression of matter (investigation → action → resolution)
- Better storytelling for audit purposes
- shadcn/ui has Timeline component available
- Table view as alternate for administrators who need filtering/sorting
- View toggle button in header (similar to Kanban/List toggle for tasks)

**Implementation**:
```typescript
// components/disciplinary/MatterTimelineView.tsx
import { Timeline, TimelineItem } from '@/components/ui/timeline'

export function MatterTimelineView({ matter }: { matter: DisciplinaryMatter }) {
  return (
    <Timeline>
      {matter.actions.map(action => (
        <TimelineItem
          key={action.id}
          date={action.created_at}
          type={action.action_type} // 'investigation', 'warning', 'resolution'
          user={action.created_by_name}
        >
          <div>
            <h4>{action.action_type}</h4>
            <p>{action.description}</p>
            {action.attachments && <FileList files={action.attachments} />}
          </div>
        </TimelineItem>
      ))}
    </Timeline>
  )
}
```

---

### RQ7: Flight Request Workflow - Manual vs Auto-approval?

**Question**: Should flight requests be auto-approved based on rules, or always require manual admin review?

**Research**:
- Auto-approval risks: Scheduling conflicts, crew availability issues
- Manual review: Slower but safer, allows business judgment
- Hybrid: Auto-approve simple requests, flag complex ones for review

**Decision**: ✅ **Manual approval workflow with admin review dashboard**

**Rationale**:
- Aviation safety: Human judgment needed for flight scheduling
- Fleet manager needs to verify crew availability, route feasibility
- Request complexity varies (simple swap vs major schedule change)
- Admin dashboard shows pending requests sorted by submission date
- Future enhancement: Flag "low-risk" requests for faster approval

**Implementation**:
```typescript
// Workflow states
type FlightRequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'

// Service function
export async function submitFlightRequest(request: FlightRequestInput) {
  // Validate request dates, pilot eligibility
  // Create request with status: 'PENDING'
  // Send notification to admin
  // Send confirmation email to pilot
}

// Admin action
export async function reviewFlightRequest(
  requestId: string,
  decision: 'APPROVED' | 'DENIED',
  comments?: string
) {
  // Update status
  // Log action in audit_logs
  // Notify pilot of decision
  // If approved, optionally update roster
}
```

---

### RQ8: Pilot Registration - Email Verification Required?

**Question**: Should pilot registration require email verification before admin approval?

**Research**:
- Email verification prevents fake registrations
- But adds friction to pilot signup flow
- Admin approval already acts as verification gate

**Decision**: ✅ **Email verification required + Admin approval (two-step)**

**Rationale**:
- Security: Ensures pilot owns the email address
- Prevents spam registrations with fake emails
- Admin sees verified email status when approving
- Supabase Auth handles email verification automatically
- Two-factor verification (email + admin) for high-security aviation context

**Implementation**:
```typescript
// 1. Pilot submits registration form
// 2. Supabase Auth sends verification email
// 3. Pilot clicks link to verify email
// 4. Record created in pilot_registrations table with status: 'PENDING'
// 5. Admin reviews and approves/denies
// 6. If approved, create pilot record and link to user account

// Registration service
export async function registerPilot(data: PilotRegistrationInput) {
  const supabase = await createClient()

  // Create Supabase Auth user (sends verification email)
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/pilot/verify`,
    }
  })

  if (error) throw error

  // Create registration record (approved by admin later)
  await supabase.from('pilot_registrations').insert({
    user_id: authData.user.id,
    first_name: data.first_name,
    last_name: data.last_name,
    employee_id: data.employee_id,
    rank: data.rank,
    status: 'PENDING', // Admin must approve
    email_verified: false // Updated when email verified
  })
}
```

---

## Technology Stack Research

### Next.js 15 + React 19 Patterns

**Server Components** (default):
- Use for initial page loads, SEO-critical pages
- Pilot dashboard, feedback list, task list all use Server Components
- Data fetching with `async/await` directly in components

**Client Components** (`'use client'`):
- Interactive forms (leave submission, flight requests)
- Real-time features (notification bell, presence indicators)
- Drag-and-drop (task Kanban)

**Server Actions**:
- Form submissions that mutate data
- Progressive enhancement (works without JavaScript)

```typescript
// app/pilot/leave/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { LeaveRequestForm } from '@/components/pilot/LeaveRequestForm' // Client Component

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const pilot = await getPilotByUserId(user.id)

  return (
    <div>
      <h1>Submit Leave Request</h1>
      <LeaveRequestForm pilotId={pilot.id} />
    </div>
  )
}
```

### Supabase Real-time Patterns

**Recommended**: Use Supabase Realtime only for high-value real-time features (notifications, presence). Most features work fine with periodic refetches.

```typescript
// Real-time notifications
const channel = supabase
  .channel('pilot-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'pilot_notifications',
    filter: `pilot_id=eq.${pilotId}`
  }, handleNewNotification)
  .subscribe()

// Real-time presence (who's viewing task board)
const presenceChannel = supabase.channel('task-board')
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState()
    setActiveUsers(Object.keys(state))
  })
  .subscribe()
```

### Form Validation with Zod

**Pattern**: Define schema once, use for both client and server validation.

```typescript
// lib/validations/flight-request-schema.ts
export const FlightRequestSchema = z.object({
  route: z.string().min(1, 'Route required'),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date']
})

// Client: React Hook Form
const form = useForm({
  resolver: zodResolver(FlightRequestSchema)
})

// Server: API route validation
const parsed = FlightRequestSchema.safeParse(await request.json())
if (!parsed.success) {
  return NextResponse.json({ errors: parsed.error.format() }, { status: 400 })
}
```

---

## Best Practices Identified

### 1. Service Layer Architecture (Mandatory)

**Never make direct Supabase calls from API routes or components.**

```typescript
// ❌ WRONG - Direct Supabase call in API route
export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('flight_requests').select('*')
  return NextResponse.json(data)
}

// ✅ CORRECT - Use service layer
import { getFlightRequests } from '@/lib/services/flight-request-service'

export async function GET() {
  const requests = await getFlightRequests()
  return NextResponse.json({ success: true, data: requests })
}
```

### 2. Row Level Security (RLS) for All Tables

**Every new table requires RLS policies.**

```sql
-- Enable RLS
ALTER TABLE pilot_notifications ENABLE ROW LEVEL SECURITY;

-- Pilots can read their own notifications
CREATE POLICY "Pilots can view own notifications"
ON pilot_notifications FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM pilots WHERE id = pilot_notifications.pilot_id
));

-- Admins can insert notifications
CREATE POLICY "Admins can create notifications"
ON pilot_notifications FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);
```

### 3. Optimistic UI Updates

**For better UX, update UI immediately then sync with server.**

```typescript
// Example: Mark notification as read
async function markAsRead(notificationId: string) {
  // Optimistic update
  setNotifications(prev =>
    prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
  )

  // Server sync
  try {
    await fetch(`/api/pilot/notifications/${notificationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true })
    })
  } catch (error) {
    // Revert on failure
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
    )
    toast.error('Failed to mark as read')
  }
}
```

### 4. Pagination for Large Lists

**Feedback posts, audit logs, tasks should paginate to avoid performance issues.**

```typescript
// API route with cursor-based pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = 20

  const posts = await getFeedbackPosts({
    limit,
    cursor,
    orderBy: 'created_at',
    order: 'desc'
  })

  return NextResponse.json({
    data: posts,
    nextCursor: posts.length === limit ? posts[posts.length - 1].id : null
  })
}
```

### 5. Error Handling Standards

**Use standardized error messages and constraint handlers.**

```typescript
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { handleConstraintError } from '@/lib/utils/constraint-error-handler'

try {
  const result = await createTask(taskData)
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  // Handle database constraints
  if (error.code?.startsWith('23')) {
    return NextResponse.json(handleConstraintError(error), { status: 400 })
  }

  // Generic error
  return NextResponse.json(
    formatApiError(ERROR_MESSAGES.TASK.CREATE_FAILED, 500),
    { status: 500 }
  )
}
```

---

## External Resources Consulted

### Official Documentation
1. **Next.js 15 Documentation**: https://nextjs.org/docs/app
   - Server Components, Server Actions, Middleware patterns
2. **Supabase Auth Documentation**: https://supabase.com/docs/guides/auth
   - Email verification, role-based access, RLS policies
3. **Supabase Realtime Documentation**: https://supabase.com/docs/guides/realtime
   - Change Data Capture (CDC), presence tracking, broadcast
4. **React Hook Form Documentation**: https://react-hook-form.com/
   - Zod resolver integration, nested forms, error handling
5. **Zod Documentation**: https://zod.dev/
   - Schema composition, refinements, error messages

### Community Best Practices
1. **@dnd-kit/core GitHub**: https://github.com/clauderic/dnd-kit
   - Kanban board examples, accessibility patterns
2. **shadcn/ui Components**: https://ui.shadcn.com/
   - Timeline component, Dialog, Form components
3. **Supabase Community Examples**: https://github.com/supabase/supabase/tree/master/examples
   - Real-time subscriptions, auth patterns, RLS examples

---

## Design Decisions Summary

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| **Pilot Authentication** | Shared Supabase Auth + role routing | Single auth system, RLS enforcement |
| **Real-time Notifications** | Supabase Realtime + polling fallback | Instant updates with offline support |
| **Task Kanban** | @dnd-kit/core library | Modern, accessible, TypeScript-friendly |
| **Feedback Comments** | Flat threads with @mentions | Simpler schema, better mobile UX |
| **Audit Logging** | Database triggers + app-level events | Complete coverage with business context |
| **Disciplinary UI** | Timeline view (primary) + table toggle | Shows progression, audit-friendly |
| **Flight Request Approval** | Manual admin review | Safety-critical, requires human judgment |
| **Pilot Registration** | Email verification + admin approval | Two-factor verification for security |

---

## Risks & Mitigations

### Risk 1: Real-time Subscriptions Scale
**Risk**: Supabase Realtime has connection limits (default 200 concurrent)
**Mitigation**: Use real-time only for critical features (notifications), poll for less urgent updates
**Monitoring**: Track active connection count in Supabase dashboard

### Risk 2: Audit Log Table Growth
**Risk**: audit_logs table could grow very large (every data mutation logged)
**Mitigation**: Implement data retention policy (archive logs older than 7 years)
**Monitoring**: Monthly table size check, automated archival script

### Risk 3: Drag-Drop Performance
**Risk**: Kanban board with 100+ tasks may lag
**Mitigation**: Virtual scrolling for large lists, lazy load task cards
**Monitoring**: React DevTools Profiler during testing

### Risk 4: Feedback Spam
**Risk**: Pilots could spam feedback posts/comments
**Mitigation**: Rate limiting (max 10 posts/day, 50 comments/day), moderation dashboard
**Monitoring**: Admin moderation queue alerts

---

## Open Questions (To Address in data-model.md)

1. **Notification preferences**: Should pilots be able to mute notification types?
2. **Task assignment**: Can tasks be assigned to multiple users, or single assignee only?
3. **Disciplinary attachments**: Max file size for uploaded documents?
4. **Feedback categories**: Predefined categories or user-created tags?
5. **Flight request recurrence**: Support recurring requests (e.g., monthly route preference)?

**Resolution**: These will be finalized during data-model.md design phase.

---

## Next Steps

1. ✅ Research complete
2. ⏳ Create `data-model.md` - Define exact database schemas for 8 new tables
3. ⏳ Create `contracts/` - Define all API endpoints (REST contracts)
4. ⏳ Create `quickstart.md` - Developer implementation guide

**Phase 0 Status**: ✅ **COMPLETE**
**Ready for Phase 1**: Database design and API contracts

---

**Research Complete**: 2025-10-22
**Reviewed By**: Claude Code
**Next Phase**: Phase 1 - Design (data-model.md, contracts/, quickstart.md)
