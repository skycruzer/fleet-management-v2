# Fleet Management V2: Leave Approval System Analysis

## Executive Summary

The Fleet Management V2 system has a comprehensive leave approval system based on crew availability and seniority-based prioritization. The system is designed to maintain minimum crew requirements (10 Captains and 10 First Officers) while processing leave requests. The system includes two parallel services: `leave-approval-service.ts` (for dashboard/approval workflows) and `leave-eligibility-service.ts` (for detailed eligibility checking).

---

## 1. DATA STRUCTURES & TABLES

### 1.1 Leave Requests Table (`leave_requests`)

**Columns:**
- `id` (UUID, Primary Key)
- `pilot_id` (UUID, Foreign Key → pilots)
- `request_type` (TEXT) - RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE
- `roster_period` (TEXT) - RP1/2025, RP2/2025, etc. (28-day cycles)
- `start_date` (DATE) - Leave start date
- `end_date` (DATE) - Leave end date
- `days_count` (INTEGER) - Calculated days of leave (inclusive)
- `status` (TEXT) - PENDING, APPROVED, DENIED
- `request_date` (DATE) - When the request was submitted
- `request_method` (TEXT) - EMAIL, ORACLE, LEAVE_BIDS, SYSTEM
- `reason` (TEXT) - Optional reason for leave
- `is_late_request` (BOOLEAN) - Flag for requests with < 21 days advance notice
- `reviewed_by` (UUID, Foreign Key → an_users)
- `reviewed_at` (TIMESTAMPTZ)
- `review_comments` (TEXT) - Approval/denial comments
- `review_notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- Unique constraint: `leave_requests_pilot_dates_unique` - prevents duplicate requests for same pilot/dates

### 1.2 Pilots Table (Relevant Fields)

**Relevant Columns for Leave System:**
- `id` (UUID, Primary Key)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `middle_name` (TEXT, Optional)
- `employee_id` (TEXT) - Unique identifier
- `role` (ENUM) - 'Captain' or 'First Officer'
- `seniority_number` (INTEGER, 1-27) - Lower number = higher priority
- `commencement_date` (DATE) - Used to calculate seniority
- `is_active` (BOOLEAN) - Active status
- `user_id` (UUID, Foreign Key → an_users) - Portal user association

### 1.3 Pilot Relationships

```
leave_requests → pilots (pilot_id)
leave_requests → an_users (reviewed_by) - reviewer info
pilots → an_users (user_id) - pilot user account
```

---

## 2. CURRENT PRIORITY SCORING LOGIC

### 2.1 Leave Approval Service Priority Score (`calculatePriorityScore`)

**Source:** `/lib/services/leave-approval-service.ts` (lines 33-64)

**Score Components:**

1. **Seniority Factor** (0-198 points)
   - Formula: `(100 - seniority_number) * 2`
   - Pilots 1-27: Senior pilot #1 gets 198 points, junior pilot #27 gets 46 points
   - Maximizes for senior pilots

2. **Urgency Factor** (0-50 points)
   - ≤ 7 days until leave: +50 points (very urgent)
   - 8-14 days: +30 points (urgent)
   - 15-21 days: +10 points (moderate)
   - > 21 days: +0 points

3. **Late Request Penalty** (-20 points)
   - Requests marked as `is_late_request = true`

4. **Request Type Priority** (+0 or +30 points)
   - SICK or COMPASSIONATE: +30 points
   - Other types (RDO, SDO, ANNUAL, LSL, LWOP, MATERNITY): +0 points

5. **Pending Status Bonus** (+20 points)
   - Only if `status = 'PENDING'`

**Total Score Range:** 0 to ~298 points
**Higher score = higher priority for approval**

### 2.2 Score Used For

- Sorting leave requests in approval dashboard
- Determining which pilots get priority when crew shortage exists
- Breaking ties between pilots of same seniority

---

## 3. CREW AVAILABILITY CALCULATION METHODS

### 3.1 Basic Crew Availability (Leave Approval Service)

**Function:** `calculateCrewAvailabilityForDate` (lines 322-382)

**Calculation Logic:**
```
For each date:
  totalCaptains = COUNT(pilots WHERE role='Captain' AND is_active=true)
  totalFirstOfficers = COUNT(pilots WHERE role='First Officer' AND is_active=true)
  
  captainsOnLeave = COUNT(
    leave_requests 
    WHERE status='APPROVED' 
    AND pilots.role='Captain' 
    AND date BETWEEN start_date AND end_date
  )
  
  firstOfficersOnLeave = COUNT(
    leave_requests 
    WHERE status='APPROVED' 
    AND pilots.role='First Officer' 
    AND date BETWEEN start_date AND end_date
  )
  
  captainsAvailable = totalCaptains - captainsOnLeave
  firstOfficersAvailable = totalFirstOfficers - firstOfficersOnLeave
