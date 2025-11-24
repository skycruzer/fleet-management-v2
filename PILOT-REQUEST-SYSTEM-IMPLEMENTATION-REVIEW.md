# Pilot Leave & Flight Request System - Implementation Review & Restart Plan

**Author**: Maurice Rondeau
**Date**: January 19, 2025
**Status**: 🔄 RESTARTING IMPLEMENTATION
**Version**: v2.0.0 Unified Architecture

---

## 📋 Executive Summary

This document provides a comprehensive review of three major planning documents for the pilot request system and consolidates them into a single, actionable implementation plan. The system is currently **~40% complete** with core database architecture in place but missing critical features like notifications, alerts, and admin UI.

---

## 🎯 Current State Assessment

### ✅ COMPLETED (Phase 1 - Database Foundation)

#### 1. **Unified `pilot_requests` Table** ✅
- **Created**: Migration `20251111124223_create_pilot_requests_table.sql`
- **Status**: PRODUCTION READY
- **Features**:
  - Unified table for LEAVE and FLIGHT requests
  - `request_category` field differentiates types
  - `workflow_status` field (not `status`)
  - Denormalized pilot data (name, rank, employee_number)
  - Roster period tracking fields
  - Conflict detection fields (jsonb)
  - Proper indexes and RLS policies

#### 2. **Legacy Tables Deprecated** ✅
- **Migration**: `20251116060204_mark_legacy_tables_deprecated.sql`
- `leave_requests`: READ-ONLY (RLS enforced)
- `flight_requests`: EMPTY - Safe to drop

#### 3. **Service Layer Migrated** ✅
**Services using `pilot_requests`:**
- ✅ `lib/services/pilot-leave-service.ts` - Pilot portal leave submissions
- ✅ `lib/services/pilot-flight-service.ts` - Pilot portal flight submissions
- ✅ `lib/services/leave-service.ts` - Admin leave management
- ✅ `lib/services/reports-service.ts` - Reporting queries

**All services properly filter by `request_category`**

#### 4. **Roster Period Service** ✅
- **File**: `lib/services/roster-period-service.ts` (713 lines)
- **Features**:
  - Accurate 28-day cycle calculations
  - Known anchor: RP12/2025 = Oct 11, 2025
  - Date calculations (start, end, publish, deadline)
  - Status determination (OPEN, LOCKED, PUBLISHED, ARCHIVED)
  - Helper functions for date ranges and formatting

---

### 🚧 PARTIALLY STARTED (Phase 2 - Workflow)

#### 1. **Pilot Portal Authentication** 🟡
- **Status**: `an_users` table exists for pilot authentication
- **Current**: Basic authentication working
- **Missing**:
  - Notification system
  - Email alerts
  - Real-time status updates

#### 2. **Workflow Status** 🟡
- **Status**: `workflow_status` field exists and working
- **Values**: SUBMITTED, IN_REVIEW, APPROVED, DENIED, WITHDRAWN
- **Missing**:
  - Status change notifications
  - Admin approval workflow UI
  - Audit trail logging

---

### ❌ NOT STARTED (Phases 3-5)

#### 1. **Notification System** ❌
**Planned in**: `PILOT-PORTAL-WORKFLOW-IMPLEMENTATION-PLAN.md`

**Missing**:
- `notifications` table
- `notification-service.ts`
- NotificationBell component
- Real-time subscription system
- Email integration

#### 2. **Deadline Alert System** ❌
**Planned in**: `UNIFIED-REQUEST-SYSTEM-IMPLEMENTATION.md`

**Missing**:
- `roster_periods` database table
- Deadline calculation service
- Email alerts for approaching deadlines
- Admin dashboard deadline warnings
- Cron job for daily checks

#### 3. **Conflict Detection** ❌
**Planned in**: `UNIFIED-REQUEST-SYSTEM-IMPLEMENTATION.md`

