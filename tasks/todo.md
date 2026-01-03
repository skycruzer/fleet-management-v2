# Fix Systemic Save/Create Failures

## Problem

All save/create operations fail due to incomplete migration to unified `pilot_requests` table.

## Todo List

- [x] Task 1: Fix authorization middleware - change table names to `pilot_requests`
- [x] Task 2: Fix pilot-flight-service - change `'PORTAL'` to `'PILOT_PORTAL'`
- [x] Task 3: Fix leave-service - remove `'SYSTEM'`, add `'PHONE'` to types
- [x] Task 4: Fix leave-validation - update Zod enum to match DB constraint
- [x] Task 5: Delete 8 duplicate migration files
- [x] Task 6: Run validation and type checks
- [x] Task 7: Create review summary

---

## Review Section

### Changes Made

| File                                         | Change                                                                            | Lines    |
| -------------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| `lib/middleware/authorization-middleware.ts` | Changed `leave_requests` → `pilot_requests`, `flight_requests` → `pilot_requests` | 192, 196 |
| `lib/services/pilot-flight-service.ts`       | Changed `'PORTAL'` → `'PILOT_PORTAL'`                                             | 132      |
| `lib/services/leave-service.ts`              | Removed `'SYSTEM'`, added `'PHONE'` to type unions                                | 42, 68   |
| `lib/validations/leave-validation.ts`        | Updated Zod enum to match DB constraint                                           | 27-28    |
| `components/forms/leave-request-form.tsx`    | Changed default `'SYSTEM'` → `'ADMIN_PORTAL'`                                     | 75       |
| `supabase/migrations/`                       | Deleted 8 duplicate " 2.sql" files                                                | N/A      |

### Root Cause

Authorization middleware was querying deprecated `leave_requests` and `flight_requests` tables instead of the unified `pilot_requests` table. Every ownership check returned 404 because the deprecated tables were empty/blocked by RLS.

### Additional Fix Required

During type checking, discovered `components/forms/leave-request-form.tsx` also used invalid `'SYSTEM'` value - changed to `'ADMIN_PORTAL'`.

### Validation Results

- **TypeScript**: ✅ Passes (0 errors)
- **ESLint**: Pre-existing issues (52 errors, 766 warnings) - not introduced by this fix

### Files Modified (Total: 5 code files + 8 deleted)

1. `lib/middleware/authorization-middleware.ts`
2. `lib/services/pilot-flight-service.ts`
3. `lib/services/leave-service.ts`
4. `lib/validations/leave-validation.ts`
5. `components/forms/leave-request-form.tsx`

### Deleted Files (8 duplicate migrations)

- `20250119120000_create_rdo_sdo_requests_table 2.sql`
- `20250119120001_recreate_leave_requests_table 2.sql`
- `20251118230934_drop_legacy_request_tables 2.sql`
- `20251119000002_fix_leave_request_unique_constraint 2.sql`
- `20251119070637_standardize_workflow_status 2.sql`
- `20251120000001_mark_legacy_request_tables_readonly 2.sql`
- `20251120000002_fix_pilot_requests_rls_policies 2.sql`
- `20251120010000_extend_pilot_requests_for_rdo_sdo 2.sql`

### Next Steps

1. Manual test: Create leave request via pilot portal
2. Manual test: Create flight/RDO/SDO request via pilot portal
3. Manual test: Edit existing records
4. Run E2E tests if available
