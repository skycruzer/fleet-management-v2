# Deployment Troubleshooting - November 2, 2025

**Developer**: Maurice Rondeau
**Status**: 🔴 DEPLOYMENT FAILING
**Issue**: TypeScript type mismatch in FlightRequestForm

---

## ❌ Current Deployment Status

**Latest Attempts**: All failing with TypeScript error

- Commit `3a7a862`: Failed - Type mismatch
- Commit `3ace8a7`: Failed - Type mismatch (with type assertion)

**Error from Vercel**:

```
Type error: Type '"ADDITIONAL_FLIGHT"' is not assignable to type
'"REQUEST_FLIGHT" | "REQUEST_DAY_OFF" | "REQUEST_SUBSTITUTE_DAY_OFF" | "REQUEST_OTHER_DUTY" | undefined'.
```

---

## 🔍 Investigation Summary

### What We've Checked

1. ✅ **Local Build**: Passes successfully
2. ✅ **TypeScript Check**: No errors locally
3. ✅ **FlightRequestSchema**: Correct enum values (`ADDITIONAL_FLIGHT`, etc.)
4. ✅ **Source Code**: No references to old enum values found
5. ✅ **Database Types**: Regenerated from Supabase

### The Mystery

The error message references enum values (`REQUEST_FLIGHT`, `REQUEST_DAY_OFF`, etc.) that:

- **DO NOT exist** in the current codebase
- **ARE NOT** in `lib/validations/flight-request-schema.ts`
- **ARE NOT** in `types/supabase.ts`
- **ARE NOT** in `components/pilot/FlightRequestForm.tsx`

### Possible Causes

1. **Vercel Build Cache**: Vercel may be using cached types from a previous deployment
2. **Database Schema Mismatch**: The actual database might have a CHECK constraint with old values
3. **Migration Needed**: Database enum needs to be updated
4. **Git Submodule Issue**: Vercel warns about failed git submodule fetch

---

## 🎯 Required Actions

### Option 1: Check Vercel Dashboard

**MUST DO**: Check the actual Vercel build logs in the dashboard:

1. Go to https://vercel.com/
2. Navigate to fleet-management-v2 project
3. Click on the latest failed deployment
4. View the full build logs
5. Look for the exact TypeScript error and file/line number

### Option 2: Check Database Schema

The database might have a CHECK constraint enforcing old enum values:

```sql
-- Run this in Supabase SQL Editor:
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'flight_requests'::regclass
  AND contype = 'c'  -- CHECK constraints
;
```

If there's a CHECK constraint with the old values, we need to drop it:

```sql
-- ONLY RUN IF CONSTRAINT EXISTS WITH OLD VALUES:
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

-- Then add new constraint with correct values:
ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
CHECK (request_type IN (
  'ADDITIONAL_FLIGHT',
  'ROUTE_CHANGE',
  'SCHEDULE_PREFERENCE',
  'TRAINING_FLIGHT',
  'OTHER'
));
```

### Option 3: Clear Vercel Build Cache

In Vercel Dashboard:

1. Go to Project Settings
2. Click "Clear Build Cache"
3. Trigger new deployment

### Option 4: Force Fresh Build

```bash
# Add empty commit to force rebuild
git commit --allow-empty -m "chore: force Vercel rebuild

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

## 📝 Changes Made

### Commit 3a7a862 (First Attempt)

```typescript
// Changed in FlightRequestForm.tsx:
- request_date → flight_date (field name)
- REQUEST_FLIGHT → ADDITIONAL_FLIGHT (default value)
- Updated enum options to match schema
```

### Commit 3ace8a7 (Second Attempt - with type assertion)

```typescript
// Added explicit type assertion:
defaultValues: {
  request_type: 'ADDITIONAL_FLIGHT' as FlightRequestInput['request_type'],
  // ...
}

// Also regenerated types/supabase.ts
```

---

## ✅ What's Working Locally

```bash
# These all pass:
npm run type-check  # ✅ No TypeScript errors
npm run lint        # ✅ Passes
npm run build       # ✅ Builds successfully (100+ routes)
```

**Local Build Output**: All 100+ routes build successfully with no errors.

---

## 🚨 Next Steps

1. **CHECK VERCEL DASHBOARD** - Get actual error from build logs
2. **CHECK DATABASE** - Verify schema constraints in Supabase
3. **CLEAR CACHE** - Try clearing Vercel build cache
4. **UPDATE SCHEMA** - If database has old enum, update it

---

## 📞 Support Resources

- **Vercel Dashboard**: https://vercel.com/
- **Supabase Dashboard**: https://app.supabase.com/project/wgdmgvonqysflwdiiols
- **GitHub Repo**: Check Actions for build status

---

_Last Updated: 2025-11-02_
_Status: Awaiting Vercel dashboard inspection_
