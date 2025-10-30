# Flight Request / RDO / SDO Implementation Plan

## Overview

This document outlines the comprehensive plan to restructure the flight request and leave request systems by moving RDO (Rostered Day Off) and SDO (Scheduled Day Off) from leave requests to flight requests, and implementing automatic roster period calculation.

## Current State Analysis

### Current Flight Request Types
- **ADDITIONAL_FLIGHT** - Request to operate an additional flight
- **ROUTE_CHANGE** - Request for route modification
- **SCHEDULE_SWAP** - Request to swap schedules with another pilot
- **OTHER** - Other flight-related requests

### Current Leave Request Types
- **RDO** - Rostered Day Off (to be moved)
- **SDO** - Scheduled Day Off (to be moved)
- **ANNUAL** - Annual Leave
- **SICK** - Sick Leave
- **UNPAID** - Unpaid Leave
- **LSL** - Long Service Leave
- **LWOP** - Leave Without Pay
- **MATERNITY** - Maternity Leave
- **COMPASSIONATE** - Compassionate Leave

### Current Issues
1. RDO and SDO are currently in leave requests but should be part of flight/duty requests
2. No automatic roster period calculation for flight requests
3. Form name doesn't reflect RDO/SDO functionality

## Proposed Changes

### 1. New Flight Request Types

**Updated Types:**
- **REQUEST_FLIGHT** - Request a flight to operate
- **REQUEST_DAY_OFF** - Request a day off (formerly RDO)
- **REQUEST_SUBSTITUTE_DAY_OFF** - Request substitute day off (formerly SDO)
- **REQUEST_OTHER_DUTY** - Request other duty assignment

**Remove:**
- ADDITIONAL_FLIGHT
- ROUTE_CHANGE
- SCHEDULE_SWAP
- OTHER

### 2. Updated Leave Request Types

**Remove:**
- RDO
- SDO

**Keep:**
- ANNUAL
- SICK
- UNPAID
- LSL
- LWOP
- MATERNITY
- COMPASSIONATE

### 3. Automatic Roster Period Calculation

**Implementation:**
- Use existing `roster-utils.ts` functions
- Automatically calculate roster period from selected date(s)
- Display calculated roster period to user
- No manual roster period input required

**Function to Use:**
```typescript
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

const rosterPeriod = getRosterPeriodFromDate(flightDate)
// Returns: { code: 'RP12/2025', number: 12, year: 2025, ... }
```

### 4. Form Rename

**Current:** "Submit Flight Request"
**New:** "Submit Flight Request / RDO / SDO"

## Implementation Steps

### Step 1: Update Type Definitions

**Files to modify:**
1. `types/supabase.ts` - TypeScript database types
2. Flight request interfaces in components
3. Validation schemas

**Changes:**
```typescript
// OLD
type FlightRequestType = 'ADDITIONAL_FLIGHT' | 'ROUTE_CHANGE' | 'SCHEDULE_SWAP' | 'OTHER'

// NEW
type FlightRequestType = 'REQUEST_FLIGHT' | 'REQUEST_DAY_OFF' | 'REQUEST_SUBSTITUTE_DAY_OFF' | 'REQUEST_OTHER_DUTY'
```

```typescript
// OLD
type LeaveRequestType = 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'UNPAID' | ...

// NEW
type LeaveRequestType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE'
```

### Step 2: Update Flight Request Form

**File:** `components/pilot/FlightRequestForm.tsx`

**Changes:**
1. Update request type dropdown with new options
2. Add automatic roster period calculation
3. Display calculated roster period (read-only)
4. Update form title to "Submit Flight Request / RDO / SDO"
5. Change field label from "Flight Date" to "Date" (more general)

**New Structure:**
```typescript
<select>
  <option value="REQUEST_FLIGHT">Request a Flight to Operate</option>
  <option value="REQUEST_DAY_OFF">Request a Day Off (RDO)</option>
  <option value="REQUEST_SUBSTITUTE_DAY_OFF">Request Substitute Day Off (SDO)</option>
  <option value="REQUEST_OTHER_DUTY">Request Other Duty</option>
</select>

{/* Automatic Roster Period Calculation */}
{selectedDate && (
  <div className="info-box">
    <p>Roster Period: {calculateRosterPeriod(selectedDate)}</p>
  </div>
)}
```

