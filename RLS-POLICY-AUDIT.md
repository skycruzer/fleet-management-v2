# RLS Policy Audit - Sprint 1 Days 3-4 (Task 4)

**Developer**: Maurice Rondeau
**Date**: October 27, 2025
**Sprint**: Sprint 1 Days 3-4 (Task 4)
**Status**: 🔄 **IN PROGRESS** - Manual audit required

---

## 📋 Audit Instructions

This audit requires manual execution in the Supabase SQL Editor. Follow these steps:

### Step 1: Run SQL Audit Script

1. Open Supabase Dashboard: https://app.supabase.com/project/wgdmgvonqysflwdiiols
2. Navigate to: **SQL Editor** → **New Query**
3. Copy contents of `/scripts/extract-rls-policies.sql`
4. Execute each section sequentially
5. Export results to this document

### Step 2: Analyze Results

Review the output for:
- ❌ **Critical Issues**: Tables without RLS, overly permissive policies
- ⚠️ **Warnings**: Public/anon role access, missing WITH CHECK clauses
- ✅ **Best Practices**: Proper role-based access control

### Step 3: Document Findings

Update sections below with actual database results.

---

## 🎯 Expected RLS Configuration

Based on codebase analysis, the following RLS policies **should** exist:

### Core Tables (CRUD Operations)

#### 1. `pilots` Table
**Expected Policies**:
- ✅ SELECT: Authenticated users can view all pilots
- ✅ INSERT: Admin/Manager roles only
- ✅ UPDATE: Admin/Manager roles only
- ✅ DELETE: Admin role only

**Security Requirements**:
- Pilots should NOT be able to modify their own records (prevent privilege escalation)
- Public/anon users should have NO access

#### 2. `pilot_checks` (Certifications) Table
**Expected Policies**:
- ✅ SELECT: Authenticated users can view certifications
- ✅ INSERT: Admin/Manager roles only
- ✅ UPDATE: Admin/Manager roles only
- ✅ DELETE: Admin role only

**Security Requirements**:
- Certification records must maintain audit trail
- Expiry dates must be validated

#### 3. `leave_requests` Table
**Expected Policies**:
- ✅ SELECT:
  - Pilots can view ONLY their own leave requests
  - Admin/Manager can view all leave requests
- ✅ INSERT:
  - Pilots can submit their own leave requests
  - Admin/Manager can create on behalf of pilots
- ✅ UPDATE:
  - Pilots can update ONLY their own PENDING requests
  - Admin/Manager can update any request
- ✅ DELETE:
  - Pilots can delete ONLY their own PENDING requests
  - Admin/Manager can delete any request

**Security Requirements**:
- **CRITICAL**: Pilots must ONLY access their own data
- Status changes (PENDING → APPROVED) must be restricted to Admin/Manager
- Approved requests must be immutable (no deletion)

#### 4. `an_users` (Pilot Portal Authentication) Table
**Expected Policies**:
- ✅ SELECT:
  - Users can view ONLY their own record
  - Admin can view all users
- ✅ INSERT: Admin only (or registration API with approval workflow)
- ✅ UPDATE:
  - Users can update ONLY their own non-sensitive fields
  - Admin can update all fields including roles
- ✅ DELETE: Admin only

**Security Requirements**:
- **CRITICAL**: Password hashes must NEVER be readable by users
- **CRITICAL**: Role field must ONLY be modifiable by Admin
- Prevent privilege escalation attacks

#### 5. `flight_requests` Table
**Expected Policies**:
- Similar to `leave_requests` - pilots access only their own data
- Admin/Manager can view/modify all requests

#### 6. `tasks` Table
**Expected Policies**:
- ✅ SELECT: Authenticated users
- ✅ INSERT: Authenticated users
- ✅ UPDATE: Task owner or Admin/Manager
- ✅ DELETE: Task owner or Admin

#### 7. `notifications` Table
**Expected Policies**:
- ✅ SELECT: Users can view ONLY their own notifications
- ✅ INSERT: System/Admin can create notifications
- ✅ UPDATE: Users can mark their own notifications as read
- ✅ DELETE: Users can delete their own notifications

### Reference Tables (Read-Only for Most Users)

#### 8. `check_types` Table
**Expected Policies**:
- ✅ SELECT: Authenticated users (read-only)
- ✅ INSERT/UPDATE/DELETE: Admin only

#### 9. `contract_types` Table
**Expected Policies**:
- ✅ SELECT: Authenticated users (read-only)
- ✅ INSERT/UPDATE/DELETE: Admin only

