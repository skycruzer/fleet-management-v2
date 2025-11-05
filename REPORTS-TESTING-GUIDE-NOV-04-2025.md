# Reports System - Comprehensive Testing Guide
**Author**: Maurice Rondeau
**Date**: November 4, 2025
**Status**: Ready for Testing

---

## 🎯 Quick Access

**Reports Page**: http://localhost:3000/dashboard/reports

The new reports system is **100% complete** and ready for comprehensive testing.

---

## ✅ Implementation Summary

### What's Been Built

1. **Complete Service Layer** (`lib/services/reports-service.ts`)
   - Leave requests report generator with multi-roster period support
   - Flight requests report generator with multi-roster period support
   - Certifications report generator with multi-roster period + multi-check type support
   - Professional PDF generation with jsPDF and autoTable
   - Summary statistics calculation

2. **API Routes**
   - `/api/reports/preview` - Preview report data (JSON)
   - `/api/reports/export` - Download PDF
   - `/api/reports/email` - Email via Resend

3. **UI Components**
   - Modern tabbed interface (Leave | Flight Requests | Certifications)
   - Multi-select roster periods (26 periods: RP1/2025 - RP13/2026)
   - Multi-select check type categories (34 check types for certifications)
   - Status filters (Pending, Approved, Rejected)
   - Rank filters (Captain, First Officer)
   - Preview modal with data table
   - Email configuration modal

4. **Dependencies** (Already Installed)
   - ✅ jspdf@3.0.3
   - ✅ jspdf-autotable@5.0.2
   - ✅ resend@6.3.0

---

## 📋 Testing Checklist

### 🟢 Leave Requests Report

#### Basic Functionality
- [ ] Navigate to Reports → Leave Requests tab
- [ ] Select date range (Start Date + End Date)
- [ ] Click "Preview" - verify modal opens with data
- [ ] Click "Export PDF" - verify PDF downloads
- [ ] Click "Email Report" - configure and send

#### Multi-Roster Period Selection
- [ ] Select single roster period (e.g., RP13/2025)
- [ ] Preview shows only that period's data
- [ ] Select multiple roster periods (e.g., RP13/2025, RP1/2026, RP2/2026)
- [ ] Preview shows combined data from all selected periods
- [ ] Select all 26 roster periods
- [ ] Clear all selections

#### Status Filtering
- [ ] Check "Pending" only → Preview shows only pending requests
- [ ] Check "Approved" only → Preview shows only approved requests
- [ ] Check "Rejected" only → Preview shows only rejected requests
- [ ] Check all three → Preview shows all statuses
- [ ] Check none → Preview shows all statuses

#### Rank Filtering
- [ ] Check "Captain" only → Preview shows only captain requests
- [ ] Check "First Officer" only → Preview shows only FO requests
- [ ] Check both → Preview shows all ranks
- [ ] Check none → Preview shows all ranks

#### Combined Filtering
- [ ] Date range + roster periods + status + rank
- [ ] Verify filters combine correctly (AND logic)
- [ ] Check summary statistics are accurate

#### PDF Export
- [ ] Export with no filters → Full report
- [ ] Export with roster periods selected → Filtered report
- [ ] Open PDF → Verify professional formatting
- [ ] Check columns: Pilot, Rank, Type, Start Date, End Date, Status, Roster Period
- [ ] Verify summary statistics section
- [ ] Check page numbers

#### Email Delivery
- [ ] Click "Email Report"
- [ ] Enter valid email address
- [ ] Customize subject and message
- [ ] Send email
- [ ] Check inbox for email with PDF attachment
- [ ] Verify PDF attachment opens correctly

---

### 🔵 Flight Requests Report

#### Basic Functionality
- [ ] Navigate to Reports → Flight Requests tab
- [ ] Select date range (Departure From + Return Through)
- [ ] Click "Preview" - verify modal opens with data
- [ ] Click "Export PDF" - verify PDF downloads
- [ ] Click "Email Report" - configure and send

#### Multi-Roster Period Selection
- [ ] Select single roster period (e.g., RP13/2025)
- [ ] Preview shows only that period's flight requests
- [ ] Select multiple roster periods (e.g., RP13/2025, RP1/2026)
- [ ] Preview shows combined data from all selected periods
- [ ] Select all 26 roster periods
- [ ] Clear all selections

#### Status Filtering
- [ ] Check "Pending" only → Preview shows only pending requests
- [ ] Check "Approved" only → Preview shows only approved requests
- [ ] Check "Rejected" only → Preview shows only rejected requests
- [ ] Check all three → Preview shows all statuses
- [ ] Check none → Preview shows all statuses

#### Rank Filtering
- [ ] Check "Captain" only → Preview shows only captain requests
- [ ] Check "First Officer" only → Preview shows only FO requests
- [ ] Check both → Preview shows all ranks
- [ ] Check none → Preview shows all ranks

#### Combined Filtering
- [ ] Date range + roster periods + status + rank
- [ ] Verify filters combine correctly
- [ ] Check summary statistics (unique destinations, etc.)

