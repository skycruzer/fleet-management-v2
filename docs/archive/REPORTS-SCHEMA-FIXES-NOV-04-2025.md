# Reports System - Database Schema Fixes
**Author**: Maurice Rondeau
**Date**: November 4, 2025
**Status**: ✅ All Schema Issues Resolved

---

## 🔍 Overview

During testing, several database schema mismatches were discovered between the code assumptions and the actual Supabase database schema. All issues have been identified and fixed.

---

## 🐛 Schema Issues Fixed

### Issue 1: `pilots` Table Column Names
**Error**: `column pilots_1.employee_number does not exist`

**Root Cause**: Code assumed incorrect column names for the `pilots` table.

**Actual Schema** (from `/types/supabase.ts`):
```typescript
pilots: {
  Row: {
    employee_id: string    // ❌ NOT employee_number
    role: string            // ❌ NOT rank
    first_name: string
    last_name: string
    // ... other columns
  }
}
```

**Fix Applied**:
- Changed all `employee_number` references to `employee_id`
- Changed all `rank` references to `role`

**Files Fixed**:
- `/lib/services/reports-service.ts` (all three report queries + PDF generation)

---

### Issue 2: `flight_requests` Table - No Roster Period
**Error**: `column flight_requests.roster_period does not exist`

**Root Cause**: The `flight_requests` table does not have a `roster_period` column.

**Actual Schema** (from `/types/supabase.ts`):
```typescript
flight_requests: {
  Row: {
    id: string
    pilot_id: string
    flight_date: string        // Single date field
    request_type: string
    description: string
    status: string | null
    // NO roster_period column
  }
}
```

**Fix Applied**:
- Removed roster period filtering from flight requests query
- Removed roster period multi-select from flight request form
- Added comment explaining why roster periods don't apply

**Files Fixed**:
- `/lib/services/reports-service.ts` (lines 122-123)
- `/components/reports/flight-request-report-form.tsx` (removed rosterPeriods from schema)

---

### Issue 3: `check_types` Table Column Names
**Error**: `column check_types_1.check_name does not exist`

**Root Cause**: Code assumed incorrect column names for the `check_types` table.

**Actual Schema** (from `/types/supabase.ts`):
```typescript
check_types: {
  Row: {
    id: string
    check_code: string           // ❌ NOT check_name
    check_description: string    // The descriptive name
    category: string | null
    // NO check_name column
    // NO validity_days column
  }
}
```

**Fix Applied**:
- Changed query to select `check_code`, `check_description`, `category`
- Updated PDF generation to use `check_description` (or `check_code` as fallback)
- Updated form interface to match actual schema
- Updated form rendering to display `check_description`

**Files Fixed**:
- `/lib/services/reports-service.ts` (lines 175-179, 329)
- `/components/reports/certification-report-form.tsx` (interface + rendering)

---

## 📊 Complete Schema Mapping

### Pilots Table
| Assumed Column | Actual Column | Status |
|----------------|---------------|--------|
| `employee_number` | `employee_id` | ✅ Fixed |
| `rank` | `role` | ✅ Fixed |
| `first_name` | `first_name` | ✅ Correct |
| `last_name` | `last_name` | ✅ Correct |

### Flight Requests Table
| Feature | Status | Notes |
|---------|--------|-------|
| `flight_date` | ✅ Correct | Single date field |
| `request_type` | ✅ Correct | |
| `description` | ✅ Correct | |
| `status` | ✅ Correct | |
| `roster_period` | ❌ Does not exist | Removed from filtering |

### Check Types Table
| Assumed Column | Actual Column | Status |
|----------------|---------------|--------|
| `check_name` | `check_description` | ✅ Fixed |
| N/A | `check_code` | ✅ Added |
| N/A | `category` | ✅ Added |
| `validity_days` | Does not exist | ✅ Removed |

---

## 🔧 Technical Changes Summary

### Service Layer (`/lib/services/reports-service.ts`)

**Leave Requests Query** (✅ Correct):
```typescript
.select(`
  *,
  pilot:pilots!leave_requests_pilot_id_fkey (
    first_name,
    last_name,
    employee_id,  // ✅ Fixed from employee_number
    role          // ✅ Fixed from rank
  )
`)
```

