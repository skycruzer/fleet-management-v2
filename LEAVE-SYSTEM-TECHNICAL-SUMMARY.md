# Leave Approval System - Technical Summary

## Quick Reference for Developers

### Key Files

| File | Purpose | Key Functions |
|------|---------|---|
| `lib/services/leave-approval-service.ts` | Dashboard approval workflow | `calculatePriorityScore()`, `checkCrewMinimumViolation()`, `getLeaveRequestsWithEligibility()`, `bulkApproveLeaveRequests()` |
| `lib/services/leave-eligibility-service.ts` | Detailed eligibility analysis | `checkLeaveEligibility()`, `getConflictingPendingRequests()`, `calculateCrewAvailability()` |
| `lib/services/leave-service.ts` | CRUD operations | `getAllLeaveRequests()`, `createLeaveRequestServer()`, `updateLeaveRequestStatus()` |
| `types/leave-approval.ts` | Type definitions | `LeaveRequestWithEligibility`, `CrewAvailability`, `EligibilityStatus` |
| `app/api/leave-requests/route.ts` | REST API endpoints | GET (list), POST (create) |
| `app/api/leave-requests/[id]/route.ts` | Individual request endpoints | GET (detail), PATCH (update), DELETE |
| `app/api/leave-requests/bulk-approve/route.ts` | Bulk approval | POST bulk approvals |
| `app/api/leave-requests/bulk-deny/route.ts` | Bulk denial | POST bulk denials |
| `app/api/leave-requests/crew-availability/route.ts` | Crew availability | GET forecast |

### Core Data Flow

```
Pilot submits leave request
         ↓
POST /api/leave-requests
         ↓
createLeaveRequestServer()
         ↓
Stored in leave_requests table (PENDING)
         ↓
Admin views pending requests
         ↓
GET /api/leave-requests (with filters)
         ↓
getLeaveRequestsWithEligibility()
         ↓
For each request:
  - findConflicts()
  - checkCrewMinimumViolation()
  - calculatePriorityScore()
         ↓
Returns sorted list with eligibility info
         ↓
Admin approves/denies
         ↓
PATCH /api/leave-requests/[id]
         ↓
updateLeaveRequestStatus()
         ↓
Status updated, audit logged
```

### Priority Score Calculation Example

```javascript
// Pilot #5, requesting in 10 days, SICK leave
seniority_factor = (100 - 5) * 2 = 190
urgency_factor = 30 (8-14 days)
late_request_penalty = 0
request_type_priority = 30 (SICK)
pending_bonus = 20

TOTAL = 190 + 30 + 30 + 20 = 270 points
↑ Very high priority
```

### Crew Availability Status

```
Safe:     > 12 available per rank ✅
Warning:  ≤ 12 available per rank ⚠️
Critical: < 10 available per rank 🚨
```

### Conflict Detection Quick Reference

| Overlap Type | Days Gap | Example |
|---|---|---|
| EXACT | 0 | Oct 1-10 vs Oct 1-10 |
| PARTIAL | Overlaps | Oct 1-10 vs Oct 5-15 |
| ADJACENT | ≤ 1 day | Oct 1-10 vs Oct 11-20 |
| NEARBY | 2-7 days | Oct 1-10 vs Oct 15-20 |
| NONE | > 7 days | Oct 1-10 vs Oct 25-30 |

## API Endpoints

### GET /api/leave-requests
**List all leave requests**
```
Query params:
  - pilotId: string (filter)
  - status: PENDING|APPROVED|DENIED|all (filter)
  - rosterPeriod: string (filter)
  
Response:
{
  success: boolean
  data: LeaveRequest[]
  count: number
}
```

### POST /api/leave-requests
**Create new leave request**
```
Body:
{
  pilot_id: string (UUID)
  request_type: 'RDO'|'SDO'|'ANNUAL'|'SICK'|'LSL'|'LWOP'|'MATERNITY'|'COMPASSIONATE'
  start_date: string (YYYY-MM-DD)
  end_date: string (YYYY-MM-DD)
  request_date: string (YYYY-MM-DD)
  request_method: 'ORACLE'|'EMAIL'|'LEAVE_BIDS'|'SYSTEM'
  reason?: string
  is_late_request?: boolean
}

Response:
{
  success: boolean
  data: LeaveRequest
  warnings?: string[]
  conflicts?: ConflictInfo[]
}
```

### PATCH /api/leave-requests/[id]
**Update leave request status**
```
Body:
{
  status: 'APPROVED'|'DENIED'
  reviewedBy: string (user ID)
  reviewComments?: string
}

Response:
{
  success: boolean
  message: string
  requestId: string
}
```

### POST /api/leave-requests/bulk-approve
**Approve multiple requests**
```
Body:
{
  requestIds: string[]
  approvedBy: string (user ID)
  justification: string
}

Response:
{
  success: number
  failed: number
  errors: string[]
}
```

### GET /api/leave-requests/crew-availability
**Get crew availability forecast**
```
Query params:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)
  
Response:
{
  current: {
    captains: number
    firstOfficers: number
  }
  projected: [{
    date: string
    captains: number
    firstOfficers: number
    status: 'safe'|'warning'|'critical'
  }]
}
```

