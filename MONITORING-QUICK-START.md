# Production Monitoring - Quick Start Guide

**Status**: ✅ **All Constraints Verified Active**
**Date**: October 27, 2025, 9:00 PM

---

## ✅ Immediate Verification Results

### Database Constraints (ALL ACTIVE ✅)

| Type | Count | Expected | Status |
|------|-------|----------|--------|
| **NOT NULL constraints** | 99 | 99 | ✅ **PASS** |
| **UNIQUE constraints** | 30 | 30 | ✅ **PASS** |
| **CHECK constraints** | 83 | 45+ | ✅ **PASS** |
| **Custom indexes** | 157 | 157 | ✅ **PASS** |

### Critical Constraints Verified

- ✅ `chk_pilots_seniority_number_range` - Active on pilots table
- ✅ `uk_pilots_employee_id` - UNIQUE constraint active
- ✅ `chk_feedback_categories_display_order_positive` - CHECK constraint active

---

## 📊 What to Monitor (Next 24 Hours)

### 1. Check Supabase Logs (Every 6 Hours)

**URL**: https://app.supabase.com/project/wgdmgvonqysflwdiiols/logs

**What to look for**:
- ❌ Constraint violation errors (SQLSTATE 23514, 23505, 23502)
- ⚠️ Slow query warnings
- 🔴 Any ERROR level messages

**Recommended**: Set up email alerts for errors

---

### 2. Test Application Manually (Now)

```bash
# Start local dev server connected to production
npm run dev

# Test these critical paths:
# 1. Dashboard: http://localhost:3000/dashboard
# 2. Pilots list: http://localhost:3000/dashboard/pilots
# 3. Create pilot: Test UNIQUE constraint on employee_id
# 4. Certifications: http://localhost:3000/dashboard/certifications
# 5. Leave requests: Test date range validation
```

**Expected**: All pages load in < 500ms, validation works correctly

---

### 3. Performance Baselines

**Measure now and record**:

Open DevTools → Network → Reload:

| Page | Target | Your Result | Status |
|------|--------|-------------|--------|
| Dashboard | < 500ms | ___ ms | ⏳ |
| Pilots List | < 200ms | ___ ms | ⏳ |
| Certifications | < 300ms | ___ ms | ⏳ |
| Leave Requests | < 250ms | ___ ms | ⏳ |

**Goal**: 30-50% faster than before migrations

---

### 4. Smoke Tests (Run every 6 hours)

**Test 1: Data Validation**
```bash
# Create pilot with duplicate employee_id
# Expected: ❌ UNIQUE constraint error
```

**Test 2: Date Validation**
```bash
# Submit leave request with end_date < start_date
# Expected: ❌ CHECK constraint error
```

**Test 3: Seniority Validation**
```bash
# Create pilot with seniority_number = 0
# Expected: ❌ CHECK constraint error
```

All tests SHOULD fail with constraint errors (this proves they're working!)

---

## 🚨 What to Watch For

### Critical Issues (Take Action Immediately)

**1. Constraint Violation Blocking Operations**
- Symptom: Users can't submit valid data
- Check: Application validation logic
- Fix: Update client-side validation

**2. Performance Degradation**
- Symptom: Pages loading > 1 second
- Check: Supabase dashboard → Performance
- Fix: Run `ANALYZE` on tables

**3. High Error Rate**
- Symptom: Multiple constraint errors per minute
- Check: Which operations are failing
- Fix: Review validation logic

---

### Warning Issues (Monitor and Document)

**1. Occasional Constraint Errors**
- Expected: Some errors as users adjust to new validation
- Action: Document patterns, fix in next sprint

**2. Slow Queries**
- Check: Are new indexes being used?
- Action: Monitor and optimize if needed

---

## 📋 Monitoring Schedule

### Tonight (Oct 27, 9 PM - Midnight)

- [x] ✅ Run verification script
- [x] ✅ Verify constraints active
- [ ] 🔄 Test application manually
- [ ] 🔄 Record performance baselines
- [ ] 🔄 Check Supabase logs (11 PM)

### Tomorrow Morning (Oct 28, 9 AM)

- [ ] Check overnight logs
- [ ] Run smoke tests
- [ ] Measure performance
- [ ] Document any issues

### Tomorrow Afternoon (Oct 28, 3 PM)

- [ ] Check logs
- [ ] Run smoke tests
- [ ] Measure performance

### Tomorrow Evening (Oct 28, 9 PM - 24 Hour Mark)

- [ ] Final metrics collection
- [ ] Performance comparison
- [ ] Issue summary
- [ ] Decision: Continue to Days 3-4 or investigate issues

---

## ✅ Success Checklist (24 Hours)

Before proceeding to Sprint 1 Days 3-4:

- [ ] **Zero Critical Errors**: No blocking constraint violations
- [ ] **Performance Improved**: Queries 30-50% faster
- [ ] **All Smoke Tests Pass**: 4 rounds completed successfully
- [ ] **Logs Clean**: No unexpected errors
- [ ] **Metrics Documented**: 24 hours of data collected

---

## 🎯 Quick Commands

### Check Database Constraints
```bash
./verify-production-deployment.sh
```

### Check Supabase Logs
```bash
# Open dashboard
open "https://app.supabase.com/project/wgdmgvonqysflwdiiols/logs"
```

### Test Application
```bash
npm run dev
# Visit http://localhost:3000
```

### Check Migration Status
```bash
supabase migration list
```

---

## 📞 Need Help?

**If Critical Issues**:
1. Check `PRODUCTION-MONITORING-PLAN.md` for troubleshooting
2. Review `PRODUCTION-MIGRATION-COMPLETE.md` for what was deployed
3. See `LOCAL-MIGRATION-TESTING-STEPS.md` for rollback procedure

**If Performance Issues**:
```sql
-- Run ANALYZE to update statistics
ANALYZE pilots;
ANALYZE pilot_checks;
ANALYZE leave_requests;
```

---

## 🎉 Current Status

**✅ Deployment Complete**: All migrations successfully applied

**✅ Constraints Active**: 99 NOT NULL, 30 UNIQUE, 83 CHECK, 157 indexes

**🔄 Monitoring Started**: 24-48 hour monitoring period begins now

**Next Milestone**: Sprint 1 Days 3-4 (Security Hardening) after successful 24h monitoring

---

**Document Version**: 1.0
**Created**: October 27, 2025
**Status**: 🟢 Active Monitoring
**Next Review**: October 28, 2025 9:00 AM
