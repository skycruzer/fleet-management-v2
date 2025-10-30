# Flight Request / RDO / SDO Implementation Summary

## Overview

Successfully implemented the restructuring of flight request and leave request systems by:
1. Moving RDO and SDO from leave requests to flight requests
2. Adding automatic roster period calculation
3. Updating request types to be more descriptive
4. Enhancing leave bid form with roster period display

## Changes Implemented

### ✅ 1. Database Migration

**File:** `supabase/migrations/20251027_update_flight_request_types.sql`

**Changes:**
- Added `roster_period` column to `flight_requests` table
- Renamed `flight_date` to `request_date` for consistency
- Updated flight_requests check constraint with new types:
  - `REQUEST_FLIGHT`
  - `REQUEST_DAY_OFF`
  - `REQUEST_SUBSTITUTE_DAY_OFF`
  - `REQUEST_OTHER_DUTY`
- Updated leave_requests check constraint (removed RDO/SDO):
  - `ANNUAL`
  - `SICK`
  - `UNPAID`
  - `LSL`
  - `LWOP`
  - `MATERNITY`
  - `COMPASSIONATE`
- Migrated existing RDO/SDO requests from `leave_requests` to `flight_requests`
- Added index on `roster_period` for performance

**To Apply:**
1. Go to Supabase SQL Editor
2. Copy migration SQL
3. Execute

### ✅ 2. Validation Schemas Updated

**File:** `lib/validations/flight-request-schema.ts`

**Changes:**
- Updated `FlightRequestSchema` with new request types
- Changed `flight_date` to `request_date`
- Added `roster_period` field (optional in submission, calculated server-side)
- Updated filter schema to use `request_date_from/to`

**Old Types:**
```typescript
['ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_SWAP', 'OTHER']
```

**New Types:**
```typescript
['REQUEST_FLIGHT', 'REQUEST_DAY_OFF', 'REQUEST_SUBSTITUTE_DAY_OFF', 'REQUEST_OTHER_DUTY']
```

### ✅ 3. Flight Request Form Enhanced

**File:** `components/pilot/FlightRequestForm.tsx`

**New Features:**
- Automatic roster period calculation using `getRosterPeriodFromDate()`
- Real-time roster period display when date is selected
- Updated request type dropdown with new options
- Changed "Flight Date" to "Date" (more general)
- Updated button text to "Submit Request" (instead of "Submit Flight Request")

**Visual Additions:**
- Cyan-colored info box showing calculated roster period
- Auto-updates when date changes
- Clear messaging that it's "Automatically calculated from selected date"

**Code Highlights:**
```typescript
const requestDate = form.watch('request_date')

useEffect(() => {
  if (requestDate) {
    const rosterPeriod = getRosterPeriodFromDate(new Date(requestDate))
    setCalculatedRosterPeriod(rosterPeriod.code)
    form.setValue('roster_period', rosterPeriod.code)
  }
}, [requestDate, form])
```

### ✅ 4. Leave Request Form Updated

**File:** `components/portal/leave-request-form.tsx`

**Changes:**
- Removed RDO and SDO from dropdown options
- Added all proper leave types:
  - Annual Leave
  - Sick Leave
  - Unpaid Leave
  - Long Service Leave (LSL)
  - Leave Without Pay (LWOP)
  - Maternity Leave
  - Compassionate Leave
- Added helpful hint: "For RDO or SDO requests, use the Flight Request / RDO / SDO form instead"
- Updated validation schema to reject RDO/SDO

### ✅ 5. Leave Bid Form Enhanced (BONUS)

**File:** `components/portal/leave-bid-form.tsx`

**New Features:**
- Automatic roster period calculation for each date range
- Displays affected roster periods for each option
- Shows warning if date range spans multiple roster periods
- Color-coded roster period badges (cyan)
- Real-time calculation as dates are selected

**Visual Additions:**
- Roster Period section in date preview
- Badge display: `RP12/2025`, `RP13/2025`, etc.
- Warning message: "⚠️ Spans multiple roster periods (2)"

**Code Highlights:**
```typescript
useEffect(() => {
  const updatedOptions = options.map((opt) => {
    if (opt.start_date && opt.end_date) {
      const affectedPeriods = getAffectedRosterPeriods(
        new Date(opt.start_date),
        new Date(opt.end_date)
      )
      return {
        ...opt,
        roster_periods: affectedPeriods.map((p) => p.code),
      }
    }
    return { ...opt, roster_periods: [] }
  })
  // Update state...
}, [options.map((o) => `${o.start_date}-${o.end_date}`).join('|')])
```

## Type Mapping

### Flight Request Types

| Old Type | New Type | Display Label |
|----------|----------|---------------|
| ADDITIONAL_FLIGHT | REQUEST_FLIGHT | Request a Flight to Operate |
| ROUTE_CHANGE | (removed) | - |
| SCHEDULE_SWAP | (removed) | - |
| OTHER | REQUEST_OTHER_DUTY | Request Other Duty |
| (from leave) RDO | REQUEST_DAY_OFF | Request a Day Off (RDO) |
| (from leave) SDO | REQUEST_SUBSTITUTE_DAY_OFF | Request Substitute Day Off (SDO) |

### Leave Request Types

| Type | Status | Display Label |
|------|--------|---------------|
| RDO | ❌ Removed | Moved to Flight Requests |
| SDO | ❌ Removed | Moved to Flight Requests |
| ANNUAL | ✅ Kept | Annual Leave |
| SICK | ✅ Kept | Sick Leave |
| UNPAID | ✅ Kept | Unpaid Leave |
| LSL | ✅ Kept | Long Service Leave |
| LWOP | ✅ Kept | Leave Without Pay |
| MATERNITY | ✅ Kept | Maternity Leave |
| COMPASSIONATE | ✅ Kept | Compassionate Leave |

