# TypeScript Errors - Fix Summary
**Author**: Maurice Rondeau
**Date**: November 9, 2025
**Status**: 27 errors need fixing

---

## Summary

The project currently has **27 TypeScript errors** that need to be resolved. While the build succeeds (Next.js build system is lenient), these errors indicate type safety issues that should be fixed.

---

## Errors by File

### 1. app/api/analytics/export/route.ts (5 errors)

**Issues**:
- Lines 18, 23, 79, 83: Missing `format` import from 'date-fns'
- Line 144: Buffer type conversion issue

**Fix**:
```typescript
// Add at top of file:
import { format } from 'date-fns'

// Line 144 - Fix Buffer conversion:
const responseBody = Buffer.isBuffer(exportResult.content)
  ? new Uint8Array(exportResult.content)
  : exportResult.content
```

---

### 2. lib/services/account-deletion-service.ts (17 errors)

**Issues**:
- Line 13: Missing export `logAuditEvent` from audit-service
- Multiple type errors with `an_users` table (pilot_id column doesn't exist in types)
- Lines 109, 253: `feedback` table not in Supabase types

**Root Cause**: Database types need regeneration

**Fix**:
```bash
npm run db:types
```

Then update imports:
```typescript
// Change line 13 from:
import { logAuditEvent } from '@/lib/services/audit-service'

// To:
import { createAuditLog } from '@/lib/services/audit-service'
```

---

### 3. lib/services/pilot-certification-service.ts (4 errors)

**Issues**:
- Lines 65, 202: Null handling for `expiry_date`
- Lines 79, 216: Type conversion issues with `check_types`

**Fix**:
```typescript
// Lines 65, 202 - Add null check:
const expiryDate = cert.expiry_date ? new Date(cert.expiry_date) : null
const daysUntilExpiry = expiryDate
  ? Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  : -999

// Lines 79, 216 - Fix type assertion:
return {
  ...cert,
  daysUntilExpiry,
  status,
  check_types: cert.check_types || null
} as PilotCertificationWithDetails
```

---

### 4. lib/services/pilot-portal-service.ts (1 error)

**Issue**:
- Line 685: Type incompatibility with `date_of_birth` (string | null vs string)

**Fix**:
```typescript
// Line 685 - Add null handling:
const pilotData = {
  ...pilot,
  date_of_birth: pilot.date_of_birth || '',
  commencement_date: pilot.commencement_date || ''
}
```

---

### 5. lib/services/export-service.ts (1 error)

**Issue**:
- Line 331: Callable type issue with ExportFormat

**Fix**:
```typescript
// Line 331 - Fix function call:
const formatFunction = formats[options.format]
if (typeof formatFunction === 'function') {
  return formatFunction(data, options)
}
```

---

## Quick Fix Script

Run these commands in order:

```bash
# 1. Regenerate database types
npm run db:types

# 2. Run type-check to see remaining errors
npm run type-check

# 3. Run build to verify
npm run build
```

---

## Reports Issue Investigation

You mentioned "leave request report doesn't seem to work". The reports page structure looks correct. Potential issues to check:

1. **API Route**: Check `/app/api/reports/export/route.ts` for errors
2. **Service Layer**: Check `/lib/services/reports-service.ts`
3. **Data Fetching**: The `LeaveReportForm` component may have issues

**Diagnostic Steps**:
1. Open browser console while on `/dashboard/reports`
2. Try generating a leave request report
3. Check Network tab for failed API calls
4. Check Console for JavaScript errors

---

## Priority Order

1. **HIGH**: Fix `account-deletion-service.ts` (17 errors) - Run `npm run db:types` first
2. **MEDIUM**: Fix `pilot-certification-service.ts` (4 errors) - Null handling
3. **MEDIUM**: Fix `analytics/export/route.ts` (5 errors) - Missing import
4. **LOW**: Fix `pilot-portal-service.ts` (1 error) - Type conversion
5. **LOW**: Fix `export-service.ts` (1 error) - Callable type

---

## Next Steps

1. Run `npm run db:types` to regenerate database types
2. Apply fixes listed above for each file
3. Run `npm run type-check` to verify fixes
4. Test reports functionality manually
5. Run `npm run build` to ensure production build succeeds

---

**Note**: The build currently succeeds despite these errors because Next.js build is configured to continue on type errors. However, these should be fixed for proper type safety.
