# Missing Features Analysis
**Comparison**: air-niugini-pms vs fleet-management-v2
**Date**: 2025-10-22
**Purpose**: Identify features to migrate (excluding documents and forms)

---

## 📊 Comparison Summary

### ✅ Already Exist in fleet-management-v2 (DO NOT DUPLICATE)

**Pages/Routes**:
- ✅ Landing page (`/`)
- ✅ Admin dashboard (`/dashboard`)
- ✅ Pilot management (`/dashboard/pilots`, `/dashboard/pilots/[id]`)
- ✅ Certification management (`/dashboard/certifications`)
- ✅ Leave requests (`/dashboard/leave`)
- ✅ Analytics (`/dashboard/analytics`)
- ✅ Admin settings (`/dashboard/admin`)

**Core Features**:
- ✅ Pilot CRUD operations
- ✅ Certification tracking with FAA color coding
- ✅ Leave request management
- ✅ 28-day roster period system
- ✅ Leave eligibility checking
- ✅ Dashboard statistics
- ✅ Authentication system
- ✅ Service layer architecture

**Components**:
- ✅ 53 shadcn/ui components
- ✅ Theme provider with dark mode
- ✅ Navigation and layout components
- ✅ Form components with validation

---

## 🚨 MISSING Features from air-niugini-pms

### 🎯 HIGH PRIORITY - Missing Major Features

#### 1. **Pilot Portal** (Complete Section Missing)
**Impact**: Pilots cannot access the system at all

**Missing Pages**:
- ❌ `/pilot/login` - Pilot authentication
- ❌ `/pilot/register` - Pilot account creation
- ❌ `/pilot/dashboard` - Pilot home dashboard
- ❌ `/pilot/leave` - Pilot leave request submission
- ❌ `/pilot/flight-requests` - Flight request bidding
- ❌ `/pilot/feedback` - Feedback community
- ❌ `/pilot/feedback/[id]` - Individual feedback posts
- ❌ `/pilot/notifications` - Notification center

**Missing Services**:
- ❌ `pilot-portal-service.ts`
- ❌ `pilot-leave-service.ts`
- ❌ `pilot-flight-request-service.ts`
- ❌ `pilot-notifications-service.ts`
- ❌ `pilot-auth-utils.ts`

**Missing Components**:
- ❌ Pilot login/register forms
- ❌ Pilot dashboard widgets
- ❌ Leave bidding interface (`LeaveBidModal.tsx`)
- ❌ Flight request form (`PilotFlightRequestForm.tsx`)
- ❌ Notification center

---

#### 2. **Flight Request System** (Complete Feature Missing)
**Impact**: No way to manage pilot flight requests

**Missing Pages**:
- ❌ `/dashboard/flight-requests` - Admin review dashboard
- ❌ Flight request approval workflow

**Missing API Routes**:
- ❌ `GET/POST /api/pilot/flight-requests` - Pilot submission
- ❌ `GET/PATCH /api/admin/flight-requests` - Admin review

**Missing Services**:
- ❌ `flight-request-service.ts`
- ❌ `pilot-flight-request-service.ts`

**Missing Components**:
- ❌ `AdminFlightRequestsTable.tsx`
- ❌ `FlightRequestForm.tsx`
- ❌ `FlightRequestReviewModal.tsx`
- ❌ `PilotFlightRequestForm.tsx`
- ❌ `PilotFlightRequestsList.tsx`

**Missing Database**:
- ❌ `flight_requests` table

---

#### 3. **Task Management System** (Complete Feature Missing)
**Impact**: No task tracking or assignment capability

**Missing Pages**:
- ❌ `/dashboard/tasks` - Task list (Kanban and list views)
- ❌ `/dashboard/tasks/new` - Create new task
- ❌ `/dashboard/tasks/[id]` - Task detail page

**Missing API Routes**:
- ❌ `GET/POST /api/tasks` - Task CRUD
- ❌ `GET/PATCH /api/tasks/[id]` - Individual task operations

**Missing Services**:
- ❌ `task-service.ts`

**Missing Components**:
- ❌ `TaskModal.tsx` - Task creation/edit
- ❌ Task list views (Kanban/List)
- ❌ Real-time presence tracking

**Missing Database**:
- ❌ `tasks` table

---

#### 4. **Disciplinary System** (Complete Feature Missing)
**Impact**: No way to track disciplinary matters

**Missing Pages**:
- ❌ `/dashboard/disciplinary` - Disciplinary matters list
- ❌ `/dashboard/disciplinary/new` - Create new matter
- ❌ `/dashboard/disciplinary/[id]` - Matter detail page

**Missing API Routes**:
- ❌ `GET/POST /api/disciplinary-matters` - Matter CRUD
- ❌ `GET/PATCH /api/disciplinary-matters/[id]` - Individual operations
- ❌ `POST /api/disciplinary-matters/[id]/actions` - Add actions