```

**Status Determination:**
- `CRITICAL`: Available crew < 10 (minimum)
- `WARNING`: Available crew ≤ 12 (minimum + 2)
- `SAFE`: Available crew > 12

### 3.2 Minimum Crew Requirements

**Current Hardcoded:** 10 Captains AND 10 First Officers (simultaneously)

**Rationale:** 2 aircraft × 5 crew per hull = 10 minimum per rank

### 3.3 Crew Minimum Violation Check (`checkCrewMinimumViolation`)

**Function:** `checkCrewMinimumViolation` (lines 166-218)

**Logic:**
```
For a new request:
  1. Count active pilots by rank
  2. Count APPROVED leave requests overlapping with this request's dates
  3. Calculate: availableAfterApproval = total - alreadyOnLeave - 1 (new request)
  4. VIOLATION if: availableAfterApproval < 10 for ANY rank
```

**Result:** Boolean - true if approval would violate minimum

---

## 4. LEAVE BALANCE TRACKING

### 4.1 Current State: NO FORMAL LEAVE BALANCE SYSTEM

**Status:** Leave balance/entitlement tracking is NOT implemented

**What exists:**
- `days_count` field tracks days taken in a request (calculated from start/end dates)
- Historical tracking through approved leave requests
- No per-pilot entitlement tables
- No accrual/carry-over logic

**What's missing:**
- `pilot_leave_entitlements` or `pilot_leave_balances` table
- Annual entitlement allocation (e.g., 30 days/year)
- Carryover rules (e.g., 5 days max carryover)
- Leave type breakdowns (Annual vs Sick vs LSL, etc.)
- Leave accrual schedules

### 4.2 Leave Balance Calculation (If Needed)

**Pseudo-logic for future implementation:**
```
annual_entitlement = 30 days (configurable)
prior_balance = last_year_carryover (max 5 days)
ytd_approved = SUM(days_count) WHERE status='APPROVED' AND YEAR(start_date)=current_year
ytd_pending = SUM(days_count) WHERE status='PENDING' AND YEAR(start_date)=current_year

available_balance = annual_entitlement + prior_balance - ytd_approved
pending_balance = ytd_pending
remaining_balance = available_balance - pending_balance
```

---

## 5. DATE AVAILABILITY CHECKING LOGIC

### 5.1 Conflict Detection (`detectConflictType`)

**Function:** `detectConflictType` (lines 69-103)

**Conflict Types:**

| Type | Condition | Example |
|------|-----------|---------|
| **EXACT** | Same start and end dates | Request 1: Oct 1-10, Request 2: Oct 1-10 |
| **PARTIAL** | Overlapping dates | Request 1: Oct 1-10, Request 2: Oct 5-15 |
| **ADJACENT** | Within 1 day gap | Request 1: Oct 1-10, Request 2: Oct 11-20 |
| **NEARBY** | Within 7 days gap | Request 1: Oct 1-10, Request 2: Oct 15-20 |
| **NONE** | No conflict | Request 1: Oct 1-10, Request 2: Oct 25-30 |

### 5.2 Overlap Days Calculation

**Function:** `calculateOverlapDays` (lines 108-120)

```
overlapStart = MAX(request1.start, request2.start)
overlapEnd = MIN(request1.end, request2.end)

if overlapStart > overlapEnd:
  overlapDays = 0
else:
  overlapDays = ceil((overlapEnd - overlapStart) / 86400000ms) + 1
```

### 5.3 Finding Conflicts

**Function:** `findConflicts` (lines 125-161)

**Logic:**
1. Gets all requests from SAME RANK (Captain vs Captain, FO vs FO)
2. Excludes DENIED requests
3. Excludes the current request
4. Detects conflict type and overlap days
5. Returns list of `ConflictInfo` objects

**Critical Business Rule:** Only pilots of the SAME RANK can conflict

---

## 6. ELIGIBILITY STATUS DETERMINATION

### 6.1 Eligibility Status Types

**Source:** `types/leave-approval.ts` (lines 40-45)

```typescript
type EligibilityStatus =
  | 'eligible'              // Can approve immediately
  | 'conflicts'             // Has date conflicts with other requests
  | 'crew_minimum_violation'// Would violate minimum crew requirements
  | 'late_request'          // Less than 21 days advance notice
  | 'review_required'       // Needs manual review
