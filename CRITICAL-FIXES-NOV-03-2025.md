# Critical Fixes - November 3, 2025

**Author**: Maurice Rondeau
**Date**: November 3, 2025
**Status**: ✅ Retirement Fix Complete | ⏳ Email Settings Migration Needed

---

## 🔴 CRITICAL ISSUE #1: Retirement Forecast Inaccuracy

### Problem Identified
**Neil Sexton was incorrectly showing as retiring in less than 2 years**

**Actual Data:**
- Date of Birth: September 15, 1963
- Retirement Date (age 65): September 15, 2028
- **Actual Years to Retirement: 2.86 years**
- **Should be in 2-year forecast? NO**
- **Should be in 5-year forecast? YES**

### Root Cause
**File**: `lib/services/retirement-forecast-service.ts`
**Lines**: 81-82, 102

The service was using `Math.floor()` to round down years, turning 2.86 into 2.0, then checking `<= 2` which incorrectly included pilots with 2.0-2.99 years remaining.

**Buggy Code:**
```typescript
const yearsToRetirement = Math.floor(
  (retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
)

if (yearsToRetirement >= 0 && yearsToRetirement <= 2) {  // BUG: <= includes 2.0-2.99
  twoYearPilots.push(pilotData)
}
```

### Fix Applied ✅

**Changed to use precise decimal calculation:**
```typescript
// NO rounding - keep precise decimal value
const yearsToRetirement =
  (retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

// STRICTLY less than 2.0 years (< 2.0, not <= 2)
if (yearsToRetirement >= 0 && yearsToRetirement < 2.0) {
  twoYearPilots.push(pilotData)
}

// STRICTLY less than 5.0 years (< 5.0, not <= 5)
if (yearsToRetirement >= 0 && yearsToRetirement < 5.0) {
  fiveYearPilots.push(pilotData)
}
```

### Verification ✅

**Test Results:**
```
Neil Sexton - Fixed Calculation:
Years to Retirement (precise): 2.86
Should be in 2-year list?: false  ✓ CORRECT
Should be in 5-year list?: true   ✓ CORRECT
```

### Impact
- **Dashboard**: Retirement forecast card now shows accurate counts
- **Analytics Page**: Multi-year retirement charts now accurate
- **Reports**: Retirement forecast report data corrected
- **All Locations**: Consistent calculation across entire system

---

## 🔴 CRITICAL ISSUE #2: Report Email Recipients

### Problem Identified
**User Request**: "lets have the reports email to get email settings from a Settings recipient where the admin can add"

Currently, reports are emailed to the authenticated user only. Need admin-configurable recipient lists.

### Solution Implemented ✅

Created a new email settings system:

#### 1. Database Migration Created
**File**: `supabase/migrations/20251103_create_report_email_settings.sql`

**Features:**
- New table: `report_email_settings`
- Email recipient configuration per report category
- Default fallback recipients
- RLS policies (admin-only access)
- Auto-update timestamps

**Settings Structure:**
```sql
CREATE TABLE report_email_settings (
  id UUID PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE,  -- e.g., "fleet_report_recipients"
  setting_value TEXT,                -- e.g., "fleet@example.com,hr@example.com"
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Default Settings Included:**
- `default_report_recipients` - Fallback for all reports
- `fleet_report_recipients` - Fleet reports (roster, demographics, etc.)
- `certification_report_recipients` - Training and compliance reports
- `leave_report_recipients` - Leave and scheduling reports
- `operational_report_recipients` - Flight requests, tasks, etc.
- `system_report_recipients` - Audit logs, system health, etc.

**Database Function:**
```sql
SELECT get_report_email_recipients('fleet');
-- Returns: 'fleet@example.com,hr@example.com'
```

#### 2. Service Layer Created
**File**: `lib/services/report-email-settings-service.ts`

**Functions:**
- `getAllEmailSettings()` - Get all settings for admin UI
- `getEmailSetting(key)` - Get specific setting
- `getEmailRecipientsForCategory(category)` - Get recipients with fallback
- `updateEmailSetting(key, value)` - Update setting
- `createEmailSetting(key, value, description)` - Create new setting
- `deleteEmailSetting(key)` - Delete setting
- `validateEmailAddresses(emails)` - Validate email format

**Usage Example:**
```typescript
import { getEmailRecipientsForCategory } from '@/lib/services/report-email-settings-service'

// In report email endpoint:
const recipients = await getEmailRecipientsForCategory('fleet')
// Returns: ['fleet@example.com', 'hr@example.com']

// Send to all recipients
for (const recipient of recipients) {
  await resend.emails.send({
    to: recipient,
    subject: 'Fleet Report',
    // ...
  })
}
```

### Next Steps Required ⏳

#### Step 1: Apply Migration
```bash
# Apply the migration to create the table
supabase db push

# Or manually run the SQL in Supabase SQL Editor
```

#### Step 2: Create Admin UI
Need to create admin settings page at `/dashboard/admin/settings/report-emails` with:
- List of all email settings
- Edit button for each setting
- Email validation
- Add/remove recipients
- Test email functionality

#### Step 3: Update Report Email Endpoints
Update all 18 email endpoints to use the new settings:

**Before:**
```typescript
await resend.emails.send({
  to: user.email,  // Only to authenticated user
  // ...
})
```

**After:**
```typescript
import { getEmailRecipientsForCategory } from '@/lib/services/report-email-settings-service'