#### PDF Export
- [ ] Export with no filters → Full report
- [ ] Export with roster periods selected → Filtered report
- [ ] Open PDF → Verify professional formatting
- [ ] Check columns: Pilot, Rank, Destination, Departure, Return, Purpose, Status
- [ ] Verify summary statistics section
- [ ] Check page numbers

#### Email Delivery
- [ ] Click "Email Report"
- [ ] Enter valid email address
- [ ] Customize subject and message
- [ ] Send email
- [ ] Check inbox for email with PDF attachment
- [ ] Verify PDF attachment opens correctly

---

### 🟡 Certifications Report

#### Basic Functionality
- [ ] Navigate to Reports → Certifications tab
- [ ] Select completion date range (From + To)
- [ ] Click "Preview" - verify modal opens with data
- [ ] Click "Export PDF" - verify PDF downloads
- [ ] Click "Email Report" - configure and send

#### Expiry Threshold Filtering
- [ ] Select "All Certifications" → Shows all
- [ ] Select "Expiring within 30 days" → Shows only those expiring ≤30 days
- [ ] Select "Expiring within 60 days" → Shows only those expiring ≤60 days
- [ ] Select "Expiring within 90 days" → Shows only those expiring ≤90 days
- [ ] Select "Expiring within 120 days" → Shows only those expiring ≤120 days
- [ ] Select "Expiring within 180 days" → Shows only those expiring ≤180 days

#### Multi-Roster Period Selection
- [ ] Check "Loading check types..." message appears
- [ ] Wait for 34 check types to load
- [ ] Select single roster period (e.g., RP13/2025)
- [ ] Preview shows only that period's certifications
- [ ] Select multiple roster periods
- [ ] Preview shows combined data from all selected periods
- [ ] Select all 26 roster periods
- [ ] Clear all selections

#### Multi-Check Type Selection
- [ ] Verify 34 check types loaded in 3-column grid
- [ ] Select single check type (e.g., "Line Check")
- [ ] Preview shows only certifications for that check type
- [ ] Select multiple check types (e.g., "Line Check", "PPC", "Recurrent")
- [ ] Preview shows all selected check types
- [ ] Select all check types
- [ ] Clear all selections

#### Rank Filtering
- [ ] Check "Captain" only → Preview shows only captain certifications
- [ ] Check "First Officer" only → Preview shows only FO certifications
- [ ] Check both → Preview shows all ranks
- [ ] Check none → Preview shows all ranks

#### Combined Filtering
- [ ] Date range + expiry threshold + roster periods + check types + rank
- [ ] Verify all filters combine correctly
- [ ] Check summary statistics (expired, expiring soon, current)

#### PDF Export with Color Coding
- [ ] Export with no filters → Full report
- [ ] Export with expiry threshold → Verify only expiring certs included
- [ ] Open PDF → Verify professional formatting
- [ ] Check columns: Pilot, Rank, Check Type, Completion, Expiry, Days Until Expiry, Status
- [ ] **Verify color coding**:
   - 🔴 Red text + bold for "EXPIRED" status
   - 🟡 Yellow/Orange text + bold for "EXPIRING SOON" status
   - Black text for "CURRENT" status
- [ ] Verify summary statistics section (expired count, expiring soon count, current count)
- [ ] Check page numbers

#### Email Delivery
- [ ] Click "Email Report"
- [ ] Enter valid email address
- [ ] Customize subject and message
- [ ] Send email
- [ ] Check inbox for email with PDF attachment
- [ ] Open PDF attachment → Verify color coding preserved

---

## 🧪 Edge Cases to Test

### Empty Results
- [ ] Select filters that return no results (e.g., future roster period with no data)
- [ ] Verify preview shows "No records found" or similar message
- [ ] Verify PDF export still works (empty table)
- [ ] Verify email still sends (with note about no records)

### Large Data Sets
- [ ] Select all 26 roster periods across all reports
- [ ] Select all check types (34) for certifications
- [ ] Verify preview loads without timeout
- [ ] Verify PDF generates successfully
- [ ] Check PDF page count (should have multiple pages)
- [ ] Verify email attachment size is reasonable

### Filter Combinations
- [ ] Date range overlapping roster periods → Verify data matches
- [ ] Conflicting filters (e.g., date range with no roster periods) → Verify behavior
- [ ] All filters enabled → Verify correct results
- [ ] No filters enabled → Verify shows all data

### UI/UX
- [ ] Verify loading spinners appear during preview
- [ ] Verify loading spinners appear during PDF export
- [ ] Verify toast notifications appear on success
- [ ] Verify error toast appears on failure
- [ ] Check responsive design on mobile/tablet
- [ ] Verify scrolling works in roster period grids
- [ ] Verify scrolling works in check type grid

---

## 🔍 Data Validation

### Leave Requests
- [ ] Pilot names match database
- [ ] Rank values are correct (Captain/First Officer)
- [ ] Leave types are correct (RDO, SDO, ANNUAL, etc.)
- [ ] Start/End dates are correctly formatted
- [ ] Status values are correct (pending/approved/rejected)
- [ ] Roster periods match the database

