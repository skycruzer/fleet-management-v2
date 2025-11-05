# Quick Test Guide - Reports Fixes - November 3, 2025

**Time Required**: 10 minutes
**URL**: http://localhost:3000/dashboard/reports

---

## ✅ What Was Just Fixed

All 6 reports that had N/A data mapping issues:
1. Expiring Certifications ✅
2. Renewal Schedule ✅
3. All Certifications ✅
4. Flight Requests ✅
5. Leave Calendar Export ✅
6. Leave Request Summary ✅

---

## 🧪 Quick Test Checklist

### Test 1: Expiring Certifications (2 min)
```
1. Go to http://localhost:3000/dashboard/reports
2. Click "Expiring Certifications"
3. Click "Preview" button
4. ✅ Check: Do you see real pilot names? (e.g., "John Doe")
5. ✅ Check: Do you see real check types? (e.g., "Line Check")
6. ✅ Check: Do you see Employee IDs? (e.g., "P001")
7. ✅ Check: Do you see Ranks? (e.g., "Captain")
8. ❌ Verify: NO "N/A" values in Pilot Name or Check Type columns
```

**Expected Result**: All pilot data shows correctly with real names, not "N/A"

---

### Test 2: PDF Removed (1 min)
```
1. Browse any report
2. Look at format buttons (CSV, Excel, etc.)
3. ✅ Check: Is PDF button missing?
4. ✅ Check: Only CSV, Excel, JSON, iCal buttons show
```

**Expected Result**: PDF button is gone from all reports

---

### Test 3: Leave Calendar Export (2 min)
```
1. Go to http://localhost:3000/dashboard/reports
2. Click "Leave Calendar Export"
3. Click "Preview" button
4. ✅ Check: Do you see real pilot names?
5. ✅ Check: Do you see leave types? (e.g., "ANNUAL", "RDO")
6. ✅ Check: Do you see Employee IDs and Ranks?
```

**Expected Result**: Leave data shows correctly with pilot information

---

### Test 4: All Certifications (2 min)
```
1. Click "All Certifications Export"
2. Click "Preview" button
3. ✅ Check: Real pilot names show
4. ✅ Check: Check types show (e.g., "Line Check")
5. ✅ Check: Expiry dates show
6. ✅ Check: Status shows (e.g., "Current", "Expiring Soon")
7. ❌ Verify: NO columns for "Completion Date" or "Certificate Number"
```

**Expected Result**: Only valid columns show with real data

---

### Test 5: Flight Request Log (1 min)
```
1. Click "Flight Request Log"
2. Click "Preview" button
3. ✅ Check: Pilot names show
4. ✅ Check: Employee IDs and Ranks show
5. ✅ Check: Flight dates and types show
```

**Expected Result**: Flight request data shows correctly

---

### Test 6: Leave Request Summary (1 min)
```
1. Click "Leave Request Summary"
2. Click "Preview" button
3. ✅ Check: Pilot names show
4. ✅ Check: Leave types show (e.g., "ANNUAL")
5. ✅ Check: Dates and status show
```

**Expected Result**: Leave request summary data shows correctly

---

## 🐛 If You See Issues

### Issue: Still seeing "N/A" values
**Fix**:
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Restart dev server: `npm run dev`

### Issue: Console errors
**Check**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Note any error messages

### Issue: Preview button doesn't work
**Check**:
1. Verify dev server is running: http://localhost:3000
2. Check terminal for errors
3. Try refreshing the page

---

## ✅ Success Criteria

All tests pass if:
- ✅ All 6 reports show real pilot data (not "N/A")
- ✅ Employee IDs and Ranks show in all reports
- ✅ PDF button is removed from all reports
- ✅ No console errors when previewing reports
- ✅ Summary metrics show correct counts

---

## 📝 Report Test Results

Mark each test result:

- [ ] Expiring Certifications: ✅ Pass / ❌ Fail
- [ ] PDF Removed: ✅ Pass / ❌ Fail
- [ ] Leave Calendar Export: ✅ Pass / ❌ Fail
- [ ] All Certifications: ✅ Pass / ❌ Fail
- [ ] Flight Request Log: ✅ Pass / ❌ Fail
- [ ] Leave Request Summary: ✅ Pass / ❌ Fail

**Overall Status**: _______________

**Issues Found**: _______________

---

## 🚀 After Testing

### If All Tests Pass ✅
1. Great! All fixes are working
2. Can proceed to test remaining 13 reports
3. Ready to apply email settings migration
4. Safe to deploy these fixes

### If Tests Fail ❌
1. Note which reports failed
2. Document what data is still showing as "N/A"
3. Take screenshots of errors
4. Share findings for further investigation

---

**Test URL**: http://localhost:3000/dashboard/reports
**Dev Server Status**: Running ✅
**Time to Test**: 10 minutes
**Priority**: High - verify fixes before continuing
