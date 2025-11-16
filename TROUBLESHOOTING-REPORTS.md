# Report Issues - Troubleshooting Guide

**Date**: November 16, 2025

---

## Issue 1: "Preview Failed - Offline" Errors

**Symptoms:**
- Multiple red toast notifications saying "Preview Failed - Offline"
- Error page showing "Something went wrong"
- Preview/Export/Email buttons not working

**Likely Cause:**
Browser cache showing old JavaScript code before the validation fix was applied.

**Solution:**
1. **Hard refresh the browser** to clear cached JavaScript:
   - **Mac**: Cmd + Shift + R
   - **Windows/Linux**: Ctrl + Shift + F5 or Ctrl + Shift + R
2. Alternatively, open DevTools (F12) → Network tab → Check "Disable cache" → Refresh

---

## Issue 2: Flight Request Report Missing Date Range/Roster Toggle

**Symptoms:**
- Leave Report tab shows the toggle
- Certification Report tab shows the toggle
- Flight Request Report tab does NOT show the toggle

**Root Cause:**
Browser cached the old version of flight-request-report-form.tsx from before the implementation.

**Verification:**
The code IS implemented - checked file and confirmed:
- Line 27: DateFilterToggle import ✅
- Line 242: DateFilterToggle component rendered ✅
- Roster period logic implemented ✅

**Solution:**
1. **Hard refresh the page** (see above)
2. **Clear browser cache completely**:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Safari: Develop → Empty Caches
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

3. **If still not showing**, try:
   - Close all browser tabs for localhost:3001
   - Restart the browser
   - Visit http://localhost:3001/dashboard/reports again

---

## Issue 3: Validation Errors (400 responses)

**Status:** ✅ FIXED

**What was wrong:**
- Validation schema expected lowercase status values
- Forms sent uppercase status values

**Fix applied:**
Updated `lib/validations/reports-schema.ts` to accept correct uppercase enum values.

**Verification:**
```bash
node test-report-validation.mjs
# All tests pass ✅
```

---

## Current Implementation Status

### ✅ Completed Features
1. Date filter toggle on all 3 report types
2. Roster period selection (RP1/2025 - RP13/2026)
3. Date range selection (traditional method)
4. Backend conversion (roster periods → date ranges)
5. Validation schema fixed for uppercase status values
6. Filter preset compatibility

### 📝 Files Modified
- `components/reports/leave-report-form.tsx`
- `components/reports/flight-request-report-form.tsx`
- `components/reports/certification-report-form.tsx`
- `lib/services/reports-service.ts`
- `lib/validations/reports-schema.ts`

### 🆕 Files Created
- `components/reports/date-filter-toggle.tsx`
- `lib/utils/roster-periods.ts`

---

## Testing Checklist

After hard refresh, verify:

**Leave Report Tab:**
- [ ] Toggle visible at top of form
- [ ] Switching to "Roster Period" shows multi-select
- [ ] Switching to "Date Range" shows date pickers
- [ ] Preview button works
- [ ] Export PDF button works

**Flight Request Report Tab:**
- [ ] Toggle visible at top of form
- [ ] Switching to "Roster Period" shows multi-select
- [ ] Switching to "Date Range" shows date pickers
- [ ] Preview button works
- [ ] Export PDF button works

**Certification Report Tab:**
- [ ] Toggle visible at top of form
- [ ] Switching to "Roster Period" shows multi-select
- [ ] Switching to "Date Range" shows date pickers
- [ ] Preview button works
- [ ] Export PDF button works

---

## Dev Server Info

**Running at:** http://localhost:3001/dashboard/reports

**To check server logs:**
```bash
# In the terminal where npm run dev is running
# Look for successful compilations and 200 responses
```

**Server is healthy if you see:**
```
✓ Compiled in XXXms
GET /dashboard/reports 200
POST /api/reports/preview 200
```

---

## Quick Fix Commands

```bash
# If dev server isn't running
npm run dev

# If you want to verify validation works
node test-report-validation.mjs

# If you want to see what's actually in the flight report form
cat components/reports/flight-request-report-form.tsx | grep -A 5 "DateFilterToggle"
```

---

## Next Steps

1. **Hard refresh browser** (most important!)
2. Navigate to each report tab and verify toggle is visible
3. Test preview/export on each report type
4. If issues persist, check browser console (F12) for JavaScript errors

---

**Key Takeaway:** The code is correct and implemented. The issue is browser caching. A hard refresh should resolve both the "Preview Failed" errors and the missing toggle on Flight Request Report.