**Missing Services**:
- ❌ `disciplinary-service.ts`

**Missing Components**:
- ❌ `DisciplinaryMatterModal.tsx`
- ❌ Disciplinary list and detail views

**Missing Database**:
- ❌ `disciplinary_actions` table

---

#### 5. **Feedback Community System** (Complete Feature Missing)
**Impact**: No community discussion or feedback mechanism

**Missing Pages**:
- ❌ `/pilot/feedback` - Feedback posts list
- ❌ `/pilot/feedback/[id]` - Individual post view
- ❌ `/dashboard/admin/feedback-moderation` - Moderation dashboard

**Missing API Routes**:
- ❌ `GET/POST /api/pilot/feedback/posts` - Post CRUD
- ❌ `GET/PATCH /api/pilot/feedback/posts/[id]` - Post operations
- ❌ `POST /api/pilot/feedback/posts/[id]/comments` - Comments
- ❌ `GET/PATCH /api/admin/feedback/posts/[id]` - Moderation

**Missing Services**:
- ❌ `feedback-service.ts`
- ❌ `feedback-admin-service.ts`

**Missing Components**:
- ❌ `CreatePostModal.tsx`
- ❌ `CreateCategoryModal.tsx`
- ❌ Feedback post list/detail views
- ❌ Comment threads

**Missing Database**:
- ❌ `feedback_posts` table
- ❌ `feedback_comments` table
- ❌ `feedback_categories` table

---

#### 6. **Audit Logging System** (Complete Feature Missing)
**Impact**: No audit trail of system changes

**Missing Pages**:
- ❌ `/dashboard/audit` - Audit log viewer
- ❌ `/dashboard/audit/[id]` - Individual audit record

**Missing API Routes**:
- ❌ `GET /api/audit` - Fetch audit logs (admin-only)

**Missing Services**:
- ❌ `audit-log-service.ts`
- ❌ `audit-integration.ts`

**Missing Components**:
- ❌ `AuditLogTable.tsx`
- ❌ `AuditLogFilters.tsx`
- ❌ `AuditLogTimeline.tsx`
- ❌ `AuditLogCharts.tsx`
- ❌ `AuditLogDetail.tsx`

**Missing Database**:
- ❌ `audit_logs` table

---

#### 7. **Admin Registration Approval** (Feature Missing)
**Impact**: No workflow for approving new pilot registrations

**Missing Pages**:
- ❌ `/dashboard/admin/pilot-registrations` - Registration queue

**Missing API Routes**:
- ❌ `GET /api/admin/pilot-registrations` - List registrations
- ❌ `POST /api/admin/pilot-registrations` - Process registration
- ❌ `PATCH /api/admin/pilot-registrations/[id]` - Update status

**Missing Services**:
- ❌ `pilot-registration-service.ts`

**Missing Database**:
- ❌ `pilot_registrations` table (or status field in `pilots`)

---

### 🎨 MEDIUM PRIORITY - Enhanced Views/Components

#### 8. **Enhanced Certification Views**
**Partially exists, but missing advanced features**

**Missing Components**:
- ❌ `CertificationCalendar.tsx` - Interactive calendar view
- ❌ `CertificationTimeline.tsx` - Timeline visualization
- ❌ `FleetTimelineView.tsx` - Fleet-wide timeline
- ❌ `CategoryTimelineView.tsx` - Category-based timeline
- ❌ `BulkCertificationModal.tsx` - Bulk cert operations

**Missing Pages**:
- ❌ `/dashboard/certifications/calendar` - Calendar view
- ❌ `/dashboard/certifications/timeline` - Timeline view
- ❌ `/dashboard/certifications/expiry-planning` - Expiry planning
- ❌ `/dashboard/certifications/bulk` - Bulk operations

**Missing API Routes**:
- ❌ `GET /api/certifications/calendar` - Calendar data
- ❌ `PATCH /api/certifications/bulk-update` - Bulk updates

---

#### 9. **Enhanced Leave Management Views**
**Basic leave exists, but missing advanced features**

**Missing Components**:
- ❌ `InteractiveRosterCalendar.tsx` - Interactive roster calendar
- ❌ `RosterPeriodNavigator.tsx` - Period navigation
- ❌ `RosterPeriodSelector.tsx` - Period selection
- ❌ `LeaveCalendarView.tsx` - Calendar visualization
- ❌ `LeaveBidModal.tsx` - Leave bidding interface
- ❌ `LeaveConflictDetector.tsx` - Conflict detection
- ❌ `TeamAvailabilityView.tsx` - Team availability

**Missing Pages**:
- ❌ `/dashboard/leave/calendar` - Calendar view
- ❌ `/dashboard/leave/roster-planning` - Roster planning

**Missing API Routes**:
- ❌ `GET /api/leave-bids` - Leave bidding

---

#### 10. **Enhanced Analytics & Reporting**
**Basic analytics exist, but missing advanced features**

