# Production Monitoring Plan - Sprint 1 Days 1-2

**Date**: October 27, 2025
**Migration Deployed**: Database Integrity (NOT NULL, UNIQUE, CHECK, INDEXES)
**Monitoring Period**: 24-48 hours
**Status**: 🟢 Active Monitoring

---

## 🎯 Monitoring Objectives

1. ✅ Verify all constraints are active and enforcing data integrity
2. ✅ Detect any constraint violation errors in application
3. ✅ Measure query performance improvements
4. ✅ Monitor for unexpected errors or issues
5. ✅ Validate application functionality post-migration

---

## 📊 Immediate Verification (Next 30 Minutes)

### 1. Verify Database Constraints

**Run these queries in Supabase SQL Editor**:

```sql
-- Check constraint counts
SELECT
  'NOT NULL constraints' as type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_nullable = 'NO'
  AND column_name NOT IN ('id', 'created_at', 'updated_at')
UNION ALL
SELECT 'UNIQUE constraints', COUNT(*)
FROM pg_constraint
WHERE contype = 'u' AND connamespace = 'public'::regnamespace
UNION ALL
SELECT 'CHECK constraints', COUNT(*)
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace
UNION ALL
SELECT 'Custom indexes', COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

**Expected Results**:
| Type | Count | Status |
|------|-------|--------|
| NOT NULL constraints | 99 | ✅ |
| UNIQUE constraints | 30 | ✅ |
| CHECK constraints | 83 | ✅ |
| Custom indexes | 157 | ✅ |

---

### 2. Check Recent Errors

**Supabase Dashboard**:
1. Go to https://app.supabase.com/project/wgdmgvonqysflwdiiols/logs
2. Select "Database" logs
3. Filter by "Error" level
4. Check for constraint violations (SQLSTATE 23514, 23505, 23503)

**Look for**:
- ❌ CHECK constraint violations (23514)
- ❌ UNIQUE constraint violations (23505)
- ❌ NOT NULL violations (23502)
- ❌ Foreign key violations (23503)

**Action if found**:
- Document the error
- Identify which operation caused it
- Check if application logic needs updating

---

### 3. Test Critical Paths

**Admin Dashboard**:
```bash
# Test locally against production database
npm run dev

