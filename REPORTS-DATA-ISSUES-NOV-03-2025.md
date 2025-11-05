# Critical Reports Data Issues - November 3, 2025

**Date**: November 3, 2025
**Severity**: 🔴 CRITICAL - Reports showing N/A for all data
**Impact**: Users cannot trust report accuracy

---

## Issue #1: Expiring Certifications Report - All N/A Values

### Problem
The Expiring Certifications report preview shows:
- Pilot Name: N/A
- Check Type: N/A
- Completion Date: N/A
- Certificate Number: N/A

**Only working fields**: Expiry Date, Days Until Expiry, Status

### Root Cause
**File**: `app/api/reports/certifications/expiring/preview/route.ts` (lines 44-57)

The preview endpoint is trying to access properties that **don't exist** on the returned data:

```typescript
// WRONG - These properties don't exist
'Pilot Name': cert.pilot_name || 'N/A',           // ❌ Should be cert.pilot
'Check Type': cert.check_type_name || 'N/A',      // ❌ Should be cert.check_type
'Completion Date': cert.completion_date || 'N/A',  // ❌ Doesn't exist
'Certificate Number': cert.certificate_number || 'N/A', // ❌ Doesn't exist
```

**What the service actually returns** (`lib/services/certification-service.ts`):

```typescript
{
  ...cert,                    // Raw pilot_checks table data
  pilot: {                    // ✓ Nested pilot object
    id,
    first_name,
    last_name,
    employee_id,
    role
  },
  check_type: {               // ✓ Nested check_type object
    id,
    check_code,
    check_description,
    category
  },
  daysUntilExpiry,
  status: { color, label, daysUntilExpiry }
}
```

### Fix Required

**File**: `app/api/reports/certifications/expiring/preview/route.ts`

**Lines 44-57** need to be changed to:

```typescript
const previewData = certifications.slice(0, limit).map((cert) => {
  const expiryDate = new Date(cert.expiry_date)
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    'Pilot Name': cert.pilot
      ? `${cert.pilot.first_name} ${cert.pilot.last_name}`
      : 'N/A',
    'Check Type': cert.check_type?.check_description || cert.check_type?.check_code || 'N/A',
    'Completion Date': cert.completion_date || 'N/A',
    'Expiry Date': cert.expiry_date || 'N/A',
    'Days Until Expiry': daysUntilExpiry,
    'Status': daysUntilExpiry < 0 ? 'EXPIRED' : daysUntilExpiry <= 30 ? 'CRITICAL' : 'WARNING',
    'Certificate Number': cert.certificate_number || 'N/A',
  }
})
```

**Note**: The `pilot_checks` table may not have `completion_date` or `certificate_number` columns. Need to verify database schema.

---

## Issue #2: PDF Generation Not Working

### Problem
User reports: "pdf not generating too"

All PDF export buttons return **501 Not Implemented** errors.

### Root Cause
**Pattern**: All export endpoints in `app/api/reports/*/export/route.ts`

Every export endpoint has this defensive code:

```typescript
if (format === 'pdf') {
  return NextResponse.json(
    { error: 'PDF export not yet implemented' },
    { status: 501 }
  )
}
```

This was intentional defensive coding, but PDF option should either:
1. Be implemented
2. Be removed from UI until implemented

### Current Status
**Files Affected**: 19 export endpoints
- `/app/api/reports/fleet/*/export/route.ts` (5 files)
- `/app/api/reports/certifications/*/export/route.ts` (3 files)
- `/app/api/reports/leave/*/export/route.ts` (3 files)
- `/app/api/reports/operational/*/export/route.ts` (3 files)
- `/app/api/reports/system/*/export/route.ts` (5 files)

### Recommended Action
**Short-term**: Remove PDF option from reports config until implementation complete

**File**: `lib/config/reports-config.ts`

Change lines like:
```typescript
formats: ['csv', 'json', 'excel', 'pdf']  // Remove 'pdf'
```

To:
```typescript
formats: ['csv', 'json', 'excel']  // PDF coming soon
```

**Long-term**: Implement PDF generation using a library like `jsPDF` or `pdfmake`

---

## Issue #3: Comprehensive Report Data Verification Needed

### Problem
If Expiring Certifications report has data mapping issues, **other reports likely have similar problems**.

### Reports to Verify (19 total)

#### Fleet Reports (5)
1. ✅ Active Pilot Roster - **Verified working** (has complete preview endpoint)
2. ⏳ Pilot Demographics
3. ⏳ Seniority List
4. ⏳ Qualification Matrix
5. ⏳ Contract Type Distribution

#### Certification Reports (3)
6. ⚠️ Expiring Certifications - **BROKEN** (N/A values)
7. ⏳ Certification Compliance
8. ⏳ Renewal Schedule

#### Leave Reports (3)
9. ⏳ Leave Request Summary
10. ⏳ Leave Balance Report
11. ⏳ Annual Leave Planning

#### Operational Reports (3)
12. ⏳ Flight Request Log
13. ⏳ Task Management Summary
14. ⏳ Crew Availability

#### System Reports (5)
15. ⏳ Audit Log
16. ⏳ User Activity
17. ⏳ System Health
18. ⏳ Data Quality Report
19. ⏳ Retirement Forecast

### Testing Checklist

