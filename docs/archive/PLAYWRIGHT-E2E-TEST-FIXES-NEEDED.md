# Playwright E2E Test Fixes Needed
**Date**: November 3, 2025
**Status**: ⚠️ Test Selector Mismatch Identified

---

## Issue Summary

Playwright E2E tests are failing because the test selectors don't match the actual report IDs in the configuration.

### Root Cause

The E2E tests (`e2e/reports.spec.ts`) use incorrect `data-report` selectors that don't match the actual report IDs defined in `/lib/config/reports-config.ts`.

---

## Report ID Mismatches

### Certification Reports

| E2E Test Selector | Actual Report ID | Status |
|-------------------|------------------|--------|
| `certifications-all` | `all-certifications` | ❌ MISMATCH |
| `certifications-expiring` | `expiring-certifications` | ❌ MISMATCH |
| `certifications-compliance` | `compliance-summary` | ❌ MISMATCH |
| `certifications-renewal` | `renewal-schedule` | ❌ MISMATCH |

### Fleet Reports

| E2E Test Selector | Actual Report ID | Status |
|-------------------|------------------|--------|
| `fleet-active-roster` | `active-roster` | ❌ MISMATCH |
| `fleet-demographics` | `fleet-demographics` | ✅ MATCH |
| `fleet-retirement-forecast` | `retirement-forecast` | ❌ MISMATCH |
| `fleet-succession` | `succession-pipeline` | ❌ MISMATCH |

---

## Actual Report IDs (from `/lib/config/reports-config.ts`)

### Fleet Reports (4)
1. `active-roster` - Active Pilot Roster
2. `fleet-demographics` - Fleet Demographics
3. `retirement-forecast` - Retirement Forecast
4. `succession-pipeline` - Succession Planning Pipeline

### Certification Reports (4)
5. `all-certifications` - All Certifications Export
6. `expiring-certifications` - Expiring Certifications
7. `compliance-summary` - Fleet Compliance Summary
8. `renewal-schedule` - Certification Renewal Schedule

### Leave Reports (4)
9. `annual-leave-allocation` - Annual Leave Allocation
10. `leave-bid-summary` - Leave Bid Summary
11. `leave-calendar-export` - Leave Calendar Export
12. `leave-request-summary` - Leave Request Summary

### Operational Reports (3)
13. `disciplinary-summary` - Disciplinary Actions Summary
14. `flight-requests-summary` - Flight Requests Summary
15. `task-completion` - Task Completion Report

### System Reports (4)
16. `audit-log` - System Audit Log
17. `feedback-summary` - User Feedback Summary
18. `system-health` - System Health Report
19. `user-activity` - User Activity Report

---

## Required Fixes

### Fix E2E Test Selectors

Update `/e2e/reports.spec.ts` to use correct report IDs:

```typescript
// ❌ BEFORE (Incorrect selectors)
await page.click('[data-report="certifications-all"]')
await page.click('[data-report="fleet-active-roster"]')
await page.click('[data-report="certifications-expiring"]')

// ✅ AFTER (Correct selectors)
await page.click('[data-report="all-certifications"]')
await page.click('[data-report="active-roster"]')
await page.click('[data-report="expiring-certifications"]')
```

### Complete Selector Mapping

```typescript
// CERTIFICATION REPORTS
'[data-report="all-certifications"]'          // All Certifications Export
'[data-report="expiring-certifications"]'     // Expiring Certifications
'[data-report="compliance-summary"]'          // Fleet Compliance Summary
'[data-report="renewal-schedule"]'            // Certification Renewal Schedule

// FLEET REPORTS
'[data-report="active-roster"]'               // Active Pilot Roster
'[data-report="fleet-demographics"]'          // Fleet Demographics
'[data-report="retirement-forecast"]'         // Retirement Forecast
'[data-report="succession-pipeline"]'         // Succession Planning Pipeline

// LEAVE REPORTS
'[data-report="annual-leave-allocation"]'     // Annual Leave Allocation
'[data-report="leave-bid-summary"]'           // Leave Bid Summary
'[data-report="leave-calendar-export"]'       // Leave Calendar Export
'[data-report="leave-request-summary"]'       // Leave Request Summary

// OPERATIONAL REPORTS
'[data-report="disciplinary-summary"]'        // Disciplinary Actions
'[data-report="flight-requests-summary"]'     // Flight Requests
'[data-report="task-completion"]'             // Task Completion

// SYSTEM REPORTS
'[data-report="audit-log"]'                   // System Audit Log
'[data-report="feedback-summary"]'            // User Feedback Summary
'[data-report="system-health"]'               // System Health Report
'[data-report="user-activity"]'               // User Activity Report
```

---

## Test Results Before Fix

```
Running 32 tests using 1 worker

✅ 1 PASSED: should display report cards with generate buttons
❌ 10 FAILED: All using incorrect selectors (timeout waiting for elements)
⏭️ 21 NOT RUN: Stopped after max failures

Duration: 4.9 minutes
```

---

## Next Steps

1. ✅ Identified root cause: Test selector mismatch
2. ⏳ Update E2E test file with correct selectors
3. ⏳ Re-run Playwright tests to verify fixes
4. ⏳ Update documentation with correct selectors

---

## Implementation Status

### Completed ✅
- Reports Dashboard UI fully implemented
- ReportCard component has `data-report` attribute
- Reports link exists in sidebar navigation
- All 19 API endpoints functional

### Pending ⏳
- Fix E2E test selectors to match actual report IDs
- Re-run Playwright tests after fixes
- Verify all 32 tests pass

---

**End of Report**
