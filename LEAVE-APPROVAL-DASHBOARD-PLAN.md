# Leave Request Approval Workflow Dashboard - Implementation Plan

**Created**: October 26, 2025
**Task**: Create a comprehensive leave request approval workflow dashboard
**Methodology**: APA (Analyze, Plan, Apply)

---

## Executive Summary

Build a **dedicated leave request approval workflow dashboard** for Admin/Manager users to efficiently review, approve, and deny leave requests with intelligent eligibility checking, bulk actions, and real-time crew availability tracking.

---

## 1. Analysis Summary

### Existing Infrastructure ✅

**Database**:
- `leave_requests` table with PENDING/APPROVED/DENIED statuses
- `pilots` table with rank and seniority data
- RLS policies for Admin/Manager access
- Audit logging enabled

**Services**:
- `leave-service.ts` - CRUD operations
- `leave-eligibility-service.ts` - Eligibility checking (rank-separated)
- `pilot-leave-service.ts` - Pilot-facing operations

**API Routes**:
- `/api/leave-requests` - Admin CRUD endpoints
- Leave approval/denial endpoints available

**Components**:
- `LeaveRequestsClient` - Existing filtering/grouping UI
- `LeaveReviewModal` - Review modal component
- `LeaveRequestGroup` - Grouped display component

**Business Rules Identified**:
1. Minimum crew: 10 Captains + 10 First Officers (rank-separated)
2. Seniority-based priority (lower number = higher priority)
3. Conflict detection (EXACT, PARTIAL, ADJACENT, NEARBY)
4. Late request flag (<21 days advance notice)
5. 28-day roster periods (RP1-RP13 annual cycle)

### Gaps to Address 🎯

1. **No dedicated approval dashboard** - Current page shows all requests mixed
2. **No crew availability dashboard** - No real-time view of crew status
3. **No bulk approval actions** - Must review one-by-one
4. **No eligibility visualization** - Eligibility alerts hidden until modal
5. **No approval history tracking** - Limited audit trail visibility
6. **No advanced filtering** - Only roster period filter exists
7. **No approval recommendations** - No AI/ML suggestions
8. **No conflict visualization** - Conflicts not highlighted upfront

---

## 2. Dashboard Architecture Design

### Page Structure

```
/dashboard/leave/approve
├── Header Section
│   ├── Page title + description
│   ├── Quick actions (Bulk Approve/Deny)
│   └── Real-time crew availability widget
│
├── Filter & Sort Section
│   ├── Status filter (Pending/Approved/Denied/All)
│   ├── Roster period filter
│   ├── Rank filter (Captain/First Officer/All)
│   ├── Leave type filter (RDO/SDO/ANNUAL/etc.)
│   ├── Conflict filter (Show conflicts only)
│   ├── Late request filter (Show late requests only)
│   └── Sort options (Seniority/Date/Priority)
│
├── Crew Availability Dashboard
│   ├── Captain availability (current + projected)
│   ├── First Officer availability (current + projected)
│   ├── Visual indicators (Safe/Warning/Critical)
│   └── Affected dates timeline
│
├── Approval Queue Section
│   ├── Priority queue (sorted by urgency)
│   ├── Eligibility alerts (conflicts, crew minimum violations)
│   ├── Request cards with inline actions
│   └── Bulk selection checkboxes
│
├── Approval History Section
│   ├── Recent approvals/denials
│   ├── Approval statistics
│   └── Audit trail access
│
└── Modal Components
    ├── Detailed review modal
    ├── Bulk approval confirmation
    ├── Conflict resolution wizard
    └── Override justification form
```

### Component Hierarchy