**Missing**:
- Crew availability calculations
- Overlapping request detection
- Minimum crew requirement validation
- Conflict resolution workflow

#### 4. **Admin Request Management UI** ❌
**Missing**:
- Unified request dashboard
- Bulk approval workflows
- Roster period filtering
- Deadline tracking UI
- PDF report generation

#### 5. **RDO/SDO Reclassification** ❓
**Planned in**: `FLIGHT-REQUEST-RDO-SDO-IMPLEMENTATION-PLAN.md`

**Status**: NEEDS DECISION
- Plan suggests moving RDO/SDO from LEAVE to FLIGHT category
- Current implementation: RDO/SDO are in `request_category='LEAVE'`
- Question: Is this still the desired approach?

---

## 📚 Planning Documents Review

### Document 1: `FLIGHT-REQUEST-RDO-SDO-IMPLEMENTATION-PLAN.md`

**Date**: October 26, 2025
**Status**: Not Started
**Goal**: Move RDO and SDO from leave requests to flight requests

**Key Proposals**:
1. Move RDO/SDO from leave category to flight category
2. Rename flight request types:
   - `REQUEST_FLIGHT` - Request a flight to operate
   - `REQUEST_DAY_OFF` - RDO
   - `REQUEST_SUBSTITUTE_DAY_OFF` - SDO
   - `REQUEST_OTHER_DUTY` - Other duty

3. Automatic roster period calculation
4. Update form titles to "Flight Request / RDO / SDO"

**Assessment**:
- ⚠️ **NEEDS REVIEW**: This plan predates the unified architecture
- With `pilot_requests`, RDO/SDO can stay as LEAVE requests
- May not need to reclassify - current structure is cleaner

**Recommendation**:
- **DEFER** this plan - Current LEAVE category for RDO/SDO is correct
- RDO/SDO are leave types, not flight operations
- Keep existing structure

---

### Document 2: `PILOT-PORTAL-WORKFLOW-IMPLEMENTATION-PLAN.md`

**Date**: October 26, 2025
**Status**: Partially Started
**Goal**: Complete pilot-admin workflow with notifications

**Key Features Planned**:

1. ✅ **Pilot-User Linking** (COMPLETED)
   - `pilot_user_id` field exists in `pilot_requests`
   - Links pilot_users (authentication) to pilots (HR data)

2. ❌ **Notification System** (NOT STARTED)
   ```sql
   CREATE TABLE notifications (
     id uuid PRIMARY KEY,
     recipient_id uuid REFERENCES auth.users(id),
     type notification_type,
     title text,
     message text,
     link text,
     read boolean DEFAULT false,
     created_at timestamptz
   )
   ```

3. ❌ **Notification Service** (NOT STARTED)
   - `lib/services/notification-service.ts`
   - Functions:
     - `createNotification()`
     - `getUnreadNotifications()`
     - `markNotificationAsRead()`
     - `notifyAdminOfPilotRequest()`
     - `notifyPilotOfRequestStatus()`

4. ❌ **UI Components** (NOT STARTED)
   - `NotificationBell` component
   - Real-time notification updates
   - Click-through to related requests

**Assessment**:
- 🚀 **HIGH PRIORITY**: Critical for user experience
- Enables pilot-admin communication loop
- Required for production workflow

**Recommendation**:
- **START IMMEDIATELY** - Phase 3 priority
- Create notifications table first
- Build notification service
- Add UI components last

---

### Document 3: `UNIFIED-REQUEST-SYSTEM-IMPLEMENTATION.md`

**Date**: November 11, 2025
**Status**: Foundation Started, Features Pending
**Goal**: Comprehensive unified request management system

**Phases Overview**:

✅ **Phase 1: Unified Data Model** (COMPLETE)
- `pilot_requests` table created
- All fields implemented
- Services migrated

❌ **Phase 2: Roster Period Service** (50% COMPLETE)
- ✅ Service layer exists (`roster-period-service.ts`)
- ❌ `roster_periods` database table NOT created
- ❌ Database synchronization functions commented out