### Flight Requests
- [ ] Pilot names match database
- [ ] Rank values are correct
- [ ] Destinations are correct
- [ ] Departure/Return dates are correctly formatted
- [ ] Purpose field displays correctly
- [ ] Status values are correct
- [ ] Roster periods match the database

### Certifications
- [ ] Pilot names match database
- [ ] Rank values are correct
- [ ] Check type names match `check_types` table (34 types)
- [ ] Completion dates are correctly formatted
- [ ] Expiry dates are correctly formatted
- [ ] Days until expiry is calculated correctly
- [ ] Status logic is correct:
   - EXPIRED if days_until_expiry < 0
   - EXPIRING SOON if 0 ≤ days_until_expiry ≤ 90
   - CURRENT if days_until_expiry > 90

---

## 🎨 Preview Modal Verification

### Summary Statistics Section
- [ ] Leave: Shows total, pending, approved, rejected, captains, first officers
- [ ] Flight Requests: Shows total, pending, approved, rejected, unique destinations
- [ ] Certifications: Shows total, expired, expiring soon, current, unique pilots

### Data Table Section
- [ ] Columns match report type
- [ ] Data is sorted correctly
- [ ] Scrollable area works (if many records)
- [ ] Status badges have correct colors
- [ ] All fields display correctly (no [object Object] or null)

### Modal Functionality
- [ ] Close button works
- [ ] Click outside modal closes it
- [ ] ESC key closes modal
- [ ] Modal is responsive on different screen sizes

---

## 📧 Email Modal Verification

### Form Validation
- [ ] Recipients field is required
- [ ] Subject field is required
- [ ] Message field is optional
- [ ] Invalid email format shows error
- [ ] Multiple emails (comma-separated) work

### Email Sending
- [ ] Loading state appears during send
- [ ] Success toast appears on successful send
- [ ] Error toast appears on failure
- [ ] Modal closes automatically on success
- [ ] Can send to multiple recipients
- [ ] Custom subject line is used
- [ ] Custom message is included in email body

### Email Contents
- [ ] Subject line includes report type and date
- [ ] Email body includes summary
- [ ] PDF is attached
- [ ] PDF filename includes report type and timestamp
- [ ] PDF opens correctly from email

---

## 🚨 Error Scenarios

### Network Errors
- [ ] Disconnect internet → Try preview → Verify error message
- [ ] Disconnect internet → Try PDF export → Verify error message
- [ ] Disconnect internet → Try email send → Verify error message
- [ ] Reconnect → Verify everything works again

### Server Errors
- [ ] Stop dev server → Try any action → Verify graceful error
- [ ] Invalid filters → Verify validation errors
- [ ] Database connection issues → Verify error handling

### Invalid Data
- [ ] End date before start date → Verify validation
- [ ] Future dates (no data) → Verify empty results handled
- [ ] Invalid email format → Verify validation
- [ ] Empty recipients field → Verify validation

---

## 📊 Performance Testing

### Load Times
- [ ] Preview with 10 records → Time to display
- [ ] Preview with 100+ records → Time to display
- [ ] PDF export with 10 records → Time to download
- [ ] PDF export with 100+ records → Time to download
- [ ] Email send with attachment → Time to send

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Safari
- [ ] Firefox
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## ✅ Success Criteria

All reports must:
1. ✅ Preview correctly with accurate data
2. ✅ Export professional PDF with correct formatting
3. ✅ Send email with PDF attachment
4. ✅ Support multi-roster period filtering
5. ✅ Support status and rank filtering
6. ✅ Certifications support multi-check type filtering
7. ✅ Display accurate summary statistics
8. ✅ Handle empty results gracefully
9. ✅ Show appropriate loading/error states
10. ✅ Work on all major browsers

---

## 🐛 Issue Reporting Template

If you encounter any issues, please document:

```markdown
**Report Type**: Leave / Flight Requests / Certifications
**Action**: Preview / PDF Export / Email
**Filters Applied**: [List all selected filters]
**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Error Message**: [If any]
**Browser**: [Chrome/Safari/Firefox/etc.]
**Screenshots**: [If applicable]
```

---

## 🎉 Next Steps After Testing

Once testing is complete:

1. **Document any bugs** found during testing
2. **Verify all checklist items** are working
3. **Test with real production data** (if different from dev)
4. **Update environment variables** for Resend email in production
5. **Deploy to staging** for final verification
6. **Deploy to production** once all tests pass

---

## 📝 Notes

- **Resend Email**: Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in environment
- **Check Types**: Dynamically loaded from `/api/check-types` (34 types in database)
- **Roster Periods**: Hardcoded RP1/2025 through RP13/2026 (26 periods)
- **PDF Generation**: Uses jsPDF with professional formatting and color coding
- **Service Layer**: All reports use `lib/services/reports-service.ts`

---

**Testing Status**: 🟡 Ready for Testing
**Implementation Status**: ✅ 100% Complete
**Time to Test**: ~30-45 minutes for comprehensive testing