```typescript
ApproveLeaveRequestsPage (Server Component)
├── Data Fetching
│   ├── getAllLeaveRequests()
│   ├── getCrewAvailability()
│   └── getApprovalHistory()
│
└── ApprovalDashboardClient (Client Component)
    ├── FilterSection
    │   ├── StatusFilter
    │   ├── RosterPeriodFilter
    │   ├── RankFilter
    │   ├── LeaveTypeFilter
    │   └── AdvancedFilters
    │
    ├── CrewAvailabilityWidget
    │   ├── CrewMetrics (Captain/FO counts)
    │   ├── AvailabilityTimeline
    │   └── WarningIndicators
    │
    ├── ApprovalQueueSection
    │   ├── BulkActions (Select All/Approve/Deny)
    │   ├── PriorityQueue (sorted requests)
    │   └── ApprovalRequestCard[]
    │       ├── PilotInfo
    │       ├── LeaveDetails
    │       ├── EligibilityIndicators
    │       ├── ConflictWarnings
    │       └── QuickActions (Approve/Deny/Review)
    │
    ├── ApprovalHistorySection
    │   ├── RecentApprovals
    │   ├── ApprovalStats
    │   └── AuditTrailLink
    │
    └── Modals
        ├── DetailedReviewModal
        ├── BulkApprovalModal
        ├── ConflictResolutionModal
        └── OverrideJustificationModal
```

---

## 3. Data Model & Types

### New Types

```typescript
// types/leave-approval.ts

export interface CrewAvailability {
  date: string
  captainsAvailable: number
  firstOfficersAvailable: number
  captainsMinimum: number
  firstOfficersMinimum: number
  status: 'safe' | 'warning' | 'critical'
}

export interface LeaveRequestWithEligibility extends LeaveRequest {
  eligibilityStatus: 'eligible' | 'conflicts' | 'crew_minimum_violation' | 'late_request'
  conflicts: ConflictInfo[]
  affectsCrewMinimum: boolean
  recommendedAction: 'approve' | 'deny' | 'review' | null
  priorityScore: number
}

export interface ConflictInfo {
  type: 'EXACT' | 'PARTIAL' | 'ADJACENT' | 'NEARBY'
  conflictingRequest: LeaveRequest
  overlapDays: number
}

export interface ApprovalHistory {
  id: string
  requestId: string
  approvedBy: string
  approverName: string
  action: 'approved' | 'denied'
  timestamp: string
  justification?: string
}

export interface BulkApprovalRequest {
  requestIds: string[]
  action: 'approve' | 'deny'
  justification: string
}
```

### Extended Service Functions

```typescript
// lib/services/leave-approval-service.ts (NEW)

export async function getLeaveRequestsWithEligibility(
  filters?: {
    status?: LeaveStatus
    rosterPeriod?: string
    rank?: 'Captain' | 'First Officer'
    leaveType?: string
    conflictsOnly?: boolean
    lateRequestsOnly?: boolean
  }
): Promise<LeaveRequestWithEligibility[]>

export async function getCrewAvailabilityForecast(
  startDate: string,
  endDate: string
): Promise<CrewAvailability[]>

export async function bulkApproveLeaveRequests(
  requestIds: string[],
  approvedBy: string,
  justification: string
): Promise<{ success: number; failed: number; errors: string[] }>

export async function bulkDenyLeaveRequests(
  requestIds: string[],
  deniedBy: string,
  justification: string
): Promise<{ success: number; failed: number; errors: string[] }>

export async function getApprovalHistory(
  limit?: number
): Promise<ApprovalHistory[]>

export async function calculatePriorityScore(
  request: LeaveRequest
): Promise<number>
```

---

## 4. Implementation Checklist

### Phase 1: Core Infrastructure ⚙️

- [ ] Create `types/leave-approval.ts` with new types
- [ ] Create `lib/services/leave-approval-service.ts`
  - [ ] Implement `getLeaveRequestsWithEligibility()`
  - [ ] Implement `getCrewAvailabilityForecast()`
  - [ ] Implement `calculatePriorityScore()`
  - [ ] Implement `bulkApproveLeaveRequests()`
  - [ ] Implement `bulkDenyLeaveRequests()`
  - [ ] Implement `getApprovalHistory()`
- [ ] Create API route `/api/leave-requests/bulk-approve` (POST)
- [ ] Create API route `/api/leave-requests/bulk-deny` (POST)
- [ ] Create API route `/api/leave-requests/crew-availability` (GET)

