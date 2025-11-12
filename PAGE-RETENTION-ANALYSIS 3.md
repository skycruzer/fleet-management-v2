# Page Retention Analysis - Leave Management System

**Author**: Maurice Rondeau (via Claude Code)
**Date**: November 12, 2025
**Decision**: KEEP all three pages - each serves distinct purpose

---

## Executive Summary

After analyzing the unified Pilot Requests page alongside the existing Leave Approve and Leave Bid Review pages, **recommendation is to KEEP all three pages**. Each serves a fundamentally different purpose and user workflow.

---

## Page Comparison Matrix

| Feature | Pilot Requests | Leave Approve | Leave Bid Review |
|---------|----------------|---------------|------------------|
| **Purpose** | Comprehensive management & reporting | Fast approval workflow | Annual preference allocation |
| **Data Source** | `pilot_requests` table | `pilot_requests` (filtered) | `leave_bids` + `leave_bid_options` |
| **Primary User** | Admin/Manager (broad view) | Manager (action-focused) | Admin (planning-focused) |
| **Scope** | All categories (Leave/Flight/Bids) | Leave requests only | Annual leave preferences only |
| **Status Filter** | All statuses | PENDING/IN_REVIEW only | PENDING/APPROVED/REJECTED |
| **Workflow** | View, filter, bulk actions | Rapid approve/deny decisions | Batch allocation by seniority |
| **Key Features** | • 3 tabs (Leave/Flight/Bids)<br>• Multi-roster period view<br>• Advanced filtering<br>• Reporting | • Eligibility alerts<br>• Conflict warnings<br>• Crew impact display<br>• Inline approve/deny | • Priority-ranked choices<br>• Calendar visualization<br>• Seniority-based allocation<br>• PDF export |
| **UI Style** | Data table with filtering | Action-oriented cards | Table + Calendar toggle |
| **Implementation** | ✅ Complete | ⚠️ Placeholder (needs work) | ✅ Complete |

---

## Detailed Analysis

### 1. Pilot Requests Page (`/dashboard/requests`)

**Route**: `/dashboard/requests`
**Status**: ✅ Fully Implemented

**Purpose**: Unified management hub for ALL pilot requests

**Key Features**:
- Three-tab interface:
  - **Leave Requests** tab - RDO, SDO, Annual, Sick, LSL, etc.
  - **Flight Requests** tab - Training flights, check rides, simulator
  - **Leave Bids** tab - Annual leave preferences (read-only view)
- Advanced filtering:
  - By roster period (RP1-RP13)
  - By pilot
  - By status (Draft, Submitted, Approved, Denied, etc.)
  - By submission channel (Email, Phone, Portal, Walk-in)
  - By flags (Late, Past Deadline, Conflicts)
- Quick Entry Form for manual submissions
- Bulk operations (approve/deny multiple)
- Conflict detection badges
- Comprehensive reporting view

**Use Case**:
> "I need to see ALL leave requests for RP12/2025 to generate a report for the operations meeting."

> "Show me all flight requests submitted via email that are still pending."

**User Journey**:
1. Admin logs in
2. Navigates to Pilot Requests
3. Selects appropriate tab (Leave/Flight/Bids)
4. Applies filters to find specific requests
5. Reviews bulk data, exports reports, or performs bulk actions

**Strengths**:
- ✅ Comprehensive view across all categories
- ✅ Powerful filtering and reporting
- ✅ Conflict detection integrated
- ✅ Handles multi-channel submissions

**Why Not Sufficient Alone**:
- ❌ Too much data for quick approval workflow
- ❌ Not optimized for decision-making (shows all statuses)
- ❌ Doesn't highlight eligibility alerts prominently
- ❌ Focused on data management, not action-taking

---

### 2. Leave Approve Page (`/dashboard/leave/approve`)

**Route**: `/dashboard/leave/approve`
**Status**: ⚠️ Placeholder (needs implementation)

