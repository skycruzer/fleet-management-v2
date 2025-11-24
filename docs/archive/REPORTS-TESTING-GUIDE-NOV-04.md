# Reports System Testing Guide
**Phase 1 Verification - November 4, 2025**

---

## Quick Test Checklist

### 1. Authentication Testing ✅

#### Test: Unauthenticated Access
```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:3000/api/reports/preview \
  -H "Content-Type: application/json" \
  -d '{"reportType": "leave"}'
```

**Expected Result:**
```json
{
  "success": false,
  "error": "Unauthorized - Please sign in"
}
```

#### Test: Authenticated Access
1. Sign in to the application at `/auth/login`
2. Open DevTools → Application → Cookies
3. Verify `sb-access-token` cookie exists
4. Try generating a report - should work ✅

---

### 2. Rate Limiting Testing ✅

#### Test: Trigger Rate Limit
```bash
# Run this script 30+ times rapidly
for i in {1..30}; do
  curl -X POST http://localhost:3000/api/reports/preview \
    -H "Content-Type: application/json" \
    -H "Cookie: sb-access-token=<your-token>" \
    -d '{"reportType": "leave"}' &
done
```

**Expected Result (after threshold):**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

**Verify in Better Stack:**
- Check for "Rate limit exceeded" warning logs
- Verify userId and timestamp logged

---

### 3. Validation Testing ✅

#### Test: Invalid Report Type
```bash
curl -X POST http://localhost:3000/api/reports/preview \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<your-token>" \
  -d '{"reportType": "invalid-type"}'
```

**Expected Result:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "reportType",
      "message": "Report type must be \"leave\", \"flight-requests\", or \"certifications\""
    }
  ]
}
```

#### Test: Invalid Date Range
```bash
curl -X POST http://localhost:3000/api/reports/preview \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<your-token>" \
  -d '{
    "reportType": "leave",
    "filters": {
      "dateRange": {
        "startDate": "2025-12-31",
        "endDate": "2025-01-01"
      }
    }
  }'
```

**Expected Result:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "filters.dateRange.startDate",
      "message": "Start date must be before or equal to end date"
    }
  ]
}
```

#### Test: Invalid Email Addresses
```bash
curl -X POST http://localhost:3000/api/reports/email \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<your-token>" \
  -d '{
    "reportType": "leave",
    "recipients": ["invalid-email", "also-invalid"]
  }'
```

