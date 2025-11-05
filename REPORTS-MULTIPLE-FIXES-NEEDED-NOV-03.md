# Multiple Reports Need Data Mapping Fixes - November 3, 2025

**Date**: November 3, 2025
**Status**: 🔴 CRITICAL - 5+ Reports Have Same Issue

---

## 🔍 Reports with N/A Data Issues

Found **6 files** with incorrect property access patterns:

### Fixed ✅
1. `/app/api/reports/certifications/expiring/preview/route.ts` - **FIXED**
2. `/app/api/reports/certifications/renewal-schedule/preview/route.ts` - **FIXED**

### Need Fixing ⏳
3. `/app/api/reports/certifications/all/preview/route.ts`
4. `/app/api/reports/operational/flight-requests/preview/route.ts`
5. `/app/api/reports/leave/calendar-export/preview/route.ts`
6. `/app/api/reports/leave/request-summary/preview/route.ts`

### Already Correct ✅
- `/app/api/reports/certifications/compliance/route.ts` - Uses different service with flat structure

---

## 🔧 Fix Pattern

### Wrong Pattern (Causes N/A)
```typescript
'Pilot Name': cert.pilot_name || 'N/A',
'Check Type': cert.check_type_name || 'N/A',
'Completion Date': cert.completion_date || 'N/A',
'Certificate Number': cert.certificate_number || 'N/A',
```

### Correct Pattern
```typescript
'Pilot Name': (cert as any).pilot
  ? `${(cert as any).pilot.first_name} ${(cert as any).pilot.last_name}`
  : 'Unknown Pilot',
'Check Type': (cert as any).check_type?.check_description ||
              (cert as any).check_type?.check_code ||
              'Unknown Check',
'Employee ID': (cert as any).pilot?.employee_id || 'N/A',
'Rank': (cert as any).pilot?.role || 'N/A',
```

---

## 📋 Fix Checklist

### File 1: `/app/api/reports/certifications/all/preview/route.ts`

**Search for**:
```typescript
'Pilot Name': cert.pilot_name
'Check Type': cert.check_type_name
```

**Replace with**:
```typescript
'Pilot Name': (cert as any).pilot
  ? `${(cert as any).pilot.first_name} ${(cert as any).pilot.last_name}`
  : 'Unknown Pilot',
'Check Type': (cert as any).check_type?.check_description ||
              (cert as any).check_type?.check_code ||
              'Unknown Check',
'Employee ID': (cert as any).pilot?.employee_id || 'N/A',
```

---

### File 2: `/app/api/reports/operational/flight-requests/preview/route.ts`

**Check what properties it's trying to access**:
- May be trying to access `pilot_name` or `pilot_id`
- Should use nested `pilot` object if available

**Likely fix**:
```typescript
// If accessing pilot data:
'Pilot Name': (request as any).pilot
  ? `${(request as any).pilot.first_name} ${(request as any).pilot.last_name}`
  : 'Unknown Pilot',
'Employee ID': (request as any).pilot?.employee_id || 'N/A',
```

---

### File 3: `/app/api/reports/leave/calendar-export/preview/route.ts`

**Check what properties it's trying to access**:
- Likely accessing `pilot_name` from leave requests
- Should use nested `pilot` object

**Likely fix**:
```typescript
'Pilot Name': (leaveRequest as any).pilot
  ? `${(leaveRequest as any).pilot.first_name} ${(leaveRequest as any).pilot.last_name}`
  : 'Unknown Pilot',
'Employee ID': (leaveRequest as any).pilot?.employee_id || 'N/A',
'Rank': (leaveRequest as any).pilot?.role || 'N/A',
```

---

### File 4: `/app/api/reports/leave/request-summary/preview/route.ts`

**Same pattern as File 3** - leave requests with pilot data

---

## 🚀 Batch Fix Script

Create a script to fix all at once:

```bash
#!/bin/bash
# fix-report-property-access.sh

# Files to fix
FILES=(
  "app/api/reports/certifications/all/preview/route.ts"
  "app/api/reports/operational/flight-requests/preview/route.ts"
  "app/api/reports/leave/calendar-export/preview/route.ts"
  "app/api/reports/leave/request-summary/preview/route.ts"
)

# For each file, check what needs fixing
for file in "${FILES[@]}"; do
  echo "Checking: $file"
  grep -n "pilot_name\|check_type_name" "$file" || echo "  ✓ No issues found"
done
```

---

## 🧪 Testing After Fixes

For each fixed report:

1. **Navigate to Reports Page**:
   - http://localhost:3000/dashboard/reports

2. **Test Preview**:
   - Select the report
   - Click "Preview"
   - Verify all data shows (not N/A)

3. **Test Export**:
   - Select CSV or Excel
   - Click "Export"
   - Verify downloaded file has real data

4. **Document Results**:
   - Report Name: [name]
   - Preview Works: [ ] Yes [ ] No
   - Export Works: [ ] Yes [ ] No
   - Issues Found: [list any]

---

## 📊 Impact Assessment

### High Priority (User-Facing)
- Expiring Certifications - ✅ FIXED
- Renewal Schedule - ✅ FIXED
- Certification Compliance - ✅ Already correct
- All Certifications - ⏳ NEEDS FIX

### Medium Priority (Operational)
- Flight Request Log - ⏳ NEEDS FIX
- Leave Request Summary - ⏳ NEEDS FIX
- Leave Calendar Export - ⏳ NEEDS FIX

### Low Priority (Less Used)
- Other reports - ⏳ Need testing to identify issues

---

## 🔍 How to Find More Issues

### Method 1: Grep for Problematic Patterns
```bash
# Find files accessing pilot_name (wrong)
grep -r "pilot_name" app/api/reports --include="*.ts"

# Find files accessing check_type_name (wrong)
grep -r "check_type_name" app/api/reports --include="*.ts"

# Find files accessing completion_date (doesn't exist)
grep -r "completion_date" app/api/reports --include="*.ts"
```

### Method 2: Manual Testing
1. Go through all 19 reports
2. Test preview for each
3. Look for N/A values
4. Document which reports have issues

### Method 3: Check Service Layer
```bash
# See what properties services actually return
grep -A 20 "select(" lib/services/*-service.ts | grep "pilot:"
```

---

## 💡 Root Cause Analysis

### Why This Happened

1. **Task Agent Generated Code**: The report endpoints were generated by a Task agent
2. **Assumed Flat Structure**: Agent assumed data came back with flat properties
3. **Didn't Check Service Layer**: Agent didn't verify what services actually return
4. **No Type Checking**: Used `any` types, so TypeScript didn't catch the errors
5. **No Testing**: Generated code wasn't tested before delivery

### How to Prevent

1. **Always Check Service Layer**: Verify what data structure services return
2. **Use Proper Types**: Import and use actual types from service layer
3. **Test Generated Code**: Run manual tests on generated endpoints
4. **Add Integration Tests**: Create automated tests for report endpoints
5. **Code Review**: Review generated code for common issues

---

## 🎯 Action Plan

### Immediate (Today)
1. Fix remaining 4 preview endpoints
2. Test each fixed report in browser
3. Document results

### Short-Term (This Week)
1. Review all 19 reports systematically
2. Fix any other data mapping issues
3. Add TypeScript types to prevent future issues
4. Create integration tests

### Long-Term
1. Refactor report generation to use shared utilities
2. Create typed interfaces for all report data
3. Add automated testing for all reports
4. Improve code generation process

---

## 📝 Lessons Learned

### For Task Agents
- Don't assume data structure without checking
- Always verify service layer returns
- Test generated code before delivery
- Use proper TypeScript types

### For Human Review
- Check generated code carefully
- Test all user-facing features
- Verify data accuracy, not just "works"
- Look for patterns in errors

---

**Status**: ✅ 2 Fixed | ⏳ 4 Need Fixing | ⚠️ Unknown number of other issues
**Next Action**: Fix remaining 4 preview endpoints, then test all 19 reports systematically