### Phase 2: Page & Layout 📄

- [ ] Create `app/dashboard/leave/approve/page.tsx` (Server Component)
  - [ ] Fetch leave requests with eligibility
  - [ ] Fetch crew availability forecast
  - [ ] Fetch approval history
  - [ ] Pass data to client component
- [ ] Add navigation link in sidebar/header to approval dashboard

### Phase 3: Client Components 🎨

#### Main Dashboard Component
- [ ] Create `components/leave/approval-dashboard-client.tsx`
  - [ ] State management (filters, selected requests, modals)
  - [ ] Filter/sort logic
  - [ ] Bulk selection logic
  - [ ] Modal handlers

#### Filter Section
- [ ] Create `components/leave/approval-filters.tsx`
  - [ ] Status filter dropdown
  - [ ] Roster period filter
  - [ ] Rank filter
  - [ ] Leave type filter
  - [ ] Conflict filter toggle
  - [ ] Late request filter toggle
  - [ ] Sort options dropdown

#### Crew Availability Widget
- [ ] Create `components/leave/crew-availability-widget.tsx`
  - [ ] Captain availability metrics
  - [ ] First Officer availability metrics
  - [ ] Visual status indicators (green/yellow/red)
  - [ ] Availability timeline chart

#### Approval Queue
- [ ] Create `components/leave/approval-queue.tsx`
  - [ ] Bulk action toolbar
  - [ ] Priority-sorted request list
  - [ ] Eligibility badges

- [ ] Create `components/leave/approval-request-card.tsx`
  - [ ] Pilot info display
  - [ ] Leave details (dates, type, days)
  - [ ] Eligibility indicators
  - [ ] Conflict warnings
  - [ ] Quick action buttons (Approve/Deny/Review)
  - [ ] Selection checkbox

#### Approval History
- [ ] Create `components/leave/approval-history-section.tsx`
  - [ ] Recent approvals table
  - [ ] Approval statistics cards
  - [ ] Link to full audit trail

#### Modal Components
- [ ] Create `components/leave/bulk-approval-modal.tsx`
  - [ ] Confirmation dialog
  - [ ] Justification text area
  - [ ] Request summary list
  - [ ] Submit handler

- [ ] Create `components/leave/conflict-resolution-modal.tsx`
  - [ ] Conflict details display
  - [ ] Resolution options
  - [ ] Override justification
  - [ ] Submit handler

- [ ] Enhance `components/leave/leave-review-modal.tsx`
  - [ ] Add eligibility details section
  - [ ] Add conflict warnings
  - [ ] Add crew availability impact
  - [ ] Add override option

### Phase 4: Styling & UX ✨

- [ ] Apply Tailwind CSS styling consistent with existing dashboard
- [ ] Add loading states (Skeleton components)
- [ ] Add error states (Error messages)
- [ ] Add success toasts (Sonner)
- [ ] Add animations (Framer Motion for transitions)
- [ ] Ensure responsive design (mobile-first)
- [ ] Add keyboard shortcuts (bulk select with Shift+Click)

### Phase 5: Testing & Quality 🧪

- [ ] Create E2E test `e2e/leave-approval.spec.ts`
  - [ ] Test filtering functionality
  - [ ] Test approval workflow
  - [ ] Test bulk approval
  - [ ] Test conflict detection
  - [ ] Test crew availability widget
- [ ] Manual testing checklist
  - [ ] Approve single request
  - [ ] Deny single request
  - [ ] Bulk approve multiple requests
  - [ ] Bulk deny multiple requests
  - [ ] Filter by status/period/rank
  - [ ] Sort by different criteria
  - [ ] View crew availability
  - [ ] Review approval history
- [ ] Run `npm run validate` (type-check + lint + format)
- [ ] Performance testing (100+ requests)

### Phase 6: Documentation 📚

- [ ] Update CLAUDE.md with new approval dashboard info
- [ ] Add API documentation for new endpoints
- [ ] Create user guide for approval workflow
- [ ] Update database documentation
- [ ] Add Storybook stories for new components

---

## 5. Business Logic Implementation

