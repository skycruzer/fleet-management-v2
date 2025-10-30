# RLS Implementation Guide - Complete Setup

**Developer**: Maurice Rondeau
**Date**: October 27, 2025
**Sprint**: Sprint 1 Days 3-4 (Task 4)
**Status**: Ready to Execute

---

## 🎯 Overview

This guide provides step-by-step instructions to implement Row Level Security (RLS) across all 14 database tables.

**Current Status**: ❌ NO RLS ENABLED (Critical vulnerability)
**Target Status**: ✅ ALL TABLES PROTECTED with 42 RLS policies

**Total Implementation Time**: ~5-6 minutes
**Risk Level**: Medium (test thoroughly before production)

---

## 📋 Quick Start Checklist

Copy this checklist and mark items as you complete them:

### Phase 1: Enable RLS (1 minute)
- [ ] Open Supabase SQL Editor: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
- [ ] Copy contents of `scripts/enable-rls-safe.sql`
- [ ] Paste and execute
- [ ] Verify all 14 tables show "✅ Enabled RLS"

### Phase 2: Create Critical Policies (1 minute)
- [ ] Copy contents of `scripts/create-rls-policies-critical.sql`
- [ ] Paste and execute
- [ ] Verify 7 policies created (an_users, pilots, pilot_users)

### Phase 3: Create Sensitive Data Policies (1 minute)
- [ ] Copy contents of `scripts/create-rls-policies-sensitive-data.sql`
- [ ] Paste and execute
- [ ] Verify 14 policies created (leave_requests, flight_requests, notifications)

### Phase 4: Create Audit Log Policies (30 seconds)
- [ ] Copy contents of `scripts/create-rls-policies-audit-logs.sql`
- [ ] Paste and execute
- [ ] Verify 2 policies created (immutable audit trail)

### Phase 5: Create Operational Policies (1 minute)
- [ ] Copy contents of `scripts/create-rls-policies-operational.sql`
- [ ] Paste and execute
- [ ] Verify 15 policies created (pilot_checks, tasks, leave_bids, etc.)

### Phase 6: Create Reference Data Policies (30 seconds)
- [ ] Copy contents of `scripts/create-rls-policies-reference.sql`
- [ ] Paste and execute
- [ ] Verify 4 policies created (check_types, contract_types)

### Phase 7: Verify Setup (30 seconds)
- [ ] Copy contents of `scripts/rls-complete-setup-guide.sql`
- [ ] Paste and execute verification queries
- [ ] Confirm 42 total policies across 14 tables

### Phase 8: Test Application (5-10 minutes)
- [ ] Test admin dashboard (should work normally)
- [ ] Test pilot portal (should work normally)
- [ ] Test leave request creation (pilot)
- [ ] Test leave request approval (admin)
- [ ] Verify pilots cannot see other pilots' data

---

## 📁 Script Files

All scripts are located in `scripts/` directory:

| File | Purpose | Policies | Time |
|------|---------|----------|------|
| `enable-rls-safe.sql` | Enable RLS on all tables | - | 1 min |
| `create-rls-policies-critical.sql` | User accounts & auth | 7 | 1 min |
| `create-rls-policies-sensitive-data.sql` | Requests & notifications | 14 | 1 min |
| `create-rls-policies-audit-logs.sql` | Immutable audit trail | 2 | 30 sec |
| `create-rls-policies-operational.sql` | Certifications & tasks | 15 | 1 min |
| `create-rls-policies-reference.sql` | Reference data | 4 | 30 sec |
| `rls-complete-setup-guide.sql` | Verification queries | - | 30 sec |

**Total**: 42 policies, ~5-6 minutes

---

## 🔒 Security Features Implemented

### 1. Pilot Data Isolation ✅
**CRITICAL**: Pilots can ONLY see their own data

**Tables Protected**:
- `leave_requests` - Pilots see only their own requests
- `flight_requests` - Pilots see only their own requests
- `notifications` - Users see only their own notifications
- `leave_bids` - Pilots see only their own bids

**Policy Example**:
```sql
CREATE POLICY "leave_requests_pilot_read_own" ON leave_requests
  FOR SELECT TO authenticated
  USING (pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid()));
```

