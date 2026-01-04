# Change Proposal: Add Missing Core Features from air-niugini-pms

**Change ID**: `add-missing-core-features`
**Created**: 2025-10-22
**Status**: Draft
**Priority**: P1 (Critical - Core Functionality)

## Why This Change?

**Problem Statement**: Fleet Management V2 currently lacks critical pilot-facing features and admin capabilities that exist in the reference air-niugini-pms system. Pilots have NO self-service portal access, preventing them from viewing their certifications, submitting leave requests, or accessing flight request systems. This forces pilots to call/email admins for basic information, creating operational bottlenecks and poor user experience.

**Business Impact**:

- **Pilots blocked**: Cannot view their own certification status, leave balance, or submit requests
- **Admin overhead**: Must manually handle all pilot inquiries and data requests
- **Compliance gaps**: No audit logging for regulatory compliance and accountability
- **Operational inefficiency**: No task management, flight request workflow, or disciplinary tracking

**User Requests**: This change implements the user requirement:

> "Add missing pages and features from air-niugini-pms except documents and forms: Pilot Portal (8 pages), Flight Request System, Task Management, Disciplinary System, Feedback Community, Audit Logging, Pilot Registration Approval"

## What Changes?

This change adds **7 major capability areas** to Fleet Management V2:

### 1. Pilot Portal (8 pages) - PRIORITY 1

- **`/pilot/login`** - Pilot authentication (separate from admin)
- **`/pilot/register`** - Self-service registration (pending admin approval)
- **`/pilot/dashboard`** - Personal dashboard with certifications, leave balance, notifications
- **`/pilot/certifications`** - View own certifications with expiry status (Red/Yellow/Green)
- **`/pilot/leave`** - Submit leave requests (RDO/WDO/Annual) for roster periods
- **`/pilot/flight-requests`** - Submit flight requests for additional flying opportunities
- **`/pilot/profile`** - View and update personal profile information
- **`/pilot/feedback`** - Community feedback and discussion board

### 2. Flight Request System - PRIORITY 1

- **Pilot Submission**: `/pilot/flight-requests` - Submit requests with route, dates, reason
- **Admin Review**: `/dashboard/flight-requests` - Approve/deny with comments
- **Workflow**: PENDING → APPROVED/DENIED with notification to pilot
- **Database**: New `flight_requests` table with RLS policies

### 3. Audit Logging - PRIORITY 2

- **Admin View**: `/dashboard/audit` - Complete audit trail of all system changes
- **Tracking**: WHO changed WHAT, WHEN (user, timestamp, table, action, old/new values)
- **Filtering**: By user, date range, table, action type
- **Export**: CSV export for compliance reporting
- **Database**: New `audit_logs` table with automatic triggers on all tables

### 4. Task Management - PRIORITY 2

- **Admin Management**: `/dashboard/tasks` - Create, assign, track tasks
- **Views**: Kanban board (To Do/In Progress/Done) and List view
- **Assignment**: Assign to pilots/staff with due dates and priorities
- **Pilot View**: Pilots see assigned tasks in dashboard
- **Real-time**: Presence indicators showing who's viewing tasks
- **Database**: New `tasks` table with status tracking

### 5. Disciplinary System - PRIORITY 2

- **Admin Management**: `/dashboard/disciplinary` - Create and track disciplinary matters
- **Severity Levels**: Low, Medium, High, Critical
- **Actions**: Counseling, warning, suspension, other (timestamped log)
- **Resolution Tracking**: Timeline of actions until resolution
- **Database**: New `disciplinary_actions` and `disciplinary_actions_log` tables

### 6. Feedback Community - PRIORITY 3

- **Pilot Posting**: `/pilot/feedback` - Post suggestions, questions, safety concerns
- **Categories**: Suggestions, Questions, Safety, General
- **Comments**: Threaded comments on posts
- **Admin Moderation**: `/dashboard/admin/feedback-moderation` - Remove inappropriate content
- **Database**: New `feedback_posts` and `feedback_comments` tables

### 7. Pilot Registration Approval - PRIORITY 3

- **Pilot Registration**: `/pilot/register` - Submit registration request
- **Admin Approval**: `/dashboard/admin/pilot-registrations` - Review and approve/deny
- **Workflow**: PENDING → APPROVED/DENIED
- **Account Creation**: Approved registrations auto-create pilot portal accounts
- **Database**: New `pilot_registrations` table

## Impact Analysis

### Affected Capabilities

This change adds **7 new capabilities** to the system:

1. **`pilot-portal`** (NEW) - Self-service pilot portal with authentication
2. **`flight-requests`** (NEW) - Flight request submission and approval workflow
3. **`audit-logging`** (NEW) - System-wide audit trail for compliance
4. **`task-management`** (NEW) - Task creation, assignment, and tracking
5. **`disciplinary-tracking`** (NEW) - HR disciplinary matter management
6. **`feedback-community`** (NEW) - Pilot feedback and discussion system
7. **`pilot-registration`** (NEW) - Self-service registration with admin approval

