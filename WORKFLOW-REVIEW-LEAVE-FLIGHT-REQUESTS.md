# Pilot Portal Request Workflows - Complete Review

**Date**: October 26, 2025
**Review Status**: ✅ **COMPLETE**
**Reviewed By**: Claude Code

---

## 📋 Executive Summary

The pilot portal request workflows are **well-implemented** and follow service-layer architecture. Both leave requests and flight requests have complete end-to-end workflows from pilot submission through admin review and approval/denial.

### Overall Assessment: ✅ **EXCELLENT**

| Feature | Status | Notes |
|---------|--------|-------|
| **Leave Requests** | ✅ Complete | Full CRUD, proper service layer, validation |
| **Flight Requests** | ⚠️ Near Complete | Missing server action implementation |
| **Admin Review** | ✅ Complete | Both workflows have admin review interfaces |
| **Service Layer** | ✅ Excellent | Proper separation, authentication, error handling |
| **Database Design** | ✅ Complete | Proper tables, foreign keys, status tracking |

---

## 🔄 Leave Request Workflow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PILOT PORTAL LEAVE REQUEST FLOW                 │
└─────────────────────────────────────────────────────────────────────┘

1. PILOT SUBMISSION (Pilot Portal)
   ↓
   /portal/leave-requests (UI)
   ↓
   submitLeaveRequestAction() [Server Action]
   ↓
   POST /api/portal/leave-requests
   ↓
   submitPilotLeaveRequest() [Service Layer]
   ↓
   createLeaveRequestServer() [Core Service]
   ↓
   INSERT INTO leave_requests (status: PENDING)

2. ADMIN REVIEW (Admin Dashboard)
   ↓
   /dashboard/leave (Admin UI)
   ↓
   LeaveRequestsClient Component
   ↓
   Approve/Deny/Review Actions
   ↓
   UPDATE leave_requests SET status = 'APPROVED'/'DENIED'

3. PILOT NOTIFICATION
   ↓
   Pilot sees updated status in portal
   ↓
   Can cancel PENDING requests only
```

### Implementation Details

#### Pilot Portal Leave Request Service
**File**: `lib/services/pilot-leave-service.ts`

**Key Functions**:
```typescript
✅ submitPilotLeaveRequest(request): ServiceResponse<LeaveRequest>
   - Validates pilot authentication
   - Auto-sets pilot_id from session
   - Calculates is_late_request flag (< 21 days notice)
   - Sets request_date to today
   - Sets request_method to 'SYSTEM'

✅ getCurrentPilotLeaveRequests(): ServiceResponse<LeaveRequest[]>
   - Fetches all leave requests for authenticated pilot
   - Includes pilot details, reviewer info
   - Sorted by request_date DESC

✅ cancelPilotLeaveRequest(requestId): ServiceResponse
   - Only allows PENDING requests to be cancelled
   - Verifies pilot owns the request
   - Soft delete (updates status)
```

#### API Endpoints
**File**: `app/api/portal/leave-requests/route.ts`

**Endpoints**:
```typescript
✅ POST /api/portal/leave-requests
   - Submit new leave request
   - Validates with PilotLeaveRequestSchema (Zod)
   - Returns created request

✅ GET /api/portal/leave-requests
   - Get all leave requests for current pilot
   - No query params needed (uses session)

✅ DELETE /api/portal/leave-requests?id={requestId}
   - Cancel pending leave request
   - Validates ownership and status
   - Returns 403 if not allowed
```

#### Admin Dashboard
**File**: `app/dashboard/leave/page.tsx`

**Features**:
```typescript
✅ Display all leave requests (excluding RDO/SDO)
✅ Filter by roster period
✅ Quick stats (Pending, Approved, Denied, Total Days)
✅ LeaveRequestsClient component for review
✅ Approve/Deny actions
✅ Reviewer comments
✅ Status tracking
```

#### Database Schema
**Table**: `leave_requests`

```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY,
  pilot_id UUID REFERENCES pilots(id),
  request_type VARCHAR CHECK (request_type IN (
    'RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL',
    'LWOP', 'MATERNITY', 'COMPASSIONATE'
  )),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  request_date TIMESTAMPTZ NOT NULL,
  request_method VARCHAR CHECK (request_method IN ('SYSTEM', 'EMAIL', 'PHONE')),
  reason TEXT,
  is_late_request BOOLEAN DEFAULT FALSE,
  status VARCHAR CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
  reviewer_comments TEXT,
  reviewed_by UUID REFERENCES an_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### Leave Request Validation