❌ **Phase 3: Deadline Alert System** (NOT STARTED)
- Email notifications for approaching deadlines
- Daily cron job checking
- Alert severity levels (INFO, WARNING, CRITICAL, URGENT)
- Fleet manager email notifications

❌ **Phase 4: Unified Reporting System** (NOT STARTED)
- PDF report generation
- Email delivery to rostering team
- Report audit trail (`roster_reports` table)

❌ **Phase 5: Conflict Detection** (NOT STARTED)
- Crew availability calculations
- Overlapping request detection
- Minimum crew requirement validation (10 Captains, 10 FOs)

**Assessment**:
- 🎯 **COMPREHENSIVE PLAN**: Covers all requirements
- Foundation is solid
- Missing features are well-defined
- Clear implementation path

**Recommendation**:
- **FOLLOW THIS PLAN** as primary roadmap
- Complete phases 2-5 sequentially
- Prioritize deadline alerts for operational urgency

---

## 🚀 Consolidated Implementation Plan

### **PHASE 3: Notification System** (Week 1-2)
**Priority**: 🔴 CRITICAL

#### Tasks:
1. **Create notifications table**
   ```sql
   -- Migration: 20250119_create_notifications_table.sql
   CREATE TABLE notifications (...)
   CREATE INDEX idx_notifications_recipient ON notifications(recipient_id)
   CREATE INDEX idx_notifications_unread ON notifications(recipient_id, read) WHERE read = FALSE
   -- RLS policies for user access
   ```

2. **Build notification service**
   - `lib/services/notification-service.ts`
   - Core functions: create, read, mark as read
   - Helper functions: notify admins, notify pilots

3. **Update API endpoints**
   - `/api/portal/leave-requests/route.ts` - Trigger admin notification
   - `/api/leave-requests/route.ts` - Trigger pilot notification on status change
   - `/api/portal/flight-requests/route.ts` - Trigger admin notification

4. **Create UI components**
   - `components/notifications/notification-bell.tsx`
   - Add to admin header
   - Add to pilot portal header
   - Real-time updates via Supabase subscriptions

#### Success Criteria:
- ✅ Pilot submits request → Admin receives notification
- ✅ Admin approves request → Pilot receives notification
- ✅ Notification bell shows unread count
- ✅ Clicking notification navigates to request

---

### **PHASE 4: Roster Periods Database** (Week 2)
**Priority**: 🟡 HIGH

#### Tasks:
1. **Create roster_periods table**
   ```sql
   -- Migration: 20250119_create_roster_periods_table.sql
   CREATE TABLE roster_periods (
     id uuid PRIMARY KEY,
     code text UNIQUE NOT NULL,
     period_number integer NOT NULL,
     year integer NOT NULL,
     start_date date NOT NULL,
     end_date date NOT NULL,
     publish_date date NOT NULL,
     request_deadline_date date NOT NULL,
     status text DEFAULT 'OPEN',
     created_at timestamptz DEFAULT NOW(),
     updated_at timestamptz DEFAULT NOW(),
     CHECK (status IN ('OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED')),
     UNIQUE(period_number, year)
   )
   ```

2. **Uncomment database sync functions**
   - Enable `getRosterPeriodByCode()`
   - Enable `getRosterPeriodsByYear()`
   - Enable `updateRosterPeriodStatus()`

3. **Initialize roster periods**
   ```bash
   # Script: scripts/sync-roster-periods.mjs
   # Populates current year + 2 years ahead
   ```

4. **Update admin dashboard**
   - Display upcoming roster periods
   - Show deadline countdown
   - Visual status indicators

#### Success Criteria:
- ✅ Database contains roster periods for current + 2 years
- ✅ Roster period service queries database
- ✅ Admin can see upcoming deadlines
- ✅ Status auto-updates based on dates

