# Fleet Management V2 - Complete Existing Inventory

**Generated**: October 22, 2025
**Project**: Fleet Management V2 (Modern B767 Pilot Management System)
**Framework**: Next.js 15 + React 19 + TypeScript 5.7
**Database**: Supabase PostgreSQL (Project: wgdmgvonqysflwdiiols)

---

## Table of Contents

1. [Pages & Routes](#pages--routes)
2. [Components](#components)
3. [API Routes](#api-routes)
4. [Services](#services)
5. [Hooks & Utilities](#hooks--utilities)
6. [Type Definitions](#type-definitions)
7. [E2E Tests](#e2e-tests)
8. [Database Schema](#database-schema)

---

## Pages & Routes

### Public Routes

#### Home Page
- **Path**: `/` (root)
- **File**: `/app/page.tsx`
- **Purpose**: Landing page, authentication redirect
- **Features**: Responsive hero section, welcome messaging

#### Authentication
- **Path**: `/auth/login`
- **File**: `/app/auth/login/page.tsx`
- **Purpose**: User login page
- **Features**: Email/password authentication, error handling

#### Login (Legacy)
- **Path**: `/login`
- **Directory**: `/app/login/`
- **Purpose**: Alternative login routing

### Admin Dashboard Routes

#### Dashboard Home
- **Path**: `/dashboard`
- **File**: `/app/dashboard/page.tsx`
- **Type**: SSR Server Component
- **Features**: Main admin dashboard overview, stats aggregation

#### Pilots Management
- **Route**: `/dashboard/pilots`
- **List Page**: `/app/dashboard/pilots/page.tsx`
- **Loading**: `/app/dashboard/pilots/loading.tsx`
- **Create New**: `/app/dashboard/pilots/new/page.tsx`
- **View/Edit**: `/app/dashboard/pilots/[id]/page.tsx`
- **Edit Page**: `/app/dashboard/pilots/[id]/edit/page.tsx`
- **Features**:
  - Pilot CRUD operations
  - View pilot details
  - Edit pilot information
  - Captain qualification management
  - Seniority tracking
  - Contract type assignment

#### Certifications Management
- **Route**: `/dashboard/certifications`
- **List Page**: `/app/dashboard/certifications/page.tsx`
- **Loading**: `/app/dashboard/certifications/loading.tsx`
- **Create New**: `/app/dashboard/certifications/new/page.tsx`
- **Edit**: `/app/dashboard/certifications/[id]/edit/page.tsx`
- **Features**:
  - Certification CRUD operations
  - FAA compliance tracking
  - Expiry date management
  - Check type assignment
  - Color-coded status (Red/Yellow/Green)

#### Leave Management
- **Route**: `/dashboard/leave`
- **List Page**: `/app/dashboard/leave/page.tsx`
- **Loading**: `/app/dashboard/leave/loading.tsx`
- **Create New**: `/app/dashboard/leave/new/page.tsx`
- **Features**:
  - Leave request CRUD
  - Roster period alignment (28-day cycles)
  - Eligibility checking
  - Approval workflow
  - Leave duration calculation

#### Analytics & Reporting
- **Route**: `/dashboard/analytics`
- **File**: `/app/dashboard/analytics/page.tsx`
- **Loading**: `/app/dashboard/analytics/loading.tsx`
- **Features**:
  - Fleet-wide compliance metrics
  - Expiring certifications dashboard
  - Pilot statistics
  - Leave pattern analysis
  - Retirement projections

#### Admin Settings
- **Route**: `/dashboard/admin/settings`
- **File**: `/app/dashboard/admin/settings/page.tsx`
- **Client Component**: `/app/dashboard/admin/settings/settings-client.tsx`
- **Features**:
  - System configuration
  - Certification categories
  - Leave policies
  - Application settings

#### Check Types Management
- **Route**: `/dashboard/admin/check-types`
- **File**: `/app/dashboard/admin/check-types/page.tsx`
- **Features**:
  - Check type CRUD
  - Category management (Initial, Proficiency, Line, Type Rating, etc.)
  - Expiry period configuration

#### User Management
- **Route**: `/dashboard/admin/users`
- **New User**: `/app/dashboard/admin/users/new/page.tsx`
- **Features**:
  - User CRUD operations
  - Role assignment (Admin, Manager, Pilot)
  - Permission management

#### Admin Overview
- **Route**: `/dashboard/admin`
- **File**: `/app/dashboard/admin/page.tsx`
- **Loading**: `/app/dashboard/admin/loading.tsx`
- **Purpose**: Admin dashboard with system overview

### Pilot Portal Routes

#### Portal Home
- **Path**: `/portal`
- **Redirect**: `/portal/dashboard`
- **File**: `/app/portal/page.tsx`
- **Features**: Pilot-specific home page

#### Portal Dashboard
- **Route**: `/portal/dashboard`
- **File**: `/app/portal/dashboard/page.tsx`
- **Loading**: `/app/portal/dashboard/loading.tsx`
- **Features**:
  - Personal certification status
  - Expiring certifications alerts
  - Leave status overview
  - Personal metrics

#### Portal Certifications
- **Route**: `/portal/certifications`
- **File**: `/app/portal/certifications/page.tsx`
- **Loading**: `/app/portal/certifications/loading.tsx`
- **Features**:
  - View personal certifications
  - Download PDF certificates
  - Track expiry dates
  - Color-coded compliance status

#### Portal Leave Management
- **Route**: `/portal/leave`
- **List Page**: `/app/portal/leave/page.tsx`
- **Loading**: `/app/portal/leave/loading.tsx`
- **Create New**: `/app/portal/leave/new/page.tsx`
- **Features**:
  - Submit leave requests
  - View leave history
  - Roster period awareness
  - Eligibility checking

#### Portal Flights
- **Route**: `/portal/flights`
- **List Page**: `/app/portal/flights/page.tsx`
- **Loading**: `/app/portal/flights/loading.tsx`
- **Create New**: `/app/portal/flights/new/page.tsx`
- **Features**:
  - Submit flight requests
  - Track flight status
  - View flight history

#### Portal Feedback
- **Route**: `/portal/feedback`
- **Form Page**: `/app/portal/feedback/new/page.tsx`
- **Feedback List**: `/app/portal/feedback/page.tsx`
- **Features**:
  - Submit feedback
  - View feedback history
  - Pagination support

### Layout Components

#### Root Layout
- **File**: `/app/layout.tsx`
- **Features**:
  - Global providers setup
  - Theme configuration
  - Font loading
  - PWA manifest integration

#### Dashboard Layout
- **File**: `/app/dashboard/layout.tsx`
- **Features**:
  - Admin navigation sidebar
  - Breadcrumb navigation
  - Role-based access control

#### Portal Layout
- **File**: `/app/portal/layout.tsx`
- **Features**:
  - Pilot-specific navigation
  - Mobile responsiveness

### Error & Loading Pages

#### Global Loading
- **File**: `/app/loading.tsx`
- **Purpose**: Skeleton loading for root level

#### Portal Error Handler
- **File**: `/app/portal/error.tsx`
- **Features**: Portal-specific error boundary

#### Portal Loading
- **File**: `/app/portal/loading.tsx`

#### Dashboard Loading
- **File**: `/app/dashboard/loading.tsx`

#### Service Worker
- **File**: `/app/sw.ts`
- **Purpose**: PWA service worker registration

---

## Components

### UI Components (shadcn/ui Based)

**Location**: `/components/ui/` (53 components + stories)

#### Form Components
- `form.tsx` - React Hook Form wrapper
- `input.tsx` - Text input field
- `textarea.tsx` - Textarea field
- `select.tsx` - Select dropdown
- `checkbox.tsx` - Checkbox input
- `label.tsx` - Form label

#### Dialog & Modal Components
- `dialog.tsx` - Dialog/modal container
- `alert-dialog.tsx` - Alert dialog for confirmations
- `confirm-dialog.tsx` - Custom confirmation dialog
- `modal.tsx` - Modal wrapper
- `popover.tsx` - Popover component

#### Data Display
- `table.tsx` - Data table
- `data-table.tsx` - Advanced data table with sorting/filtering
- `data-table-loading.tsx` - Data table skeleton loading
- `badge.tsx` - Status badges
- `card.tsx` - Card container
- `alert.tsx` - Alert notifications
- `error-alert.tsx` - Error-specific alert

#### Navigation
- `breadcrumb.tsx` - Breadcrumb navigation
- `dropdown-menu.tsx` - Dropdown menu

#### Feedback & Status
- `toast.tsx` - Toast notification
- `toaster.tsx` - Toast container
- `spinner.tsx` - Loading spinner
- `skeleton.tsx` - Content skeleton
- `retry-indicator.tsx` - Retry status indicator
- `network-status-indicator.tsx` - Network status display
- `offline-indicator.tsx` - Offline status indicator

#### Misc UI
- `button.tsx` - Button component
- `calendar.tsx` - Date picker calendar
- `empty-state.tsx` - Empty state display
- `pagination.tsx` - Pagination controls
- `skip-link.tsx` - Accessibility skip link
- `route-change-focus.tsx` - Focus management on route change

#### Stories (Storybook)
- `alert.stories.tsx`
- `badge.stories.tsx`
- `button.stories.tsx`
- `card.stories.tsx`
- `data-table.stories.tsx`
- `empty-state.stories.tsx`
- `input.stories.tsx`
- `network-status-indicator.stories.tsx`
- `offline-indicator.stories.tsx`
- `pagination.stories.tsx`
- `select.stories.tsx`
- `skeleton.stories.tsx`
- `spinner.stories.tsx`
- `toast.stories.tsx`
- `toaster.stories.tsx`

### Feature Components

#### Accessible Form Components
- `components/ui/accessible-form.tsx` - Accessible form wrapper

#### Accessibility Components
**Location**: `/components/accessibility/`
- `announcer.tsx` - Live region announcer for screen readers
- `focus-trap.tsx` - Focus trap for modals
- `skip-nav.tsx` - Skip navigation link
- `index.ts` - Barrel export

#### Theme Management
- `theme-provider.tsx` - Next-themes provider wrapper
- `theme-toggle.tsx` - Dark/light mode toggle
- `theme-provider.stories.tsx` - Theme provider Storybook story

#### Error Boundaries
- `error-boundary.tsx` - React error boundary
- `error-boundaries.tsx` - Multiple error boundaries
- `error-boundary.stories.tsx` - Error boundary Storybook story

#### Navigation Components
**Location**: `/components/navigation/`
- `dashboard-nav-link.tsx` - Dashboard sidebar link
- `page-breadcrumbs.tsx` - Breadcrumb navigation for pages
- `mobile-nav.tsx` - Mobile navigation menu
- `index.ts` - Barrel export

#### Pilot Management Components
**Location**: `/components/pilots/`
- `pilots-table.tsx` - Pilots list table view
- `pilots-view-toggle.tsx` - Switch between list/grid/card views
- `pilot-rank-group.tsx` - Group pilots by rank
- `index.ts` - Barrel export

#### Certification Components
**Location**: `/components/certifications/`
- `certifications-table.tsx` - Certifications list table
- `certifications-view-toggle.tsx` - View mode toggle
- `certification-category-group.tsx` - Group certifications by category
- `index.ts` - Barrel export

#### Leave Management Components
**Location**: `/components/leave/`
- `leave-request-group.tsx` - Group leave requests by status
- `index.ts` - Barrel export

#### Settings Components
**Location**: `/components/settings/`
- `certification-category-manager.tsx` - Manage certification categories
- `index.ts` - Barrel export

#### Dashboard Components
**Location**: `/components/dashboard/`
- `roster-period-carousel.tsx` - Navigate through 28-day roster periods
- `index.ts` - Barrel export

#### Portal Components
**Location**: `/components/portal/`
- `leave-request-form.tsx` - Portal leave request submission
- `flight-request-form.tsx` - Portal flight request form
- `feedback-form.tsx` - Portal feedback submission form
- `feedback-pagination.tsx` - Pagination for feedback list
- `form-error-alert.tsx` - Error alert for forms
- `portal-form-wrapper.tsx` - Common portal form wrapper
- `submit-button.tsx` - Disabled/loading submit button
- `index.ts` - Barrel export

#### Form Components
**Location**: `/components/forms/`
- `pilot-form.tsx` - Pilot creation/editing form
- `certification-form.tsx` - Certification form (admin)
- `leave-request-form.tsx` - Leave request form (admin)
- `form-field-wrapper.tsx` - Field wrapper with label/error
- `form-select-wrapper.tsx` - Select field wrapper
- `form-checkbox-wrapper.tsx` - Checkbox wrapper
- `form-date-picker-wrapper.tsx` - Date picker wrapper
- `form-textarea-wrapper.tsx` - Textarea wrapper
- `base-form-card.tsx` - Base form card container
- `index.ts` - Barrel export

#### Layout Components
**Location**: `/components/layout/`
- (Currently empty - reserved for future layout components)

#### Examples Components
**Location**: `/components/examples/`
- `optimistic-pilot-list.tsx` - Example of optimistic updates
- `optimistic-pilot-list.stories.tsx` - Storybook story
- `toast-example.tsx` - Toast notification example
- `optimistic-feedback-example.tsx` - Optimistic feedback example
- `connection-error-handling-example.tsx` - Error handling example

#### Offline Components
**Location**: `/components/offline/`
- `OfflineIndicator.tsx` - Offline status indicator

---

## API Routes

**Location**: `/app/api/`

### Pilot Management

#### Pilots List & CRUD
- **Route**: `GET /api/pilots`
- **File**: `/app/api/pilots/route.ts`
- **Methods**: GET (list), POST (create)
- **Features**:
  - Fetch all pilots with pagination
  - Create new pilot
  - Service: `pilot-service.ts`

#### Pilot Detail Operations
- **Route**: `GET/PUT/DELETE /api/pilots/[id]`
- **File**: `/app/api/pilots/[id]/route.ts`
- **Methods**:
  - GET: Fetch single pilot with certifications
  - PUT: Update pilot information
  - DELETE: Delete pilot
- **Service**: `pilot-service.ts`

### Certification Management

#### Certifications CRUD
- **Route**: `GET/POST /api/certifications`
- **File**: `/app/api/certifications/route.ts`
- **Methods**:
  - GET: List all certifications (with filtering)
  - POST: Create new certification
- **Features**:
  - Expiry date calculation
  - Status color coding
  - Service: `certification-service.ts`

#### Certification Detail Operations
- **Route**: `GET/PUT/DELETE /api/certifications/[id]`
- **File**: `/app/api/certifications/[id]/route.ts`
- **Methods**:
  - GET: Fetch certification details
  - PUT: Update certification
  - DELETE: Delete certification
- **Service**: `certification-service.ts`

### Leave Management

#### Leave Requests CRUD
- **Route**: `GET/POST /api/leave-requests`
- **File**: `/app/api/leave-requests/route.ts`
- **Methods**:
  - GET: List leave requests with filters
  - POST: Submit new leave request
- **Features**:
  - Roster period alignment
  - Eligibility checking
  - Approval workflow
  - Service: `leave-service.ts`, `leave-eligibility-service.ts`

### Check Types

#### Check Types Management
- **Route**: `GET/POST /api/check-types`
- **File**: `/app/api/check-types/route.ts`
- **Methods**:
  - GET: List all check types
  - POST: Create new check type
- **Features**:
  - Category management
  - Expiry period configuration
  - Service: `check-types-service.ts`

### Analytics

#### Dashboard Analytics
- **Route**: `GET /api/analytics`
- **File**: `/app/api/analytics/route.ts`
- **Purpose**: Fetch analytics data for dashboards
- **Features**:
  - Compliance metrics
  - Expiring certifications
  - Leave statistics
  - Service: `analytics-service.ts`, `dashboard-service.ts`

### Settings

#### Settings CRUD
- **Route**: `GET/POST /api/settings`
- **File**: `/app/api/settings/route.ts`
- **Methods**:
  - GET: Fetch application settings
  - POST: Update settings

#### Setting Detail Operations
- **Route**: `GET/PUT/DELETE /api/settings/[id]`
- **File**: `/app/api/settings/[id]/route.ts`
- **Service**: `admin-service.ts`

### User Management

#### User Management
- **Route**: `GET/POST /api/users`
- **File**: `/app/api/users/route.ts`
- **Methods**:
  - GET: List users
  - POST: Create user
- **Service**: `user-service.ts`

### Authentication

#### Sign Out
- **Route**: `POST /api/auth/signout`
- **File**: `/app/api/auth/signout/route.ts`
- **Purpose**: Handle user logout and session cleanup

---

## Services

**Location**: `/lib/services/`

All database operations flow through service layer (no direct Supabase calls).

### Core Services

#### Pilot Service
- **File**: `pilot-service.ts`
- **Exports**:
  - `getPilots()` - Fetch all pilots with pagination
  - `getPilotById(id)` - Get single pilot with full details
  - `createPilot(data)` - Create new pilot
  - `updatePilot(id, data)` - Update pilot information
  - `deletePilot(id)` - Delete pilot
  - `getPilotWithCertifications(id)` - Pilot + certifications
  - `getCaptainQualifications(id)` - Get captain qualifications
  - `updateCaptainQualifications(id, qualifications)` - Update qualifications

#### Certification Service
- **File**: `certification-service.ts`
- **Exports**:
  - `getCertifications()` - List all certifications
  - `getCertificationById(id)` - Get certification details
  - `createCertification(data)` - Create certification
  - `updateCertification(id, data)` - Update certification
  - `deleteCertification(id)` - Delete certification
  - `getExpiringCertifications(days)` - Get certifications expiring soon
  - `calculateColorStatus(daysUntilExpiry)` - Get FAA color code

#### Leave Service
- **File**: `leave-service.ts`
- **Exports**:
  - `getLeaveRequests()` - List leave requests
  - `getLeaveRequestById(id)` - Get request details
  - `createLeaveRequest(data)` - Submit leave request
  - `updateLeaveRequest(id, data)` - Update request
  - `deleteLeaveRequest(id)` - Delete request
  - `approveLeaveRequest(id)` - Approve request
  - `rejectLeaveRequest(id)` - Reject request

#### Leave Eligibility Service
- **File**: `leave-eligibility-service.ts`
- **Purpose**: Complex leave eligibility logic (rank-separated)
- **Exports**:
  - `checkLeaveEligibility(pilotId, startDate, endDate)` - Check if leave can be approved
  - `getEligibilityByRank(rank, startDate, endDate)` - Check by rank
  - `calculateMinimumCrewRequirement()` - Get minimum crew needed per rank

#### Expiring Certifications Service
- **File**: `expiring-certifications-service.ts`
- **Purpose**: Calculate and track expiring certifications
- **Exports**:
  - `getExpiringCertifications(days)` - Get certifications expiring within X days
  - `getDetailedExpiringList()` - Detailed expiry report
  - `getPilotExpiringCertifications(pilotId)` - Per-pilot expiry list

#### Dashboard Service
- **File**: `dashboard-service.ts`
- **Purpose**: Aggregate metrics for dashboard
- **Exports**:
  - `getDashboardMetrics()` - Overall dashboard stats
  - `getPilotDashboardMetrics(pilotId)` - Individual pilot stats
  - `getComplianceSummary()` - Fleet compliance percentage

#### Analytics Service
- **File**: `analytics-service.ts`
- **Purpose**: Process analytics data
- **Exports**:
  - `getAnalyticsData()` - Main analytics dataset
  - `getCertificationStats()` - Certification statistics
  - `getLeaveStats()` - Leave request statistics
  - `getFleetMetrics()` - Fleet-wide metrics

#### Check Types Service
- **File**: `check-types-service.ts`
- **Exports**:
  - `getCheckTypes()` - List all check types
  - `getCheckTypeById(id)` - Get check type details
  - `createCheckType(data)` - Create check type
  - `updateCheckType(id, data)` - Update check type
  - `deleteCheckType(id)` - Delete check type
  - `getCategoriesByType()` - Group by category

#### PDF Service
- **File**: `pdf-service.ts`
- **Purpose**: Generate PDF reports
- **Exports**:
  - `generatePilotReport(pilotId)` - Generate pilot PDF
  - `generateCertificationReport()` - Certification report
  - `generateLeaveReport()` - Leave report

#### Admin Service
- **File**: `admin-service.ts`
- **Purpose**: System administration
- **Exports**:
  - `getSettings()` - Fetch app settings
  - `updateSetting(key, value)` - Update setting
  - `getSetting(key)` - Get single setting
  - `getSystemStatus()` - System health check

#### User Service
- **File**: `user-service.ts`
- **Exports**:
  - `getUsers()` - List all users
  - `getUserById(id)` - Get user details
  - `createUser(data)` - Create user
  - `updateUser(id, data)` - Update user
  - `deleteUser(id)` - Delete user
  - `assignRole(userId, role)` - Assign role

#### Pilot Portal Service
- **File**: `pilot-portal-service.ts`
- **Purpose**: Pilot-specific operations
- **Exports**:
  - `getPortalDashboard(pilotId)` - Portal dashboard data
  - `getMyLeaveRequests(pilotId)` - My leave requests
  - `getMyFlightRequests(pilotId)` - My flight requests
  - `getMyFeedback(pilotId)` - My feedback

#### Cache Service
- **File**: `cache-service.ts`
- **Purpose**: Performance caching with TTL
- **Exports**:
  - `getCachedData(key)` - Get cached data
  - `setCachedData(key, data, ttl)` - Cache data with TTL
  - `invalidateCache(key)` - Clear cache entry
  - `clearAllCache()` - Clear all cache

#### Audit Service
- **File**: `audit-service.ts`
- **Purpose**: Log all CRUD operations
- **Exports**:
  - `logCreate(table, record)` - Log create operation
  - `logUpdate(table, oldRecord, newRecord)` - Log update
  - `logDelete(table, record)` - Log delete
  - `getAuditLog(filters)` - Retrieve audit history

---

## Hooks & Utilities

### Custom Hooks

**Location**: `/lib/hooks/`

#### Form Hooks
- `use-portal-form.ts` - Portal form state management
- `use-deduplicated-submit.ts` - Prevent duplicate submissions

#### State Management
- `use-retry-state.ts` - Retry state for failed operations
- `use-optimistic-mutation.ts` - Optimistic updates

#### Accessibility
- `use-focus-management.ts` - Focus management utilities
- `use-keyboard-nav.ts` - Keyboard navigation

#### UI State
- `use-touch.ts` - Touch event handling
- `use-online-status.ts` - Network status detection

### Utility Functions

**Location**: `/lib/utils/`

#### Date & Time Utilities
- `date-utils.ts` - General date functions (formatting, parsing)
- `roster-utils.ts` - 28-day roster period calculations
- `date-range-utils.ts` - Date range operations

#### Certification Utilities
- `certification-utils.ts` - FAA color coding, expiry calculations
- `qualification-utils.ts` - Captain qualification helpers

#### Form Utilities
- `form-utils.ts` - Form-related helpers
- `form-layouts.ts` - Form layout configurations

#### API & Response
- `api-response.ts` - Standardized API response formatting
- `error-messages.ts` - Standardized error messages (50+ message types)
- `constraint-error-handler.ts` - Database constraint error handling

#### Roster & Export
- `roster-utils.ts` - Roster management
- `export-utils.ts` - Data export (CSV, PDF)

#### Optimization & Safety
- `optimistic-utils.ts` - Optimistic update helpers
- `retry-utils.ts` - Retry logic with exponential backoff
- `type-guards.ts` - TypeScript type guards

#### Accessibility & Logging
- `focus-trap.ts` - Focus trap implementation
- `logger.ts` - Application logging
- `metadata.ts` - Metadata utilities

#### Core Utilities
- `utils.ts` - Main utility exports
- `index.ts` - Barrel export

#### Configuration
- `env.ts` - Environment variable validation

### Request/Response Utilities

#### Rate Limiting
- `rate-limit.ts` - Rate limiting with Upstash Redis

#### Request Deduplication
- `request-deduplication.ts` - Prevent duplicate requests

#### Sanitization
- `sanitize.ts` - HTML/XSS sanitization

#### Error Logging
- `error-logger.ts` - Centralized error logging

### Validation Schemas (Zod)

**Location**: `/lib/validations/`

- `pilot-validation.ts` - Pilot CRUD schemas
- `certification-validation.ts` - Certification schemas
- `leave-validation.ts` - Leave request schemas
- `user-validation.ts` - User management schemas
- `dashboard-validation.ts` - Dashboard data schemas
- `analytics-validation.ts` - Analytics schemas
- `index.ts` - Barrel export (all schemas)

---

## Type Definitions

**Location**: `/types/`

### Main Type Files

#### Pilot Types
- **File**: `pilot.ts`
- **Exports**:
  - `CaptainQualifications` - Captain qualification JSONB type
  - `PilotRow` - Pilot database row with typed qualifications
  - `PilotInsert` - Insert type for new pilots
  - `PilotUpdate` - Update type for pilots
  - `PilotWithDetails` - Pilot + computed fields
  - `CaptainQualificationSummary` - Qualification summary

#### Supabase Types
- **File**: `supabase.ts`
- **Generated**: From Supabase schema via `npm run db:types`
- **Size**: 2000+ lines
- **Exports**:
  - `Database` - Complete database schema types
  - All table types: `pilots`, `pilot_checks`, `check_types`, `leave_requests`, `flight_requests`, `an_users`, etc.
  - All function return types
  - All view types

#### Index
- **File**: `index.ts`
- **Purpose**: Barrel export of all types

---

## E2E Tests

**Location**: `/e2e/`

### Test Files

#### Authentication Tests
- **File**: `auth.spec.ts`
- **Covers**: Login, logout, session management

#### Pilot Management Tests
- **File**: `pilots.spec.ts`
- **Covers**: Create, read, update, delete pilots

#### Certification Tests
- **File**: `certifications.spec.ts`
- **Covers**: Certification CRUD, expiry tracking

#### Leave Request Tests
- **File**: `leave-requests.spec.ts`
- **Covers**: Leave request workflow, eligibility, approval

#### Dashboard Tests
- **File**: `dashboard.spec.ts`
- **Covers**: Dashboard rendering, metrics display

#### Flight Requests Tests
- **File**: `flight-requests.spec.ts`
- **Covers**: Flight request submission and management

#### Portal Tests
- **File**: `portal-quick-test.spec.ts`
- **Covers**: Portal functionality quick smoke tests
- **File**: `portal-error-check.spec.ts`
- **Covers**: Portal error handling

#### Feedback Tests
- **File**: `feedback.spec.ts`
- **Covers**: Feedback submission and history

#### Accessibility Tests
- **File**: `accessibility.spec.ts`
- **Covers**: WCAG compliance, screen reader support, keyboard navigation

#### Performance Tests
- **File**: `performance.spec.ts`
- **Covers**: Page load times, response times, Core Web Vitals

#### PWA Tests
- **File**: `pwa.spec.ts`
- **Covers**: Service worker, offline functionality, installation

#### Rate Limiting Tests
- **File**: `rate-limiting.spec.ts`
- **Covers**: Rate limit enforcement, error handling

#### Mobile Navigation Tests
- **File**: `mobile-navigation.spec.ts`
- **Covers**: Mobile responsive design, touch interactions

#### Example Tests
- **File**: `example.spec.ts`
- **Purpose**: Playwright example/reference tests

---

## Database Schema

### Supabase Project
- **Project ID**: `wgdmgvonqysflwdiiols`
- **Provider**: PostgreSQL
- **Current Records**: 27 pilots, 607 certifications, 34 check types

### Main Tables

#### pilots
- **Columns**: id, name, rank, seniority_number, commencement_date, retirement_date, contract_type_id, status, captain_qualifications (JSONB), created_at, updated_at
- **Records**: 27
- **Indexes**: seniority, status, commencement_date

#### pilot_checks
- **Columns**: id, pilot_id, check_type_id, date_issued, expiry_date, remarks, created_at, updated_at
- **Records**: 607
- **Purpose**: Stores individual certification records
- **Indexes**: pilot_id, check_type_id, expiry_date

#### check_types
- **Columns**: id, name, category, description, validity_months, created_at, updated_at
- **Records**: 34
- **Categories**: Initial, Proficiency, Line, Type Rating, etc.

#### leave_requests
- **Columns**: id, pilot_id, start_date, end_date, reason, status, roster_period, created_at, updated_at
- **Purpose**: Leave request management
- **Statuses**: pending, approved, rejected, cancelled

#### flight_requests
- **Columns**: id, pilot_id, flight_date, duration, status, created_at, updated_at
- **Purpose**: Flight request submissions

#### an_users
- **Purpose**: System authentication users
- **Integrated with**: Supabase Auth

#### contract_types
- **Records**: 3
- **Purpose**: Contract type definitions (Permanent, Contract, etc.)

#### disciplinary_actions
- **Purpose**: Track disciplinary records

### Database Views (Read-Only)

#### expiring_checks
- Simplified view of certifications expiring soon

#### detailed_expiring_checks
- Detailed certification expiry information with pilot details

#### compliance_dashboard
- Fleet-wide compliance metrics aggregation

#### pilot_report_summary
- Comprehensive pilot summaries with aggregated data

#### captain_qualifications_summary
- Captain qualification tracking and status

#### dashboard_metrics
- Real-time dashboard statistics

### Database Functions

#### calculate_years_to_retirement(pilot_id)
- Calculates years until retirement date

#### calculate_years_in_service(pilot_id)
- Calculates years in service based on commencement_date

#### get_fleet_compliance_summary()
- Returns fleet-wide compliance percentage

#### get_fleet_expiry_statistics()
- Returns distribution of expiring certifications

#### get_pilot_dashboard_metrics(pilot_id)
- Returns pilot-specific metrics

---

## Key Architecture Patterns

### Service Layer Pattern (MANDATORY)

All database operations must go through services:

```typescript
// ✅ CORRECT
import { getPilots } from '@/lib/services/pilot-service'

export async function GET() {
  const pilots = await getPilots()
  return NextResponse.json({ success: true, data: pilots })
}

// ❌ WRONG - Never call Supabase directly
const { data } = await supabase.from('pilots').select('*')
```

### Supabase Clients (Context-Specific)

1. **Browser Client** (`lib/supabase/client.ts`):
   - Use in Client Components (`'use client'`)
   - Real-time subscriptions

2. **Server Client** (`lib/supabase/server.ts`):
   - Use in Server Components, Server Actions, Route Handlers
   - SSR-compatible with async cookies

3. **Middleware Client** (`lib/supabase/middleware.ts`):
   - Authentication state management
   - Route protection

### Business Logic Rules

#### Roster Period System (28-Day Cycles)
- **Anchor**: RP12/2025 starts 2025-10-11
- All leave aligned to roster period boundaries
- Automatic rollover to next year after RP13

#### Certification Color Coding (FAA)
- 🔴 Red: Expired
- 🟡 Yellow: ≤30 days until expiry
- 🟢 Green: >30 days until expiry

#### Leave Eligibility (Rank-Separated)
- Minimum 10 Captains available
- Minimum 10 First Officers available
- Approved by seniority within rank
- Special alerts for overlapping requests

#### Captain Qualifications
- Stored as JSONB: line_captain, training_captain, examiner, rhs_captain_expiry
- Tracked separately from regular certifications

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.4 | App framework |
| React | 19.1.0 | UI library |
| TypeScript | 5.7.3 | Type safety |
| Turbopack | Built-in | Build system |
| Tailwind CSS | 4.1.0 | Styling |
| Supabase | 2.75.1 | PostgreSQL + Auth + Storage |
| TanStack Query | 5.90.2 | Server state |
| React Hook Form | 7.65.0 | Form handling |
| Zod | 4.1.12 | Validation |
| Playwright | 1.55.0 | E2E testing |
| Storybook | 8.5.11 | Component dev |
| Radix UI | Various | Headless UI |
| Lucide React | 0.546.0 | Icons |
| Serwist | 9.2.1 | PWA/Service Worker |

---

## File Structure Summary

```
fleet-management-v2/
├── app/                          # Next.js 15 App Router (PAGES & ROUTES)
│   ├── api/                      # 11 API route handlers
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Admin dashboard (8 sections)
│   ├── portal/                   # Pilot portal (6 sections)
│   ├── login/                    # Legacy login
│   └── layout.tsx, page.tsx       # Root level
│
├── components/                   # 85+ React components
│   ├── ui/                       # 53 shadcn/ui components + stories
│   ├── portal/                   # 8 portal-specific components
│   ├── forms/                    # 10 form components
│   ├── navigation/               # 4 navigation components
│   ├── accessibility/            # 4 accessibility components
│   ├── pilots/                   # 3 pilot components
│   ├── certifications/           # 3 certification components
│   ├── dashboard/                # 1 dashboard component
│   ├── leave/                    # 1 leave component
│   ├── settings/                 # 1 settings component
│   ├── examples/                 # 4 example components
│   └── offline/                  # 1 offline component
│
├── lib/                          # Core functionality
│   ├── services/                 # 13 business logic services
│   ├── hooks/                    # 8 custom React hooks
│   ├── supabase/                 # 4 Supabase client types
│   ├── utils/                    # 20+ utility modules
│   └── validations/              # 7 Zod schemas
│
├── types/                        # 3 TypeScript type files
│
├── e2e/                          # 15 Playwright test files
│
└── [config files & docs]
```

---

## Critical Notes for Development

### AVOID DUPLICATING:

✅ **Already Exists:**
- All major CRUD pages (pilots, certifications, leave)
- All service layer functions
- All API routes
- Complete authentication system
- Dashboard analytics
- Pilot portal system
- Form components with validation
- E2E test coverage
- PWA support

### AREAS FOR ENHANCEMENT:

These features are minimally implemented or could be enhanced:
- Advanced filtering options on data tables
- Export functionality (partially implemented)
- Real-time collaboration features
- Mobile app (native)
- Advanced reporting features
- Machine learning based predictions
- Integration with external systems

---

**Document Created**: October 22, 2025
**Next.js Version**: 15.5.4 | **React**: 19.1.0 | **TypeScript**: 5.7.3
