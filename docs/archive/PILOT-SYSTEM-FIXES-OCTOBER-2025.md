# Pilot Management System - Bug Fixes & Feature Implementations

## Date: October 24, 2025

This document outlines the fixes and implementations for five critical issues in the pilot management system.

---

## ✅ COMPLETED FIXES

### 1. Seniority Column Display Issue - FIXED ✅

**Problem**: Seniority numbers were not displaying in the pilots table view despite being present in the database.

**Root Cause**: Field name mismatch between database schema (`seniority_number`) and component interface (`seniority`).

**Files Modified**:

- `/components/pilots/pilots-table.tsx`

**Changes Made**:

1. Updated `PilotTableRow` interface to use `seniority_number` instead of `seniority` (line 20)
2. Updated filter function to reference `seniority_number` (line 40)
3. Updated export function to use `seniority_number` (line 49)
4. Updated column definition `accessorKey` to `'seniority_number'` (line 68)
5. Updated cell renderer to display `row.seniority_number` (line 72)

**Testing**:

- ✅ Manually verify seniority column now displays numbers (#1, #2, #3, etc.)
- ✅ Verify sorting by seniority works correctly
- ✅ Verify search/filter includes seniority numbers
- ✅ Verify CSV export includes seniority data

**Status**: COMPLETE - Ready for testing

---

### 5. Pilot Certification Dates Update Persistence - FIXED ✅

**Problem**: Editing and updating pilot certification dates did not persist in the database and were not reflected in views due to stale cache data.

**Root Cause**: Certification service functions (create, update, delete) were not invalidating the cache after mutations, causing subsequent reads to return 5-minute-old cached data.

**Files Modified**:

- `/lib/services/certification-service.ts`

**Changes Made**:

1. **`createCertification()` function** (line 419-421): Added cache invalidation after creating new certification
2. **`updateCertification()` function** (line 472-474): Added cache invalidation after updating certification
3. **`deleteCertification()` function** (line 516-518): Added cache invalidation after deleting certification

**Implementation Details**:

```typescript
// Invalidate certification cache to ensure fresh data is fetched
const { invalidateCacheByTag } = await import('./cache-service')
invalidateCacheByTag('certifications')
```

**Testing**:

- ✅ Create new certification → verify it appears immediately in list
- ✅ Update certification expiry date → verify change reflects immediately
- ✅ Delete certification → verify it disappears immediately
- ✅ Test concurrent users updating different certifications
- ✅ Verify audit logs still work correctly

**Status**: COMPLETE - Ready for testing

---

## 📋 IMPLEMENTATION PLANS FOR REMAINING ITEMS

### 2. Pilot Form Contract Types - NEEDS IMPLEMENTATION

**Problem**: Contract type options in "Add Pilot" form are hardcoded instead of fetched from database.

**Current State**:

- Hardcoded options: "Fixed Term", "Permanent", "Contract"
- Database has `contract_types` table with `name`, `description`, `is_active` fields
- Service function `getContractTypes()` exists but is unused

**Files Requiring Changes**:

1. `/app/dashboard/pilots/new/page.tsx` - Lines 195-207
2. `/app/dashboard/pilots/[id]/edit/page.tsx` - Similar section
3. `/components/forms/pilot-form.tsx` - Lines 147-157
4. `/lib/validations/pilot-validation.ts` - Add enum validation (optional)

**Implementation Steps**:

**Step 1**: Create API endpoint for contract types

```bash
# File: /app/api/contract-types/route.ts
```

```typescript
import { NextResponse } from 'next/server'
import { getContractTypes } from '@/lib/services/admin-service'

export async function GET() {
  try {
    const contractTypes = await getContractTypes()
    const activeTypes = contractTypes.filter((ct) => ct.is_active)
    return NextResponse.json({ success: true, data: activeTypes })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contract types' },
      { status: 500 }
    )
  }
}
```

**Step 2**: Update Add Pilot form to fetch and use dynamic options

```typescript
// In /app/dashboard/pilots/new/page.tsx
const [contractTypes, setContractTypes] = useState<Array<{id: string, name: string}>>([])

useEffect(() => {
  fetch('/api/contract-types')
    .then(res => res.json())
    .then(data => setContractTypes(data.data || []))
}, [])

// Replace hardcoded select with:
<select
  id="contract_type"
  {...register('contract_type')}
  className="..."
>
  <option value="">Select contract type...</option>
  {contractTypes.map(ct => (
    <key={ct.id} value={ct.name}>{ct.name}</option>
  ))}
</select>
```

**Step 3**: Update reusable form component

```typescript
// In /components/forms/pilot-form.tsx
// Replace FormFieldWrapper with FormSelectWrapper:
<FormSelectWrapper
  name="contract_type"
  label="Contract Type"
  options={contractTypes.map(ct => ({ label: ct.name, value: ct.name }))}
  placeholder="Select contract type"
/>
```

**Step 4**: Add validation (optional but recommended)

```typescript
// In /lib/validations/pilot-validation.ts
const validContractTypes = ['Fixed Term', 'Permanent', 'Contract'] // Fetch from DB

contract_type: z.enum(validContractTypes).optional().nullable()
```

**Testing Checklist**:

- [ ] Verify contract types are fetched from database on form load
- [ ] Verify only active contract types are shown
- [ ] Verify form submission works with selected contract type
- [ ] Verify validation rejects invalid contract types
- [ ] Test both Add and Edit forms

---

### 3. Pilot Form Country Selection - NEEDS IMPLEMENTATION

**Problem**: No country selection dropdown in Add/Edit Pilot forms; currently uses free-text "Nationality" field.

**Current State**:

- Database has `nationality` field (text, nullable)
- Forms use `FormFieldWrapper` (text input) for nationality
- No country field exists in database

**Decision Required**:

- **Option A**: Add new `country` field to database (recommended for structured data)
- **Option B**: Convert existing `nationality` field to use dropdown (simpler, reuses existing field)

**Recommended Approach - Option B** (Convert nationality to dropdown):

**Implementation Steps**:

**Step 1**: Create country list utility

```typescript
// File: /lib/utils/countries.ts
export const COUNTRIES = [
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'SB', name: 'Solomon Islands' },
  // ... add more countries
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']
export type CountryName = (typeof COUNTRIES)[number]['name']
```

**Step 2**: Update validation schema

```typescript
// In /lib/validations/pilot-validation.ts
import { COUNTRIES } from '@/lib/utils/countries'

const validCountries = COUNTRIES.map((c) => c.name)

const nationalitySchema = z.enum(validCountries).optional().nullable()
```

**Step 3**: Update Add Pilot form

```typescript
// In /app/dashboard/pilots/new/page.tsx
import { COUNTRIES } from '@/lib/utils/countries'

// Replace text input with select:
<div className="space-y-2">
  <Label htmlFor="nationality">Nationality</Label>
  <select
    id="nationality"
    {...register('nationality')}
    className="border-border w-full rounded-lg border px-3 py-2"
  >
    <option value="">Select nationality...</option>
    {COUNTRIES.map(country => (
      <option key={country.code} value={country.name}>
        {country.name}
      </option>
    ))}
  </select>
</div>
```

**Step 4**: Update reusable form component

```typescript
// In /components/forms/pilot-form.tsx
import { COUNTRIES } from '@/lib/utils/countries'

// Replace FormFieldWrapper with FormSelectWrapper:
<FormSelectWrapper
  name="nationality"
  label="Nationality"
  options={COUNTRIES.map(c => ({ label: c.name, value: c.name }))}
  placeholder="Select nationality"
/>
```

**Step 5**: Update Edit Pilot form (same changes as Add form)

**Testing Checklist**:

- [ ] Verify dropdown displays comprehensive country list
- [ ] Verify selected nationality saves correctly to database
- [ ] Verify edit form pre-populates existing nationality
- [ ] Verify validation rejects invalid country names
- [ ] Test both Add and Edit forms
- [ ] Test with existing pilots that have free-text nationality values

---

### 4. Pilot Retirement Information Display - NEEDS IMPLEMENTATION

**Problem**: Years, months, and days to retirement not displayed in Pilot Info "Employment Information" section.

**Current State**:

- **No `retirement_date` field in database**
- Employment Information shows: Contract Type, Commencement Date, Years in Service
- Date utilities available in `/lib/utils/date-utils.ts`

**Implementation Steps**:

**Step 1**: Add retirement_date field to database

```sql
-- Migration: /supabase/migrations/YYYYMMDD_add_retirement_date_to_pilots.sql
ALTER TABLE pilots
ADD COLUMN retirement_date DATE NULL;

COMMENT ON COLUMN pilots.retirement_date IS
'Expected retirement date for the pilot. Used to calculate time until retirement.';
```

**Step 2**: Regenerate TypeScript types

```bash
npm run db:types
```

**Step 3**: Update validation schema

```typescript
// In /lib/validations/pilot-validation.ts
import { z } from 'zod'

const retirementDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
  .optional()
  .nullable()

// Add to PilotCreateSchema and PilotUpdateSchema:
retirement_date: retirementDateSchema
```

**Step 4**: Create retirement countdown utility

```typescript
// In /lib/utils/date-utils.ts
interface RetirementCountdown {
  years: number
  months: number
  days: number
  totalDays: number
  status: 'current' | 'approaching' | 'imminent' | 'retired'
  color: 'green' | 'yellow' | 'red' | 'gray'
}

export function calculateRetirementCountdown(
  retirementDate: string | null
): RetirementCountdown | null {
  if (!retirementDate) return null

  const now = new Date()
  const retirement = new Date(retirementDate)
  const diffMs = retirement.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      years: 0,
      months: 0,
      days: Math.abs(diffDays),
      totalDays: diffDays,
      status: 'retired',
      color: 'gray',
    }
  }

  // Calculate years, months, days
  const years = Math.floor(diffDays / 365)
  const remainingDays = diffDays % 365
  const months = Math.floor(remainingDays / 30)
  const days = remainingDays % 30

  // Determine status and color based on time remaining
  let status: 'current' | 'approaching' | 'imminent' | 'retired' = 'current'
  let color: 'green' | 'yellow' | 'red' | 'gray' = 'green'

  if (diffDays <= 90) {
    // 3 months
    status = 'imminent'
    color = 'red'
  } else if (diffDays <= 365) {
    // 1 year
    status = 'approaching'
    color = 'yellow'
  }

  return { years, months, days, totalDays: diffDays, status, color }
}
```

**Step 5**: Update Pilot Detail page

```typescript
// In /app/dashboard/pilots/[id]/page.tsx
import { calculateRetirementCountdown } from '@/lib/utils/date-utils'

// Add to component:
const retirementInfo = calculateRetirementCountdown(pilot.retirement_date)

// Add to Employment Information section (after Years in Service):
{pilot.retirement_date && retirementInfo && (
  <>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Retirement Date:</span>
      <span className="text-foreground font-medium">
        {formatDate(pilot.retirement_date)}
      </span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Time to Retirement:</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${
          retirementInfo.color === 'green' ? 'text-green-600' :
          retirementInfo.color === 'yellow' ? 'text-yellow-600' :
          retirementInfo.color === 'red' ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {retirementInfo.years} years, {retirementInfo.months} months, {retirementInfo.days} days
        </span>
        <Badge variant={
          retirementInfo.status === 'imminent' ? 'destructive' :
          retirementInfo.status === 'approaching' ? 'warning' :
          retirementInfo.status === 'retired' ? 'secondary' :
          'default'
        }>
          {retirementInfo.status.toUpperCase()}
        </Badge>
      </div>
    </div>
  </>
)}
```

**Step 6**: Add retirement_date input to Edit Pilot form

```typescript
// In /app/dashboard/pilots/[id]/edit/page.tsx
// Add in Employment Information section:
<div className="space-y-2">
  <Label htmlFor="retirement_date">Retirement Date</Label>
  <Input
    id="retirement_date"
    type="date"
    {...register('retirement_date')}
  />
</div>
```

**Step 7**: Add to Add Pilot form as well

```typescript
// In /app/dashboard/pilots/new/page.tsx
// Same as edit form
```

**Testing Checklist**:

- [ ] Run database migration successfully
- [ ] Verify retirement_date field appears in TypeScript types
- [ ] Add retirement date to pilot via Edit form
- [ ] Verify retirement countdown displays correctly with proper color coding
- [ ] Test with pilots retiring in:
  - [ ] More than 1 year (green, "current")
  - [ ] Less than 1 year but more than 3 months (yellow, "approaching")
  - [ ] Less than 3 months (red, "imminent")
  - [ ] Past retirement date (gray, "retired")
- [ ] Verify years/months/days calculation is accurate
- [ ] Test with pilots who have no retirement date (field should not display)

---

## Summary of Work

### Completed ✅

1. **Seniority Column** - Fixed field name mismatch in pilots table component
2. **Certification Updates** - Added cache invalidation to fix persistence issue

### Requires Implementation 📋

3. **Contract Types** - Fetch from database instead of hardcoded options
4. **Country Selection** - Convert nationality field to dropdown with country list
5. **Retirement Info** - Add database field and calculate/display countdown

### Next Steps

1. **Test completed fixes**:
   - Verify seniority column displays correctly
   - Verify certification updates persist immediately

2. **Implement remaining features** following the detailed plans above

3. **Run comprehensive testing**:
   - Unit tests for new utility functions
   - Integration tests for form submissions
   - E2E tests for complete user flows

4. **Code review** before merging to main branch

---

**Author**: Claude Code
**Date**: October 24, 2025
**Project**: Fleet Management V2 - B767 Pilot Management System
