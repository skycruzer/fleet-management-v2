# Leave Request System - Quick Reference Guide

## File Locations

### Core Services
- **`lib/services/leave-service.ts`** - CRUD operations, conflict checking
- **`lib/services/leave-eligibility-service.ts`** - Crew requirements, eligibility checking, seniority logic
- **`lib/services/pilot-leave-service.ts`** - Pilot self-service wrapper

### Validation
- **`lib/validations/leave-validation.ts`** - Admin schemas (ISO datetime)
- **`lib/validations/pilot-leave-schema.ts`** - Pilot schemas (YYYY-MM-DD dates)

### API Routes
- **`app/api/leave-requests/route.ts`** - GET/POST leave requests (admin)
- **`app/api/leave-requests/[id]/review/route.ts`** - PUT approve/deny
- **`app/api/portal/leave-requests/route.ts`** - POST/GET/DELETE (pilot portal)
- **`app/api/pilot/leave/route.ts`** - GET/POST (legacy pilot API)

### Pages
- **`app/dashboard/leave/page.tsx`** - Admin dashboard (main page)
- **`app/dashboard/leave/new/page.tsx`** - Create new request
- **`app/portal/(protected)/leave-requests/page.tsx`** - Pilot list
- **`app/portal/(protected)/leave-requests/new/page.tsx`** - Pilot submit

### Components
- **`components/leave/leave-requests-client.tsx`** - Admin filtering UI
- **`components/leave/leave-request-group.tsx`** - Expandable request group
- **`components/leave/leave-review-modal.tsx`** - Approve/deny dialog
- **`components/forms/leave-request-form.tsx`** - Create/edit form (admin)
- **`components/portal/leave-request-form.tsx`** - Submit form (pilot)

---

## Key Interfaces at a Glance

### LeaveRequest
```typescript
{
  id: string                                    // UUID
  pilot_id: string
  request_type: 'RDO'|'SDO'|'ANNUAL'|'SICK'|'LSL'|'LWOP'|'MATERNITY'|'COMPASSIONATE'
  start_date: string                           // ISO datetime
  end_date: string                             // ISO datetime
  days_count: number                           // Calculated automatically
  status: 'PENDING'|'APPROVED'|'DENIED'        // Current status
  roster_period: string                        // "RP1/2025" format (calculated)
  is_late_request: boolean                     // true if <21 days notice
  request_date: string                         // When submitted
  request_method: 'EMAIL'|'ORACLE'|'LEAVE_BIDS'|'SYSTEM'
  reason?: string                              // Optional reason
  reviewed_by?: string                         // Reviewer ID
  reviewed_at?: string                         // Review timestamp
  review_comments?: string                     // Approval/denial notes
}
```

### LeaveEligibilityCheck
```typescript
{
  isEligible: boolean                          // No conflicts?
  conflicts: LeaveConflict[]                   // Days below minimum
  recommendation: 'APPROVE'|'DENY'|'REVIEW_REQUIRED'
  seniorityRecommendation?: string             // Text if multiple requesting
  conflictingRequests?: ConflictingRequest[]   // Other pending requests
  crewImpact: CrewAvailability[]              // Day-by-day availability
  reasons: string[]                            // Why recommended action
  alternativePilots: PilotRecommendation[]     // Senior alternatives
}
```

### ConflictingRequest
```typescript
{
  requestId: string                            // ID of conflicting request
  pilotId: string
  pilotName: string
  seniorityNumber: number                      // Lower = more senior
  startDate: string
  endDate: string
  requestDate: string                          // When submitted
  overlapType: 'EXACT'|'PARTIAL'|'ADJACENT'|'NEARBY'
  isPriority: boolean                          // Higher seniority than current?
  recommendation: string                       // Text recommendation
  spreadSuggestion?: string                    // Alternative dates
}
```

---

## Service Function Reference

### Leave Service (leave-service.ts)

```typescript
// FETCH
getAllLeaveRequests()                          → LeaveRequest[]
getLeaveRequestById(id)                        → LeaveRequest | null
getPilotLeaveRequests(pilotId)                 → LeaveRequest[]
getPendingLeaveRequests()                      → LeaveRequest[]
getLeaveRequestsByRosterPeriod(period)         → LeaveRequest[]

// CREATE
createLeaveRequestServer(data)                 → LeaveRequest
                                               (throws DuplicateLeaveRequestError)

// UPDATE
updateLeaveRequestServer(id, data)             → LeaveRequest
updateLeaveRequestStatus(id, status, by, comments) → { success, message, requestId }

// DELETE
deleteLeaveRequest(id)                         → void (PENDING only)

// CONFLICTS
checkLeaveConflicts(pilotId, start, end)      → LeaveRequest[]

// STATS
getLeaveRequestStats()                         → LeaveRequestStats
```

### Eligibility Service (leave-eligibility-service.ts)

```typescript
// REQUIREMENTS
getCrewRequirements()                          → CrewRequirements

// AVAILABILITY
calculateCrewAvailability(start, end)          → CrewAvailability[]

// CONFLICTS
getConflictingPendingRequests(request)         → { conflictingRequests[], seniorityRecommendation }

// ELIGIBILITY
checkLeaveEligibility(request)                 → LeaveEligibilityCheck
checkBulkLeaveEligibility(rosterPeriod)        → { eligible[], requiresReview[], shouldDeny[], recommendations }

// RECOMMENDATIONS
getAlternativePilotRecommendations(role, start, end) → PilotRecommendation[]
```

### Pilot Leave Service (pilot-leave-service.ts)