### Priority Score Calculation

```typescript
function calculatePriorityScore(request: LeaveRequest): number {
  let score = 0

  // Seniority (lower number = higher priority)
  score += (100 - (request.pilots.seniority_number || 50)) * 2

  // Days until leave starts (urgency)
  const daysUntilStart = Math.ceil(
    (new Date(request.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntilStart <= 7) score += 50
  else if (daysUntilStart <= 14) score += 30
  else if (daysUntilStart <= 21) score += 10

  // Late request penalty
  if (request.is_late_request) score -= 20

  // Request type priority (SICK/COMPASSIONATE = higher)
  if (request.request_type === 'SICK' || request.request_type === 'COMPASSIONATE') {
    score += 30
  }

  // Has conflicts penalty
  if (request.conflicts && request.conflicts.length > 0) {
    score -= 10 * request.conflicts.length
  }

  return Math.max(0, score)
}
```

### Crew Availability Calculation

```typescript
async function calculateCrewAvailability(date: string): Promise<CrewAvailability> {
  // Get all active pilots by rank
  const captains = await getAllPilotsByRank('Captain')
  const firstOfficers = await getAllPilotsByRank('First Officer')

  // Get approved leave requests for this date
  const approvedLeave = await getApprovedLeaveForDate(date)

  // Calculate available crew
  const captainsAvailable = captains.length - approvedLeave.filter(
    req => req.pilots.rank === 'Captain'
  ).length

  const firstOfficersAvailable = firstOfficers.length - approvedLeave.filter(
    req => req.pilots.rank === 'First Officer'
  ).length

  // Determine status
  const MINIMUM_CREW = 10
  let status: 'safe' | 'warning' | 'critical' = 'safe'

  if (captainsAvailable < MINIMUM_CREW || firstOfficersAvailable < MINIMUM_CREW) {
    status = 'critical'
  } else if (captainsAvailable <= MINIMUM_CREW + 2 || firstOfficersAvailable <= MINIMUM_CREW + 2) {
    status = 'warning'
  }

  return {
    date,
    captainsAvailable,
    firstOfficersAvailable,
    captainsMinimum: MINIMUM_CREW,
    firstOfficersMinimum: MINIMUM_CREW,
    status
  }
}
```

---

## 6. UI/UX Design Principles

### Visual Hierarchy

1. **Critical Items** → Red badge + top of queue
2. **Warning Items** → Yellow badge + high priority
3. **Safe Items** → Green badge + normal queue
4. **Historical** → Muted colors + collapsed by default

### Color Coding

- 🔴 **Critical**: Crew minimum violations, expired deadlines
- 🟡 **Warning**: Conflicts, late requests, close to crew minimum
- 🟢 **Safe**: Eligible for approval, no conflicts
- 🔵 **Info**: Historical data, statistics

### Interaction Patterns

- **Single-click** → Select request
- **Double-click** → Open detailed review modal
- **Shift+Click** → Multi-select range
- **Ctrl/Cmd+Click** → Add to selection
- **Hover** → Show quick preview tooltip
- **Keyboard shortcuts**:
  - `A` → Approve selected
  - `D` → Deny selected
  - `R` → Review selected
  - `Esc` → Clear selection

---

## 7. Performance Optimization

### Data Loading Strategy

1. **Server-side rendering** → Initial page load with SSR
2. **Client-side filtering** → Instant filter updates
3. **Optimistic updates** → Immediate UI feedback
4. **Background sync** → Refresh data every 30 seconds
5. **Virtualization** → Render only visible requests (if >50 items)

### Caching Strategy

```typescript
// Cache crew availability for 5 minutes
const CACHE_KEY = 'crew_availability'
const CACHE_TTL = 300 // 5 minutes

// Cache approval queue for 1 minute
const QUEUE_CACHE_KEY = 'approval_queue'
const QUEUE_CACHE_TTL = 60 // 1 minute
```

---

## 8. Security Considerations

### Authorization