### Audit/Logging Tables

#### 10. `audit_logs` Table
**Expected Policies**:
- ✅ SELECT: Admin/Manager only
- ✅ INSERT: System only (automated)
- ✅ UPDATE: Never allowed (immutable audit trail)
- ✅ DELETE: Never allowed (retention policy only)

---

## 🚨 Critical Security Checks

### 1. Pilot Data Isolation (HIGHEST PRIORITY)

**Tables Requiring Pilot Isolation**:
- `leave_requests` - Pilots must ONLY see their own requests
- `flight_requests` - Pilots must ONLY see their own requests
- `an_users` - Pilots must ONLY see their own user record
- `notifications` - Pilots must ONLY see their own notifications

**Test Query** (run for each table):
```sql
-- This should return ZERO rows if properly isolated
-- (when run as a pilot user, not admin)
SELECT COUNT(*)
FROM leave_requests
WHERE pilot_id != (SELECT id FROM pilots WHERE user_id = auth.uid());
```

### 2. Admin Role Protection

**Critical Fields That Must Be Protected**:
- `an_users.role` - Only Admin can modify
- `an_users.password_hash` - Never readable, only writable via secure API
- `pilots.status` - Only Admin/Manager can modify
- `leave_requests.status` - Only Admin/Manager can approve/deny

**Test**: Try updating these fields as a non-admin user - should FAIL

### 3. Audit Trail Immutability

**Audit tables must be append-only**:
- `audit_logs` - No UPDATE or DELETE allowed
- Approved `leave_requests` - Should be immutable
- Approved `flight_requests` - Should be immutable

### 4. Public/Anon Access

**Expected**: ZERO tables should allow public/anon access

**Test Query**:
```sql
-- This should return ZERO rows
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND ('public' = ANY(roles) OR 'anon' = ANY(roles));
```

---

## 📊 RLS Policy Analysis Template

Use this template to document each table's policies:

### Table: `[table_name]`

| Policy Name | Command | Roles | USING Clause | WITH CHECK | Status | Issues |
|-------------|---------|-------|--------------|------------|--------|--------|
| policy_name_1 | SELECT | authenticated | ... | N/A | ✅ / ⚠️ / ❌ | ... |
| policy_name_2 | INSERT | admin | ... | ... | ✅ / ⚠️ / ❌ | ... |

**Security Analysis**:
- ✅ Properly restricted
- ⚠️ Warning: [description]
- ❌ Issue: [description]

**Recommendations**:
- [Action items]

---

## 🔍 Common RLS Security Issues

### Issue 1: No RLS Enabled
**Severity**: 🔴 CRITICAL

**Problem**: Table has no RLS enabled - ALL users can access ALL rows

**Fix**:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Overly Permissive Policies
**Severity**: 🔴 CRITICAL

**Problem**: Policy has `USING (true)` or `USING (NULL)` - no restrictions

**Example**:
```sql
-- ❌ BAD: Everyone can see everything
CREATE POLICY "anyone_can_read" ON leave_requests
  FOR SELECT TO authenticated
  USING (true);
```

**Fix**:
```sql
-- ✅ GOOD: Pilots see only their own data
CREATE POLICY "pilots_read_own" ON leave_requests
  FOR SELECT TO authenticated
  USING (pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid()));
```

### Issue 3: Missing WITH CHECK Clauses
**Severity**: ⚠️ WARNING

**Problem**: INSERT/UPDATE policies without WITH CHECK allow data integrity violations

**Example**:
```sql
-- ❌ BAD: User could insert data they can't later read
CREATE POLICY "insert_requests" ON leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- Too permissive
```

**Fix**:
```sql
-- ✅ GOOD: User can only insert their own data
CREATE POLICY "insert_own_requests" ON leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid()));
```

### Issue 4: DELETE Without Restrictions
**Severity**: 🔴 CRITICAL

**Problem**: Users can delete any row

**Fix**: Add proper USING clause to restrict deletions

### Issue 5: Role Confusion
**Severity**: 🔴 CRITICAL

**Problem**: Policy applies to wrong role (e.g., public instead of authenticated)

**Fix**: Review all role assignments in policies

### Issue 6: Missing Status Checks
**Severity**: ⚠️ WARNING

**Problem**: Users can modify approved/completed records

**Example**:
```sql
-- ❌ BAD: Users can modify approved requests
CREATE POLICY "update_own" ON leave_requests
  FOR UPDATE TO authenticated
  USING (pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid()));
```