const recipients = await getEmailRecipientsForCategory('fleet')

// Send to all configured recipients
for (const recipient of recipients) {
  await resend.emails.send({
    to: recipient,
    // ...
  })
}
```

---

## 📋 Summary of Changes

### Files Modified ✅
1. `lib/services/retirement-forecast-service.ts` - Fixed retirement calculation

### Files Created ✅
1. `supabase/migrations/20251103_create_report_email_settings.sql` - Email settings migration
2. `lib/services/report-email-settings-service.ts` - Email settings service

### Files To Create ⏳
1. `app/api/admin/report-email-settings/route.ts` - API for managing settings
2. `app/dashboard/admin/settings/report-emails/page.tsx` - Admin UI
3. `components/admin/report-email-settings-form.tsx` - Settings form component

### Files To Update ⏳
1. All 18 email endpoints in `app/api/reports/*/email/route.ts` - Use new settings

---

## 🧪 Testing Checklist

### Retirement Forecast Testing ✅
- [x] Neil Sexton NOT in 2-year forecast
- [x] Neil Sexton IS in 5-year forecast
- [ ] Dashboard shows correct counts
- [ ] Analytics page shows correct data
- [ ] All pilots accurately categorized

### Email Settings Testing ⏳
- [ ] Migration applies successfully
- [ ] Default settings are created
- [ ] Admin can view all settings
- [ ] Admin can update settings
- [ ] Email validation works
- [ ] Reports use new recipient lists
- [ ] Emails sent to all recipients
- [ ] Fallback to default works

---

## 📊 Before vs After

### Retirement Forecast

| Pilot | DOB | Retirement Date | Years to Retirement | Before (Buggy) | After (Fixed) |
|-------|-----|-----------------|---------------------|----------------|---------------|
| Neil Sexton | 1963-09-15 | 2028-09-15 | 2.86 years | ❌ In 2-year list | ✅ In 5-year list only |
| Others 2.0-2.99 | Various | Various | 2.0-2.99 years | ❌ In 2-year list | ✅ In 5-year list only |

### Email Recipients

| Report Category | Before | After |
|----------------|--------|-------|
| **Fleet Reports** | ❌ Authenticated user only | ✅ fleet@example.com, hr@example.com (configurable) |
| **Certification** | ❌ Authenticated user only | ✅ training@example.com, compliance@example.com |
| **Leave Reports** | ❌ Authenticated user only | ✅ hr@example.com, scheduling@example.com |
| **Operational** | ❌ Authenticated user only | ✅ operations@example.com, scheduling@example.com |
| **System Reports** | ❌ Authenticated user only | ✅ it@example.com, admin@example.com |

---

## 🚀 Deployment Instructions

### Immediate (No Migration Needed)
1. ✅ Retirement forecast fix is already applied
2. ✅ Dev server will pick up changes automatically
3. Test dashboard and analytics pages to verify

### Migration Required (For Email Settings)
1. Review migration SQL: `supabase/migrations/20251103_create_report_email_settings.sql`
2. Apply migration:
   ```bash
   supabase db push
   ```
   Or run SQL manually in Supabase SQL Editor
3. Verify table created:
   ```sql
   SELECT * FROM report_email_settings;
   ```
4. Create admin UI (see "Files To Create" section above)
5. Update email endpoints to use new settings
6. Test email delivery to configured recipients

---

## 🔍 Additional Recommendations

### 1. Retirement Age Configuration
Consider making retirement age (currently hardcoded as 65) configurable in system settings:
```typescript
// Current: hardcoded
const retirementAge = 65

// Recommended: from settings
const retirementAge = await getSystemSetting('retirement_age', 65)
```

### 2. Email Testing
Add a "Send Test Email" button in admin settings to verify configuration:
```typescript
// Test endpoint: POST /api/admin/test-email
{
  "category": "fleet",
  "test_message": "This is a test email from report settings"
}
```

### 3. Email Delivery Logging
Log all report email deliveries for audit trail:
- Who requested the report
- When it was sent
- To which recipients
- Success/failure status

### 4. Email Templates
Create professional HTML email templates for each report category with:
- Company branding
- Report summary in email body
- Attachment description
- Contact information

---

## ❗ Known Issues

### 1. TypeScript Type Errors
The earlier report endpoint generation created **75+ TypeScript errors**. These need to be fixed before full deployment.

**See**: `REPORTS-TYPE-ERRORS-TO-FIX.md` (if exists)

### 2. PDF Generation Not Implemented
PDF format is shown in UI but returns 501 errors. This was intentional (defensive coding) but should be implemented or hidden.

### 3. Email Rate Limiting
Sending to multiple recipients may hit rate limits. Consider:
- Batch email sending
- Queue-based delivery
- Resend API limits

---

## 📞 Support Information

**Issues Found**: Report to Maurice Rondeau
**Migration Help**: See Supabase documentation
**Email Service**: Resend (resend.com)
**Database**: Supabase PostgreSQL

---

**Status Summary:**
- ✅ Retirement forecast calculation: **FIXED**
- ✅ Email settings infrastructure: **CREATED**
- ⏳ Email settings migration: **PENDING**
- ⏳ Admin UI: **PENDING**
- ⏳ Email endpoint updates: **PENDING**

**Next Action**: Apply database migration and create admin UI for email settings management.