### Database Changes

**New Tables** (8 total):

1. `pilot_registrations` - Registration approval queue
2. `flight_requests` - Flight request submissions
3. `tasks` - Task management
4. `disciplinary_actions` - Disciplinary matters
5. `disciplinary_actions_log` - Disciplinary action timeline
6. `feedback_posts` - Feedback posts
7. `feedback_comments` - Comments on posts
8. `audit_logs` - System-wide audit trail

**RLS Policies Required**:

- All new tables require Row Level Security policies
- Role-based access (Admin, Manager, Pilot)
- Pilots can only see their own data (except community feedback)

### Service Layer Changes

**New Services** (8 total):

1. `lib/services/pilot-registration-service.ts` - Registration CRUD
2. `lib/services/flight-request-service.ts` - Flight request CRUD
3. `lib/services/task-service.ts` - Task CRUD and assignment
4. `lib/services/disciplinary-service.ts` - Disciplinary tracking
5. `lib/services/feedback-service.ts` - Feedback posts and comments
6. `lib/services/audit-logging-service.ts` - Audit trail generation
7. `lib/services/pilot-notification-service.ts` - Notification system
8. `lib/services/pilot-auth-service.ts` - Pilot-specific authentication

**Modified Services**:

- `lib/services/pilot-portal-service.ts` - Extend for new dashboard data

### API Routes

**New Routes** (15+ endpoints):

**Pilot Portal Routes**:

- `app/api/pilot/auth/login/route.ts`
- `app/api/pilot/auth/register/route.ts`
- `app/api/pilot/certifications/route.ts`
- `app/api/pilot/leave/route.ts`
- `app/api/pilot/flight-requests/route.ts`
- `app/api/pilot/feedback/route.ts`
- `app/api/pilot/notifications/route.ts`

**Admin Routes**:

- `app/api/admin/pilot-registrations/route.ts`
- `app/api/admin/flight-requests/route.ts`
- `app/api/admin/tasks/route.ts`
- `app/api/admin/disciplinary/route.ts`
- `app/api/admin/feedback-moderation/route.ts`
- `app/api/admin/audit-logs/route.ts`

### UI Components

**New Pages** (20+ pages):

**Pilot Portal**:

- `app/pilot/login/page.tsx`
- `app/pilot/register/page.tsx`
- `app/pilot/dashboard/page.tsx`
- `app/pilot/certifications/page.tsx`
- `app/pilot/leave/page.tsx`
- `app/pilot/flight-requests/page.tsx`
- `app/pilot/profile/page.tsx`
- `app/pilot/feedback/page.tsx`

**Admin Dashboard**:

- `app/dashboard/flight-requests/page.tsx`
- `app/dashboard/tasks/page.tsx`
- `app/dashboard/disciplinary/page.tsx`
- `app/dashboard/audit/page.tsx`
- `app/dashboard/admin/pilot-registrations/page.tsx`
- `app/dashboard/admin/feedback-moderation/page.tsx`

**New Components** (30+ components):

- Pilot authentication forms
- Leave request submission calendar
- Flight request form and list
- Task Kanban board
- Task list view with filters
- Disciplinary matter form
- Feedback post editor
- Comment thread component
- Audit log table with filters
- Registration approval interface
- Notification dropdown
- Real-time presence indicators

### Authentication & Authorization

**Changes**:

- **Separate Pilot Portal Auth**: Pilots log in at `/pilot/login` (not `/auth/login`)
- **Role-Based Routing**: Middleware enforces `/pilot/*` = Pilot role, `/dashboard/*` = Admin/Manager
- **RLS Policies**: All new tables restrict access by role and user ID
- **Session Management**: Reuse existing Supabase Auth (no new auth system)

### Performance Considerations

**Expected Load**:

- **27 concurrent pilots** accessing portal
- **3 admins** managing approvals and tasks
- **Real-time updates** for notifications and presence

**Caching Strategy**:

- Use existing `cache-service.ts` with 5-minute TTL for dashboard metrics
- NetworkFirst strategy for API calls (existing PWA setup)
- Supabase Realtime for notifications (no polling)

**Optimizations**:

- Lazy load heavy components (Kanban board, audit log table)
- Pagination for feedback posts, audit logs, flight requests
- Index on `pilot_id`, `status`, `created_at` columns

### Testing Requirements

**E2E Tests** (Playwright):

- Pilot login and registration flow
- Leave request submission (roster period validation)
- Flight request submission and admin approval
- Task creation and Kanban board interaction
- Disciplinary matter creation and timeline
- Feedback posting and commenting
- Audit log filtering and export
- Registration approval workflow

**Minimum Coverage**: 70% on critical paths (per project constitution)

### Migration Strategy

**Phased Rollout**:

1. **Phase 1** (Priority 1 - Week 1-2):
   - Pilot Portal authentication and dashboard
   - Leave request submission (reuse existing approval logic)
   - Flight request system

