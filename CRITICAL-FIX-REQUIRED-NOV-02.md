# CRITICAL DATABASE MIGRATION REQUIRED - November 2, 2025

## ⚠️ ACTION REQUIRED BEFORE DEPLOYMENT

**You MUST apply this database migration manually in Supabase SQL Editor BEFORE deploying the code changes.**

## Problem Summary

The `flight_requests` table has a CHECK constraint mismatch:
- **Database constraint allows**: `ADDITIONAL_FLIGHT`, `ROUTE_CHANGE`, `SCHEDULE_PREFERENCE`, `TRAINING_FLIGHT`, `OTHER`
- **Application sends**: `FLIGHT_REQUEST`, `RDO`, `SDO`, `OFFICE_DAY`

This causes ALL pilot flight request submissions to fail at the database level.

## Step 1: Apply Database Migration

**Go to Supabase SQL Editor**: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

**Copy and paste this SQL**:

```sql
-- Fix flight_requests table request_type constraint
-- Update CHECK constraint to match pilot portal request types
--
-- Current constraint allows: ADDITIONAL_FLIGHT, ROUTE_CHANGE, SCHEDULE_PREFERENCE, TRAINING_FLIGHT, OTHER
-- Need to allow: FLIGHT_REQUEST, RDO, SDO, OFFICE_DAY
--
-- Migration created: 2025-11-02

-- Drop existing CHECK constraint
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

-- Add new CHECK constraint with correct values
ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
CHECK (request_type IN ('FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'));

-- Add comment explaining the request types
COMMENT ON COLUMN flight_requests.request_type IS
'Type of flight request: FLIGHT_REQUEST (additional flight), RDO (rostered day off), SDO (scheduled day off), OFFICE_DAY (office duty day)';
```

## Step 2: Verify Migration Success

After running the SQL, you should see:
- ✅ `ALTER TABLE` (constraint dropped)
- ✅ `ALTER TABLE` (new constraint added)
- ✅ `COMMENT` (column comment updated)

## Step 3: Deploy Code Changes

Once the migration is applied, deploy the code:

```bash
vercel --prod --yes
```

## What Was Fixed in the Code

1. **Validation Schema** (`lib/validations/flight-request-schema.ts`):
   - Updated enum to: `['FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY']`

2. **Flight Request Form** (`app/portal/(protected)/flight-requests/new/page.tsx`):
   - Updated REQUEST_TYPES to show: Flight, RDO, SDO, Office
   - Changed default value to `FLIGHT_REQUEST`

3. **Legacy Form** (`components/pilot/FlightRequestForm.tsx`):
   - Updated select options
   - Changed default value to `FLIGHT_REQUEST`

## Request Type Meanings

| Value | Label | Description |
|-------|-------|-------------|
| `FLIGHT_REQUEST` | Flight | Request for additional flight assignment |
| `RDO` | RDO | Rostered Day Off request |
| `SDO` | SDO | Scheduled Day Off request |
| `OFFICE_DAY` | Office | Office duty day request |

## Testing After Deployment

1. Navigate to `/portal/flight-requests/new`
2. Verify dropdown shows: Flight, RDO, SDO, Office
3. Submit a test flight request
4. Check `/dashboard/flight-requests` to see it appears in admin portal

## Files Changed

- `supabase/migrations/20251102_fix_flight_request_types.sql` (NEW)
- `lib/validations/flight-request-schema.ts` (MODIFIED)
- `app/portal/(protected)/flight-requests/new/page.tsx` (MODIFIED)
- `components/pilot/FlightRequestForm.tsx` (MODIFIED)

## Related Issues Fixed

This also resolves why flight requests weren't showing in the admin portal - they were never successfully saved to the database due to the CHECK constraint violation.

---

**Status**: Build completed successfully. Ready to deploy after database migration is applied.