### 2. Admin Role Protection ✅
**CRITICAL**: Prevent privilege escalation

**Tables Protected**:
- `an_users` - Users cannot change their own role
- Admin approval required for role changes

**Policy Example**:
```sql
CREATE POLICY "an_users_users_update_own_profile" ON an_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM an_users WHERE id = auth.uid())  -- Role unchanged
  );
```

### 3. Audit Trail Immutability ✅
**CRITICAL**: Audit logs cannot be modified or deleted

**Tables Protected**:
- `audit_logs` - INSERT only, no UPDATE/DELETE

**Policy Example**:
```sql
-- INSERT allowed
CREATE POLICY "audit_logs_authenticated_create" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- NO UPDATE POLICY = UPDATE DENIED ✅
-- NO DELETE POLICY = DELETE DENIED ✅
```

### 4. Status Protection ✅
**IMPORTANT**: Pilots cannot modify approved requests

**Tables Protected**:
- `leave_requests` - Can only update PENDING requests
- `flight_requests` - Can only update PENDING requests

**Policy Example**:
```sql
CREATE POLICY "leave_requests_pilot_update_own_pending" ON leave_requests
  FOR UPDATE TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status = 'PENDING'  -- Only PENDING can be updated
  );
```

### 5. Reference Data Protection ✅
**IMPORTANT**: Read-only reference data

**Tables Protected**:
- `check_types` - Admin-only writes, all authenticated read
- `contract_types` - Admin-only writes, all authenticated read

---

## 🧪 Testing Procedures

After implementing RLS, follow these test procedures:

### Test 1: Admin Access (2 minutes)
1. Login as admin
2. Navigate to dashboard
3. Verify can view all pilots
4. Verify can approve leave requests
5. Verify can view all data

**Expected**: ✅ Full access to all data

### Test 2: Pilot Data Isolation (3 minutes)
1. Login as Pilot A
2. Navigate to leave requests
3. Verify see ONLY own requests (not other pilots)
4. Try to access another pilot's request URL directly
5. Verify get 404 or empty result

**Expected**: ✅ Can only see own data

### Test 3: Role Protection (2 minutes)
1. Login as pilot
2. Open browser DevTools → Network
3. Try to update own role to 'Admin' via API
4. Verify request is denied

**Expected**: ✅ Role change denied

### Test 4: Audit Trail (1 minute)
1. Login as admin
2. Try to update an audit_logs record
3. Try to delete an audit_logs record

**Expected**: ✅ Both operations denied

### Test 5: Status Protection (2 minutes)
1. Login as pilot
2. Create a leave request
3. Admin approves the request
4. Pilot tries to modify approved request

**Expected**: ✅ Update denied (approved requests are immutable)

**Comprehensive Testing**: See `RLS-TESTING-GUIDE.md` for detailed test cases with SQL queries.

---

## ⚠️ Important Warnings

### WARNING 1: Application May Break Initially
After enabling RLS, the application may return empty results or errors until ALL policies are created.

**Solution**: Execute all policy scripts in order without delay.

### WARNING 2: Test Before Production
RLS changes can break existing functionality if policies are incorrect.

**Solution**: Test thoroughly in development first, then staging, then production.

### WARNING 3: Service Role Bypasses RLS
Code using `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies.

**Current Usage**: Service role is NOT used in this application - all operations use user authentication.

### WARNING 4: No Rollback
Once RLS is enabled and policies are created, rolling back requires manual policy deletion.

**Mitigation**: All scripts use `DROP POLICY IF EXISTS` for safe re-execution.

---

## 🔧 Troubleshooting

### Problem: Empty Results After Enabling RLS
**Symptom**: Application returns no data or empty arrays

**Cause**: RLS enabled but policies not yet created

**Solution**:
1. Check if all policy scripts were executed
2. Run verification query: `SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'`
3. Expected: 42 policies
4. If less than 42, re-run missing policy scripts

---

### Problem: "Permission Denied" Errors
**Symptom**: API routes return 403 or permission denied