**Fix**:
```sql
-- ✅ GOOD: Users can only modify PENDING requests
CREATE POLICY "update_own_pending" ON leave_requests
  FOR UPDATE TO authenticated
  USING (
    pilot_id = (SELECT id FROM pilots WHERE user_id = auth.uid())
    AND status = 'PENDING'
  );
```

---

## ✅ RLS Best Practices

### 1. Principle of Least Privilege
- Grant minimum necessary access
- Default DENY, explicit ALLOW
- Separate policies for different operations (SELECT, INSERT, UPDATE, DELETE)

### 2. Role-Based Access Control
- `authenticated` - Logged-in users
- `admin` - Administrators only
- `manager` - Managers and admins
- Custom roles for specific permissions

### 3. Audit Trail Protection
- Audit tables should be INSERT-only
- No UPDATE or DELETE on audit logs
- Approved records should be immutable

### 4. Performance Considerations
- Keep USING clauses simple
- Use indexes on columns referenced in policies
- Test policy performance with EXPLAIN ANALYZE

### 5. Testing
- Test each policy with different user roles
- Verify isolation between users
- Check edge cases (NULL values, empty results)

---

## 🧪 RLS Testing Checklist

### Test 1: Pilot Data Isolation
- [ ] Pilot A cannot see Pilot B's leave requests
- [ ] Pilot A cannot modify Pilot B's leave requests
- [ ] Pilot A cannot delete Pilot B's leave requests
- [ ] Pilot A can see ONLY their own data

### Test 2: Admin Access
- [ ] Admin can view all pilots' data
- [ ] Admin can modify all records
- [ ] Admin can approve/deny requests
- [ ] Admin can access audit logs

### Test 3: Role Protection
- [ ] Pilot cannot change their own role
- [ ] Pilot cannot access admin functions
- [ ] Pilot cannot modify password_hash directly
- [ ] Pilot cannot escalate privileges

### Test 4: Status Protection
- [ ] Pilot cannot modify APPROVED requests
- [ ] Pilot cannot delete APPROVED requests
- [ ] Only Admin/Manager can change status
- [ ] Status changes are audited

### Test 5: Public Access
- [ ] No public/anon access to any table
- [ ] Authentication required for all operations
- [ ] Proper error messages (not data leakage)

---

## 📝 Manual Audit Results

*Note: This section should be filled in after running the SQL audit script*

### Tables Analyzed

| Table Name | RLS Enabled | Policy Count | Status |
|------------|-------------|--------------|--------|
| pilots | ? | ? | ⏳ Pending |
| pilot_checks | ? | ? | ⏳ Pending |
| leave_requests | ? | ? | ⏳ Pending |
| an_users | ? | ? | ⏳ Pending |
| *...add all tables...* | | | |

### Critical Issues Found

*To be completed after audit*

1. 🔴 **Issue 1**: [Description]
   - **Impact**: [Severity]
   - **Action**: [Fix]

### Warnings

*To be completed after audit*

1. ⚠️ **Warning 1**: [Description]
   - **Impact**: [Severity]
   - **Action**: [Recommendation]

---

## 🔧 Recommended Fixes

### Priority 1: Critical Security Issues

*To be populated based on audit findings*

### Priority 2: Warnings and Improvements

*To be populated based on audit findings*

### Priority 3: Performance Optimizations

*To be populated based on audit findings*

---

## 📚 Reference

### Supabase RLS Documentation
- https://supabase.com/docs/guides/auth/row-level-security
- https://supabase.com/docs/guides/auth/managing-user-data

### PostgreSQL RLS Documentation
- https://www.postgresql.org/docs/current/ddl-rowsecurity.html

### Security Resources
- OWASP Access Control Cheat Sheet
- NIST RBAC Model

---

## 🎯 Next Steps

1. **Run SQL Audit Script** (`scripts/extract-rls-policies.sql` in Supabase SQL Editor)
2. **Document Findings** (fill in tables above with actual results)
3. **Identify Critical Issues** (prioritize fixes)
4. **Create Fix Scripts** (SQL migrations to fix issues)
5. **Test Fixes** (verify security with test suite)
6. **Deploy to Production** (after thorough testing)

---

**Status**: ⏳ AWAITING MANUAL AUDIT

Run the SQL script in Supabase SQL Editor and update this document with findings.

**Last Updated**: October 27, 2025
**Document Version**: 1.0