**Expected Result:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "recipients.0",
      "message": "Invalid email address format"
    },
    {
      "field": "recipients.1",
      "message": "Invalid email address format"
    }
  ]
}
```

---

### 4. Data Field Testing ✅

#### Test: Leave Requests Report
1. Navigate to `/dashboard/reports`
2. Click **Leave Requests** tab
3. Select filters:
   - Date range: Last 30 days
   - Status: All
   - Rank: Captain, First Officer
4. Click **Preview**
5. **Verify:**
   - ✅ Pilot names display correctly
   - ✅ **Rank column shows "Captain" or "First Officer"** (not blank/N/A)
   - ✅ All columns have data
   - ✅ Status badges are colored correctly

**Critical Check:**
```
Before: pilot.rank (❌ undefined)
After: pilot.role (✅ "Captain" or "First Officer")
```

#### Test: Flight Requests Report
1. Navigate to `/dashboard/reports`
2. Click **Flight Requests** tab
3. Select filters:
   - Date range: Last 90 days
   - Status: All
4. Click **Preview**
5. **Verify:**
   - ✅ **Rank column shows "Captain" or "First Officer"**
   - ✅ **Description column shows request descriptions** (not "N/A")
   - ✅ **Flight Date column shows dates** (not "N/A")
   - ✅ **Type column shows "RDO", "SDO", etc.** (not "N/A")
   - ⚠️ Return column shows "N/A" (expected - field doesn't exist)

**Critical Checks:**
```
Before: destination (❌ undefined) → After: description (✅)
Before: departure_date (❌) → After: flight_date (✅)
Before: purpose (❌) → After: request_type (✅)
```

#### Test: Certifications Report
1. Navigate to `/dashboard/reports`
2. Click **Certifications** tab
3. Select filters:
   - Expiry threshold: 90 days
   - Check types: Select a few
   - Rank: All
4. Click **Preview**
5. **Verify:**
   - ✅ **Rank column shows "Captain" or "First Officer"**
   - ✅ **Check Type column shows descriptions** (e.g., "Line Check", "Instrument Proficiency Check")
   - ✅ Days until expiry calculated correctly
   - ✅ Status badges colored (Red=Expired, Yellow=Expiring Soon, Green=Current)

**Critical Check:**
```
Before: check_type.check_name (❌ undefined)
After: check_type.check_description (✅ "Line Check", etc.)
```

---

### 5. PDF Export Testing ✅

#### Test: Generate Leave Requests PDF
1. Navigate to `/dashboard/reports` → Leave Requests
2. Select filters (date range, status, rank)
3. Click **Preview** first to verify data
4. Click **Export PDF**
5. **Verify:**
   - ✅ PDF downloads automatically
   - ✅ Filename format: `leave-report-2025-11-04.pdf`
   - ✅ PDF contains:
     - Report title
     - Generated timestamp
     - Summary statistics
     - Data table with **correct field values**
   - ✅ **Rank column shows "Captain"/"First Officer"** (not blank)

#### Test: Generate Flight Requests PDF
1. Follow same steps for Flight Requests
2. **Critical PDF Verification:**
   - ✅ Type column shows request types (RDO, SDO, etc.)
   - ✅ Flight Date column shows dates
   - ✅ Description column shows descriptions

#### Test: Generate Certifications PDF
1. Follow same steps for Certifications
2. **Critical PDF Verification:**
   - ✅ Check Type column shows descriptions (not codes)
   - ✅ Status column color-coded (Red/Yellow for expired/expiring)

---

### 6. Email Delivery Testing ✅

#### Test: Send Report via Email
1. Navigate to `/dashboard/reports` → Any report type
2. Select filters and click **Preview**
3. Click **Email** button
4. Enter recipients:
   - **Valid email:** `your-email@example.com`
5. Optional: Add custom subject/message
6. Click **Send Email**
7. **Verify:**
   - ✅ Success toast notification appears
   - ✅ Email received in inbox
   - ✅ Email contains:
     - Report title
     - Summary statistics
     - PDF attachment
     - Correct filename
   - ✅ PDF attachment has correct data

#### Test: Email Validation
1. Try sending with **invalid email:** `invalid-email`
2. **Expected:**
   - ❌ Validation error before sending
   - Error message: "Invalid email address format"

#### Test: Multiple Recipients
1. Enter multiple valid emails (comma-separated):
   - `email1@example.com, email2@example.com`
2. Send email
3. **Verify:**
   - ✅ All recipients receive email
   - ✅ PDF attachment included for all

---

### 7. Better Stack Logging Verification ✅

#### Access Better Stack Dashboard
1. Visit: https://logs.betterstack.com
2. Sign in with credentials
3. Navigate to Source: Fleet Management V2

#### Verify Log Events

**Search for:**
```
"Report preview requested"
```

**Expected Log Fields:**
- `userId`: UUID
- `email`: User email
- `reportType`: leave/flight-requests/certifications
- `filterCount`: Number of filters applied
- `timestamp`: ISO timestamp

**Search for:**
```
"Rate limit exceeded"
```

**Expected Log Fields:**
- `userId`: UUID
- `email`: User email
- `timestamp`: ISO timestamp
- Warning level (yellow)

**Search for:**
```
"Report preview generated successfully"
```

**Expected Log Fields:**
- `userId`: UUID
- `reportType`: Report type
- `resultCount`: Number of records
- `executionTime`: Milliseconds
- Info level (blue)

**Search for:**
```
"Unauthorized report preview attempt"
```

**Expected Log Fields:**
- `ip`: IP address
- `timestamp`: ISO timestamp
- Warning level (yellow)

---

## Browser Testing

### Chrome/Edge (Latest)
- [ ] Reports page loads correctly
- [ ] All 3 report tabs functional
- [ ] Preview dialog displays data
- [ ] PDF export downloads
- [ ] Email dialog works

### Safari (macOS/iOS)
- [ ] Same tests as Chrome
- [ ] Verify date picker compatibility
- [ ] Check PDF download behavior

### Firefox (Latest)
- [ ] Same tests as Chrome
- [ ] Verify multi-select components

### Mobile Safari (iOS)
- [ ] Reports page responsive
- [ ] Touch interactions work
- [ ] Preview dialog scrollable
- [ ] PDF export triggers download

### Chrome Mobile (Android)
- [ ] Same tests as iOS

---

## Performance Testing

### Load Time
1. Open DevTools → Network tab
2. Navigate to `/dashboard/reports`
3. **Expected:** Page loads in < 2 seconds

### Report Generation Time
1. Generate report with filters
2. Check DevTools → Network → `/api/reports/preview`
3. **Expected:**
   - < 500ms for 50 records
   - < 2s for 500 records

### PDF Generation Time
1. Export PDF
2. Check DevTools → Network → `/api/reports/export`
3. **Expected:** < 5 seconds for 100 records

### Email Delivery Time
1. Send email
2. Check DevTools → Network → `/api/reports/email`
3. **Expected:** < 10 seconds (includes PDF generation + email sending)

---

## Error Scenarios

### Test: Database Connection Failure
1. Temporarily disable database connection (if possible)
2. Try generating report
3. **Expected:**
   - Error logged to Better Stack
   - User sees friendly error message
   - No stack traces exposed

### Test: Resend API Failure
1. Use invalid `RESEND_API_KEY` (temporarily)
2. Try sending email
3. **Expected:**
   - Error logged: "Resend email error"
   - User sees: "Failed to send email"
   - Better Stack shows error details

### Test: Invalid JSON Body
```bash
curl -X POST http://localhost:3000/api/reports/preview \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<your-token>" \
  -d '{invalid json'