### Step 3: Update Leave Request Form

**File:** `components/portal/leave-request-form.tsx`

**Changes:**
1. Remove RDO and SDO from dropdown options
2. Keep all other leave types
3. Update validation schema to exclude RDO/SDO

**Updated Options:**
```typescript
<select>
  <option value="ANNUAL">Annual Leave</option>
  <option value="SICK">Sick Leave</option>
  <option value="UNPAID">Unpaid Leave</option>
  <option value="LSL">Long Service Leave</option>
  <option value="LWOP">Leave Without Pay</option>
  <option value="MATERNITY">Maternity Leave</option>
  <option value="COMPASSIONATE">Compassionate Leave</option>
</select>
```

### Step 4: Update Validation Schemas

**File:** `lib/validations/flight-request-schema.ts`

**Changes:**
```typescript
// OLD
const FlightRequestSchema = z.object({
  request_type: z.enum(['ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_SWAP', 'OTHER']),
  flight_date: z.string(),
  description: z.string(),
  reason: z.string().optional(),
})

// NEW
const FlightRequestSchema = z.object({
  request_type: z.enum([
    'REQUEST_FLIGHT',
    'REQUEST_DAY_OFF',
    'REQUEST_SUBSTITUTE_DAY_OFF',
    'REQUEST_OTHER_DUTY'
  ]),
  request_date: z.string().min(1, 'Date is required'),
  roster_period: z.string(), // Auto-calculated, included in submission
  description: z.string().min(10, 'Description must be at least 10 characters'),
  reason: z.string().optional(),
})
```

**File:** `lib/validations/pilot-leave-schema.ts` or `components/portal/leave-request-form.tsx`

**Changes:**
```typescript
// OLD
request_type: z.enum(['RDO', 'ANNUAL', 'SICK', 'SDO', 'UNPAID'], ...)

// NEW
request_type: z.enum([
  'ANNUAL',
  'SICK',
  'UNPAID',
  'LSL',
  'LWOP',
  'MATERNITY',
  'COMPASSIONATE'
], {
  message: 'Please select a leave type',
})
```

### Step 5: Update API Routes

**File:** `app/api/portal/flight-requests/route.ts`

**Changes:**
1. Accept new request types
2. Calculate roster period from request_date
3. Store roster period in database
4. Update validation logic

**Implementation:**
```typescript
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

export async function POST(request: Request) {
  const body = await request.json()
  const { request_type, request_date, description, reason } = body

  // Calculate roster period automatically
  const rosterPeriod = getRosterPeriodFromDate(new Date(request_date))

  // Insert into database with calculated roster period
  const { data, error } = await supabase
    .from('flight_requests')
    .insert({
      pilot_id,
      request_type,
      request_date,
      roster_period: rosterPeriod.code,
      description,
      reason,
      status: 'PENDING'
    })

  return NextResponse.json({ success: true, data })
}
```

**File:** `app/api/portal/leave-requests/route.ts`

**Changes:**
1. Remove RDO and SDO from accepted types
2. Add validation to reject RDO/SDO submissions
3. Keep all other leave type logic

### Step 6: Update Database Schema

**File:** `supabase/migrations/[timestamp]_update_flight_request_types.sql`

