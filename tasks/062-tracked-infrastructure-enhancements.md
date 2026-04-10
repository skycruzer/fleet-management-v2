# TRACKED: Infrastructure & Service Enhancements

**Status**: Pending
**Priority**: P2
**Created**: 2026-01-04

## Description

Collection of infrastructure improvements and service enhancements pending implementation.

---

## 1. System Settings Table

**File**: `lib/services/roster-deadline-alert-service.ts:477`
**Task**: Replace hardcoded settings with actual system settings table/query

---

## 2. Dashboard Materialized View

**File**: `lib/services/dashboard-service-v4.ts:199,204`
**Task**: Add `missingCertifications` and `overdue` fields to materialized view

---

## 3. Feedback Response Notifications

**File**: `lib/services/feedback-service.ts:403`
**Task**: Send notification to pilot when admin responds to feedback

---

## 4. Roster Period Migration

**File**: `lib/services/roster-period-service.ts:533,576,622`
**Task**: Uncomment database operations after migration is deployed

---

## 5. Production Email Configuration

**File**: `lib/services/pilot-email-service.ts:241`
**Task**: Update `support@yourdomain.com` with actual support email

---

## 6. CSRF Enhancement

**File**: `lib/middleware/csrf-middleware.ts:59`
**Task**: Implement session-based CSRF tokens for Vercel compatibility

---

## 7. Error Monitoring Integration

**File**: `lib/error-logger.ts:112`
**Task**: Integrate with Sentry, LogRocket, or similar service