```

**Expected:**
- 400 Bad Request
- Error message about malformed JSON

---

## Regression Testing

### Verify Existing Features Still Work
- [ ] Leave request submission (separate feature)
- [ ] Flight request submission
- [ ] Certification viewing
- [ ] Pilot profile pages
- [ ] Admin dashboard

**Note:** Reports system changes should NOT affect these features.

---

## Test Results Log

### Test Session: [Date/Time]
**Tester:** [Your Name]
**Environment:** Production / Staging / Local

| Test | Status | Notes |
|------|--------|-------|
| Authentication | ✅ / ❌ | |
| Rate Limiting | ✅ / ❌ | |
| Validation | ✅ / ❌ | |
| Leave Reports Data | ✅ / ❌ | |
| Flight Reports Data | ✅ / ❌ | |
| Certifications Data | ✅ / ❌ | |
| PDF Export | ✅ / ❌ | |
| Email Delivery | ✅ / ❌ | |
| Better Stack Logs | ✅ / ❌ | |
| Browser Compatibility | ✅ / ❌ | |
| Performance | ✅ / ❌ | |

---

## Issues Found

### Template for Reporting Issues

**Issue #:** [Number]
**Severity:** Critical / High / Medium / Low
**Component:** [API Route / UI Component / etc.]
**Description:** [What went wrong]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:** [What should happen]
**Actual Behavior:** [What actually happened]
**Screenshots/Logs:** [Attach if available]

---

## Sign-Off

**Phase 1 Testing Complete:** ✅ / ❌
**Ready for Deployment:** ✅ / ❌

**Tester Signature:** ___________________
**Date:** ___________________

---

**End of Testing Guide**
**Version:** 1.0
**Last Updated:** November 4, 2025