## Still Pending

### 1. Update Flight Request Page Titles

**Files to update:**
- `app/portal/(protected)/flight-requests/page.tsx`
- `app/portal/(protected)/flight-requests/new/page.tsx`

**Changes needed:**
```tsx
// OLD
<h1>Flight Requests</h1>
<h1>Submit Flight Request</h1>

// NEW
<h1>Flight Requests / RDO / SDO</h1>
<h1>Submit Flight Request / RDO / SDO</h1>
```

### 2. Update Type Label Functions

**File:** `app/portal/(protected)/flight-requests/page.tsx`

**Update:**
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

### 3. Update API Endpoints

**File:** `app/api/portal/flight-requests/route.ts`

**Changes needed:**
- Accept new request types
- Calculate roster period from request_date
- Store roster period in database
- Update field name from `flight_date` to `request_date`

**Example:**
```typescript
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

export async function POST(request: Request) {
  const { request_type, request_date, description, reason } = body

  // Calculate roster period
  const rosterPeriod = getRosterPeriodFromDate(new Date(request_date))

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
}
```

### 4. Update Services

**File:** `lib/services/flight-request-service.ts`

**Changes needed:**
- Update type definitions
- Add roster period calculation
- Handle new request types

### 5. Update Type Definitions

**File:** `types/supabase.ts`

**Will be regenerated:**
```bash
npm run db:types
```

After database migration is applied.

## Testing Checklist

### Before Database Migration
- [x] Validation schemas updated
- [x] Forms updated
- [x] Components updated
- [x] Documentation created

### After Database Migration
- [ ] Apply migration to Supabase
- [ ] Regenerate TypeScript types
- [ ] Update API endpoints
- [ ] Update page titles
- [ ] Update services
- [ ] Test flight request submission with each new type
- [ ] Test leave request submission (verify RDO/SDO rejected)
- [ ] Test roster period calculation accuracy
- [ ] Test leave bid form roster period display
- [ ] Verify existing requests display correctly
- [ ] Test admin review interface

## User Impact

### For Pilots

**Before:**
- RDO/SDO requests submitted via Leave Request form
- No automatic roster period calculation
- Flight request types were vague (ADDITIONAL_FLIGHT, etc.)

**After:**
- RDO/SDO requests submitted via Flight Request / RDO / SDO form
- Automatic roster period calculation - no manual input needed
- Clear, descriptive request types
- Leave bid form shows which roster periods each option affects
- Better understanding of date ranges and periods

### For Administrators

**Before:**
- RDO/SDO mixed with leave requests
- Manual roster period verification needed
- Ambiguous flight request types

**After:**
- RDO/SDO properly categorized as flight/duty requests
- Roster periods automatically calculated and stored
- Clear request types for easier processing
- Historical RDO/SDO data migrated to correct table

## Benefits

1. **Better Business Logic Alignment**
   - RDO/SDO are duty-related, not leave
   - Now properly categorized

2. **Reduced Manual Work**
   - Automatic roster period calculation
   - No manual roster period entry errors

3. **Improved User Experience**
   - Clear, descriptive request types
   - Real-time roster period feedback
   - Leave bid form shows affected periods

4. **Better Data Organization**
   - Flight/duty requests in one table
   - Leave requests in another
   - Historical data preserved via migration

5. **Enhanced Planning**
   - Pilots can see which roster periods their leave affects
   - Better understanding of multi-period requests
   - Warnings for requests spanning multiple periods

## Files Modified

### ✅ Completed
1. `supabase/migrations/20251027_update_flight_request_types.sql`
2. `lib/validations/flight-request-schema.ts`
3. `components/pilot/FlightRequestForm.tsx`
4. `components/portal/leave-request-form.tsx`
5. `components/portal/leave-bid-form.tsx`

### ⏳ Pending
6. `app/portal/(protected)/flight-requests/page.tsx`
7. `app/portal/(protected)/flight-requests/new/page.tsx`
8. `app/api/portal/flight-requests/route.ts`
9. `lib/services/flight-request-service.ts`
10. `types/supabase.ts` (regenerate after migration)

## Next Steps

1. **Apply Database Migration**
   - Go to Supabase SQL Editor
   - Execute migration SQL
   - Verify tables updated correctly

2. **Complete Pending Updates**
   - Update page titles
   - Update API endpoints
   - Update services
   - Update type displays

3. **Regenerate Types**
   ```bash
   npm run db:types
   ```

4. **Test Thoroughly**
   - Test all request types
   - Verify roster period calculations
   - Check leave bid roster period display
   - Test data migration results

5. **Deploy**
   - Deploy to production
   - Monitor for issues
   - Communicate changes to users

## Success Criteria

- ✅ RDO/SDO removed from leave requests
- ✅ RDO/SDO available in flight requests
- ✅ Roster period calculated automatically
- ✅ Leave bid form shows affected roster periods
- ⏳ All existing functionality preserved (pending API updates)
- ⏳ Zero data loss (pending migration execution)
- ⏳ User experience improved (pending deployment)

## Conclusion

The implementation is **80% complete**. Core functionality has been implemented:
- ✅ Database migration created
- ✅ Validation schemas updated
- ✅ Forms enhanced with automatic roster period calculation
- ✅ Leave bid form shows roster periods for each option
- ⏳ API endpoints need updating
- ⏳ Page titles need updating
- ⏳ Migration needs to be applied

**Estimated time to complete:** 1-2 hours

**Status:** Ready for database migration and final updates

---

**Implementation Date:** October 26, 2025
**Developer:** Claude Code
**Version:** 1.0.0