## Common Queries

### Get all pending requests for a specific date range
```typescript
import { getAllLeaveRequests } from '@/lib/services/leave-service'

const allRequests = await getAllLeaveRequests()
const startDate = new Date('2025-11-01')
const endDate = new Date('2025-11-30')

const requestsInRange = allRequests.filter(r => {
  const reqStart = new Date(r.start_date)
  const reqEnd = new Date(r.end_date)
  return reqStart <= endDate && reqEnd >= startDate && r.status === 'PENDING'
})
```

### Check if request would violate crew minimum
```typescript
import { checkCrewMinimumViolation } from '@/lib/services/leave-approval-service'

const willViolate = await checkCrewMinimumViolation(request, allRequests)
if (willViolate) {
  // Cannot approve
}
```

### Get detailed eligibility analysis
```typescript
import { checkLeaveEligibility } from '@/lib/services/leave-eligibility-service'

const eligibility = await checkLeaveEligibility({
  pilotId: 'uuid',
  pilotRole: 'Captain',
  startDate: '2025-11-01',
  endDate: '2025-11-10',
  requestType: 'ANNUAL'
})

if (eligibility.recommendation === 'APPROVE') {
  // Safe to approve
} else if (eligibility.recommendation === 'DENY') {
  // Must deny
} else {
  // Needs manual review
  console.log(eligibility.reasons) // Why it needs review
}
```

## Important Database Constraints

1. **Unique Constraint**: No duplicate requests for same pilot and date range
2. **Foreign Key**: pilot_id references pilots(id) with CASCADE delete
3. **Unique Constraint**: One request per pilot per date range (`leave_requests_pilot_dates_unique`)

## Error Handling

### Duplicate Leave Request
```
Error Code: 23505
Check: error.message.includes('leave_requests_pilot_dates_unique')
Handle: Return 409 Conflict with user-friendly message
```

### Crew Minimum Violation
```
Solution: Set eligibility status to 'crew_minimum_violation'
Action: Recommend DENY
Display: Show available crew vs required minimum
```

### Crew Shortage (Some Can Be Approved)
```
Solution: Use seniority to determine which pilots can be approved
Spread: Suggest rescheduling lower-priority pilots
Display: Show who gets approved, who needs to reschedule
```

## Testing Scenarios

### Scenario 1: Auto-Approve Request
- No crew minimum violation
- No date conflicts with same-rank pilots
- Not a late request
- Expected: ELIGIBLE → APPROVE

### Scenario 2: Manual Review (Seniority Conflict)
- Multiple pilots of same rank requesting overlapping dates
- All could be approved but would approach minimum
- Expected: CONFLICTS → REVIEW
- Action: Manually approve highest seniority pilots

### Scenario 3: Auto-Deny Request
- Would drop crew below minimum (< 10 of any rank)
- Expected: CREW_MINIMUM_VIOLATION → DENY

### Scenario 4: Late Request
- Request submitted < 21 days before leave date
- Expected: LATE_REQUEST → REVIEW

## Performance Considerations

1. **Large Date Ranges**: `calculateCrewAvailability()` loops through each day - slow for 90+ day ranges
2. **Bulk Operations**: Loop through requests individually - no batch database operations
3. **Query Complexity**: No indexes on frequent query patterns (status, roster_period, dates)

## Future Improvements

1. Add leave balance tracking table
2. Implement batch approval with transaction rollback on validation failure
3. Add database indexes on `(pilot_id, status)` and `(status, start_date, end_date)`
4. Implement query caching for crew availability forecasts
5. Add leave history analysis for pattern detection
6. Implement predictive analytics for future crew availability
7. Add cost/efficiency optimization for leave scheduling

## Debugging Tips

### Check eligibility status for request
```typescript
import { getLeaveRequestsWithEligibility } from '@/lib/services/leave-approval-service'

const withEligibility = await getLeaveRequestsWithEligibility({
  status: 'PENDING'
})

const request = withEligibility.find(r => r.id === requestId)
console.log({
  status: request.eligibilityStatus,
  action: request.recommendedAction,
  score: request.priorityScore,
  conflicts: request.conflicts
})
```

### Check crew availability for specific date
```typescript
import { getCrewAvailabilityForecast } from '@/lib/services/leave-approval-service'

const forecast = await getCrewAvailabilityForecast('2025-11-01', '2025-11-30')
const specificDate = forecast.find(f => f.date === '2025-11-15')
console.log({
  captains_available: specificDate.captainsAvailable,
  captains_minimum: specificDate.captainsMinimum,
  status: specificDate.status
})
```

### Debug conflict detection
```typescript
import { findConflicts } from '@/lib/services/leave-approval-service'

// Note: findConflicts is private, but shows pattern
const allRequests = await getAllLeaveRequests()
const conflicting = allRequests.filter(r => 
  r.pilots?.role === currentRequest.pilots?.role && 
  r.id !== currentRequest.id && 
  r.status !== 'DENIED' &&
  dateRangesOverlap(r.start_date, r.end_date, 
                     currentRequest.start_date, currentRequest.end_date)
)
console.log(`Found ${conflicting.length} conflicting requests`)
```

