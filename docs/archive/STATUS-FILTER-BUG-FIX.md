# Status Filter Bug - Fixed ✅

**Date**: November 11, 2025
**Developer**: Maurice Rondeau

---

## 🐛 Root Cause

**The database stores status values in UPPERCASE**, but the code was filtering with lowercase values.

### Database Values
```sql
status IN ('PENDING', 'APPROVED', 'REJECTED')  -- Actual database values
```

### Code Was Sending
```javascript
filters.status = ['pending', 'approved', 'rejected']  // ❌ Wrong case
```

### Result
**0 records** returned because `'pending' !== 'PENDING'`

---

## ✅ Fix Applied

### File 1: `components/reports/leave-report-form.tsx` (lines 116-118)

**Before**:
```typescript
if (values.statusPending) statuses.push('pending')
if (values.statusApproved) statuses.push('approved')
if (values.statusRejected) statuses.push('rejected')
```

**After**:
```typescript
if (values.statusPending) statuses.push('PENDING')
if (values.statusApproved) statuses.push('APPROVED')
if (values.statusRejected) statuses.push('REJECTED')
```

### File 2: `lib/validations/reports-schema.ts` (line 53)

**Before**:
```typescript
status: z.array(z.enum(['pending', 'approved', 'rejected'])).optional(),
```

**After**:
```typescript
status: z.array(z.enum(['PENDING', 'APPROVED', 'REJECTED', 'pending', 'approved', 'rejected'])).optional(),
```

*(Accepts both cases for backward compatibility)*

---

## 🧪 Testing Results

Ran diagnostic query (`debug-report-query.mjs`):

| Test | Result |
|------|--------|
| No filters | ✅ 20 records |
| Submission method filter | ✅ 20 records |
| **Status filter (lowercase)** | ❌ **0 records** ← BUG |
| **Status filter (UPPERCASE)** | ✅ **20 records** ← FIXED |
| Rank filter | ✅ 20 records |

---

## 📊 Sample Data Revealed

The diagnostic also showed:
- Most leave requests are in **RP13/2025** (November 2025)
- Only a few in **RP11/2025** (September 2025)
- **NO requests in RP1/2026 or RP2/2026** (those roster periods are in the future)

**This explains why selecting RP1/2026 showed 0 records** - the data simply doesn't exist yet for that roster period.

---

## ✅ What Now Works

1. **Status filter**: Now correctly filters by PENDING, APPROVED, REJECTED
2. **Submission method filter**: Already working (EMAIL, SYSTEM, ORACLE, LEAVE_BIDS)
3. **Rank filter**: Already working (Captain, First Officer)

---

## 🎯 To Test the Fix

**Option 1**: Select existing roster periods
- Clear date range
- Select **RP13/2025** (where most data is)
- Select all statuses
- Click Preview

**Option 2**: Remove roster period filter entirely
- Clear date range
- Clear roster periods
- Select statuses: Pending, Approved
- Select ranks: Captain, First Officer
- Select all submission methods
- Click Preview

This should now show all 20 leave requests!

---

## 📝 Additional Notes

The report form UI needs some improvements (see `REPORT-REDESIGN-PROPOSAL.md`), but the **core filtering now works**.

**Server**: Running on **http://localhost:3001** (port 3000 was in use)

Ready for you to test!
