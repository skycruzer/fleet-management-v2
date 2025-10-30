# Email Notification Opportunities - Complete Analysis

**Date**: October 26, 2025
**Status**: 📋 **ANALYSIS COMPLETE**
**Reviewed By**: Claude Code

---

## 📋 Executive Summary

This document identifies **all opportunities** for email notifications across the Fleet Management V2 system. We've analyzed the entire codebase and identified **15 high-value notification scenarios** that would significantly improve pilot and admin user experience.

---

## ✅ Already Implemented

### 1. **Pilot Registration** ✅
**Service**: `lib/services/pilot-email-service.ts`

- ✅ Registration approval email
- ✅ Registration denial email

### 2. **Leave Requests** ✅
**Service**: `lib/services/pilot-email-service.ts`

- ✅ Leave request approval email
- ✅ Leave request denial email

### 3. **Flight Requests** ✅
**Service**: `lib/services/pilot-email-service.ts`

- ✅ Flight request approval email
- ✅ Flight request denial email

---

## 🎯 High Priority Opportunities

### 4. **Certification Expiry Alerts** 🔥 **CRITICAL**

**Service**: `lib/services/expiring-certifications-service.ts`

**Scenarios**:
- 🔴 **Expired certification** (immediate action required)
- 🟡 **Expiring in 30 days** (warning)
- 🟢 **Expiring in 60 days** (notice)
- 📅 **Expiring in 90 days** (planning reminder)

**Email Templates Needed**:
```typescript
sendCertificationExpiryAlert({
  firstName: string
  lastName: string
  email: string
  rank: string
  certifications: Array<{
    checkCode: string
    checkDescription: string
    expiryDate: string
    daysUntilExpiry: number
    status: 'expired' | 'critical' | 'warning' | 'notice'
  }>
  urgencyLevel: 'critical' | 'warning' | 'notice'
})
```

**Triggers**:
- Daily cron job checking certification expiry dates
- Immediate notification when certification expires
- Weekly digest of upcoming expirations

**Business Impact**: 🔥 **CRITICAL** - Prevents pilots from flying with expired certifications (FAA compliance)

**Effort**: 2 hours (template + cron job)

---

### 5. **Leave Bid Results** 🎯 **HIGH PRIORITY**

**Service**: `lib/services/leave-bid-service.ts`