2. **Phase 2** (Priority 2 - Week 3-4):
   - Audit logging (retroactive for existing data)
   - Task management (Kanban + List views)
   - Disciplinary tracking

3. **Phase 3** (Priority 3 - Week 5):
   - Feedback community
   - Pilot registration approval

**Rollback Plan**:

- All new tables are isolated (no foreign keys to existing tables except `pilots`)
- Can disable new routes via environment variable
- RLS policies prevent data access even if routes are active

## Risks & Mitigation

### Risk 1: Complexity of Pilot Portal Authentication

**Risk**: Separate pilot login may conflict with existing admin auth flow.
**Mitigation**: Use same Supabase Auth, but different routes and role checks. Middleware enforces routing based on role.

### Risk 2: Leave Eligibility Logic Conflicts

**Risk**: Pilot-submitted leave requests may not align with existing admin approval logic.
**Mitigation**: Reuse existing `leave-eligibility-service.ts` with rank-separated minimum crew requirements. No changes to business rules.

### Risk 3: Audit Logging Performance

**Risk**: Database triggers on all tables may slow down writes.
**Mitigation**: Use async triggers, index `audit_logs` table on `created_at`, `table_name`, `user_id`. Monitor performance during rollout.

### Risk 4: Real-time Presence Scalability

**Risk**: 27 concurrent pilots may overload Supabase Realtime.
**Mitigation**: Use Supabase Realtime Presence API (designed for this). Fallback to polling if needed. Limit to 100 concurrent connections (well within limits).

### Risk 5: Feedback Moderation Abuse

**Risk**: Pilots may post inappropriate content before moderation.
**Mitigation**: Admin moderation queue, soft delete (not hard delete), email alerts to admins on new posts. Rate limiting (1 post per hour per pilot).

## Dependencies

### External Dependencies

- **Supabase Realtime**: Required for notifications and presence indicators
- **No new packages**: Reuse existing TanStack Query, React Hook Form, Zod

### Internal Dependencies

- **Existing Services**: Reuse `pilot-service.ts`, `leave-eligibility-service.ts`, `roster-utils.ts`
- **Existing Components**: Reuse shadcn/ui components (Calendar, Dialog, Table, etc.)
- **Existing Auth**: Leverage Supabase Auth with role-based routing

## Success Criteria

1. **Pilot Portal**:
   - ✅ Pilots can log in at `/pilot/login` and view dashboard
   - ✅ Pilots can submit leave requests with roster period validation
   - ✅ Pilots can submit flight requests and see approval status

2. **Admin Workflows**:
   - ✅ Admins can approve/deny flight requests with comments
   - ✅ Admins can create and assign tasks (Kanban/List views)
   - ✅ Admins can track disciplinary matters with timeline

3. **Compliance**:
   - ✅ Audit log tracks all CREATE/UPDATE/DELETE operations
   - ✅ Audit log filterable by user, date, table, action
   - ✅ CSV export available for compliance reporting

4. **Community**:
   - ✅ Pilots can post feedback and comment on posts
   - ✅ Admins can moderate and remove inappropriate content

5. **Registration**:
   - ✅ Pilots can self-register at `/pilot/register`
   - ✅ Admins can approve/deny registrations
   - ✅ Approved pilots can log in immediately

6. **Testing**:
   - ✅ E2E tests cover all critical user flows
   - ✅ Minimum 70% test coverage on service layer

## Timeline Estimate

**Total Effort**: 4-5 weeks (single developer)

- **Phase 1** (Priority 1): 2 weeks - Pilot Portal, Flight Requests
- **Phase 2** (Priority 2): 2 weeks - Audit, Tasks, Disciplinary
- **Phase 3** (Priority 3): 1 week - Feedback, Registration

**Milestones**:

- Week 1: Database tables, services, RLS policies
- Week 2: Pilot Portal UI, leave/flight request forms
- Week 3: Admin flight request approval, task management
- Week 4: Audit logging, disciplinary tracking
- Week 5: Feedback community, registration approval, E2E tests

## Next Steps

1. ✅ Review and approve this proposal
2. Create spec delta files for each new capability
3. Validate OpenSpec structure with `openspec validate add-missing-core-features --strict`
4. Begin Phase 1 implementation (Pilot Portal)
5. Iterative rollout with testing after each phase

## References

- **Gap Analysis**: [MISSING_FEATURES_ANALYSIS.md](../../../MISSING_FEATURES_ANALYSIS.md)
- **Existing Inventory**: [EXISTING_INVENTORY.md](../../../EXISTING_INVENTORY.md)
- **Reference System**: [air-niugini-pms project](../../../../air-niugini-pms/)
- **Data Model**: [data-model.md](./data-model.md) (8 new tables)
- **Tasks**: [tasks.md](./tasks.md) (implementation checklist)
- **Design**: [design.md](./design.md) (technical architecture)

---

**Proposal Status**: Draft (Awaiting Approval)
**Approval Required**: Yes (Major feature addition)
**Breaking Changes**: No (additive only)
**Database Migrations Required**: Yes (8 new tables)
