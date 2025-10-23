# Fleet Management V2 - Administrator Guide

**B767 Pilot Management System**
**Advanced Administration & Configuration**
**Version**: 2.0.0
**Last Updated**: October 22, 2025

---

## 📖 Table of Contents

1. [System Overview](#system-overview)
2. [User Management](#user-management)
3. [Pilot Management](#pilot-management)
4. [Certification Management](#certification-management)
5. [Leave Request Management](#leave-request-management)
6. [System Configuration](#system-configuration)
7. [Data Management](#data-management)
8. [Security & Compliance](#security--compliance)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 🎛️ System Overview

### Architecture

**Technology Stack**:
- **Frontend**: Next.js 15, React 19, TypeScript 5.7
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel (recommended)

**Current Data** (Production):
- 27 active B767 pilots
- 607 certifications
- 34 check types
- 3 contract types

### System Access Levels

| Role | Access Level | Permissions |
|------|--------------|-------------|
| **Admin** | Full | All features, user management, system settings |
| **Manager** | High | Pilot/cert management, approvals (no system settings) |
| **Pilot** | Limited | View own data, submit requests, feedback |

---

## 👥 User Management

### Viewing Users

**Access**: Dashboard → Admin → Users

**User List Includes**:
- Email address
- Full name
- Role (Admin, Manager, Pilot)
- Status (Active, Inactive)
- Last login
- Created date

### Creating Admin/Manager Accounts

**Access**: Dashboard → Admin → Users → Add User

**Steps**:
1. Click "Add User"
2. Enter email address (must be unique)
3. Enter first and last name
4. Select role:
   - **Admin**: Full system access
   - **Manager**: Approval and management access
   - **Pilot**: Self-service portal access
5. Set initial password (user should change on first login)
6. Click "Create User"

**Important**:
- Email must be unique in system
- Password requirements: 8+ characters, uppercase, lowercase, number
- User receives email with login credentials
- Pilot users auto-created when adding new pilot

### Editing Users

**Editable Fields**:
- Name
- Role (upgrade/downgrade permissions)
- Status (activate/deactivate)
- Password reset

**Changing Roles**:
1. Navigate to user detail page
2. Click "Edit"
3. Select new role from dropdown
4. Save changes
5. Changes take effect immediately

**Deactivating Users**:
1. Edit user
2. Set status to "Inactive"
3. Save
4. User can no longer log in
5. Data remains in system

### Password Management

**Admin Password Reset**:
1. Navigate to user detail
2. Click "Reset Password"
3. Enter temporary password
4. User must change on next login

**Bulk Operations**:
- Export user list to CSV
- Filter by role or status
- Search by name or email

---

## 👨✈️ Pilot Management

### Adding New Pilots

**Access**: Dashboard → Pilots → Add New Pilot

**Required Information**:
```typescript
{
  first_name: string
  last_name: string
  rank: 'Captain' | 'First Officer'
  email: string (unique)
  phone: string
  seniority_number: number (unique, 1-999)
  date_of_birth: date
  hire_date: date
  contract_type_id: uuid
}
```

**Optional Fields**:
```typescript
{
  middle_name: string
  emergency_contact: string
  emergency_phone: string
  address: string
  city: string
  country: string
  notes: text
}
```

**Automatic Actions**:
- User account created automatically
- Linked to pilot record
- Email sent with credentials
- Portal access granted

**Validation Rules**:
- Seniority number must be unique
- Email must be unique
- Phone number validated
- Date of birth must be > 18 years ago
- Hire date cannot be in future

### Captain Qualifications

**Access**: Pilot detail page → Qualifications section

**Available Qualifications**:
```typescript
{
  line_captain: boolean          // Standard captain qual
  training_captain: boolean      // Training authority
  examiner: boolean             // Check ride authority
  rhs_captain_expiry: date      // Right-hand seat currency
}
```

**Managing Qualifications**:
1. Navigate to pilot detail page
2. Scroll to Qualifications section
3. Toggle checkboxes for qualifications
4. Set RHS Captain expiry date if applicable
5. Click "Save"

**Important**:
- Only available for Captains
- First Officers cannot have qualifications
- RHS Captain expiry tracked separately
- Affects scheduling and assignments

### Editing Pilot Information

**Common Edit Scenarios**:

**Contact Information Update**:
1. Pilot detail page → Edit
2. Update phone, email, address
3. Save changes

**Status Change**:
1. Edit pilot
2. Change status to Inactive
3. Confirm action
4. Pilot cannot log in (data preserved)

**Rank Change**:
1. Edit pilot
2. Change rank (Captain ↔ First Officer)
3. If demoting Captain → loses qualifications
4. Save and confirm

**Seniority Update**:
- Only change if HR directs
- Affects leave priority
- Verify before changing
- Update requires admin approval

### Deleting Pilots

**⚠️ Danger Zone**

**Before Deleting**:
- Export pilot data
- Archive certifications
- Check for dependencies
- Get approval from management

**Deletion Process**:
1. Pilot detail page → Delete
2. Confirmation dialog appears
3. Review consequences:
   - All certifications deleted
   - Leave requests deleted
   - User account deleted
   - **Action is irreversible**
4. Type pilot name to confirm
5. Click "Delete Permanently"

**Alternative**: Set status to Inactive instead of deleting

---

## 📋 Certification Management

### Understanding Check Types

**Categories**:
- **FLT**: Flight checks (Line Check, Base Check)
- **SIM**: Simulator checks (SIM Check, OPC)
- **GRD**: Ground checks (DGR, CRM, Security)
- **MED**: Medical checks (Class 1 Medical)

**Validity Periods**:
- Line Check: 12 months
- SIM Check: 6 months
- Base Check: 24 months
- Class 1 Medical: 6 months (over 40), 12 months (under 40)
- DGR: 24 months

### Adding Certifications

**Access**: Dashboard → Certifications → Add Certification

**Steps**:
1. Select pilot from dropdown
2. Select check type
3. Enter check date (when certification earned)
4. Expiry auto-calculated based on check type
5. Add notes if needed
6. Click "Create"

**Auto-Calculation Logic**:
```typescript
// Example: Line Check (12 months)
Check Date: 2025-01-15
Expiry Date: 2026-01-15 (automatically calculated)

// Medical checks consider age
Pilot DOB: 1980-01-01
Age on check date: 45 years
Validity: 6 months (over 40)
```

**Validation**:
- Check date cannot be in future
- Cannot create duplicate active certification
- Must select valid pilot and check type

### Bulk Certification Management

**Scenario**: Annual SIM checks for entire fleet

**Process**:
1. Prepare CSV with:
   ```csv
   pilot_id,check_type,check_date
   uuid-1,SIM Check,2025-01-15
   uuid-2,SIM Check,2025-01-16
   ```
2. Use bulk import tool (future feature)
3. Or add individually with date copy-paste

**Monitoring Expiries**:
- Dashboard shows expiring count
- Filter certifications by expiry window
- Export expiring certifications
- Send reminders to pilots

### Editing Certifications

**When to Edit**:
- Correcting data entry errors
- Updating check dates
- Adding notes or details

**Process**:
1. Certification detail page → Edit
2. Modify check date (expiry recalculates)
3. Update notes
4. Save changes

**Audit Trail**:
- All changes logged
- Timestamp and user recorded
- Previous values preserved

### Deleting Certifications

**Use Cases**:
- Duplicate entries
- Data entry errors
- Invalidated checks

**Process**:
1. Certification detail → Delete
2. Confirm deletion
3. Provide reason (optional but recommended)
4. Permanent deletion

---

## 📅 Leave Request Management

### Understanding Leave System

**Roster Periods**:
- 28-day cycles (RP1-RP13 annually)
- Known anchor: RP12/2025 starts 2025-10-11
- After RP13 → rolls to RP1 of next year

**Leave Types**:
- Annual Leave
- Sick Leave
- Compassionate Leave
- Training Leave
- Other

**Eligibility Rules**:
- ✅ **10 Captains** must remain available
- ✅ **10 First Officers** must remain available
- Evaluated separately by rank
- If minimum met → approve all requests
- If minimum not met → approve by priority

**Priority System**:
1. **Seniority number** (lower = higher priority)
2. **Submission date** (earlier = better)

### Leave Request Review Process

**Access**: Dashboard → Leave Requests

**Review Steps**:
1. Filter by roster period
2. Sort by submission date
3. Review each request:
   - Pilot name and rank
   - Requested dates
   - Leave type
   - Remaining crew count
4. Check eligibility alerts
5. Approve or reject
6. Add notes

**Eligibility Alerts**:

⚠️ **Eligibility Alert**:
- Shows when 2+ pilots of same rank request overlapping dates
- Review all competing requests
- Approve by priority system

📋 **Final Review Alert**:
- Appears 22 days before roster period starts
- Only shown if pending requests exist
- Deadline for processing requests

**Bulk Processing**:
1. Select roster period
2. Review all pending requests
3. Process in order of priority
4. Approve until minimum crew reached
5. Reject remaining with explanation

### Approval Decision Matrix

**Scenario 1**: Sufficient Crew Available
```
Current: 15 Captains, 12 First Officers
Request: Captain wants leave (5 days)
Remaining: 14 Captains available
Decision: ✅ APPROVE (14 > 10 minimum)
```

**Scenario 2**: At Minimum Crew
```
Current: 11 Captains available
Request: Captain wants leave
Remaining: 10 Captains
Decision: ✅ APPROVE (meets minimum)
```

**Scenario 3**: Below Minimum
```
Current: 10 Captains available
Request: Captain wants leave
Remaining: 9 Captains
Decision: ❌ REJECT (below minimum)
```

**Scenario 4**: Multiple Competing Requests
```
Requests for same dates:
1. Captain (Seniority #3, submitted Jan 1)
2. Captain (Seniority #5, submitted Dec 28)
3. Captain (Seniority #7, submitted Jan 2)

Current: 12 Captains available
Can approve: 2 requests (leave 10 available)

Approval order:
1. #3 (lowest seniority) ✅
2. #5 (second lowest) ✅
3. #7 (rejected - would drop below minimum) ❌
```

### Rejection Best Practices

**Clear Communication**:
```
❌ Bad: "Cannot approve"
✅ Good: "Unable to approve as approving would reduce available Captains to 9, below the minimum requirement of 10. Higher seniority requests approved for this period."
```

**Include**:
- Specific reason
- Reference to policy
- Alternative suggestions
- Encourage re-submit for different dates

---

## ⚙️ System Configuration

### Check Types Management

**Access**: Dashboard → Admin → Check Types

**Adding New Check Type**:
1. Click "Add Check Type"
2. Enter details:
   - Name: "Recurrent Training"
   - Category: FLT/SIM/GRD/MED
   - Validity (months): 12
   - Description: "Annual recurrent training"
3. Save

**Editing Check Types**:
- Update name or description
- Change validity period (affects future certifications only)
- Change category
- Cannot delete if certifications exist

**Standard Check Types**:
```typescript
// Flight Checks (FLT)
Line Check - 12 months
Base Check - 24 months

// Simulator Checks (SIM)
SIM Check - 6 months
OPC (Operator Proficiency Check) - 6 months

// Ground Checks (GRD)
DGR (Dangerous Goods) - 24 months
CRM (Crew Resource Management) - 12 months
Security - 12 months
SEP (Safety Equipment Proficiency) - 12 months

// Medical (MED)
Class 1 Medical - 6 months (age >40) or 12 months (age <40)
```

### System Settings

**Access**: Dashboard → Admin → Settings

**Configurable Settings**:
- Leave minimum crew counts
- Roster period dates
- Email notification templates
- System defaults
- Feature flags

**Important**:
- Changes affect entire system
- Test in staging first
- Document all changes
- Backup before major changes

---

## 📊 Data Management

### Exporting Data

**Pilots Export**:
- Format: CSV
- Includes: All pilot data, qualifications, status
- Encoding: UTF-8 with BOM (Excel compatible)
- Filename: `pilots_YYYY-MM-DD_HHmmss.csv`

**Certifications Export**:
- Format: CSV
- Includes: Pilot name, check type, dates, status
- Filter before export
- Filename: `certifications_YYYY-MM-DD_HHmmss.csv`

**Leave Requests Export**:
- Filter by status or roster period
- Full request details
- Approval notes included

**Usage**:
1. Apply desired filters
2. Click "Export to CSV"
3. File downloads to browser
4. Open in Excel/Google Sheets

### Importing Data

**⚠️ Not currently available via UI**

**Contact system administrator for**:
- Bulk pilot imports
- Bulk certification imports
- Historical data migration

**Future Feature**: Import wizard with validation

### Backup & Recovery

**Automated Backups**:
- Supabase auto-backup: Daily
- Point-in-time recovery: 7 days
- Database snapshots: Weekly

**Manual Backup**:
- Export all data to CSV
- Store securely
- Document export date
- Verify data integrity

**Recovery Process**:
- Contact system administrator
- Specify recovery point
- Test in staging environment
- Deploy to production

---

## 🔒 Security & Compliance

### Data Privacy

**Personal Information**:
- Pilot names, DOB, contact info
- Medical certification dates
- Leave requests and approval notes

**Protection Measures**:
- Row Level Security (RLS) enabled
- Role-based access control
- Encrypted at rest and in transit
- Audit logging

**GDPR Compliance**:
- Right to access data
- Right to correction
- Right to deletion (with caveats)
- Data retention policies

### User Access Audit

**Monitoring Access**:
```sql
-- Query audit logs (admin only)
SELECT *
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
```

**Access Controls**:
- Admins: Full database access
- Managers: Pilots and certifications only
- Pilots: Own data only

### Password Policies

**Requirements**:
- Minimum 8 characters
- At least 1 uppercase
- At least 1 lowercase
- At least 1 number
- At least 1 special character

**Best Practices**:
- Force password change every 90 days
- Prevent password reuse (last 5)
- Account lockout after 5 failed attempts
- Two-factor authentication (future feature)

### Session Management

**Session Duration**:
- Default: 7 days
- Configurable per user
- Auto-logout after 30 minutes inactivity

**Security Headers**:
- HTTPS enforced
- CSP (Content Security Policy)
- HSTS enabled
- X-Frame-Options: DENY

---

## 🔧 Troubleshooting

### Common Admin Issues

#### Issue: Cannot Add New Pilot

**Symptoms**: Form validation errors

**Checks**:
1. Seniority number unique?
2. Email address unique?
3. All required fields filled?
4. Date formats correct?

**Solution**: Verify uniqueness, fix validation errors

#### Issue: Leave Request Not Showing

**Symptoms**: Pilot submitted but not in admin list

**Checks**:
1. Check filters (status, roster period)
2. Verify pilot submitted successfully
3. Check database connection

**Solution**: Clear filters, refresh page

#### Issue: Certification Not Auto-Calculating Expiry

**Symptoms**: Expiry date not populated

**Checks**:
1. Check type has validity period set?
2. Check date entered correctly?
3. Database rules working?

**Solution**: Verify check type configuration, re-save certification

### Database Issues

#### Issue: Slow Queries

**Diagnosis**:
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10
```

**Solution**: Add indexes, optimize queries

#### Issue: Connection Errors

**Symptoms**: "Unable to connect to database"

**Checks**:
1. Supabase project status
2. API keys valid?
3. Network connectivity

**Solution**: Check Supabase dashboard, verify env variables

### Performance Issues

**Slow Page Load**:
- Check caching (60-second TTL on dashboard)
- Verify database indexes
- Monitor Supabase performance
- Check Vercel analytics

**High Database Usage**:
- Review query patterns
- Optimize N+1 queries
- Implement pagination
- Add caching layer

---

## 💡 Best Practices

### Daily Operations

**Morning Routine**:
1. Check dashboard for alerts
2. Review expiring certifications (30-day window)
3. Process new leave requests
4. Respond to pilot feedback

**Weekly Tasks**:
1. Export data for backup
2. Review system logs
3. Check compliance status
4. Process pending approvals

**Monthly Tasks**:
1. Audit user accounts
2. Review system performance
3. Update check types if needed
4. Generate reports for management

### Data Entry Standards

**Pilot Information**:
- Use official names (as per passport)
- Verify contact information
- Double-check seniority numbers
- Add detailed notes for special cases

**Certifications**:
- Enter check date same day as check
- Verify auto-calculated expiry
- Add notes for special circumstances
- Keep records of physical certificates

**Leave Approvals**:
- Process in seniority order
- Document all rejections with clear reasons
- Maintain consistency
- Communicate decisions promptly

### Communication Guidelines

**Email Templates**:
```
Subject: Leave Request Approved - RP5/2026

Dear [Pilot Name],

Your leave request for RP5/2026 ([dates]) has been approved.

Details:
- Roster Period: RP5/2026
- Dates: January 15-22, 2026
- Days: 8
- Type: Annual Leave

Please note this approval in your personal calendar.

Best regards,
Fleet Management
```

**Rejection Template**:
```
Subject: Leave Request Status - RP5/2026

Dear [Pilot Name],

Your leave request for RP5/2026 has been reviewed.

Status: Not Approved

Reason: Approving this request would reduce available [rank] to [number], below the minimum requirement of 10. Higher seniority pilots (#1, #3, #5) have been approved for overlapping dates.

Alternative: Please consider submitting for RP6/2026 or later roster periods.

If you have questions, please contact fleet management.

Best regards,
Fleet Management
```

### Compliance Monitoring

**Critical Certifications**:
- Line Check (required for all)
- SIM Check (required for all)
- Class 1 Medical (required for all)
- DGR (regulatory requirement)

**Monitoring Strategy**:
1. Dashboard shows expiring counts
2. Weekly review of 60-day window
3. Monthly email reminders to pilots
4. Escalate expired certifications

**Escalation Path**:
```
30 days: Email reminder to pilot
14 days: Email to pilot + CC manager
7 days: Direct contact + schedule check
0 days (expired): Pilot grounded until renewed
```

---

## 📞 Support & Resources

### Getting Help

**System Administrator**:
- Email: admin@example.com
- Phone: +675 XXX XXXX

**Technical Support**:
- Email: support@example.com
- Emergency: +675 XXX XXXX (24/7)

**Documentation**:
- User Guide: `/USER-GUIDE.md`
- Deployment Guide: `/DEPLOYMENT-GUIDE.md`
- API Documentation: `/API-STANDARDS.md`

### Training Resources

**New Admin Onboarding**:
1. Review this admin guide
2. Shadow experienced admin
3. Practice in staging environment
4. Get credentials and access
5. Start with low-risk tasks

**Continuous Learning**:
- Attend system update training
- Review changelog regularly
- Test new features in staging
- Share knowledge with team

---

**Fleet Management V2**
*Administrator Guide*
*Version 2.0.0 - Production System*