**Zod Schema**: `lib/validations/pilot-leave-schema.ts`

```typescript
PilotLeaveRequestSchema {
  ✅ request_type: Enum (RDO, SDO, ANNUAL, etc.)
  ✅ start_date: YYYY-MM-DD format
  ✅ end_date: YYYY-MM-DD format
  ✅ roster_period: RP format (e.g., RP12/2025)
  ✅ days_count: Integer (calculated from dates)
  ✅ reason: Optional string

  Validations:
  - end_date must be >= start_date
  - roster_period format validation
  - days_count must be positive
}
```

### Leave Request Types

| Type | Description | Admin Approval Required |
|------|-------------|------------------------|
| **RDO** | Rostered Day Off | Yes |
| **SDO** | Scheduled Day Off | Yes |
| **ANNUAL** | Annual Leave | Yes |
| **SICK** | Sick Leave | Conditional |
| **LSL** | Long Service Leave | Yes |
| **LWOP** | Leave Without Pay | Yes |
| **MATERNITY** | Maternity Leave | Yes |
| **COMPASSIONATE** | Compassionate Leave | Conditional |

---

## ✈️ Flight Request Workflow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PILOT PORTAL FLIGHT REQUEST FLOW                  │
└─────────────────────────────────────────────────────────────────────┘

1. PILOT SUBMISSION (Pilot Portal)
   ↓
   /portal/flight-requests (UI)
   ↓
   submitFlightRequestAction() [Server Action] ⚠️ NOT IMPLEMENTED
   ↓
   POST /api/portal/flight-requests
   ↓
   submitPilotFlightRequest() [Service Layer]
   ↓
   INSERT INTO flight_requests (status: PENDING)

2. ADMIN REVIEW (Admin Dashboard)
   ↓
   /dashboard/flight-requests (Admin UI)
   ↓
   FlightRequestsTable Component
   ↓
   Approve/Deny/Review Actions
   ↓
   UPDATE flight_requests SET status = 'APPROVED'/'DENIED'

3. PILOT NOTIFICATION
   ↓
   Pilot sees updated status in portal
   ↓
   Can cancel PENDING requests only
```

### Implementation Details

#### Pilot Portal Flight Request Service
**File**: `lib/services/pilot-flight-service.ts`

**Key Functions**:
```typescript
✅ submitPilotFlightRequest(request): ServiceResponse<FlightRequest>
   - Validates pilot authentication
   - Auto-sets pilot_id and pilot_user_id from session
   - Sets status to 'PENDING'
   - Creates flight request record

✅ getCurrentPilotFlightRequests(): ServiceResponse<FlightRequest[]>
   - Fetches all flight requests for authenticated pilot
   - Includes pilot details, reviewer info
   - Sorted by created_at DESC

✅ cancelPilotFlightRequest(requestId): ServiceResponse
   - Only allows PENDING requests to be cancelled
   - Verifies pilot owns the request
   - Soft delete (updates status or removes)
```

#### API Endpoints
**File**: `app/api/portal/flight-requests/route.ts`

**Endpoints**:
```typescript
✅ POST /api/portal/flight-requests
   - Submit new flight request
   - Validates with FlightRequestSchema (Zod)
   - Returns created request

✅ GET /api/portal/flight-requests
   - Get all flight requests for current pilot
   - No query params needed (uses session)

✅ DELETE /api/portal/flight-requests?id={requestId}
   - Cancel pending flight request
   - Validates ownership and status
   - Returns 403 if not allowed
```

#### Admin Dashboard
**File**: `app/dashboard/flight-requests/page.tsx`

**Features**:
```typescript
✅ Display ALL flight requests (including RDO/SDO from leave_requests)
✅ Combined stats (Total, Pending, Under Review, Approved, Denied)
✅ Request type breakdown (Additional Flights, Route Changes, Swaps, RDO, SDO, Other)
✅ FlightRequestsTable component for review
✅ Approve/Deny/Review actions
✅ Reviewer comments
✅ Status tracking

IMPORTANT: RDO/SDO requests are stored in leave_requests table
           but displayed in flight requests admin page for convenience