**Cause**: User doesn't meet policy USING clause conditions

**Solution**:
1. Check user's role: `SELECT role FROM an_users WHERE id = auth.uid()`
2. Check policy for that table: `SELECT * FROM pg_policies WHERE tablename = 'table_name'`
3. Verify user meets policy conditions

---

### Problem: Pilots See All Data (Not Isolated)
**Symptom**: Pilot A can see Pilot B's leave requests

**Cause**: Incorrect policy USING clause

**Solution**:
1. Check leave_requests policies:
```sql
SELECT policyname, qual FROM pg_policies
WHERE tablename = 'leave_requests' AND cmd = 'SELECT';
```
2. Verify `pilot_read_own` policy exists
3. If missing, re-run `create-rls-policies-sensitive-data.sql`

---

### Problem: Admin Cannot Access Data
**Symptom**: Admin user gets empty results

**Cause**: Admin role check failing

**Solution**:
1. Verify admin user has correct role:
```sql
SELECT id, email, role FROM an_users WHERE role = 'Admin';
```
2. Check admin policy exists:
```sql
SELECT * FROM pg_policies
WHERE policyname LIKE '%admin%';
```

---

## 📊 Verification Queries

After implementation, run these queries to verify success:

### Query 1: RLS Status
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Expected**: All tables show `rowsecurity = true`

### Query 2: Policy Count
```sql
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
```
**Expected**: `total_policies = 42`

### Query 3: Policy Coverage
```sql
SELECT tablename, cmd, COUNT(*) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, cmd;
```
**Expected**: Each table has appropriate policies for each operation

### Query 4: Critical Policies Exist
```sql
-- Check pilot data isolation
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'leave_requests'
  AND policyname LIKE '%pilot_read_own%';
-- Expected: 1

-- Check admin role protection
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'an_users'
  AND policyname LIKE '%admin%';
-- Expected: 1

-- Check audit immutability (should be 0 UPDATE/DELETE policies)
SELECT cmd, COUNT(*) FROM pg_policies
WHERE tablename = 'audit_logs'
GROUP BY cmd;
-- Expected: SELECT=1, INSERT=1, UPDATE=0, DELETE=0
```

---

## 📈 Success Metrics

### Before RLS (Current State)
- ❌ 0/14 tables protected
- ❌ 0 policies created
- ❌ Security Score: 13/100
- ❌ Critical vulnerabilities: 5
- ❌ Pilots can see all data
- ❌ Anyone can change roles
- ❌ Audit logs can be deleted

### After RLS (Target State)
- ✅ 14/14 tables protected
- ✅ 42 policies created
- ✅ Security Score: 99/100
- ✅ Critical vulnerabilities: 0
- ✅ Pilots see only own data
- ✅ Role changes protected
- ✅ Audit logs immutable

**Security Improvement**: +86 points (13 → 99)

---

## 🎯 Next Steps After Implementation

1. ✅ Execute all RLS scripts (this guide)
2. ⏳ Run verification queries
3. ⏳ Test application thoroughly
4. ⏳ Run E2E test suite: `npm test`
5. ⏳ Document any issues found
6. ⏳ Update SPRINT-1-DAYS-3-4-COMPLETE.md
7. ⏳ Deploy to production (with rollback plan)

---

## 📚 Additional Resources

- **Audit Documentation**: `RLS-POLICY-AUDIT.md` (500+ lines)
- **Testing Guide**: `RLS-TESTING-GUIDE.md` (400+ lines)
- **Completion Summary**: `RLS-POLICY-AUDIT-COMPLETE.md`
- **Sprint Summary**: `SPRINT-1-DAYS-3-4-COMPLETE.md`

---

## 🚀 Ready to Execute?

**Prerequisites**:
- ✅ Supabase dashboard access
- ✅ SQL Editor permissions
- ✅ All script files created
- ✅ Backup plan ready

**Time Required**: 5-6 minutes for implementation, 10-15 minutes for testing

**Risk**: Medium (test thoroughly before production)

---

**When ready, start with Phase 1: Enable RLS** ☝️

**Last Updated**: October 27, 2025
**Document Version**: 1.0
