# Flight Requests Capability Spec Delta

**Change ID**: `add-missing-core-features`
**Capability**: `flight-requests`
**Type**: NEW CAPABILITY
**Status**: Draft

---

## ADDED Requirements

### Requirement: Flight Request Submission

The system SHALL allow pilots to submit flight requests for additional flying opportunities with route, dates, and justification.

**Rationale**: Provides formal channel for pilots to bid for additional flights or route changes.

**Business Rules**:
- Flight requests MUST include route, dates, reason
- Requests MUST default to PENDING status
- Pilots CAN edit or delete PENDING requests
- Pilots CANNOT modify APPROVED or DENIED requests

#### Scenario: Submit New Flight Request

- **WHEN** a pilot navigates to `/pilot/flight-requests` and clicks "New Request"
- **AND** fills out form with route "POM-LAE-POM", dates "2025-04-10 to 2025-04-12", reason "Additional flying hours"
- **AND** clicks "Submit"
- **THEN** the system creates flight request with status PENDING
- **AND** displays confirmation "Flight request submitted for review"
- **AND** sends notification to admins

#### Scenario: View Flight Request List

- **WHEN** a pilot views `/pilot/flight-requests`
- **THEN** the system displays table with all their requests showing:
  - Route
  - Dates
  - Status (PENDING/APPROVED/DENIED)
  - Admin Comments
  - Submission Date
- **AND** requests are sorted by submission date descending (newest first)

---

### Requirement: Admin Flight Request Review

The system SHALL allow admins to review, approve, or deny pilot flight requests with comments.

**Rationale**: Enables operational control over crew assignments and flight opportunities.

**Business Rules**:
- Admins MUST see all flight requests from all pilots
- Admins MUST provide comments when denying requests
- Approval/denial MUST send notification to pilot
- APPROVED requests CANNOT be reverted to PENDING (can only be DENIED with reason)

#### Scenario: Admin Approves Flight Request

- **WHEN** an admin views `/dashboard/flight-requests`
- **AND** clicks on a PENDING request
- **AND** reviews request details (route, dates, reason, pilot seniority)
- **AND** clicks "Approve" with comment "Approved for RP4/2025 roster"
- **THEN** the system updates status to APPROVED
- **AND** saves admin comment
- **AND** sends notification to pilot "Your flight request for POM-LAE-POM has been approved"

#### Scenario: Admin Denies Flight Request

- **WHEN** an admin clicks "Deny" on a request
- **AND** provides reason "Route conflict with scheduled leave"
- **THEN** the system updates status to DENIED
- **AND** sends notification to pilot with denial reason

---

### Requirement: Flight Request Filtering

The system SHALL provide filtering capabilities for admins to manage flight requests efficiently.

**Rationale**: Admins need to prioritize and manage requests based on status and seniority.

**Business Rules**:
- Filters MUST include: Status (PENDING/APPROVED/DENIED), Date Range, Pilot Rank
- PENDING requests MUST be highlighted (default view)
- Requests MUST be sortable by submission date, seniority, route

#### Scenario: Filter by Status

- **WHEN** an admin selects "PENDING" filter
- **THEN** the system shows only requests with status PENDING
- **AND** displays count "Showing [count] pending requests"

#### Scenario: Sort by Seniority

- **WHEN** an admin clicks "Seniority" column header
- **THEN** the system re-sorts requests by seniority number ascending (highest priority first)

---

## MODIFIED Requirements

_No existing requirements are modified._

---

## REMOVED Requirements

_No requirements are removed._

---

## RENAMED Requirements

_No requirements are renamed._

---

## Implementation Notes

### Database Table

**`flight_requests`**:
- Columns: id, pilot_id, route, start_date, end_date, reason, status (PENDING/APPROVED/DENIED), admin_comments, created_at, updated_at, reviewed_by, reviewed_at
- RLS: Pilots see only own, Admins see all
- Indexes: pilot_id, status, created_at

### Service Layer

- **New**: `lib/services/flight-request-service.ts` - CRUD operations
- **Methods**: `createFlightRequest()`, `getFlightRequests()`, `updateFlightRequestStatus()`, `deleteFlightRequest()`

### API Routes

- `app/api/pilot/flight-requests/route.ts` - Pilot CRUD
- `app/api/admin/flight-requests/route.ts` - Admin review and approval

### Real-time

- Supabase Realtime subscription on `flight_requests` table for status changes

---

**Status**: Draft (Spec Delta)
**Validation Required**: Yes
**Breaking Changes**: No