```

#### Database Schema
**Table**: `flight_requests`

```sql
CREATE TABLE flight_requests (
  id UUID PRIMARY KEY,
  pilot_id UUID REFERENCES pilots(id),
  pilot_user_id UUID REFERENCES an_users(id),
  request_type VARCHAR CHECK (request_type IN (
    'ADDITIONAL_FLIGHT', 'ROUTE_CHANGE', 'SCHEDULE_SWAP', 'OTHER'
  )),
  flight_date DATE NOT NULL,
  description TEXT NOT NULL,
  reason TEXT,
  status VARCHAR CHECK (status IN (
    'PENDING', 'UNDER_REVIEW', 'APPROVED', 'DENIED'
  )),
  reviewer_comments TEXT,
  reviewed_by UUID REFERENCES an_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### Flight Request Validation

**Zod Schema**: `lib/validations/flight-request-schema.ts`

```typescript
FlightRequestSchema {
  ✅ request_type: Enum (ADDITIONAL_FLIGHT, ROUTE_CHANGE, SCHEDULE_SWAP, OTHER)
  ✅ flight_date: YYYY-MM-DD format
  ✅ description: String (required, min 10 chars)
  ✅ reason: Optional string

  Validations:
  - flight_date must be future date
  - description must be descriptive
}
```

### Flight Request Types

| Type | Description | Common Use Cases |
|------|-------------|------------------|
| **ADDITIONAL_FLIGHT** | Request extra flight | Overtime, training flights |
| **ROUTE_CHANGE** | Change assigned route | Family emergency, preferences |
| **SCHEDULE_SWAP** | Swap schedule with another pilot | Personal commitments |
| **RDO** | Rostered Day Off (from leave_requests) | Regular days off |
| **SDO** | Scheduled Day Off (from leave_requests) | Scheduled breaks |
| **OTHER** | Other flight-related requests | Special circumstances |

---

## ⚠️ Issues and Recommendations

### Issues Found

#### 1. ⚠️ **Flight Request Server Action Not Implemented**

**File**: `app/portal/flights/actions.ts:9-12`

**Current Code**:
```typescript
export async function submitFlightRequestAction(_formData: FormData) {
  // TODO: Implement flight request submission
  return { success: false, error: 'Not implemented yet' }
}
```

**Impact**:
- Pilot portal flight request form cannot submit via server action
- May need to use API route directly (which is fine, but inconsistent with leave requests)

**Recommendation**:
```typescript
export async function submitFlightRequestAction(formData: FormData) {
  try {
    // Extract form data
    const requestType = formData.get('request_type')
    const flightDate = formData.get('flight_date')
    const description = formData.get('description')
    const reason = formData.get('reason')

    // Validate required fields
    if (!requestType || !flightDate || !description) {
      return { success: false, error: 'Missing required fields' }
    }

    // Make API request to submit flight request
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/portal/flight-requests`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: requestType,
          flight_date: flightDate,
          description: description,
          reason: reason || undefined,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Failed to submit flight request' }
    }

    // Revalidate the portal pages to show updated data
    revalidatePath('/portal/flight-requests')
    revalidatePath('/portal/dashboard')

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Submit flight request action error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
```

---

### Recommendations

#### 1. ✅ **Add Email Notifications for Request Status Changes**

**When to Notify**:
- ✅ Leave request approved → Send approval email to pilot
- ✅ Leave request denied → Send denial email with reason
- ✅ Flight request approved → Send approval email
- ✅ Flight request denied → Send denial email with reason

**Implementation**:
- Use existing `lib/services/pilot-email-service.ts`
- Create new email templates for leave/flight approvals
- Integrate into admin approval workflow

**Example**:
```typescript
// In leave approval action
await sendLeaveRequestApprovalEmail({
  firstName: pilot.first_name,
  lastName: pilot.last_name,
  email: pilot.email,
  requestType: 'Annual Leave',
  startDate: '2025-11-01',
  endDate: '2025-11-07',
})
```

#### 2. ✅ **Add Request Notifications to Pilot Dashboard**

**Current**: Pilots must check `/portal/leave-requests` or `/portal/flight-requests` pages

**Recommendation**: Add notification badges on pilot dashboard showing:
- Number of pending requests
- Recent status changes
- Upcoming approved leave dates

#### 3. ✅ **Add Bulk Approval for Admins**

**Current**: Admins must approve/deny requests one at a time

**Recommendation**: Add checkbox selection + "Approve Selected" button for efficiency

#### 4. ✅ **Add Request Comments/Chat**

**Current**: One-way communication (pilot → admin)

**Recommendation**: Allow admins to request clarification, pilots to respond

#### 5. ✅ **Add Request Analytics**

**Charts to Add**:
- Leave request trends by month
- Approval/denial rates
- Average days between request and approval
- Most common leave types
- Request volume by pilot

---

## 🎯 Architecture Strengths

### ✅ **Service Layer Separation**

**Excellent implementation**:
- Pilot-facing services (`pilot-leave-service.ts`, `pilot-flight-service.ts`)
- Core services (`leave-service.ts`, `flight-request-service.ts`)
- Clear separation of concerns
- Proper authentication in pilot services

### ✅ **Error Handling**

**Consistent error messages**:
- Uses `ERROR_MESSAGES` utility
- Standardized `formatApiError()` responses
- Clear error categories (VALIDATION, AUTH, LEAVE, FLIGHT, NETWORK)

### ✅ **Validation**

**Zod schemas for**:
- Pilot leave requests
- Flight requests
- Type safety throughout the stack

### ✅ **Database Design**

**Proper normalization**:
- Foreign keys to pilots and an_users
- Status enums enforced at DB level
- Timestamp tracking (created_at, updated_at, reviewed_at)
- Reviewer tracking (reviewed_by, reviewer_comments)

### ✅ **Authentication**

**Dual authentication architecture**:
- Pilot portal uses `an_users` table (custom auth)
- Admin portal uses Supabase Auth
- Proper session validation in service layer
- getCurrentPilot() for pilot context

---

## 📊 Complete Workflow Comparison

| Feature | Leave Requests | Flight Requests |
|---------|---------------|-----------------|
| **Pilot Submission** | ✅ Complete | ⚠️ Server action missing |
| **API Endpoints** | ✅ POST, GET, DELETE | ✅ POST, GET, DELETE |
| **Service Layer** | ✅ Complete | ✅ Complete |
| **Validation** | ✅ Zod schema | ✅ Zod schema |
| **Admin Review UI** | ✅ Complete | ✅ Complete |
| **Status Tracking** | ✅ PENDING/APPROVED/DENIED | ✅ PENDING/UNDER_REVIEW/APPROVED/DENIED |
| **Cancel Function** | ✅ Pilots can cancel PENDING | ✅ Pilots can cancel PENDING |
| **Email Notifications** | ❌ Not implemented | ❌ Not implemented |
| **Comments/Notes** | ✅ Reviewer comments | ✅ Reviewer comments |
| **Database Table** | `leave_requests` | `flight_requests` |
| **Late Request Flag** | ✅ is_late_request | ❌ N/A |
| **Request Method** | ✅ SYSTEM/EMAIL/PHONE | ❌ N/A |

---

## 🔧 Quick Fixes Needed

### Priority 1: Implement Flight Request Server Action
**File**: `app/portal/flights/actions.ts`
**Effort**: 15 minutes
**Impact**: High - enables pilot flight request submission

### Priority 2: Add Email Notifications
**Files**: Create new email templates, integrate into approval actions
**Effort**: 2 hours
**Impact**: High - pilots get instant feedback on request status

### Priority 3: Add Dashboard Notification Badges
**Files**: Pilot dashboard component
**Effort**: 1 hour
**Impact**: Medium - improves user experience

---

## ✅ Summary

### What's Working Well

1. ✅ **Service layer architecture** - Excellent separation of concerns
2. ✅ **API design** - RESTful, consistent, well-documented
3. ✅ **Database schema** - Proper normalization, constraints, foreign keys
4. ✅ **Admin review workflow** - Complete UI for reviewing both request types
5. ✅ **Validation** - Strong Zod schemas, type safety
6. ✅ **Error handling** - Standardized, clear messages
7. ✅ **Authentication** - Proper pilot session validation

### What Needs Improvement

1. ⚠️ **Flight request server action** - Not implemented (15 min fix)
2. ❌ **Email notifications** - No automated emails on approval/denial
3. ❌ **Dashboard notifications** - No visual indicators for pending requests
4. ❌ **Request analytics** - No charts or trends

### Overall Grade: **A-**

The workflows are **production-ready** with minor improvements needed. The architecture is solid, follows best practices, and scales well. Adding email notifications and completing the flight request server action will bring this to **A+**.

---

**Last Updated**: 2025-10-26 11:30 UTC
**Reviewed By**: Claude Code
**Next Review**: After implementing Priority 1-3 fixes