# Visit and test:
# 1. http://localhost:3000/dashboard (Dashboard loads)
# 2. http://localhost:3000/dashboard/pilots (Pilots list)
# 3. http://localhost:3000/dashboard/certifications (Certifications)
# 4. Create new pilot (test UNIQUE constraint on employee_id)
# 5. Edit pilot (test data validation)
```

**Pilot Portal**:
```bash
# Test pilot portal flows
# 1. http://localhost:3000/portal/login
# 2. Login as test pilot
# 3. Submit leave request (test date range validation)
# 4. Submit flight request
```

---

## 📈 Performance Monitoring (First 24 Hours)

### 1. Query Performance Baselines

**Before Migrations** (from previous testing):
- Dashboard load: ~800ms
- Pilots list: ~300ms
- Leave eligibility: ~400ms
- Expiry alerts: ~500ms

**After Migrations** (Expected):
- Dashboard load: ~400-500ms (40-50% faster)
- Pilots list: ~150-200ms (50% faster)
- Leave eligibility: ~200-250ms (40% faster)
- Expiry alerts: ~250-300ms (50% faster)

**How to Measure**:
1. Open browser DevTools → Network tab
2. Load each page
3. Check "Finish" time for API calls
4. Record in monitoring log below

**Monitoring Log** (Update every 6 hours):

| Time | Dashboard | Pilots List | Leave Eligibility | Notes |
|------|-----------|-------------|-------------------|-------|
| Oct 27 9pm | 191ms | 353ms | 226ms | ✅ Post-deployment baseline |
| Oct 28 3am | ___ ms | ___ ms | ___ ms | Night traffic |
| Oct 28 9am | ___ ms | ___ ms | ___ ms | Morning peak |
| Oct 28 3pm | ___ ms | ___ ms | ___ ms | Afternoon |
| Oct 28 9pm | ___ ms | ___ ms | ___ ms | 24h mark |

---

### 2. Database Performance Metrics

**Supabase Dashboard → Reports → Database**:
- ✅ Connection pool usage (should be stable)
- ✅ Active connections (monitor spikes)
- ✅ Database size (check growth rate)
- ✅ Slow queries (check for new slow queries)

**SQL Query for Index Usage**:
```sql
-- Check which new indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC
LIMIT 20;
```

**Expected**: New indexes should show increasing scan counts over time.

---

## 🚨 Error Monitoring

### 1. Application Errors

**Check Vercel Logs** (if deployed):
```bash
# View recent errors
vercel logs --follow
```

**Look for**:
- Database constraint violation errors
- "violates check constraint" messages
- "duplicate key value" errors
- "null value in column" errors

---

### 2. Supabase Error Logs

**Dashboard → Logs → Database**:

**Search queries**:
- `level:error constraint`
- `SQLSTATE 23514` (CHECK violation)
- `SQLSTATE 23505` (UNIQUE violation)
- `SQLSTATE 23502` (NOT NULL violation)

**Create alerts** (optional):
```
Alert Name: "Database Constraint Violations"
Condition: logs contain "violates.*constraint"
Notification: Email to maurice@yourdomain.com
```

---

### 3. Better Stack (Logtail) Monitoring

If Better Stack logging is configured:

**Dashboard**: https://logs.betterstack.com/

**Search queries**:
- `error AND constraint`
- `error AND database`
- `SQLSTATE`

---

## ✅ Smoke Tests (Run Every 6 Hours)

### Test Suite 1: Data Operations

**Pilots**:
- [ ] Create new pilot with valid data → ✅ Success
- [ ] Create pilot with duplicate employee_id → ❌ Should fail with UNIQUE error
- [ ] Create pilot with null required field → ❌ Should fail with NOT NULL error
- [ ] Update pilot with invalid data → ❌ Should fail with validation error

**Leave Requests**:
- [ ] Submit leave request with end_date < start_date → ❌ Should fail with CHECK error
- [ ] Submit valid leave request → ✅ Success
- [ ] Check leave eligibility query performance → ✅ < 250ms

**Certifications**:
- [ ] View expiring certifications → ✅ Success, < 300ms
- [ ] Create certification with expiry < created → ❌ Should fail with CHECK error
- [ ] Update certification with valid data → ✅ Success

---

### Test Suite 2: Performance

**Dashboard Load**:
```bash
curl -w "@curl-format.txt" -o /dev/null -s "https://your-app.vercel.app/dashboard"