- **Admin/Manager only** → RLS policies enforce access
- **Audit logging** → All approvals/denials logged with user ID
- **Override tracking** → Crew minimum overrides require justification
- **CSRF protection** → Next.js built-in CSRF tokens

### Data Validation

```typescript
// Validate bulk approval request
const BulkApprovalSchema = z.object({
  requestIds: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'deny']),
  justification: z.string().min(10).max(500)
})
```

---

## 9. Success Metrics

### Key Performance Indicators

1. **Approval Speed** → Average time to approve/deny request
2. **Bulk Usage** → % of approvals done via bulk actions
3. **Conflict Resolution** → % of conflicts resolved without escalation
4. **Crew Compliance** → % of time crew minimum maintained
5. **User Satisfaction** → Admin/Manager feedback scores

### Monitoring

- Track approval times via audit logs
- Monitor crew availability violations
- Alert on critical crew shortages
- Dashboard analytics for approval patterns

---

## 10. Future Enhancements

### Phase 2 Features (Future)

1. **AI-powered recommendations** → ML model suggests approve/deny
2. **Calendar integration** → Sync with Google Calendar/Outlook
3. **Mobile app** → Approve requests on-the-go
4. **Notification system** → Real-time alerts for critical requests
5. **Advanced analytics** → Trend analysis, prediction models
6. **Automated workflows** → Auto-approve low-risk requests
7. **Integration with rostering** → Check against flight schedules

---

## 11. Risk Assessment

### Potential Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Crew minimum violation | HIGH | Real-time validation, override justification required |
| Concurrent approvals | MEDIUM | Optimistic locking, database constraints |
| Performance with large datasets | MEDIUM | Pagination, virtualization, caching |
| Complex conflict resolution | MEDIUM | Clear UI/UX, wizard-based resolution |
| User error (wrong approval) | LOW | Confirmation dialogs, undo functionality |

---

## 12. Timeline Estimate

### Development Timeline (Conservative)

- **Phase 1: Infrastructure** → 4 hours
- **Phase 2: Page & Layout** → 2 hours
- **Phase 3: Components** → 8 hours
- **Phase 4: Styling & UX** → 4 hours
- **Phase 5: Testing** → 3 hours
- **Phase 6: Documentation** → 1 hour

**Total**: ~22 hours (3 days at 8 hours/day)

### Optimized Timeline (Aggressive)

- **Phase 1-2**: 3 hours
- **Phase 3**: 5 hours
- **Phase 4-5**: 4 hours
- **Phase 6**: 1 hour

**Total**: ~13 hours (1.5 days at 8 hours/day)

---

## 13. Implementation Priority

### Must-Have (MVP) ✅

1. ✅ Dedicated approval dashboard page
2. ✅ Filter by status/period/rank
3. ✅ Crew availability widget
4. ✅ Single approval/denial workflow
5. ✅ Eligibility indicators
6. ✅ Conflict warnings
7. ✅ Audit trail

### Should-Have (v1.1) 🎯

1. Bulk approval actions
2. Priority queue sorting
3. Advanced filtering
4. Approval history section
5. Conflict resolution wizard

### Nice-to-Have (v1.2) 💡

1. Real-time notifications
2. Keyboard shortcuts
3. Approval recommendations
4. Export functionality
5. Advanced analytics

---

## 14. Conclusion

This implementation plan provides a **comprehensive, production-ready** leave request approval workflow dashboard that:

✅ **Maintains crew minimums** through intelligent eligibility checking
✅ **Streamlines approvals** with bulk actions and priority queuing
✅ **Prevents conflicts** with real-time crew availability tracking
✅ **Ensures compliance** with complete audit trails
✅ **Scales efficiently** with performance optimizations
✅ **Follows best practices** matching existing codebase patterns

The dashboard will transform the leave approval process from manual, error-prone reviews into an **efficient, data-driven workflow** that ensures flight operations continuity while respecting pilot seniority and leave entitlements.

---

**Next Step**: Begin Phase 1 implementation (Core Infrastructure)
**Estimated Completion**: 1.5-3 days depending on complexity level chosen
**Quality Gate**: Must pass all tests and validation before deployment