**Scenarios**:
- 📊 Leave bid approved (allocated leave dates)
- ❌ Leave bid rejected (couldn't accommodate request)
- ⏳ Leave bid processing started
- ✅ Leave bid fully allocated

**Email Templates Needed**:
```typescript
sendLeaveBidApprovalEmail({
  firstName: string
  lastName: string
  email: string
  rank: string
  bidYear: number
  allocatedDates: Array<{
    priority: number
    startDate: string
    endDate: string
    approved: boolean
  }>
  alternativeOptions?: string[]
})

sendLeaveBidDenialEmail({
  firstName: string
  lastName: string
  email: string
  rank: string
  bidYear: number
  denialReason: string
  contactInfo: string
})
```

**Triggers**:
- Admin processes annual leave bids
- System automatically allocates based on seniority
- Manual approval/rejection by management

**Business Impact**: **HIGH** - Pilots need to know their annual leave allocation for family planning

**Effort**: 3 hours (multiple templates + bid processing integration)

---

### 6. **Password Reset** 🔐 **HIGH PRIORITY**

**Service**: `lib/services/pilot-portal-service.ts`

**Scenarios**:
- 🔑 Password reset requested
- ✅ Password reset successful
- ⚠️ Password reset link expired
- 🔒 Account locked (too many failed attempts)

**Email Templates Needed**:
```typescript
sendPasswordResetEmail({
  firstName: string
  lastName: string
  email: string
  resetLink: string
  expiresAt: string // "15 minutes"
})

sendPasswordResetConfirmationEmail({
  firstName: string
  lastName: string
  email: string
  resetTimestamp: string
  ipAddress?: string
  deviceInfo?: string
})
```

**Triggers**:
- User clicks "Forgot Password" link
- Password successfully reset
- Security notifications

**Business Impact**: **HIGH** - Critical for account security and user self-service

**Effort**: 2 hours (templates + reset flow integration)

---

### 7. **Task Assignment Notifications** 📋 **MEDIUM PRIORITY**

**Service**: `lib/services/task-service.ts`

**Scenarios**:
- 📌 New task assigned to pilot/admin
- ✅ Task marked as complete
- ⏰ Task deadline approaching (1 day, 3 days, 7 days)
- 🚨 Task overdue

**Email Templates Needed**:
```typescript
sendTaskAssignmentEmail({
  firstName: string
  lastName: string
  email: string
  task: {
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    dueDate: string
    assignedBy: string
    taskUrl: string
  }
})

sendTaskReminderEmail({
  firstName: string
  lastName: string
  email: string
  tasks: Array<{
    title: string
    dueDate: string
    priority: string
  }>
  reminderType: 'upcoming' | 'overdue'
})
```

**Triggers**:
- Task created and assigned
- Deadline approaching (cron job)
- Task completed
- Task overdue

**Business Impact**: **MEDIUM** - Improves accountability and task completion rates

**Effort**: 3 hours (multiple templates + cron job)

---

### 8. **Certification Renewal Plan** 📅 **MEDIUM PRIORITY**

**Service**: `lib/services/certification-renewal-planning-service.ts`

**Scenarios**:
- 📋 New renewal plan assigned to pilot
- 🔄 Renewal plan updated (roster period changed)
- ⏰ Renewal approaching (30 days notice)
- ✅ Renewal completed

**Email Templates Needed**:
```typescript
sendRenewalPlanAssignmentEmail({
  firstName: string
  lastName: string
  email: string
  rank: string
  renewals: Array<{
    checkCode: string
    checkDescription: string
    currentExpiryDate: string
    plannedRosterPeriod: string
    plannedDate: string
    pairedWith?: string // Another pilot
  }>
})

sendRenewalReminderEmail({
  firstName: string
  lastName: string
  email: string
  rank: string
  upcomingRenewals: Array<{
    checkCode: string
    plannedDate: string
    daysUntil: number
  }>
})
```

**Triggers**:
- Admin generates/updates renewal plan
- 30 days before renewal date (cron job)
- 7 days before renewal date (cron job)

**Business Impact**: **MEDIUM** - Helps pilots plan and prepare for renewals

**Effort**: 2.5 hours (templates + planning integration)

---

## 🔵 Medium Priority Opportunities

### 9. **Leave Eligibility Alerts** 📊

**Service**: `lib/services/leave-eligibility-service.ts`

**Scenarios**:
- ⚠️ Leave request conflicts with another pilot (same rank)
- 🚨 Minimum crew requirements at risk
- 📅 Final review period starting (22 days before roster)

**Email Templates**:
```typescript
sendLeaveEligibilityAlert({
  firstName: string
  lastName: string
  email: string
  rank: string
  conflictingRequests: Array<{
    dates: string
    conflictingPilots: string[]
  }>
  recommendation: string
})
```

**Business Impact**: **MEDIUM** - Helps pilots adjust requests before denial

**Effort**: 2 hours

---

### 10. **Account Security Notifications** 🔒

**Service**: `lib/services/pilot-portal-service.ts` / `user-service.ts`

**Scenarios**:
- 🚨 Suspicious login detected (new device/location)
- 🔑 Password changed
- 📧 Email address changed
- 🔐 Two-factor authentication enabled/disabled
- ⚠️ Multiple failed login attempts

**Email Templates**:
```typescript
sendSecurityAlertEmail({
  firstName: string
  lastName: string
  email: string
  alertType: 'login' | 'password_change' | 'email_change' | 'failed_attempts'
  details: {
    timestamp: string
    ipAddress: string
    location?: string
    deviceInfo?: string
  }
  actionRequired: boolean
  actionLink?: string
})
```

**Business Impact**: **MEDIUM** - Enhanced account security

**Effort**: 3 hours (multiple templates)

---

### 11. **Pilot Profile Updates** 👤

**Service**: `lib/services/pilot-service.ts`

**Scenarios**:
- ✅ Profile update approved by admin
- 📝 Profile information changed
- 🎖️ Qualification added/removed
- 📊 Seniority number changed

**Email Templates**:
```typescript
sendProfileUpdateEmail({
  firstName: string
  lastName: string
  email: string
  updateType: 'qualification' | 'seniority' | 'contact' | 'general'
  changes: Array<{
    field: string
    oldValue: string
    newValue: string
  }>
})
```

**Business Impact**: **LOW-MEDIUM** - Keeps pilots informed of profile changes

**Effort**: 1.5 hours

---

## 🟢 Lower Priority Opportunities

### 12. **Notification Digest** 📬

**Service**: `lib/services/notification-service.ts`

**Scenarios**:
- 📧 Daily digest of unread notifications
- 📊 Weekly summary of activity
- 🔔 Monthly report

**Email Templates**:
```typescript
sendNotificationDigestEmail({
  firstName: string
  lastName: string
  email: string
  period: 'daily' | 'weekly' | 'monthly'
  notifications: Array<{
    type: string
    title: string
    message: string
    timestamp: string
    read: boolean
  }>
  totalUnread: number
})
```

**Business Impact**: **LOW** - Reduces portal visits, keeps pilots informed

**Effort**: 2 hours

---

### 13. **Disciplinary Action Notifications** ⚠️

**Service**: `lib/services/disciplinary-service.ts`

**Scenarios**:
- 📋 Disciplinary action issued
- 📝 Disciplinary action updated
- ✅ Disciplinary action resolved

**Email Templates**:
```typescript
sendDisciplinaryActionEmail({
  firstName: string
  lastName: string
  email: string
  actionType: string
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  description: string
  dateIssued: string
  reviewerName: string
})
```

**Business Impact**: **LOW** - Formal notification of serious matters

**Effort**: 1.5 hours

---

### 14. **System Announcements** 📢

**Service**: New service needed

**Scenarios**:
- 📣 New feature announcement
- 🔧 Scheduled maintenance notification
- 🚨 System outage alert
- ✅ Service restored

**Email Templates**:
```typescript
sendSystemAnnouncementEmail({
  announcementType: 'feature' | 'maintenance' | 'outage' | 'restored'
  title: string
  message: string
  affectedUsers: 'all' | 'pilots' | 'admins'
  startTime?: string
  endTime?: string
  actionRequired: boolean
})
```

**Business Impact**: **LOW** - Keeps users informed of system changes

**Effort**: 2 hours

---

### 15. **Welcome Email (New Pilot Onboarding)** 👋

**Service**: `lib/services/pilot-service.ts`

**Scenarios**:
- 🎉 New pilot added to system
- 📚 Onboarding checklist
- 📖 Portal tour/guide

**Email Templates**:
```typescript
sendWelcomeEmail({
  firstName: string
  lastName: string
  email: string
  rank: string
  employeeId: string
  onboardingSteps: Array<{
    step: string
    description: string
    link?: string
  }>
})
```

**Business Impact**: **LOW** - Improves onboarding experience

**Effort**: 1.5 hours

---

## 📊 Priority Matrix

| Priority | Notification Type | Business Impact | Effort | ROI |
|----------|-------------------|-----------------|--------|-----|
| 🔥 **1** | Certification Expiry | CRITICAL | 2h | ⭐⭐⭐⭐⭐ |
| 🔥 **2** | Password Reset | HIGH | 2h | ⭐⭐⭐⭐⭐ |
| 🎯 **3** | Leave Bid Results | HIGH | 3h | ⭐⭐⭐⭐ |
| 🎯 **4** | Task Assignments | MEDIUM | 3h | ⭐⭐⭐⭐ |
| 🎯 **5** | Renewal Plan | MEDIUM | 2.5h | ⭐⭐⭐ |
| 🔵 **6** | Leave Eligibility | MEDIUM | 2h | ⭐⭐⭐ |
| 🔵 **7** | Security Alerts | MEDIUM | 3h | ⭐⭐⭐ |
| 🔵 **8** | Profile Updates | MEDIUM | 1.5h | ⭐⭐ |
| 🟢 **9** | Notification Digest | LOW | 2h | ⭐⭐ |
| 🟢 **10** | Disciplinary Actions | LOW | 1.5h | ⭐⭐ |
| 🟢 **11** | System Announcements | LOW | 2h | ⭐⭐ |
| 🟢 **12** | Welcome Email | LOW | 1.5h | ⭐⭐ |

---

## 🚀 Implementation Roadmap

### Phase 1: Critical Safety & Security (Week 1)
**Total Effort**: 4 hours

1. ✅ Certification Expiry Alerts (2h)
2. ✅ Password Reset (2h)

**Impact**: Ensures FAA compliance and account security

---

### Phase 2: High-Value User Experience (Week 2)
**Total Effort**: 8.5 hours

3. ✅ Leave Bid Results (3h)
4. ✅ Task Assignment Notifications (3h)
5. ✅ Renewal Plan Notifications (2.5h)

**Impact**: Improves pilot planning and task accountability

---

### Phase 3: Enhanced Communication (Week 3)
**Total Effort**: 8 hours

6. ✅ Leave Eligibility Alerts (2h)
7. ✅ Security Alerts (3h)
8. ✅ Profile Updates (1.5h)
9. ✅ Notification Digest (2h)

**Impact**: Better communication and security awareness

---

### Phase 4: Nice-to-Have Features (Week 4)
**Total Effort**: 5 hours

10. ✅ Disciplinary Actions (1.5h)
11. ✅ System Announcements (2h)
12. ✅ Welcome Email (1.5h)

**Impact**: Polished user experience

---

## 🛠️ Technical Implementation Guide

### Adding a New Email Notification

**Step 1**: Add email template to `lib/services/pilot-email-service.ts`

```typescript
/**
 * Send certification expiry alert email to pilot
 */
export async function sendCertificationExpiryAlert(
  data: CertificationExpiryData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/certifications`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certification Expiry Alert</title>
</head>
<body style="...">
  <!-- Professional HTML email template -->
</body>
</html>
    `.trim()

    const textContent = `...`.trim()

    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `🔴 Certification Expiry Alert - ${data.checkCode}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send expiry alert:', error)
      return { success: false, error: error.message }
    }

    console.log(`🔔 Expiry alert sent to ${data.email}`)
    return { success: true }
  } catch (error) {
    console.error('Error sending expiry alert:', error)
    return { success: false, error: 'Unknown error' }
  }
}
```

**Step 2**: Create interface for email data

```typescript
interface CertificationExpiryData {
  firstName: string
  lastName: string
  email: string
  rank: string
  certifications: Array<{
    checkCode: string
    checkDescription: string
    expiryDate: string
    daysUntilExpiry: number
  }>
  urgencyLevel: 'critical' | 'warning' | 'notice'
}
```

**Step 3**: Integrate into service/action

```typescript
// In expiring-certifications-service.ts
import { sendCertificationExpiryAlert } from './pilot-email-service'

