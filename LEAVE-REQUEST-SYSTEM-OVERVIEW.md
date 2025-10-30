# Leave Request System - Comprehensive Architecture Overview

**Fleet Management V2 - B767 Pilot Management System**

**Created**: October 26, 2025  
**Updated**: Latest Research

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Service Layer Architecture](#service-layer-architecture)
4. [API Routes](#api-routes)
5. [UI Components & Pages](#ui-components--pages)
6. [Validation & Type Safety](#validation--type-safety)
7. [Business Rules & Logic](#business-rules--logic)
8. [Authentication & Authorization](#authentication--authorization)
9. [Error Handling](#error-handling)
10. [Data Flow](#data-flow)

---

## System Overview

The leave request system is a **comprehensive pilot leave management solution** that handles:

- **Leave Request Submission** - Pilots submit requests via portal or admin creates manually
- **Eligibility Checking** - Validates crew requirements based on rank-specific rules
- **Request Review & Approval** - Admins review and approve/deny requests with seniority-based recommendations
- **Conflict Detection** - Identifies overlapping requests and provides spreading suggestions
- **Audit Logging** - All CRUD operations are logged for compliance
- **Crew Availability Tracking** - Real-time calculation of available captains/first officers

### Key Statistics

- **Leave Types**: 8 (RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
- **Request Statuses**: 3 (PENDING, APPROVED, DENIED)
- **Roster Periods**: 13 per year (28-day cycles)
- **Minimum Crew**: 10 Captains AND 10 First Officers (always maintained)
- **Maximum Leave Duration**: 90 days per request

---

## Database Schema

### Primary Table: `leave_requests`

```sql
CREATE TABLE leave_requests (
  id                UUID PRIMARY KEY (generated)
  pilot_id          UUID NOT NULL (foreign key → pilots.id)
  request_type      TEXT NOT NULL (enum: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
  roster_period     TEXT NOT NULL (format: "RP{1-13}/{year}")
  start_date        TIMESTAMP NOT NULL (ISO datetime)
  end_date          TIMESTAMP NOT NULL (ISO datetime)
  days_count        INTEGER NOT NULL (calculated: inclusive days between start & end)
  status            TEXT NOT NULL (enum: PENDING, APPROVED, DENIED)
  reason            TEXT (optional, max 500 chars)
  request_date      TIMESTAMP NOT NULL (when request was submitted, separate from created_at)
  request_method    TEXT (enum: EMAIL, ORACLE, LEAVE_BIDS, SYSTEM)
  is_late_request   BOOLEAN (true if <21 days advance notice)
  reviewed_by       UUID (foreign key → an_users.id)
  reviewed_at       TIMESTAMP (when request was reviewed)
  review_comments   TEXT (max 500 chars)
  created_at        TIMESTAMP NOT NULL (system timestamp)
  updated_at        TIMESTAMP NOT NULL (auto-updated)
)
```

### Indexes & Constraints

```sql
-- Unique constraints
UNIQUE (pilot_id, start_date, end_date)  -- Prevent duplicate requests for same dates
FOREIGN KEY (pilot_id) REFERENCES pilots(id) ON DELETE CASCADE
FOREIGN KEY (reviewed_by) REFERENCES an_users(id) ON DELETE SET NULL

-- Indexes for performance
INDEX on (pilot_id, status)
INDEX on (status, roster_period)
INDEX on (start_date, end_date)
INDEX on (created_at DESC)

-- Check constraints
CHECK (start_date <= end_date)
CHECK (status IN ('PENDING', 'APPROVED', 'DENIED'))
CHECK (request_type IN ('RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'))
```

### Relations

- **Many-to-One**: `leave_requests → pilots` (pilot submitting request)
- **Many-to-One**: `leave_requests → an_users` (reviewer/approver)
- **One-to-Many**: Implied one pilot can have many leave requests

---

## Service Layer Architecture

### Overview

All database operations MUST go through service functions in `lib/services/`. **Direct Supabase calls from API routes or components are forbidden.**

### Service Files

#### 1. **`leave-service.ts`** - Core Leave Management

**Interfaces**:
```typescript
interface LeaveRequest {
  id: string
  pilot_id: string | null
  request_type: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE'
  roster_period: string
  start_date: string
  end_date: string
  days_count: number
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  reason?: string | null
  request_date?: string | null
  request_method?: 'EMAIL' | 'ORACLE' | 'LEAVE_BIDS' | 'SYSTEM' | null
  is_late_request?: boolean | null
  created_at: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comments?: string | null
  pilot_name?: string
  employee_id?: string
  pilot_role?: 'Captain' | 'First Officer' | null
  reviewer_name?: string | null
  pilots?: { first_name; middle_name?; last_name; employee_id; role }
}

interface LeaveRequestFormData {
  pilot_id: string
  request_type: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE'
  start_date: string
  end_date: string
  request_date: string
  request_method: 'ORACLE' | 'EMAIL' | 'LEAVE_BIDS' | 'SYSTEM'
  reason?: string
  is_late_request?: boolean
}
```

**Functions**:
```typescript
// ===== FETCH OPERATIONS =====
getAllLeaveRequests()                           // Get all requests with pilot info
getLeaveRequestById(requestId)                  // Get single request
getPilotLeaveRequests(pilotId)                  // Get requests for specific pilot
getPendingLeaveRequests()                       // Get all PENDING requests for review
getLeaveRequestsByRosterPeriod(rosterPeriod)    // Get requests for specific roster period

// ===== CREATE OPERATIONS =====
createLeaveRequestServer(requestData)           // Create new leave request
                                                // Throws DuplicateLeaveRequestError if duplicate

// ===== UPDATE OPERATIONS =====
updateLeaveRequestServer(requestId, data)       // Update leave request data
updateLeaveRequestStatus(requestId, status, reviewedBy, comments)
                                                // ATOMIC: Approve/deny with audit log

// ===== DELETE OPERATIONS =====
deleteLeaveRequest(requestId)                   // Delete PENDING request only

// ===== CONFLICT CHECKING =====
checkLeaveConflicts(pilotId, startDate, endDate, excludeRequestId?)
                                                // Find overlapping requests

// ===== STATISTICS =====
getLeaveRequestStats()                          // Aggregate stats by status & type
```

**Key Features**:
- Uses server-only Supabase client
- Auto-calculates `days_count` and `roster_period` from dates
- Detects duplicate leave requests and throws specific error
- Joins pilot and reviewer data in response
- Atomic status updates using PostgreSQL RPC function

---

#### 2. **`leave-eligibility-service.ts`** - Complex Eligibility Logic

**CRITICAL**: This service implements sophisticated **rank-separated** crew requirement checking.

**Key Business Rule**:
```
Captains and First Officers are evaluated INDEPENDENTLY
- Each rank has minimum requirement of 10 pilots
- Approval priority: Seniority within same rank only
- Multiple pilots requesting same dates: calculated based on rank
```

**Interfaces**:
```typescript
interface CrewRequirements {
  minimumCaptains: number           // 10
  minimumFirstOfficers: number      // 10
  numberOfAircraft: number          // 2
  captainsPerHull: number           // 5
  firstOfficersPerHull: number      // 5
}

interface CrewAvailability {
  date: string
  availableCaptains: number
  availableFirstOfficers: number
  onLeaveCaptains: number
  onLeaveFirstOfficers: number
  totalCaptains: number
  totalFirstOfficers: number
  meetsMinimum: boolean
  captainsShortfall: number         // Negative if below minimum
  firstOfficersShortfall: number
}

interface LeaveEligibilityCheck {
  isEligible: boolean
  conflicts: LeaveConflict[]
  affectedDates: string[]
  recommendation: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED'
  reasons: string[]
  alternativePilots: PilotRecommendation[]
  crewImpact: CrewAvailability[]
  conflictingRequests?: ConflictingRequest[]
  seniorityRecommendation?: string
}

interface ConflictingRequest {
  requestId: string
  pilotId: string
  pilotName: string
  employeeId: string
  role?: 'Captain' | 'First Officer'
  seniorityNumber: number
  startDate: string
  endDate: string
  requestDate: string
  requestType?: string
  reason?: string
  overlappingDays: number
  isPriority: boolean
  recommendation: string
  overlapType?: 'EXACT' | 'PARTIAL' | 'ADJACENT' | 'NEARBY'
  overlapMessage?: string
  spreadSuggestion?: string
}
```

**Functions**:
```typescript
// ===== REQUIREMENTS & AVAILABILITY =====
getCrewRequirements()                           // Get min crew from settings
calculateCrewAvailability(startDate, endDate, excludeRequestId?)
                                                // Calculate daily crew availability

// ===== CONFLICT DETECTION =====
getConflictingPendingRequests(request)          // Get PENDING requests for same dates
                                                // Includes seniority comparison

// ===== ELIGIBILITY CHECKING =====
checkLeaveEligibility(request)                  // Comprehensive eligibility check
                                                // Returns detailed analysis

checkBulkLeaveEligibility(rosterPeriod)         // Check multiple requests
                                                // Returns categorized results

// ===== RECOMMENDATIONS =====
getAlternativePilotRecommendations(role, startDate, endDate, excludePilotId)
                                                // Suggest alternative pilots by seniority
```

**Eligibility Decision Logic**:

```
SCENARIO 1: Single pilot requesting
  - isEligible = (currentAvailable - 1) >= minimumRequired
  - If eligible: APPROVE
  - If not eligible: DENY with crew shortage message

SCENARIO 2: Multiple pilots of SAME RANK requesting overlapping dates
  - remainingAfterAllApprovals = currentAvailable - totalRequesting
  
  CASE 2a: remainingAfterAllApprovals >= minimumRequired
    → APPROVE ALL (sufficient crew even with all requests)
    → No spreading recommendations needed
  
  CASE 2b: remainingAfterAllApprovals < minimumRequired BUT > 0
    → maxApprovable = currentAvailable - minimumRequired
    → APPROVE top N by seniority number (lower = higher priority)
    → Recommend rescheduling for rest with date suggestions
  
  CASE 2c: currentAvailable <= minimumRequired (at/below minimum)
    → Cannot approve anyone without violating minimum
    → Generate spreading recommendations for all
    → Suggest sequential approvals or date changes

PRIORITY ORDER FOR APPROVAL:
  1. Seniority Number (lower = higher priority WITHIN SAME RANK)
  2. Request Submission Date (earlier = higher priority as tiebreaker)
  3. Leave Type (not used in current logic)
```

**Example Scenarios**:

```
Scenario A: 15 Captains available, 2 Captains requesting
  - Remaining after approval: 15 - 2 = 13
  - 13 >= 10 (minimum) ✅ APPROVE BOTH

Scenario B: 12 First Officers available, 4 First Officers requesting
  - Remaining after approval: 12 - 4 = 8
  - 8 < 10 (minimum) ❌ Only approve 2 (12 - 10 = 2 max)
  - Top 2 by seniority get approved
  - Other 2 get "REQUEST TO RESCHEDULE" with date suggestions

Scenario C: 10 Captains available, 3 Captains requesting (at minimum)
  - Remaining after approval: 10 - 3 = 7
  - 7 < 10 (minimum) ❌ Cannot approve any without violating crew minimum
  - Generate spreading recommendations for all 3
```

---

#### 3. **`pilot-leave-service.ts`** - Pilot Self-Service

Simplified wrapper around core leave service for pilot portal.

**Functions**:
```typescript
submitPilotLeaveRequest(request)                // Pilot submits request
                                                // Auto-sets pilot_id, request_date, method

getCurrentPilotLeaveRequests()                  // Get current pilot's requests

cancelPilotLeaveRequest(requestId)              // Cancel pending request
                                                // Ownership check included

getPilotLeaveStats()                            // Get stats for current pilot
```

**Security Features**:
- Validates pilot is authenticated
- Checks request belongs to pilot before allowing deletion
- Prevents cancellation of approved/denied requests

---

## API Routes

### Admin Management Routes

#### **`GET /api/leave-requests`**
- Fetch all leave requests (admin dashboard)
- Query params: `?pilotId=&status=&rosterPeriod=`
- Returns: `{ success, data: LeaveRequest[], count }`

#### **`POST /api/leave-requests`**
- Create new leave request (admin creates)
- Request body: `LeaveRequestCreateSchema`
- Returns: `{ success, data: LeaveRequest, message, warnings?, conflicts? }`
- Status: `201` on success, `409` on duplicate, `400` on validation error

#### **`PUT /api/leave-requests/[id]/review`**
- Approve or deny request
- Request body: `{ status: 'APPROVED'|'DENIED', comments?: string }`
- Returns: `{ success, message, requestId }`
- Calls atomic RPC function for transaction safety

---

### Pilot Portal Routes

#### **`POST /api/portal/leave-requests`**
- Submit new leave request (pilot self-service)
- Request body: `PilotLeaveRequestSchema`
- Auto-sets: `pilot_id`, `request_date` (today), `request_method` ('SYSTEM')
- Returns: `{ success, data: LeaveRequest, message }`

#### **`GET /api/portal/leave-requests`**
- Get all requests for authenticated pilot
- Returns: `{ success, data: LeaveRequest[] }`

#### **`DELETE /api/portal/leave-requests?id=<requestId>`**
- Cancel pending leave request
- Checks ownership and status
- Returns: `{ success, message }`

---

### Legacy Pilot API Routes

#### **`GET /api/pilot/leave`**
- Fetch requests for authenticated pilot
- Returns: `{ success, data: LeaveRequest[] }`

#### **`POST /api/pilot/leave`**
- Submit new leave request
- Validates using `PilotLeaveRequestSchema`
- Returns: `{ success, data: LeaveRequest }`

#### **`DELETE /api/pilot/leave/[id]`** (if exists)
- Not documented in exploration but likely mirrors portal route

---

## UI Components & Pages

### Page Structure

```
app/
├── dashboard/leave/
│   ├── page.tsx                          # Main leave management page
│   ├── new/
│   │   └── page.tsx                      # Create new leave request
│   └── [id]/
│       └── page.tsx                      # View/edit leave request
│
└── portal/(protected)/leave-requests/
    ├── page.tsx                          # Pilot leave requests list
    └── new/
        └── page.tsx                      # Pilot submit request
```

### Admin Dashboard

#### **`app/dashboard/leave/page.tsx`**
- Server component that fetches all leave requests
- Displays quick stats (pending, approved, denied, total days)
- Renders `<LeaveRequestsClient>` for filtering
- Has "Submit Leave Request" button for admin to create

**Stats Displayed**:
```
┌─────────────┬──────────────┬────────────┬──────────────┐
│   Pending   │   Approved   │   Denied   │  Total Days  │
│     15      │      42      │      8     │     285      │
└─────────────┴──────────────┴────────────┴──────────────┘
```

---

### Client Components

#### **`components/leave/leave-requests-client.tsx`**
- **Type**: Client component (`'use client'`)
- **Purpose**: Filtering and interactive review
- **Features**:
  - Filter by roster period (dropdown)
  - Group requests by type → role
  - Sort by start date within each group
  - Display `<LeaveRequestGroup>` for each type
  - Modal to review/approve requests
  - Real-time stats calculation

#### **`components/leave/leave-request-group.tsx`**
- **Type**: Client component
- **Purpose**: Display expandable group of requests
- **Features**:
  - Collapsible section for each leave type
  - Shows stats (total, pending, approved, denied, days)
  - Lists requests grouped by role (Captain, First Officer)
  - Sortable by start date
  - Shows multi-period indicator if request spans multiple roster periods
  - "View" button to open review modal

#### **`components/leave/leave-review-modal.tsx`**
- **Type**: Client component (dialog)
- **Purpose**: Review and approve/deny requests
- **Features**:
  - Shows request details (pilot name, dates, type, reason)
  - Displays crew availability impact
  - Shows seniority comparison if multiple pilots requesting
  - Textarea for review comments
  - Approve/Deny buttons with loading state
  - Calls PUT `/api/leave-requests/[id]/review`

---

### Form Components

#### **`components/forms/leave-request-form.tsx`**
- **Type**: Client component
- **Purpose**: Create and edit leave requests
- **Features**:
  - React Hook Form + Zod validation
  - Pilot selector (admin creating for another pilot)
  - Leave type dropdown
  - Start/end date pickers
  - Request method selector
  - Reason textarea
  - Auto-calculates late request flag
  - Create vs Edit mode
  - Loading states and error handling

#### **`components/portal/leave-request-form.tsx`**
- **Type**: Client component (simplified for pilots)
- **Purpose**: Pilot self-service request form
- **Features**:
  - No pilot selector (auto-set to current)
  - Leave type dropdown
  - Date pickers (YYYY-MM-DD format)
  - Reason textarea
  - Calls `POST /api/portal/leave-requests`

---

### Pilot Portal Pages

#### **`app/portal/(protected)/leave-requests/page.tsx`**
- Server component
- Fetches current pilot's leave requests
- Displays list with filters
- "Submit Request" button

#### **`app/portal/(protected)/leave-requests/new/page.tsx`**
- Server component with form
- Validates pilot is authenticated
- Shows `<LeaveRequestForm>` in simplified mode
- Redirects to list on success

---

## Validation & Type Safety

### Validation Schemas

#### **`lib/validations/leave-validation.ts`**

**Core Schemas**:
```typescript
LeaveRequestCreateSchema     // Full schema for admin creation
LeaveRequestUpdateSchema     // Partial schema for editing
LeaveRequestStatusUpdateSchema // For approval/denial
LeaveRequestIdSchema         // Single UUID validation
RosterPeriodFilterSchema     // For filtering
LeaveConflictCheckSchema     // For conflict detection
LeaveRequestFilterSchema     // Complex filtering
```

**Validation Rules**:
```typescript
// Type validation
request_type: must be one of RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE

// Date validation
- start_date: ISO datetime string, required
- end_date: ISO datetime string, required
- end_date >= start_date (required)
- Max duration: 90 days
- request_date <= start_date (must be submitted before/on start date)

// Late request validation
is_late_request: true IFF daysDiff(request_date, start_date) < 21

// Other validation
reason: max 500 characters
review_comments: max 500 characters
pilot_id: must be valid UUID
status: must be PENDING, APPROVED, or DENIED
request_method: must be EMAIL, ORACLE, LEAVE_BIDS, or SYSTEM
```

---

#### **`lib/validations/pilot-leave-schema.ts`**

**Schemas**:
```typescript
PilotLeaveRequestSchema      // Simplified for pilot submission
PilotLeaveCancelSchema       // For cancellation
```

**Key Differences from Admin Schema**:
```typescript
// Admin schema uses ISO datetime strings
// Pilot schema uses YYYY-MM-DD date strings (HTML date input compatible)

// Admin: "2025-10-26T15:30:00.000Z"
// Pilot: "2025-10-26"

// Pilot auto-fills:
// - request_date = today (calculated by service)
// - is_late_request = calculated from start_date
// - request_method = 'SYSTEM' (always)
```

**Helper Functions**:
```typescript
isLateRequest(startDate: string): boolean
  // Returns true if < 21 days until start_date

getTodayISO(): string
  // Returns today's date in ISO datetime format
```

---

### Type Exports

All types exported from service files for use in components:

```typescript
// From leave-service.ts
export interface LeaveRequest
export interface LeaveRequestFormData
export interface LeaveRequestStats

// From leave-eligibility-service.ts
export interface CrewRequirements
export interface CrewAvailability
export interface LeaveEligibilityCheck
export interface ConflictingRequest
export interface LeaveRequestCheck
```

---

## Business Rules & Logic

### 1. Roster Period System

**Anchor Point**: RP12/2025 starts 2025-10-11

**Calculation**:
```typescript
const ROSTER_DURATION = 28    // days per period
const daysSince = (date - 2025-10-11) / (1000 * 60 * 60 * 24)
const periodsPassed = floor(daysSince / 28)
number = 12 + periodsPassed  // Add to anchor period 12
year = 2025 + (floor(number / 13))
number = ((number - 1) % 13) + 1  // Normalize to 1-13
```

**Periods Rollover**:
- RP1 → RP13 → RP1 (next year)
- Calendar-independent from actual calendar months

---

### 2. Crew Minimum Requirements

**Rule**: Must maintain ALWAYS:
- Minimum 10 Captains available
- Minimum 10 First Officers available

**Calculation Logic**:
```
currentAvailable = totalPilots(role) - onApprovedLeave(role)

IF request.role === 'Captain':
  IF (currentAvailable - 1) >= 10: APPROVE
  ELSE: Check if other requests pending, apply seniority logic

IF request.role === 'First Officer':
  IF (currentAvailable - 1) >= 10: APPROVE
  ELSE: Check if other requests pending, apply seniority logic
```

**Rank Separation** (CRITICAL):
- Captains requests don't affect First Officer minimum
- First Officer requests don't affect Captain minimum
- Each rank evaluated independently

---

### 3. Seniority-Based Approval

**Priority Order**:
1. **Rank**: Captain requests processed before First Officer (if mixed)
2. **Seniority Number**: Lower number = higher priority
3. **Request Date**: Earlier submission = higher priority (tiebreaker)

**Seniority Determination**:
```
Seniority Number = Inverse of commencement_date
  Earlier hire date → Lower seniority number → Higher priority
  
Example:
  Pilot A hired 2010-01-15 → Seniority #1 (most senior)
  Pilot B hired 2015-03-20 → Seniority #5
  Pilot C hired 2020-08-10 → Seniority #15 (least senior)
```

---

### 4. Conflict Detection

**Three Levels of Detection**:

#### Level 1: Duplicate Detection
```
IF EXISTS (
  leave_requests 
  WHERE pilot_id = X 
  AND start_date = Y 
  AND end_date = Z
)
→ THROW DuplicateLeaveRequestError
```

#### Level 2: Crew Shortage Detection
```
FOR EACH date in [start_date, end_date]:
  IF (available_crew_after_approval < minimum):
    → Add to conflicts list
    → Set recommendation to REVIEW_REQUIRED or DENY
```

#### Level 3: Overlapping Requests Detection
```
FIND all PENDING leave requests FOR SAME RANK where:
  (req.start_date <= request.end_date) AND
  (req.end_date >= request.start_date)
→ Return with seniority comparison and spread suggestions
```

**Overlap Types**:
- `EXACT`: Same start and end dates
- `PARTIAL`: Some days overlap
- `ADJACENT`: Within 3 days of each other
- `NEARBY`: More than 3 days apart (good spacing)

---

### 5. Late Request Flag

```
is_late_request = daysDiff(request_date, start_date) < 21

Example:
  Today: 2025-10-26
  Requested start: 2025-10-30
  Days notice: 4 days < 21
  → is_late_request = true
```

Used for:
- Flagging requests that don't meet advance notice policy
- Potential additional review requirements
- Reporting on compliance

---

### 6. Request Methods

Four supported submission methods:

```
EMAIL      - Submitted via email (admin creates)
ORACLE     - Imported from Oracle HCM system
LEAVE_BIDS - Submitted via leave bidding system
SYSTEM     - Submitted via Fleet Management system portal
```

**Current Default**: SYSTEM (when pilot uses portal)

---

## Authentication & Authorization

### Authentication Layers

#### 1. **Middleware Authentication** (`lib/supabase/middleware.ts`)
- Handles session validation across requests
- Enforces route protection
- Manages cookie-based authentication

#### 2. **API Route Authentication**
```typescript
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

#### 3. **Service Layer Auth** (minimal, delegated to routes)
- `pilot-leave-service` checks authentication via `getCurrentPilot()`
- Validates pilot exists in authenticated session

---

### Authorization Patterns

#### Admin Routes (`/api/leave-requests/*`)
- Requires authentication
- Implicit admin role check (assumes middleware validates)
- Can create/edit/review any request

#### Pilot Routes (`/api/portal/leave-requests/*`, `/api/pilot/leave/*`)
- Requires authentication
- Pilot can only:
  - Submit own requests
  - View own requests
  - Cancel own PENDING requests
- Ownership check: `if (request.pilot_id !== pilot.id)`

#### Portal Pages (`/portal/(protected)/*`)
- Requires authentication (protected directory)
- Auto-scoped to current authenticated pilot

---

## Error Handling

### Custom Error Types

#### **DuplicateLeaveRequestError**
```typescript
name: 'DuplicateLeaveRequestError'
message: 'A leave request for these dates already exists. Please check your existing requests or contact your supervisor.'
status: 409 (Conflict)
```

---

### Standard API Error Responses

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "start_date": ["End date must be after start date"]
    }
  },
  "status": 400
}
```

#### Not Found
```json
{
  "success": false,
  "error": "Leave request not found",
  "status": 404
}
```

#### Authorization Error
```json
{
  "success": false,
  "error": "Unauthorized - You can only manage your own requests",
  "status": 403
}
```

#### Server Error
```json
{
  "success": false,
  "error": "Failed to create leave request",
  "status": 500
}
```

---

### Error Messages

Standardized error messages in `lib/utils/error-messages.ts`:

```typescript
ERROR_MESSAGES.LEAVE = {
  CREATE_FAILED: { message: 'Failed to create leave request', ... },
  FETCH_FAILED: { message: 'Failed to fetch leave requests', ... },
  NOT_FOUND: { message: 'Leave request not found', ... },
  DELETE_FAILED: { message: 'Failed to delete leave request', ... },
  UPDATE_FAILED: { message: 'Failed to update leave request', ... },
}
```

---

## Data Flow

### 1. Create Leave Request (Admin)

```
Admin Dashboard
      ↓
Click "Submit Leave Request"
      ↓
<LeaveRequestForm> (create mode)
      ↓
Fill form (pilot, type, dates, reason, method)
      ↓
Submit (onSubmit handler)
      ↓
POST /api/leave-requests
      ↓
LeaveRequestCreateSchema.parse(body)
      ↓
checkLeaveConflicts(...)
      ↓
createLeaveRequestServer(validatedData)
      ├→ Calculate days_count
      ├→ Calculate roster_period
      ├→ Insert into database
      ├→ Check for DuplicateLeaveRequestError
      └→ Create audit log
      ↓
Response: { success: true, data: LeaveRequest, ... }
      ↓
Redirect to /dashboard/leave
      ↓
Dashboard refreshes to show new request
```

---

### 2. Pilot Submits Leave Request (Self-Service)

```
Pilot Portal
      ↓
Navigate to /portal/leave-requests
      ↓
Click "Submit Request"
      ↓
<LeaveRequestForm> (pilot mode, simplified)
      ↓
Fill form (type, start_date, end_date, reason)
      ↓
Submit
      ↓
POST /api/portal/leave-requests
      ↓
PilotLeaveRequestSchema.parse(body)
      ↓
submitPilotLeaveRequest(validatedData)
      ├→ Get current authenticated pilot
      ├→ Auto-set: pilot_id, request_date, request_method, is_late_request
      ├→ Call createLeaveRequestServer(...)
      └→ Return result
      ↓
Response: { success: true, data: LeaveRequest, message }
      ↓
Show success toast
      ↓
Redirect to /portal/leave-requests
```

---

### 3. Admin Reviews & Approves Request

```
Dashboard Leave Page
      ↓
Load /dashboard/leave
      ↓
getAllLeaveRequests() → Server function
      ↓
Render <LeaveRequestsClient> with requests
      ↓
Filter & group by type/role/status
      ↓
Admin clicks "Review" on specific request
      ↓
<LeaveReviewModal> opens
      ↓
Display:
  ├─ Request details (dates, type, reason)
  ├─ Pilot info
  ├─ Crew impact (if available)
  └─ Seniority comparison (if multiple requesting)
      ↓
Admin selects APPROVED or DENIED
      ↓
Admin (optionally) adds review comments
      ↓
Click Submit
      ↓
PUT /api/leave-requests/[id]/review
      ↓
updateLeaveRequestStatus(requestId, status, user.id, comments)
      ├→ Call approve_leave_request(RPC function)
      ├→ Atomic: Update status + create audit log
      └→ Return { success, message, requestId }
      ↓
Close modal
      ↓
Reload page to show updated status
```

---

### 4. Eligibility Check (Background)

```
Admin reviews leave request details
      ↓
System could call checkLeaveEligibility(request)
      ↓
calculateCrewAvailability(startDate, endDate)
      ├→ Get all active pilots by role
      ├→ Get approved & pending leave for date range
      └→ Calculate daily availability (captains, FOs)
      ↓
getConflictingPendingRequests(request)
      ├→ Find other PENDING requests for same dates
      ├→ Compare seniority
      ├→ Generate spread suggestions
      └→ Return: { conflictingRequests, seniorityRecommendation }
      ↓
getAlternativePilotRecommendations(role, dates)
      ├→ Get pilots of same rank sorted by seniority
      ├→ Check leave status for each pilot
      └→ Return recommendations in priority order
      ↓
Determine recommendation:
  ├─ isEligible = no conflicts
  ├─ hasCriticalConflicts = below minimum crew per hull
  └─ seniorityRecommendation = text if multiple requesting
      ↓
Return: LeaveEligibilityCheck {
  isEligible,
  conflicts: [...],
  recommendation: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED',
  seniorityRecommendation,
  ...
}
      ↓
Display in UI (if implemented)
```

---

## Summary Matrix

| Aspect | Details |
|--------|---------|
| **Leave Types** | 8 types (RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE) |
| **Request Statuses** | PENDING, APPROVED, DENIED |
| **Services** | 3 core (leave, eligibility, pilot-leave) |
| **API Routes** | 6+ endpoints (admin + pilot + portal) |
| **UI Components** | 4 main (client, group, modal, form) |
| **Pages** | 4 pages (dashboard + portal) |
| **Validation** | Zod schemas for all inputs |
| **Min Crew** | 10 Captains + 10 First Officers (always) |
| **Max Leave** | 90 days per request |
| **Advance Notice** | 21 days (flags as late if less) |
| **Roster Periods** | 13 per year (28-day cycles) |
| **Audit Logging** | All CRUD operations logged |
| **Seniority System** | Lower seniority number = higher priority |
| **Rank Separation** | Captains & First Officers evaluated independently |

---

**End of Document**

Created: October 26, 2025 by Claude Code  
Last Updated: October 26, 2025