**Changes:**
```sql
-- Update flight_requests table to add roster_period column
ALTER TABLE flight_requests
ADD COLUMN IF NOT EXISTS roster_period TEXT;

-- Add check constraint for new request types
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
CHECK (request_type IN (
  'REQUEST_FLIGHT',
  'REQUEST_DAY_OFF',
  'REQUEST_SUBSTITUTE_DAY_OFF',
  'REQUEST_OTHER_DUTY'
));

-- Update leave_requests table check constraint
ALTER TABLE leave_requests
DROP CONSTRAINT IF EXISTS leave_requests_request_type_check;

ALTER TABLE leave_requests
ADD CONSTRAINT leave_requests_request_type_check
CHECK (request_type IN (
  'ANNUAL',
  'SICK',
  'UNPAID',
  'LSL',
  'LWOP',
  'MATERNITY',
  'COMPASSIONATE'
));

-- Migrate existing RDO/SDO requests from leave_requests to flight_requests
-- (OPTIONAL - only if we want to preserve historical data)
INSERT INTO flight_requests (
  pilot_id,
  request_type,
  request_date,
  roster_period,
  description,
  reason,
  status,
  created_at
)
SELECT
  pilot_id,
  CASE
    WHEN request_type = 'RDO' THEN 'REQUEST_DAY_OFF'
    WHEN request_type = 'SDO' THEN 'REQUEST_SUBSTITUTE_DAY_OFF'
  END as request_type,
  start_date as request_date,
  roster_period,
  COALESCE(reason, 'Migrated from leave request') as description,
  reason,
  status,
  created_at
FROM leave_requests
WHERE request_type IN ('RDO', 'SDO');

-- Delete migrated RDO/SDO requests from leave_requests
DELETE FROM leave_requests
WHERE request_type IN ('RDO', 'SDO');
```

### Step 7: Update Services

**File:** `lib/services/flight-request-service.ts`

**Changes:**
1. Add roster period calculation logic
2. Update type validation
3. Add helper function to calculate roster period

```typescript
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

export async function createFlightRequest(data: {
  pilot_id: string
  request_type: FlightRequestType
  request_date: string
  description: string
  reason?: string
}) {
  // Calculate roster period
  const rosterPeriod = getRosterPeriodFromDate(new Date(data.request_date))

  // Insert with calculated roster period
  const { data: result, error } = await supabase
    .from('flight_requests')
    .insert({
      ...data,
      roster_period: rosterPeriod.code,
      status: 'PENDING'
    })
    .select()
    .single()

  if (error) throw error
  return result
}
```

### Step 8: Update UI Components

**Files to update:**
1. `app/portal/(protected)/flight-requests/page.tsx` - Update type labels and colors
2. `app/portal/(protected)/flight-requests/new/page.tsx` - Update page title
3. `components/portal/flight-request-form.tsx` - Main form updates
4. `components/admin/FlightRequestsTable.tsx` - Update type display

**Type Label Mappings:**
```typescript
const getRequestTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    REQUEST_FLIGHT: 'Request Flight',
    REQUEST_DAY_OFF: 'RDO (Day Off)',
    REQUEST_SUBSTITUTE_DAY_OFF: 'SDO (Substitute Day Off)',
    REQUEST_OTHER_DUTY: 'Other Duty',
  }
  return labels[type] || type
}

const getRequestTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    REQUEST_FLIGHT: 'bg-blue-500',
    REQUEST_DAY_OFF: 'bg-green-500',
    REQUEST_SUBSTITUTE_DAY_OFF: 'bg-indigo-500',
    REQUEST_OTHER_DUTY: 'bg-gray-500',
  }
  return colors[type] || 'bg-gray-400'
}
```

### Step 9: Update Page Titles and Headers

**File:** `app/portal/(protected)/flight-requests/new/page.tsx`

**Changes:**
```tsx
// OLD
<h1>Submit Flight Request</h1>

// NEW
<h1>Submit Flight Request / RDO / SDO</h1>
<p className="text-gray-600">
  Request a flight assignment, day off (RDO), substitute day off (SDO), or other duty
</p>
```

**File:** `app/portal/(protected)/flight-requests/page.tsx`

**Changes:**
```tsx
// OLD
<h1>Flight Requests</h1>

// NEW
<h1>Flight Requests / RDO / SDO</h1>
```

### Step 10: Update Documentation

**Files to update:**
1. `CLAUDE.md` - Update business rules
2. README.md - Update feature descriptions
3. API documentation
4. Type definitions documentation

## Testing Plan

### Unit Tests
1. Test roster period calculation with various dates
2. Test form validation with new types
3. Test API endpoint with new request types
4. Test database constraints

### Integration Tests
1. Submit REQUEST_DAY_OFF request
2. Submit REQUEST_SUBSTITUTE_DAY_OFF request
3. Submit REQUEST_FLIGHT request
4. Submit REQUEST_OTHER_DUTY request
5. Verify roster period auto-calculation
6. Verify RDO/SDO cannot be submitted via leave request form