export async function checkAndNotifyExpiringCertifications() {
  const expiringCerts = await getExpiringCertifications()

  for (const cert of expiringCerts) {
    const emailResult = await sendCertificationExpiryAlert({
      firstName: cert.pilot.first_name,
      lastName: cert.pilot.last_name,
      email: cert.pilot.email,
      rank: cert.pilot.rank,
      certifications: [{
        checkCode: cert.check_code,
        checkDescription: cert.check_description,
        expiryDate: cert.expiry_date,
        daysUntilExpiry: cert.days_until_expiry,
      }],
      urgencyLevel: cert.days_until_expiry < 0 ? 'critical' : 'warning',
    })

    if (!emailResult.success) {
      console.error(`Failed to send expiry alert to ${cert.pilot.email}`)
    }
  }
}
```

**Step 4**: Set up cron job (if needed)

```typescript
// app/api/cron/certification-expiry-alerts/route.ts
import { checkAndNotifyExpiringCertifications } from '@/lib/services/expiring-certifications-service'

export async function GET() {
  await checkAndNotifyExpiringCertifications()
  return Response.json({ success: true })
}
```

**Step 5**: Configure Vercel Cron (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/certification-expiry-alerts",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## 📧 Email Template Standards

### All emails should follow these standards:

1. ✅ **Professional HTML design** with aviation theme
2. ✅ **Plain text fallback** for accessibility
3. ✅ **Mobile responsive** (max-width: 600px)
4. ✅ **Clear call-to-action** button linking to portal
5. ✅ **Request/notification details** in structured format
6. ✅ **Custom branding** using environment variables
7. ✅ **Footer** with app name, year, automated message disclaimer
8. ✅ **Proper error handling** and logging

### Color Scheme (Consistent with existing emails):

- **Primary Blue**: `#0066cc` (headers, buttons, links)
- **Success Green**: `#00aa00` (approvals, confirmations)
- **Warning Yellow**: `#ffc107` (alerts, cautions)
- **Danger Red**: `#dc3545` (denials, critical alerts)
- **Background**: `#f4f4f4` (email body background)
- **Card Background**: `#ffffff` (content container)