**Missing Components**:
- ❌ `CertificationAnalytics.tsx` - Cert-specific metrics
- ❌ `LeaveAnalytics.tsx` - Leave statistics
- ❌ `PilotAnalytics.tsx` - Pilot demographics
- ❌ `ComplianceMetrics.tsx` - Compliance KPIs
- ❌ `TrendAnalysis.tsx` - Historical trends
- ❌ `HeatmapChart.tsx` - Advanced heatmap
- ❌ `ExpiryTrendChart.tsx` - Expiry trends

**Missing Pages**:
- ❌ `/dashboard/analytics/advanced` - Advanced analytics

**Missing API Routes**:
- ❌ `GET /api/analytics/trends` - Trend analysis
- ❌ `GET /api/analytics/forecasts` - Forecasting
- ❌ `POST /api/analytics/custom` - Custom queries

**Missing Services**:
- ❌ `analytics-data-service.ts` - Enhanced data aggregation

---

#### 11. **Enhanced Pilot Profile Views**
**Basic profile exists, but missing features**

**Missing Components**:
- ❌ `PilotCardView.tsx` - Card grid view
- ❌ `PilotListView.tsx` - Enhanced list view
- ❌ `PilotTableView.tsx` - Table view
- ❌ `PilotQuickView.tsx` - Quick info modal
- ❌ `BulkActionsBar.tsx` - Bulk operations

**Missing Pages**:
- ❌ `/dashboard/pilots/[id]/certifications/timeline` - Timeline view

---

### 🔧 LOW PRIORITY - Quality of Life Improvements

#### 12. **Advanced UI Components**
**Existing UI is functional, these enhance UX**

**Missing Components**:
- ❌ `VirtualList.tsx` - Virtual scrolling for large lists
- ❌ `CollaborativeCursors.tsx` - Real-time cursor tracking
- ❌ `PresenceIndicator.tsx` - Active users indicator
- ❌ Animation components (FadeIn, SlideIn, StaggerChildren, ScaleOnHover)
- ❌ Enhanced skeleton loaders

---

#### 13. **PWA Enhancements**
**Basic PWA exists, these add features**

**Missing Components**:
- ❌ `OfflineDataView.tsx` - Offline data cache view
- ❌ `SyncIndicator.tsx` - Sync status display

---

#### 14. **Additional Utilities**
**Core utilities exist, these are extras**

**Missing Utilities**:
- ❌ `retirement-utils.ts` - Retirement calculations
- ❌ `calendar-utils.ts` - Advanced calendar operations
- ❌ `search-service.ts` - Full-text search
- ❌ `webhook-service.ts` - Webhook integrations
- ❌ `backup-service.ts` - Data backup

---

## 📋 Recommended Migration Priority

### Phase 1: Critical Missing Features (Must-Have)
1. **Pilot Portal** - Pilots need system access
2. **Flight Request System** - Core operational feature
3. **Audit Logging** - Compliance requirement
4. **Task Management** - Operational efficiency

### Phase 2: Important Features (Should-Have)
5. **Disciplinary System** - HR requirement
6. **Feedback Community** - User engagement
7. **Pilot Registration Approval** - Admin workflow

### Phase 3: Enhanced Views (Nice-to-Have)
8. **Enhanced Certification Views** (Calendar, Timeline, Bulk)
9. **Enhanced Leave Management** (Calendar, Roster Planning)
10. **Enhanced Analytics** (Advanced charts, trends)

### Phase 4: Quality of Life (Optional)
11. **Enhanced Pilot Views** (Card/List/Table toggle)
12. **Advanced UI Components** (Virtual scroll, animations)
13. **PWA Enhancements** (Offline data view, sync)
14. **Additional Utilities** (Search, webhooks, backup)

---

## 🎯 Proposed Feature Specification Scope

**For `/speckit.specify` command**:

Focus on **Phase 1 + Phase 2** (Critical + Important):
1. Pilot Portal (8 pages, complete authentication)
2. Flight Request System (2 pages, full workflow)
3. Task Management (3 pages, Kanban + list)
4. Disciplinary System (3 pages, full tracking)
5. Feedback Community (3 pages, moderation)
6. Audit Logging (2 pages, admin-only)
7. Pilot Registration Approval (1 page, admin workflow)

**Total**: ~22 new pages, ~50 components, ~30 API routes, ~10 services, ~6 database tables

**Excluded**: Documents, Forms, Phase 3/4 enhancements

---

## 📝 Next Steps

1. Generate short feature name: "missing-core-features"
2. Run `.specify/scripts/bash/create-new-feature.sh`
3. Create detailed specification with user stories
4. Generate implementation plan
5. Create task breakdown
6. Begin implementation

---

**Analysis Complete**: Ready for `/speckit.specify` execution
**Date**: 2025-10-22
**Analyst**: Claude Code