### Manual Testing Checklist
- [ ] Flight request form displays new types
- [ ] Roster period calculates automatically
- [ ] Roster period displays correctly
- [ ] Form submits successfully with each new type
- [ ] Leave request form no longer shows RDO/SDO
- [ ] Existing flight requests display correctly
- [ ] Admin can review new request types
- [ ] Dashboard stats update correctly

## Migration Strategy

### Option 1: Clean Break (Recommended)
- Apply all changes at once
- No data migration
- Clear communication to users about new structure
- Old RDO/SDO requests remain in leave_requests (historical)
- New RDO/SDO requests go to flight_requests

### Option 2: Full Migration
- Migrate existing RDO/SDO from leave_requests to flight_requests
- Preserve all historical data
- More complex but complete data consistency
- Requires careful data transformation

**Recommendation:** Use Option 1 (Clean Break) for simplicity

## Rollout Plan

### Phase 1: Backend Updates (Day 1)
1. Create database migration
2. Update API endpoints
3. Update services
4. Update validation schemas

### Phase 2: Frontend Updates (Day 1-2)
1. Update flight request form
2. Update leave request form
3. Update type labels and colors
4. Update page titles

### Phase 3: Testing (Day 2)
1. Run automated tests
2. Perform manual testing
3. Test edge cases
4. Verify roster period calculation accuracy

### Phase 4: Deployment (Day 3)
1. Apply database migration
2. Deploy backend changes
3. Deploy frontend changes
4. Monitor for issues

### Phase 5: Communication (Day 3)
1. Notify pilots of new structure
2. Update user documentation
3. Provide training if needed

## Risk Assessment

### Low Risk
- Form updates (easily reversible)
- Label changes
- Page title updates

### Medium Risk
- Database constraint changes (requires migration)
- API endpoint changes (backward compatibility)
- Validation schema updates

### High Risk
- Data migration (if choosing Option 2)
- Breaking changes to existing integrations

## Rollback Plan

If issues occur:
1. Revert frontend deployment
2. Revert API changes
3. Revert database migration (if needed)
4. Restore previous validation schemas

## Success Criteria

1. ✅ RDO/SDO removed from leave request form
2. ✅ RDO/SDO available in flight request form
3. ✅ Roster period calculated automatically
4. ✅ All existing functionality preserved
5. ✅ No data loss
6. ✅ User experience improved
7. ✅ Zero production errors

## Files to Modify - Complete List

### Components
1. `components/pilot/FlightRequestForm.tsx`
2. `components/portal/flight-request-form.tsx`
3. `components/portal/leave-request-form.tsx`
4. `components/admin/FlightRequestsTable.tsx`

### Pages
5. `app/portal/(protected)/flight-requests/page.tsx`
6. `app/portal/(protected)/flight-requests/new/page.tsx`
7. `app/portal/(protected)/leave-requests/page.tsx`

### API Routes
8. `app/api/portal/flight-requests/route.ts`
9. `app/api/portal/leave-requests/route.ts`
10. `app/api/pilot/flight-requests/route.ts`

### Services
11. `lib/services/flight-request-service.ts`
12. `lib/services/pilot-flight-service.ts`
13. `lib/services/leave-service.ts`

### Validations
14. `lib/validations/flight-request-schema.ts`
15. `lib/validations/pilot-leave-schema.ts`

### Database
16. `supabase/migrations/[new]_update_flight_request_types.sql`

### Types
17. `types/supabase.ts` (will be regenerated)

### Documentation
18. `CLAUDE.md`
19. `README.md` (if exists)

## Estimated Time

- **Planning:** 1 hour ✅ (Complete)
- **Implementation:** 4-6 hours
- **Testing:** 2-3 hours
- **Deployment:** 1 hour
- **Total:** 8-11 hours

## Next Steps

1. ✅ **Review and approve this plan**
2. Create database migration file
3. Update validation schemas
4. Update flight request form
5. Update leave request form
6. Update API endpoints
7. Update services
8. Test thoroughly
9. Deploy to production

---

**Status:** ✅ Planning Complete - Ready for Implementation
**Created:** October 26, 2025
**Developer:** Claude Code