---

## 🎯 Business Impact Summary

### Safety & Compliance
- ✅ Certification expiry alerts → Prevents expired certifications (FAA compliance)
- ✅ Security alerts → Protects pilot accounts from unauthorized access

### User Experience
- ✅ Password reset → Self-service reduces support burden
- ✅ Leave bid results → Improves annual leave planning
- ✅ Task notifications → Increases accountability and completion rates

### Operational Efficiency
- ✅ Renewal plan notifications → Better certification planning
- ✅ Leave eligibility alerts → Reduces conflicts and denials
- ✅ Notification digests → Reduces portal check frequency

### Communication
- ✅ Profile updates → Keeps pilots informed of changes
- ✅ System announcements → Centralized communication channel
- ✅ Welcome emails → Better onboarding experience

---

## 📝 Next Steps

1. **Prioritize Phase 1** (Critical Safety & Security)
   - Implement certification expiry alerts
   - Implement password reset emails

2. **Verify Resend Domain** (`pxb767office.app`)
   - Ensures professional email delivery
   - Unlocks full email capabilities

3. **Create Email Templates** for Priority 1-2 items
   - Certification expiry alert
   - Password reset

4. **Set up Cron Jobs** for automated notifications
   - Daily certification checks
   - Weekly task reminders

5. **Monitor Email Delivery** via Resend dashboard
   - Track open rates
   - Monitor bounce rates
   - Analyze user engagement

---

**Last Updated**: 2025-10-26 12:30 UTC
**Author**: Claude Code
**Status**: 📋 Analysis Complete
**Estimated Total Effort**: 25.5 hours (all phases)
