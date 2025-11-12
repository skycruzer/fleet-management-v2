# Roster Period Service Implementation

**Author**: Maurice Rondeau
**Date**: November 11, 2025
**Status**: ✅ Complete - Core Calculations Ready

---

## Overview

Created a comprehensive roster period calculation service that handles all date calculations for the 28-day roster period system used in leave request planning.

## File Created

**Location**: `/Users/skycruzer/Desktop/fleet-management-v2/lib/services/roster-period-service.ts`

**Lines of Code**: 594
**Functions**: 11 core functions + 5 utility functions
**Type Definitions**: 2 interfaces

---

## Core Functions Implemented

### 1. `calculateRosterStartDate(periodNumber, year)`
Calculates the start date for any roster period using the known anchor point.

**Anchor Point**: RP12/2025 starts on October 11, 2025

**Example**:
```typescript
const startDate = calculateRosterStartDate(1, 2025)
// Returns: December 7, 2024
```

### 2. `calculateRosterPeriodDates(periodNumber, year)`
Returns complete roster period information including all calculated dates and status.

**Returns**: `RosterPeriodDates` object with:
- `code` - Roster period code (e.g., "RP1/2025")
- `periodNumber` - Period number (1-13)
- `year` - Year
- `startDate` - Start date of roster period
- `endDate` - End date (27 days after start, inclusive 28-day period)
- `publishDate` - Date roster is published (10 days before start)
- `deadlineDate` - Deadline for leave requests (31 days before start)
- `daysUntilDeadline` - Days until deadline (negative if past)
- `daysUntilPublish` - Days until publish (negative if past)
- `daysUntilStart` - Days until period starts (negative if past)
- `isOpen` - Whether requests can be submitted
- `isPastDeadline` - Whether deadline has passed
- `status` - Current status: `OPEN | LOCKED | PUBLISHED | ARCHIVED`

**Example**:
```typescript
const rp1 = calculateRosterPeriodDates(1, 2025)
console.log(rp1.code) // "RP1/2025"
console.log(rp1.startDate) // December 7, 2024
console.log(rp1.deadlineDate) // November 6, 2024
console.log(rp1.status) // "ARCHIVED" (for past periods)
```

### 3. `getRosterPeriodCodeFromDate(date)`
Determines which roster period a specific date falls within.

**Example**:
```typescript
const code = getRosterPeriodCodeFromDate(new Date('2025-10-15'))
// Returns: "RP12/2025"
```

### 4. `getUpcomingRosterPeriods(count)`
Returns the next N roster periods starting from today.

**Example**:
```typescript
const upcoming = getUpcomingRosterPeriods(6)
// Returns array of next 6 roster periods with all dates
```

### 5. Database Synchronization Functions

**Note**: Currently using fallback calculations. Database functions will be enabled after migration deployment.

- `syncRosterPeriodsToDatabase()` - Syncs current year + 2 years ahead to database
- `getRosterPeriodByCode(code)` - Fetches period from database (fallback: calculates on-the-fly)
- `getRosterPeriodsByYear(year)` - Fetches all periods for a year (fallback: calculates on-the-fly)
- `updateRosterPeriodStatus(code, status)` - Updates period status in database

---

## Utility Functions

### Date Formatting
- `formatRosterDate(date)` - Formats date for display (e.g., "Oct 11, 2025")

### Status Helpers
- `getStatusDescription(status)` - Human-readable status descriptions
- `isValidRosterPeriodCode(code)` - Validates roster period code format
- `parseRosterPeriodCode(code)` - Parses code into period number and year

---

## Configuration Constants

```typescript
const ROSTER_PERIOD_DAYS = 28
const ROSTER_PERIODS_PER_YEAR = 13
const ROSTER_PUBLISH_DAYS_BEFORE = 10
const REQUEST_DEADLINE_DAYS_BEFORE_PUBLISH = 21

// Derived: Deadline is 31 days before period starts
// (10 days before publish + 21 days before that)
```

---

## Status Logic

| Status | Condition | Description |
|--------|-----------|-------------|
| **OPEN** | Before deadline | Requests can be submitted |
| **LOCKED** | After deadline, before publish | Deadline passed, awaiting roster publication |
| **PUBLISHED** | After publish, before end | Roster published, period active/upcoming |
| **ARCHIVED** | After end date | Period completed |

---

## Test Results

All core calculations verified and passing:

### Test 1: Anchor Point ✓
- RP12/2025 starts on 2025-10-11 (verified)

### Test 2: First Period ✓
- RP1/2025: December 7, 2024 → January 3, 2025

### Test 3: Last Period ✓
- RP13/2025: November 8, 2025 → December 5, 2025

### Test 4: Period Continuity ✓
- RP13/2025 ends December 5, 2025
- RP1/2026 starts December 6, 2025
- No gaps between periods

### Test 5: Date to Period Conversion ✓
- October 15, 2025 → RP12/2025 (correct)

### Test 6: Current Period Detection ✓
- Today (November 11, 2025) → RP13/2025

---

## Example Output

**Current Roster Period (as of November 11, 2025)**:

```
RP13/2025:
  Start: 2025-11-08
  End: 2025-12-05
  Deadline: 2025-10-08 (33 days ago)
  Publish: 2025-10-29 (12 days ago)
  Status: PUBLISHED
```

**Next Available Period for Requests**:

```
RP2/2026:
  Start: 2026-01-03
  End: 2026-01-30
  Deadline: 2025-12-03 (23 days from now)
  Publish: 2025-12-24 (44 days from now)
  Status: OPEN ✓
```

---

## Database Integration

### Migration File
**Location**: `supabase/migrations/20251111124215_create_roster_periods_and_reports_tables.sql`

**Table Schema**:
```sql
CREATE TABLE roster_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  period_number integer NOT NULL,
  year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  publish_date date NOT NULL,
  request_deadline_date date NOT NULL,
  status text DEFAULT 'OPEN',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),

  CHECK (status IN ('OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED')),
  UNIQUE(period_number, year)
);
```

### To Enable Database Functions

1. **Deploy Migration** (via Supabase Dashboard):
   - Copy SQL from `supabase/migrations/20251111124215_create_roster_periods_and_reports_tables.sql`
   - Run in Supabase SQL Editor
   - Or use migration tools when available

2. **Regenerate Types**:
   ```bash
   npm run db:types
   ```

3. **Uncomment Database Functions** in `roster-period-service.ts`:
   - Uncomment lines in `syncRosterPeriodsToDatabase()`
   - Uncomment lines in `getRosterPeriodByCode()`
   - Uncomment lines in `getRosterPeriodsByYear()`
   - Uncomment lines in `updateRosterPeriodStatus()`

4. **Initial Sync**:
   ```typescript
   import { syncRosterPeriodsToDatabase } from '@/lib/services/roster-period-service'

   const result = await syncRosterPeriodsToDatabase()
   console.log(`Created ${result.created} roster periods`)
   ```

---

## Usage Examples

### Get Current Roster Period
```typescript
import {
  getRosterPeriodCodeFromDate,
  calculateRosterPeriodDates
} from '@/lib/services/roster-period-service'

const now = new Date()
const currentCode = getRosterPeriodCodeFromDate(now)
const currentPeriod = calculateRosterPeriodDates(
  parseInt(currentCode.match(/RP(\d+)/)[1]),
  parseInt(currentCode.match(/\/(\d+)/)[1])
)

console.log(`Current period: ${currentPeriod.code}`)
console.log(`Status: ${currentPeriod.status}`)
console.log(`Can submit requests: ${currentPeriod.isOpen}`)
```

### Display Upcoming Periods in UI
```typescript
import { getUpcomingRosterPeriods } from '@/lib/services/roster-period-service'

const upcomingPeriods = getUpcomingRosterPeriods(6)

upcomingPeriods.forEach(period => {
  console.log(`${period.code}: ${period.status}`)
  if (period.isOpen) {
    console.log(`  Deadline in ${period.daysUntilDeadline} days`)
  }
})
```

### Validate Leave Request Dates
```typescript
import {
  getRosterPeriodCodeFromDate,
  calculateRosterPeriodDates
} from '@/lib/services/roster-period-service'

function validateLeaveRequest(startDate: Date, endDate: Date) {
  const startCode = getRosterPeriodCodeFromDate(startDate)
  const endCode = getRosterPeriodCodeFromDate(endDate)

  if (startCode !== endCode) {
    return {
      valid: false,
      error: 'Leave request cannot span multiple roster periods'
    }
  }

  const period = calculateRosterPeriodDates(
    parseInt(startCode.match(/RP(\d+)/)[1]),
    parseInt(startCode.match(/\/(\d+)/)[1])
  )

  if (!period.isOpen) {
    return {
      valid: false,
      error: `Roster period ${period.code} is ${period.status.toLowerCase()}`
    }
  }

  return { valid: true }
}
```

---

## Next Steps

### Immediate
1. ✅ Core calculation functions implemented and tested
2. ✅ Type definitions complete
3. ✅ Comprehensive documentation

### Pending
1. ⏳ Deploy database migration
2. ⏳ Enable database synchronization functions
3. ⏳ Create API endpoints for roster period queries
4. ⏳ Build UI components for roster period selection
5. ⏳ Integrate with leave request forms

### Future Enhancements
1. ⏳ Automated status updates (scheduled job)
2. ⏳ Email notifications for approaching deadlines
3. ⏳ Dashboard widgets showing current/upcoming periods
4. ⏳ Historical period analytics

---

## Files Modified

| File | Status | Lines | Purpose |
|------|--------|-------|---------|
| `lib/services/roster-period-service.ts` | ✅ Created | 594 | Service implementation |
| `test-roster-period-service.mjs` | ✅ Created | 217 | Validation tests |
| `ROSTER-PERIOD-SERVICE-IMPLEMENTATION.md` | ✅ Created | - | This document |

---

## TypeScript Validation

- ✅ No TypeScript errors
- ✅ Strict type checking enabled
- ✅ Full type safety with Database types (when migration deployed)
- ✅ Comprehensive JSDoc comments

---

## Performance Considerations

### Current Implementation
- All calculations are **pure functions** (no side effects)
- Date arithmetic is **O(1)** complexity
- No external API calls for core calculations
- Minimal memory footprint

### With Database (Future)
- Database queries will be **cached** where appropriate
- Indexes on `code`, `year`, `request_deadline_date`
- RLS policies for security
- Upsert strategy prevents duplicates

---

## Conclusion

The roster period service is **fully functional** for all calculation needs. The service can be used immediately with in-memory calculations. Database integration is ready to be enabled once the migration is deployed.

All test cases pass, and the calculations align perfectly with the known anchor point (RP12/2025 = October 11, 2025).

**Ready for integration with leave request system.**