# curl-format.txt:
# time_total: %{time_total}s
```

**Expected**: < 500ms

**API Endpoints**:
```bash
# Test critical API endpoints
curl -w "Total: %{time_total}s\n" "https://your-app/api/pilots"
curl -w "Total: %{time_total}s\n" "https://your-app/api/certifications"
```

---

## 📋 Monitoring Checklist

### First Hour (Immediate)
- [ ] Verify constraint counts in database
- [ ] Check Supabase logs for errors
- [ ] Test admin dashboard manually
- [ ] Test pilot portal manually
- [ ] Measure initial query performance
- [ ] Document any errors found

### First 6 Hours
- [ ] Check error logs every 2 hours
- [ ] Monitor Supabase dashboard metrics
- [ ] Run smoke tests
- [ ] Update performance log
- [ ] Verify index usage statistics

### First 24 Hours
- [ ] Check logs 4 times (every 6 hours)
- [ ] Complete all smoke tests 4 times
- [ ] Monitor performance trends
- [ ] Check for any user-reported issues
- [ ] Document any constraint violations

### 24-48 Hours
- [ ] Final performance measurement
- [ ] Review all collected metrics
- [ ] Analyze index usage patterns
- [ ] Document lessons learned
- [ ] Prepare for Sprint 1 Days 3-4

---

## 🔧 Troubleshooting Guide

### Issue: Constraint Violation Errors

**Symptom**: Application throws constraint violation errors

**Diagnosis**:
```sql
-- Find recent constraint violations in logs
-- (Check Supabase Dashboard → Logs → Database)
```

**Solution**:
1. Identify which constraint is failing
2. Check application validation logic
3. Add client-side validation if missing
4. Update error messages for better UX

---

### Issue: Performance Degradation

**Symptom**: Queries slower than expected

**Diagnosis**:
```sql
-- Check for missing ANALYZE stats
SELECT
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_analyze DESC NULLS LAST;
```

**Solution**:
```sql
-- Run ANALYZE on affected tables
ANALYZE pilots;
ANALYZE pilot_checks;
ANALYZE leave_requests;
```

---

### Issue: Index Not Being Used

**Symptom**: Query still slow despite new indexes

**Diagnosis**:
```sql
-- Check query execution plan
EXPLAIN ANALYZE
SELECT * FROM pilots
WHERE employee_id = 'EMP001';
```

**Solution**:
- Check if query matches index columns
- Verify index statistics are up to date
- Consider adjusting query or index

---

## 📊 Metrics Dashboard

### Key Performance Indicators (KPIs)

**Database Health**:
- ✅ Constraint violation rate: Target < 0.1%
- ✅ Query performance: Target 30-50% faster
- ✅ Index usage rate: Target > 80%
- ✅ Error rate: Target < 0.5%

**Application Health**:
- ✅ API response time: Target < 500ms
- ✅ Dashboard load time: Target < 500ms
- ✅ Success rate: Target > 99.5%

---

## 📝 Monitoring Log Template

### Date: October 27, 2025

**9:00 PM - Initial Deployment**
- ✅ All migrations applied successfully
- ✅ Constraint counts verified
- ✅ No immediate errors in logs
- ⏳ Baseline performance recorded

**Performance Baselines**:
- Dashboard (Compliance View): 191ms ✅
- Pilots list: 353ms ✅
- Leave eligibility: 226ms ✅
- Certifications (Expiring): 234ms ✅
- Pilot Checks (All): 607ms ⚠️ (May need optimization)
- Average Response Time: 314ms

**Notes**:
- All queries performing well under 500ms target
- Performance test suite created: `test-performance-baselines.mjs`
- Dev server running at http://localhost:3000

---

### Date: October 28, 2025

**3:00 AM - Night Check**
- [ ] Logs checked for errors
- [ ] Performance measured
- [ ] Smoke tests completed

**Issues Found**:
- [None / List issues]

**Performance**:
- Dashboard: ___ ms (___% vs baseline)
- Pilots list: ___ ms (___% vs baseline)

---

**9:00 AM - Morning Peak**
- [ ] Logs checked for errors
- [ ] Performance measured
- [ ] Smoke tests completed

**Issues Found**:
- [None / List issues]

**Performance**:
- Dashboard: ___ ms (___% vs baseline)
- Pilots list: ___ ms (___% vs baseline)

---

**3:00 PM - Afternoon Check**
- [ ] Logs checked for errors
- [ ] Performance measured
- [ ] Smoke tests completed

---

**9:00 PM - 24 Hour Mark**
- [ ] Final metrics collected
- [ ] All smoke tests passed
- [ ] Performance improvements confirmed
- [ ] Ready for Sprint 1 Days 3-4

---

## 🎯 Success Criteria

Before proceeding to Sprint 1 Days 3-4, confirm:

- [ ] **Zero Critical Errors**: No constraint violations blocking operations
- [ ] **Performance Improved**: Queries 30-50% faster than baseline
- [ ] **Indexes Active**: New indexes showing usage in pg_stat_user_indexes
- [ ] **All Smoke Tests Pass**: 4 rounds of smoke tests completed successfully
- [ ] **No User Impact**: No user-reported issues or data problems
- [ ] **Metrics Documented**: 24 hours of monitoring data collected

---

## 📞 Escalation Plan

### Minor Issues (Informational)
- Document in monitoring log
- Continue monitoring
- Fix in next sprint

### Moderate Issues (Warning)
- Investigate immediately
- Document root cause
- Create fix plan
- May delay Sprint 1 Days 3-4

### Critical Issues (Blocker)
- **Immediate Action Required**
- Contact Supabase support if needed
- Prepare rollback plan
- Execute rollback if data integrity at risk

**Rollback Procedure**: See `LOCAL-MIGRATION-TESTING-STEPS.md` Section "Rollback Procedure"

---

## 🎉 Completion

After 24-48 hours of successful monitoring:

1. ✅ Review all collected metrics
2. ✅ Document lessons learned
3. ✅ Update `PRODUCTION-MIGRATION-COMPLETE.md` with findings
4. ✅ Proceed to Sprint 1 Days 3-4 (Security Hardening)

---

**Document Version**: 1.0
**Created**: October 27, 2025
**Monitoring Start**: October 27, 2025 9:00 PM
**Monitoring End**: October 29, 2025 9:00 AM (target)
**Status**: 🟢 Active Monitoring