```typescript
submitPilotLeaveRequest(request)               → { success, data?, error? }
getCurrentPilotLeaveRequests()                 → { success, data?, error? }
cancelPilotLeaveRequest(requestId)             → { success, data?, error? }
getPilotLeaveStats()                           → { success, data?, error? }
```

---

## Business Rules Cheat Sheet

### Crew Minimums (ALWAYS)
```
Minimum Captains: 10
Minimum First Officers: 10

These are evaluated INDEPENDENTLY per rank
```

### Seniority Priority
```
1. Lower seniority number = higher priority
2. Earlier request date = tiebreaker
3. Captains ≠ First Officers (ranked separately)
```

### Late Request
```
is_late_request = true IF (start_date - request_date) < 21 days
```

### Approval Logic (Multiple Requesting Same Dates)
```
IF remaining_after_all >= minimum:
  → APPROVE ALL (no spreading needed)

ELIF remaining_after_some > 0:
  → APPROVE top N by seniority
  → Recommend reschedule for rest with date suggestions

ELSE (at/below minimum already):
  → Generate spreading recommendations for all
  → Cannot approve anyone without violating minimum
```

### Overlap Types
```
EXACT:     Same start & end dates
PARTIAL:   Some days overlap
ADJACENT:  Within 3 days of each other
NEARBY:    Good spacing (>3 days apart)
```

---

## API Endpoints Quick Reference

### Admin Endpoints
```
GET    /api/leave-requests                    # List all
POST   /api/leave-requests                    # Create
PUT    /api/leave-requests/[id]/review        # Approve/deny
```

### Pilot Endpoints
```
GET    /api/portal/leave-requests             # My requests
POST   /api/portal/leave-requests             # Submit new
DELETE /api/portal/leave-requests?id=<id>     # Cancel pending

GET    /api/pilot/leave                       # My requests (legacy)
POST   /api/pilot/leave                       # Submit new (legacy)
```

---

## Validation Rules Quick Check

### Date Validation
- Format: ISO datetime string or YYYY-MM-DD
- end_date >= start_date (required)
- Max duration: 90 days
- request_date <= start_date

### Type Validation
- Must be: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE
- Required field

### Status Validation
- Must be: PENDING, APPROVED, DENIED
- Cannot change APPROVED/DENIED requests (no edit allowed)

### Text Fields
- reason: max 500 characters
- review_comments: max 500 characters

---

## Common Tasks

### Task: Admin Creates Leave Request
1. Go to `/dashboard/leave`
2. Click "Submit Leave Request"
3. Fill form (pilot, type, dates)
4. Submit → calls `createLeaveRequestServer()`
5. Stored in database as PENDING

### Task: Admin Reviews & Approves
1. See request in dashboard
2. Click "Review" button
3. Modal opens with `<LeaveReviewModal>`
4. Select APPROVED or DENIED
5. Add optional comments
6. Submit → calls `updateLeaveRequestStatus()`
7. Updates status + creates audit log (atomic)

### Task: Pilot Submits Request
1. Go to `/portal/leave-requests`
2. Click "Submit Request"
3. Fill simplified form (type, dates, reason)
4. Submit → calls `submitPilotLeaveRequest()`
5. Auto-sets: pilot_id, request_date, request_method='SYSTEM'
6. Stored as PENDING

### Task: Pilot Cancels Request
1. View `/portal/leave-requests`
2. Click "Cancel" on pending request
3. Calls `cancelPilotLeaveRequest()`
4. Checks ownership & PENDING status
5. Deletes request

### Task: Check Eligibility
1. Call `checkLeaveEligibility(request)`
2. Returns detailed `LeaveEligibilityCheck`
3. Shows conflicts, crew impact, recommendations
4. Display to admin for review

---

## Error Handling

### DuplicateLeaveRequestError
```typescript
// Thrown when pilot already has request for same dates
// Handle with 409 Conflict status
message: 'A leave request for these dates already exists...'
```

### Validation Errors
```typescript
// From Zod schema validation
// Handle with 400 Bad Request status
// Return details in error response
```

### Authorization Errors
```typescript
// Pilot accessing other pilot's requests
// Handle with 403 Forbidden status
```

---

## Testing Checklist

- [ ] Create leave request (admin)
- [ ] Create leave request (pilot)
- [ ] List all requests (admin)
- [ ] List my requests (pilot)
- [ ] Approve request (admin)
- [ ] Deny request (admin)
- [ ] Cancel pending request (pilot)
- [ ] Prevent cancel of approved/denied (pilot)
- [ ] Detect duplicate requests
- [ ] Detect crew shortages
- [ ] Calculate late request flag
- [ ] Show seniority comparison
- [ ] Filter by roster period
- [ ] Filter by status
- [ ] Group by type/role
- [ ] Sort by start date
- [ ] Validate all form fields
- [ ] Handle network errors gracefully
- [ ] Audit log all CRUD operations

---

## Key Takeaways

1. **Service Layer First** - Always use services, never direct Supabase calls
2. **Rank Separation** - Captains and FOs are evaluated independently
3. **Crew Minimum** - 10 Captains AND 10 First Officers always maintained
4. **Seniority Logic** - Lower number = higher priority within same rank
5. **Atomic Operations** - Status updates use RPC function for transaction safety
6. **Validation** - Zod schemas enforce all business rules
7. **Audit Logging** - All CRUD operations are logged automatically
8. **Error Handling** - Specific error types for different scenarios
9. **Date Formats** - Admin uses ISO datetime, pilots use YYYY-MM-DD
10. **Ownership Checks** - Pilot routes verify request belongs to user