---

### **PHASE 5: Deadline Alert System** (Week 3)
**Priority**: 🟡 HIGH

#### Tasks:
1. **Build deadline alert service**
   - `lib/services/roster-deadline-alert-service.ts`
   - Calculate upcoming deadlines
   - Determine urgency levels
   - Generate alert emails

2. **Create cron job**
   - Daily check at 8 AM
   - Email fleet manager for deadlines at: 21, 14, 7, 3, 1, 0 days
   - Include pending request counts

3. **Admin dashboard alerts**
   - Visual deadline warnings
   - Highlighted urgent periods
   - Link to request review page

4. **Email templates**
   - Deadline reminder email
   - Urgent deadline email (day of)
   - Include request summary and links

#### Success Criteria:
- ✅ Daily cron job runs successfully
- ✅ Fleet manager receives email alerts
- ✅ Admin dashboard shows deadline warnings
- ✅ Email includes pending request counts

---

### **PHASE 6: Conflict Detection** (Week 4)
**Priority**: 🟢 MEDIUM

#### Tasks:
1. **Build conflict detection service**
   - `lib/services/conflict-detection-service.ts`
   - Calculate crew availability by date
   - Detect overlapping requests (same pilot)
   - Validate minimum crew requirements (10 Captains, 10 FOs)

2. **Update request submission**
   - Check conflicts before submission
   - Warn pilot if overlapping dates
   - Show availability impact

3. **Admin conflict resolution UI**
   - Highlight conflicting requests
   - Show crew availability chart
   - Bulk approval with conflict checks

#### Success Criteria:
- ✅ System prevents duplicate requests for same pilot
- ✅ Admin sees conflict warnings
- ✅ Crew availability calculated correctly (by rank)
- ✅ Cannot approve if below minimum crew

---

### **PHASE 7: Admin Request Management UI** (Week 5-6)
**Priority**: 🟢 MEDIUM

#### Tasks:
1. **Unified request dashboard**
   - `/dashboard/requests` page
   - Filter by roster period, status, category
   - Sort by submission date, priority
   - Bulk actions (approve, deny)

2. **Request detail modal**
   - Full request information
   - Pilot details
   - Conflict warnings
   - Approval/denial form

3. **PDF report generation**
   - Generate roster period summary
   - List all approved/denied requests
   - Email to rostering team
   - Store in `roster_reports` table

#### Success Criteria:
- ✅ Admin can view all requests in one place
- ✅ Filter and sort functionality works
- ✅ Bulk approval workflow efficient
- ✅ PDF reports generated correctly

---

### **PHASE 8: Testing & Deployment** (Week 7)
**Priority**: 🔴 CRITICAL

#### Tasks:
1. **E2E testing**
   - Pilot submission workflow
   - Admin approval workflow
   - Notification delivery
   - Deadline alerts
   - Conflict detection

2. **Load testing**
   - Concurrent submissions
   - Database performance
   - Notification throughput

3. **Production deployment**
   - Run migrations
   - Test on staging first
   - Monitor error logs
   - Verify email delivery

#### Success Criteria:
- ✅ All E2E tests pass
- ✅ No performance degradation
- ✅ Zero production errors
- ✅ User acceptance confirmed

---

## 📊 Implementation Timeline

| Phase | Duration | Priority | Status |
|-------|----------|----------|--------|
| Phase 1: Database Foundation | ✅ COMPLETE | - | Done |
| Phase 2: Service Migration | ✅ COMPLETE | - | Done |
| Phase 3: Notification System | 1-2 weeks | 🔴 CRITICAL | Starting Now |
| Phase 4: Roster Periods DB | 1 week | 🟡 HIGH | Next |
| Phase 5: Deadline Alerts | 1 week | 🟡 HIGH | Week 3 |
| Phase 6: Conflict Detection | 1 week | 🟢 MEDIUM | Week 4 |
| Phase 7: Admin UI | 2 weeks | 🟢 MEDIUM | Week 5-6 |
| Phase 8: Testing & Deploy | 1 week | 🔴 CRITICAL | Week 7 |