For each report, verify:
- [ ] Preview shows actual data (not N/A)
- [ ] All columns populated correctly
- [ ] Summary metrics accurate
- [ ] CSV export works
- [ ] JSON export works
- [ ] Excel export works
- [ ] Email button works (after email settings applied)
- [ ] Data matches database queries

---

## Database Schema Verification Needed

### pilot_checks Table Structure

Need to verify which columns actually exist:

```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pilot_checks'
ORDER BY ordinal_position;
```

**Expected columns** (based on types/supabase.ts):
- id (uuid)
- pilot_id (uuid)
- check_type_id (uuid)
- expiry_date (date, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

**Possibly missing columns**:
- completion_date (date?) - Used in preview but may not exist
- certificate_number (text?) - Used in preview but may not exist

If these columns don't exist, the preview endpoint should not try to display them.

---

## Immediate Action Items

### Priority 1: Fix Expiring Certifications Report
1. Update `app/api/reports/certifications/expiring/preview/route.ts`
2. Change property access from flat to nested objects
3. Verify database schema for missing columns
4. Test preview shows correct pilot names and check types

### Priority 2: Remove PDF from UI
1. Update `lib/config/reports-config.ts`
2. Remove 'pdf' from formats array for all 19 reports
3. Test that PDF button no longer appears

### Priority 3: Verify All Report Data
1. Test each of 19 reports systematically
2. Document which reports have data issues
3. Fix property mapping for each broken report
4. Create comprehensive test report

### Priority 4: Implement PDF Generation (Long-term)
1. Choose PDF library (jsPDF or pdfmake)
2. Create PDF service in `lib/services/pdf-service.ts`
3. Update all export endpoints to use PDF service
4. Re-add PDF to formats after implementation

---

## Test Results Log

### Expiring Certifications Report

**Date**: November 3, 2025
**Status**: ❌ BROKEN

| Field | Expected | Actual | Status |
|-------|----------|--------|--------|
| Pilot Name | "John Doe" | "N/A" | ❌ FAIL |
| Check Type | "Line Check" | "N/A" | ❌ FAIL |
| Completion Date | "2024-10-15" | "N/A" | ❌ FAIL |
| Expiry Date | "2025-11-05" | "2025-11-05" | ✅ PASS |
| Days Until Expiry | 2 | 2 | ✅ PASS |
| Status | "CRITICAL" | "CRITICAL" | ✅ PASS |
| Certificate Number | "ABC123" | "N/A" | ❌ FAIL |

**Root Cause**: Incorrect property mapping in preview endpoint
**Fix Required**: Update property access to use nested objects

---

## Code Examples

### Example 1: Correct Property Access

```typescript
// Service returns nested objects
const certifications = await getExpiringCertifications(90)

// certifications[0] structure:
{
  id: "uuid",
  pilot_id: "uuid",
  check_type_id: "uuid",
  expiry_date: "2025-11-05",
  pilot: {                      // ← NESTED OBJECT
    first_name: "John",
    last_name: "Doe",
    employee_id: "123",
    role: "Captain"
  },
  check_type: {                 // ← NESTED OBJECT
    check_code: "LC",
    check_description: "Line Check",
    category: "Operational"
  }
}

// CORRECT way to access:
const pilotName = `${cert.pilot.first_name} ${cert.pilot.last_name}`
const checkType = cert.check_type.check_description

// WRONG way (causes N/A):
const pilotName = cert.pilot_name  // ❌ Undefined
const checkType = cert.check_type_name  // ❌ Undefined
```

### Example 2: Safe Property Access with Optional Chaining

```typescript
// Use optional chaining for safety
const previewData = certifications.map((cert) => ({
  'Pilot Name': cert.pilot
    ? `${cert.pilot.first_name} ${cert.pilot.last_name}`
    : 'Unknown Pilot',
  'Check Type': cert.check_type?.check_description ||
                cert.check_type?.check_code ||
                'Unknown Check',
  'Employee ID': cert.pilot?.employee_id || 'N/A',
  'Rank': cert.pilot?.role || 'N/A',
}))
```

---

## Related Files

### Need to Fix
1. `app/api/reports/certifications/expiring/preview/route.ts` - Data mapping
2. `app/api/reports/certifications/expiring/export/route.ts` - Same issue
3. `app/api/reports/certifications/expiring/email/route.ts` - Same issue
4. Potentially 18+ other report endpoints

### Need to Update
1. `lib/config/reports-config.ts` - Remove PDF from formats

### Need to Verify
1. All 19 report preview endpoints
2. All 19 report export endpoints
3. All 19 report email endpoints

---

## Impact Assessment

### User Impact
- **High**: Users cannot generate accurate reports
- **Trust Issue**: Seeing "N/A" for all data makes reports unusable
- **Business Impact**: Cannot track expiring certifications accurately

### System Impact
- **Data Integrity**: Database data is fine, only display layer broken
- **Service Layer**: Working correctly
- **API Layer**: Broken property mapping

### Timeline
- **Immediate**: Fix Expiring Certifications (1 hour)
- **Short-term**: Remove PDF option (15 minutes)
- **Medium-term**: Fix all other reports (4-8 hours)
- **Long-term**: Implement PDF generation (8-16 hours)

---

**Status**: 🔴 CRITICAL - Reports system needs immediate attention
**Next Action**: Fix Expiring Certifications report property mapping