**Purpose**: Specialized workflow for rapid approval decisions

**Key Features** (to be implemented):
- Shows ONLY pending leave requests requiring action
- Filters: `workflow_status IN ('SUBMITTED', 'IN_REVIEW')` AND `request_category = 'LEAVE'`
- Eligibility alerts prominently displayed:
  - 🔴 **Critical**: Would drop crew below minimum (10 per rank)
  - 🟡 **Warning**: Conflicts with another pilot's approved leave
  - 🔵 **Info**: Multiple pilots requesting same dates
- Crew availability impact preview:
  ```
  Captains: 12 available → 11 available (✅ Above minimum)
  First Officers: 15 available → 15 available (✅ No impact)
  ```
- Inline approve/deny buttons with confirmation
- Quick "Approve All Eligible" action
- Sort by:
  - Priority (late requests first)
  - Seniority (senior pilots first)
  - Submission date (oldest first)

**Use Case**:
> "I have 10 minutes before the ops meeting to approve today's pending leave requests."

> "Show me only the requests that need my approval RIGHT NOW, and highlight any crew availability issues."

**User Journey**:
1. Manager logs in
2. Navigates to Leave Approve
3. Sees only pending requests (clean, focused view)
4. Reviews eligibility alerts for each request
5. Makes rapid approve/deny decisions
6. Moves on to other tasks

**Strengths**:
- ✅ Focused workflow (no distractions)
- ✅ Eligibility alerts prominently displayed
- ✅ Optimized for quick decisions
- ✅ Shows only actionable items

**Why Different from Pilot Requests**:
- Pilot Requests = **Management view** (all statuses, reporting, filtering)
- Leave Approve = **Action view** (pending only, fast approval)

**Implementation Required**:
```typescript
// pages/dashboard/leave/approve/page.tsx
// Fetch ONLY pending leave requests
const { data: pendingRequests } = await supabase
  .from('pilot_requests')
  .select(`
    *,
    pilots (first_name, last_name, seniority_number)
  `)
  .eq('request_category', 'LEAVE')
  .in('workflow_status', ['SUBMITTED', 'IN_REVIEW'])
  .order('is_late_request', { ascending: false }) // Late requests first
  .order('created_at', { ascending: true })

// Display with eligibility alerts and inline actions
```

---

### 3. Leave Bid Review Page (`/dashboard/admin/leave-bids`)

**Route**: `/dashboard/admin/leave-bids`
**Status**: ✅ Fully Implemented

**Purpose**: Annual leave preference allocation and planning

**Key Features**:
- **Different data model**: Uses `leave_bids` + `leave_bid_options` tables
- Priority-ranked preferences:
  - Pilots submit up to 10 preferred leave periods
  - Ranked 1-10 by priority (1 = most preferred)
- Two visualization modes:
  - **Table View**: List of all bids with pilot info, status, priority choices
  - **Calendar View**: Annual calendar showing all pilot preferences overlaid
- Statistics dashboard:
  - Pending Review count
  - Approved count
  - Rejected count
- Seniority-based allocation:
  - Admin processes bids in batch
  - Higher seniority pilots get priority on conflicting dates
  - Operational requirements considered
- PDF export for planning meetings
- Batch operations:
  - Approve multiple bids at once
  - Reject bids that conflict with operational needs

**Use Case**:
> "It's October, time to allocate annual leave for next year. I need to review all pilot preferences and assign leave based on seniority and crew requirements."

> "Show me a calendar view of all pilots who want leave during Christmas week, so I can decide who gets approved based on seniority."

**User Journey**:
1. Admin logs in during annual planning period (October/November)
2. Navigates to Leave Bid Review
3. Reviews statistics (how many bids submitted)
4. Switches to Calendar View to see overlapping preferences
5. Identifies conflicts (e.g., 8 pilots want Christmas week)
6. Allocates leave based on seniority + operational needs
7. Batch approves/rejects bids
8. Exports PDF for management review