**Flight Requests Query** (✅ Fixed):
```typescript
.select(`
  *,
  pilot:pilots!flight_requests_pilot_id_fkey (
    first_name,
    last_name,
    employee_id,  // ✅ Fixed from employee_number
    role          // ✅ Fixed from rank
  )
`)

// ✅ Removed roster_period filtering (doesn't exist in table)
if (filters.status && filters.status.length > 0) {
  query = query.in('status', filters.status)
}
// Note: No roster_period filter
```

**Certifications Query** (✅ Fixed):
```typescript
.select(`
  *,
  pilot:pilots!pilot_checks_pilot_id_fkey (
    first_name,
    last_name,
    employee_id,  // ✅ Fixed from employee_number
    role          // ✅ Fixed from rank
  ),
  check_type:check_types!pilot_checks_check_type_id_fkey (
    check_code,        // ✅ Fixed from check_name
    check_description, // ✅ Added
    category           // ✅ Added
  )
`)
```

**PDF Generation Fixes**:
```typescript
// All three reports:
item.pilot?.role || 'N/A'  // ✅ Fixed from rank

// Certifications report:
item.check_type?.check_description || item.check_type?.check_code || 'N/A'
// ✅ Fixed from check_name
```

### Form Updates

**Flight Request Form** (`/components/reports/flight-request-report-form.tsx`):
```typescript
const formSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // ✅ Removed rosterPeriods (not applicable to flight_requests table)
  statusPending: z.boolean().default(false),
  statusApproved: z.boolean().default(false),
  statusRejected: z.boolean().default(false),
  rankCaptain: z.boolean().default(false),
  rankFirstOfficer: z.boolean().default(false),
})
```

**Certification Form** (`/components/reports/certification-report-form.tsx`):
```typescript
interface CheckType {
  id: string
  check_code: string           // ✅ Added
  check_description: string    // ✅ Fixed from check_name
  category: string | null      // ✅ Added
}

// Rendering:
<FormLabel className="text-sm font-normal cursor-pointer">
  {checkType.check_description || checkType.check_code}
  {/* ✅ Fixed from check_name */}
</FormLabel>
```

---

## ✅ Verification

### Database Schema Verification Steps

1. **Read `types/supabase.ts`**: ✅ Verified all table structures
2. **Cross-referenced code**: ✅ Updated all queries and references
3. **Fixed all column names**: ✅ Complete
4. **Updated PDF generation**: ✅ Complete
5. **Updated form interfaces**: ✅ Complete

### Testing Status

- [ ] Leave Requests Report - Ready for testing
- [ ] Flight Requests Report - Ready for testing (roster periods removed)
- [ ] Certifications Report - Ready for testing

---

## 📚 Reference Files

**Database Schema Source**:
- `/types/supabase.ts` - Generated TypeScript types from Supabase

**Files Modified**:
1. `/lib/services/reports-service.ts` (queries + PDF generation)
2. `/components/reports/flight-request-report-form.tsx` (removed roster periods)
3. `/components/reports/certification-report-form.tsx` (fixed check type interface)

---

## 🎯 Key Lessons Learned

1. **Always verify schema first**: Never assume column names - always check `types/supabase.ts`
2. **Not all tables have roster periods**: Flight requests don't use roster periods
3. **Check type naming**: The `check_types` table uses `check_description` not `check_name`
4. **Pilot table consistency**: Use `employee_id` and `role` consistently across all queries

---

## 📋 Schema Quick Reference

### Quick Column Lookup

**Pilots**:
- ✅ `employee_id` (unique employee number)
- ✅ `role` ('Captain' | 'First Officer')
- ✅ `first_name`, `last_name`

**Flight Requests**:
- ✅ `flight_date` (single date)
- ✅ `request_type`, `description`, `status`
- ❌ No `roster_period`
- ❌ No `departure_date` / `return_date`

**Check Types**:
- ✅ `check_code` (e.g., "PPC", "OPC")
- ✅ `check_description` (full name)
- ✅ `category` (grouping)
- ❌ No `check_name`
- ❌ No `validity_days`

---

**Status**: ✅ **ALL SCHEMA ISSUES RESOLVED**

**Next Step**: Comprehensive testing of all three report types per `REPORTS-TESTING-GUIDE-NOV-04-2025.md`