```

### 6.2 Status Determination Logic (`determineEligibilityStatus`)

**Function:** `determineEligibilityStatus` (lines 223-233)

```
1. IF crew_minimum_violation → 'crew_minimum_violation'
2. ELSE IF conflicts.length > 0 → 'conflicts'
3. ELSE IF is_late_request → 'late_request'
4. ELSE IF conflicts.length == 0 && !crew_minimum_violation → 'eligible'
5. ELSE → 'review_required'
```

### 6.3 Recommended Action Mapping

**Function:** `determineRecommendedAction` (lines 238-251)

| Eligibility Status | Recommended Action | Reasoning |
|---|---|---|
| `eligible` | `approve` | No issues, can auto-approve |
| `crew_minimum_violation` | `deny` | Must deny to maintain operations |
| `conflicts` | `review` | Manager must decide based on seniority |
| `late_request` | `review` | Late requests need human review |
| `review_required` | `review` | Unknown issue, needs review |

---

## 7. LEAVE ELIGIBILITY SERVICE (Advanced)

### 7.1 Comprehensive Eligibility Check

**Function:** `checkLeaveEligibility` (lines 632-930)

**Returns:** `LeaveEligibilityCheck` object with:

```typescript
interface LeaveEligibilityCheck {
  isEligible: boolean
  conflicts: LeaveConflict[]                    // Days violating minimums
  affectedDates: string[]                       // Specific dates affected
  recommendation: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED'
  reasons: string[]                             // Human-readable explanations
  alternativePilots: PilotRecommendation[]     // Senior pilots who can cover
  crewImpact: CrewAvailability[]               // Day-by-day crew impact
  conflictingRequests?: ConflictingRequest[]   // Other pending requests for same dates
  seniorityRecommendation?: string             // Seniority-based advice
}
```

### 7.2 Crew Availability Impact Analysis

**Calculated For:** Each day in the leave date range

**Per Day:**
- Current available Captains (after approved leaves)
- Current available First Officers (after approved leaves)
- Projected available if this request approved
- Whether minimum requirements are met
- Shortfall amounts (negative if below minimum)

### 7.3 Conflicting Pending Requests Analysis

**Function:** `getConflictingPendingRequests` (lines 300-496)

**Finds:**
- All PENDING leave requests for same rank with overlapping/nearby dates
- Calculates overlap type (EXACT, PARTIAL, ADJACENT, NEARBY)
- Compares seniority
- Generates spreading suggestions

**Output:** List of `ConflictingRequest` objects with:
- Pilot name and employee ID
- Seniority comparison vs current pilot
- Recommended dates to spread out requests
- Priority indicators

### 7.4 Alternative Pilot Recommendations

**Function:** `getAlternativePilotRecommendations` (lines 940-1014)

**Returns:** Ranked list of same-rank pilots who:
- Are more senior (lower seniority_number)
- Have no leave during requested period
- Can potentially cover

**Sorted by:** Seniority (most senior first)

---

## 8. BULK OPERATIONS

### 8.1 Bulk Approve (`bulkApproveLeaveRequests`)

**Function:** Lines 468-526

**Operation:**
1. Takes array of request IDs
2. For each request:
   - Updates status to 'APPROVED'
   - Sets reviewed_by, reviewed_at, review_comments
   - Creates audit log entry
3. Returns success/failure counts and error list

**Limitations:**
- No validation of crew minimums for bulk operations
- No conflict checking
- No automatic denial if collectively would violate minimums

### 8.2 Bulk Deny (`bulkDenyLeaveRequests`)

**Function:** Lines 531-589

**Operation:** Similar to bulk approve but sets status to 'DENIED'

---

## 9. APPROVAL HISTORY & AUDIT

### 9.1 Approval History (`getApprovalHistory`)

**Function:** Lines 594-621

**Retrieves:**
- All reviewed (APPROVED or DENIED) leave requests
- Reviewer information (name, ID)
- Approval/denial timestamp
- Justification comments
- Returns up to 50 most recent

**Sorted:** By timestamp (newest first)

### 9.2 Audit Logging

**Integration:** `createAuditLog` from audit-service

**Logs:**
- All CREATE, UPDATE, DELETE operations on leave_requests
- Bulk approvals/denials
- Includes description with context

---

## 10. CURRENT GAPS & LIMITATIONS

### 10.1 No Leave Balance System
- No entitlement tracking
- No carryover management
- No leave type-specific allocations

### 10.2 Limited Conflict Prevention
- No blocking of conflicting requests
- No automatic spreading suggestions at creation time
- Conflicts detected during approval review only

### 10.3 Bulk Operation Weaknesses
- No collective impact analysis
- No verification that bulk approvals maintain crew minimums
- Could approve conflicting requests together

### 10.4 Missing Data for Recommendations
- No leave history/patterns
- No pilot preferences
- No rostering requirements beyond crew minimum
- No cost/efficiency factors

### 10.5 No Predictive Analytics
- No forecasting of future crew availability
- No anticipation of certification expirations during leave
- No roster period conflict detection

---

## 11. DATA AVAILABLE FOR RECOMMENDATION ENGINE

### 11.1 Pilot Data
```
- ID, name, employee_id
- Role (Captain/First Officer)
- Seniority number (1-27)
- Commencement date
- Active/inactive status
- User associations
- Captain qualifications (JSONB)
```

### 11.2 Leave Request Data
```
- ID, pilot_id, dates (start/end)
- Request type (SICK, ANNUAL, etc.)
- Status (PENDING, APPROVED, DENIED)
- Request date (submission time)
- Roster period
- Late request flag
- Is_active status
- Review comments
- Reviewer info
- Days count
```

### 11.3 Historical Data Available
```
- All past leave requests (APPROVED/DENIED) with dates
- All approval/denial decisions with timestamps
- Audit trail of all changes
- Request methods (EMAIL, ORACLE, LEAVE_BIDS, SYSTEM)
- Request reasons (free text)
```

### 11.4 Calculated Data Available
```
- Total active pilots by rank
- Current crew availability per date
- Approved leave for any date range
- Pending leave requests for any date range
- Crew shortfall/surplus calculations
- Seniority comparisons
- Overlap calculations
```

---

## 12. BUSINESS RULES SUMMARY

### Critical Rules (Must Maintain)

1. **Minimum Crew Requirement:** Always maintain ≥10 Captains AND ≥10 First Officers
2. **Rank Separation:** Captains and First Officers evaluated independently
3. **Seniority Priority:** Within same rank, lower seniority_number = higher priority
4. **Request Order:** For same seniority, earlier submission = higher priority
5. **Approved Leaves Lock:** APPROVED leave requests cannot be changed without explicit action

### System Constraints

1. Roster periods: 28-day cycles, RP1-RP13 annual
2. Unique constraint: One request per pilot per date range
3. Late request threshold: < 21 days advance notice
4. Concurrent request types not explicitly limited (but managed via seniority)

---

## 13. RECOMMENDATION ENGINE DATA SCHEMA

**Required Input:**
```
{
  requestId: string
  pilotId: string
  startDate: string (ISO)
  endDate: string (ISO)
  requestType: string (SICK, ANNUAL, etc.)
  submissionDate: string (ISO)
  pilotRole: 'Captain' | 'First Officer'
  pilotSeniority: number (1-27)
}
```

**Available Context:**
```
{
  allPendingRequests: LeaveRequest[]
  allApprovedLeave: LeaveRequest[]
  allPilots: Pilot[]
  crewAvailabilityByDate: CrewAvailability[]
  conflictingRequests: ConflictingRequest[]
  historicalApprovals: ApprovalHistory[]
}
```

---

## 14. RECOMMENDATION ENGINE OUTPUT STRUCTURE

**Should Return:**
```typescript
interface RecommendationOutput {
  action: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED'
  confidence: number (0-100)
  priority: number (1-100, relative priority if multiple requests)
  reasoning: {
    pros: string[]      // Why approve
    cons: string[]      // Why deny/review
    risks: string[]     // Operational risks
    alternatives: {
      pilotId: string
      pilotName: string
      seniorityNumber: number
      reason: string    // Why this pilot could substitute
    }[]
  }
  automationLevel: 'AUTO_APPROVE' | 'AUTO_DENY' | 'REQUIRE_REVIEW'
  suggestedReview: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    reviewer: string   // Suggested reviewer (e.g., 'scheduling_manager')
    comments: string
  }
}
```

---

## Conclusion

The Fleet Management V2 leave approval system has solid foundations with:
- Clear crew availability calculations
- Seniority-based prioritization
- Conflict detection and tracking
- Audit logging
- Bulk operation capabilities

However, it lacks:
- Leave balance tracking
- Predictive analytics
- Advanced recommendation engine
- Optimization for crew scheduling
- Cost/efficiency considerations

A recommendation engine would need to integrate with this existing system while adding:
- Historical pattern analysis
- Forecasting capabilities
- Multi-objective optimization (crew balance vs pilot fairness)
- Integration with roster and certification calendars