**Strengths**:
- ✅ Specialized for annual planning workflow
- ✅ Different data model (not pilot_requests)
- ✅ Calendar visualization for conflict identification
- ✅ Priority ranking system
- ✅ Batch processing capability

**Why Different from Pilot Requests**:
- Pilot Requests = Individual time-off requests (submitted as needed)
- Leave Bids = Annual preference submissions (once per year, batch processed)

**Data Model Difference**:
```
pilot_requests table:
- Single request per row
- start_date, end_date
- Immediate workflow (Submit → Review → Approve/Deny)

leave_bids table + leave_bid_options:
- One bid per pilot per year
- Multiple date options (up to 10) with priority ranking
- Batch workflow (Collect all → Process together → Allocate based on seniority)
```

---

## Workflow Comparison

### Scenario: Manager's Daily Routine

**Monday Morning - Approving Pending Requests**:
1. ✅ **Uses**: Leave Approve page
2. **Why**: Sees only what needs action today
3. **Actions**: Approve/deny 5-10 pending requests in 5 minutes

**Mid-Week - Reviewing Submissions for Upcoming Roster**:
1. ✅ **Uses**: Pilot Requests page
2. **Why**: Needs filtered view of RP13/2025 requests to prepare report
3. **Actions**: Export filtered data, analyze submission channels, review conflicts

**Annual Planning - October/November**:
1. ✅ **Uses**: Leave Bid Review page
2. **Why**: Processing annual leave preferences for next year
3. **Actions**: Review calendar conflicts, allocate by seniority, batch approve

---

## Recommendation: KEEP All Three Pages

### Summary

| Page | Keep/Remove | Rationale |
|------|-------------|-----------|
| **Pilot Requests** | ✅ **KEEP** | Comprehensive management and reporting hub |
| **Leave Approve** | ✅ **KEEP** | Specialized approval workflow (needs implementation) |
| **Leave Bid Review** | ✅ **KEEP** | Annual planning (different data model, fully implemented) |

---

## Navigation Structure

**Requests Section** (in sidebar):
```
Requests
├── 🆕 Pilot Requests         → Unified management hub
│   └── Tabs: Leave | Flight | Bids
│
├── ✅ Leave Approve          → Fast approval workflow (pending only)
│
├── 📅 Leave Calendar         → Visual calendar view
│
└── 🎯 Leave Bid Review       → Annual preference allocation
```

**User Mental Model**:
- "I need to manage all requests" → **Pilot Requests**
- "I need to approve today's pending requests" → **Leave Approve**
- "I need to plan annual leave allocation" → **Leave Bid Review**

---

## Next Steps

### Immediate Action Required
1. **Implement Leave Approve page** (`/dashboard/leave/approve`)
   - Replace placeholder with functional approval workflow
   - Query `pilot_requests` for pending leave requests only
   - Display eligibility alerts and crew impact
   - Add inline approve/deny actions

### Future Enhancements
2. **Link pages together**:
   - Add "View in Pilot Requests" link from Leave Approve
   - Add "Approve Pending" button in Pilot Requests → redirects to Leave Approve
   - Add "View Historical Bids" link from Leave Bid Review to Pilot Requests Bids tab

3. **Unified conflict detection**:
   - Ensure conflict detection works in Leave Approve workflow
   - Display conflict badges consistently across all pages

---

## Conclusion

Each page serves a **distinct user need** and **workflow context**:

1. **Pilot Requests** = Data management & reporting (broad scope)
2. **Leave Approve** = Action-taking (narrow scope, decision-focused)
3. **Leave Bid Review** = Annual planning (different data model, batch processing)

**Removing any page would degrade the user experience** by forcing users to perform specialized tasks in a general-purpose interface.

**Recommendation**: **KEEP all three pages** and implement Leave Approve page to complete the workflow suite.

---

**Date**: November 12, 2025
**Status**: Analysis Complete
**Next Action**: Implement Leave Approve page functional workflow
