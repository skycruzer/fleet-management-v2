# RLS Quick Start Guide - 2 Steps Only

**Time Required**: 2 minutes
**Risk**: Medium (test after implementation)

---

## ⚡ Ultra-Fast Setup (2 Steps)

### Step 1: Enable RLS (30 seconds)
```bash
1. Open: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
2. Copy contents of: scripts/enable-rls-safe.sql
3. Paste → Execute
4. Verify: Should see "✅ Enabled RLS on: [table_name]" for 14 tables
```

### Step 2: Create All Policies (1 minute)
```bash
1. Copy contents of: scripts/create-all-rls-policies-COMPLETE-FIXED.sql
2. Paste → Execute
3. Verify: Should see query results showing policy counts
4. Should show: 38 total policies created
```

**Done!** Your database is now secured with RLS.

---

## ✅ Verify It Worked

Run this query in SQL Editor:
```sql
SELECT
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies p
     WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'an_users', 'pilots', 'pilot_users',
    'leave_requests', 'flight_requests', 'notifications',
    'audit_logs', 'pilot_checks', 'tasks',
    'leave_bids', 'disciplinary_matters',
    'check_types', 'contract_types'
  )
ORDER BY tablename;
```

**Expected Results**:
- All tables: `rls_enabled = true` ✅
- Most tables: `policy_count = 2-5` ✅
- Total policies across all tables: ~38 ✅

---

## 🧪 Quick Test

### Test 1: Admin Can Access Everything (1 minute)
```bash
1. Login to app as admin
2. Go to /dashboard/pilots
3. Should see all 27 pilots ✅
4. Go to /dashboard/leave-requests
5. Should see all leave requests ✅
```

### Test 2: Application Still Works (2 minutes)
```bash
1. Click around the dashboard
2. Open a few pilot profiles
3. View some certifications
4. Everything should load normally ✅
```

If both tests pass → **RLS is working correctly!**

---

## ⚠️ If Something Breaks

### Problem: Empty Results in Dashboard
**Cause**: Policies might be too restrictive

**Quick Fix**: Check your user role
```sql
SELECT id, email, role FROM an_users WHERE id = auth.uid();
```

Should return your user with role='Admin'. If not, update:
```sql
UPDATE an_users SET role = 'Admin' WHERE email = 'your-email@example.com';
```

### Problem: "Permission Denied" Errors
**Cause**: Policy logic issue

**Quick Fix**: Temporarily disable RLS on problem table:
```sql
ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;
```

Then debug the policy logic and re-enable:
```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

---

## 📊 What Was Created

| Category | Tables | Policies | Security Features |
|----------|--------|----------|-------------------|
| **Critical** | an_users, pilots, pilot_users | 7 | Role protection, privilege escalation prevention |
| **Sensitive** | leave_requests, flight_requests, notifications | 14 | Pilot data isolation, status protection |
| **Audit** | audit_logs | 2 | Immutable audit trail (no UPDATE/DELETE) |
| **Operational** | pilot_checks, tasks, leave_bids, disciplinary_matters | 11 | Admin/manager controls, task assignment |
| **Reference** | check_types, contract_types | 4 | Read-only for users, admin-only writes |

**Total**: 13 tables, 38 policies

---

## 🚀 Next Steps

After RLS is working:

1. ✅ Run full E2E tests: `npm test`
2. ✅ Test pilot portal isolation manually
3. ✅ Document any issues found
4. ✅ Update sprint completion docs

---

## 📚 Detailed Documentation

If you need more details:
- **Complete Guide**: `RLS-IMPLEMENTATION-GUIDE.md` (comprehensive 600+ line guide)
- **Testing Guide**: `RLS-TESTING-GUIDE.md` (400+ lines with SQL test queries)
- **Audit Documentation**: `RLS-POLICY-AUDIT.md` (500+ lines of expected policies)
- **Individual Scripts**: `scripts/create-rls-policies-*.sql` (if you want granular control)

---

**Status**: ✅ Ready to execute
**Last Updated**: October 27, 2025
**Version**: 1.0