**Total Estimated Time**: 7-8 weeks from restart

---

## 🎯 Success Metrics

### Operational Metrics:
1. **Deadline Compliance**: 100% of roster reports sent on time
2. **Channel Migration**: 80%+ requests via pilot portal (vs. manual entry)
3. **Approval Speed**: < 48 hours average time-to-approval
4. **Notification Delivery**: 99%+ notification delivery rate

### Technical Metrics:
1. **API Response Time**: < 500ms for all request endpoints
2. **Database Query Performance**: < 100ms for report generation
3. **Zero Data Loss**: No duplicate or lost requests
4. **Uptime**: 99.9% system availability

### User Experience Metrics:
1. **Pilot Satisfaction**: Positive feedback on notification system
2. **Admin Time Savings**: 60% reduction in manual entry time
3. **Conflict Detection**: 95%+ conflicts detected before approval

---

## ❓ Open Questions & Decisions Needed

### 1. **RDO/SDO Classification**
**Question**: Should RDO/SDO remain as LEAVE requests or move to FLIGHT requests?

**Current**: RDO/SDO are `request_category='LEAVE'`

**Recommendation**:
- ✅ **KEEP AS LEAVE** - They are time-off requests, not flight operations
- RDO/SDO fit better semantically with leave requests
- Current structure is cleaner and more intuitive

**Decision**: [ ] Keep as LEAVE  [ ] Move to FLIGHT

---

### 2. **Email Service**
**Question**: Which email service to use for notifications?

**Options**:
1. Resend (already used for certification renewals)
2. SendGrid
3. AWS SES
4. Supabase Email (if available)

**Recommendation**: Use Resend (already integrated)

**Decision**: [ ] Confirmed

---

### 3. **Cron Job Infrastructure**
**Question**: How to run daily deadline check?

**Options**:
1. Vercel Cron Jobs (if on Vercel)
2. Supabase Edge Functions with cron
3. External cron service (EasyCron, etc.)
4. Self-hosted cron

**Recommendation**: Vercel Cron (simplest for Next.js)

**Decision**: [ ] Confirmed

---

## 🚀 Next Actions

### Immediate (This Session):
1. ✅ Review all planning documents
2. ✅ Create consolidated implementation plan
3. 🔄 Get user approval on plan and priorities
4. ⏳ Start Phase 3: Create notifications table migration

### This Week:
1. Implement notification system (database + service)
2. Build NotificationBell component
3. Update API endpoints to trigger notifications
4. Test notification workflow end-to-end

### Next Week:
1. Create roster_periods table
2. Initialize roster periods for 3 years
3. Update admin dashboard with deadline tracking
4. Begin deadline alert service

---

## 📝 Notes for Maurice

**Key Insights from Review**:
1. ✅ Foundation is solid - database architecture is excellent
2. 🎯 Focus on notifications first - critical for workflow
3. ⚠️ RDO/SDO plan needs reconsideration - current structure is better
4. 📧 Email integration required for production readiness
5. ⏰ Deadline system is operationally critical

**Technical Debt**:
- None identified - code quality is high
- Services are well-structured
- Type safety enforced throughout

**Risks**:
- Email delivery reliability (use Resend with fallback)
- Cron job monitoring (add health checks)
- Notification overload (rate limiting needed)

---

**Status**: 📋 READY FOR APPROVAL
**Next Step**: Start Phase 3 - Notification System Implementation

---

**Maurice, please review and confirm**:
1. Does this consolidated plan match your vision?
2. Should RDO/SDO stay as LEAVE requests? (Recommended: Yes)
3. Confirm email service: Resend?
4. Confirm cron infrastructure: Vercel Cron?
5. Ready to start Phase 3 implementation?
