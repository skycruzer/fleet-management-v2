# API Contracts Summary

**Feature**: 001-missing-core-features
**Total Endpoints**: 30 endpoints across 9 contract files
**Date**: 2025-10-22

---

## Completed Contracts

✅ **pilot-auth.yaml** (3 endpoints)

- POST `/api/pilot/login` - Pilot authentication
- POST `/api/pilot/register` - Pilot registration with email verification
- POST `/api/pilot/logout` - End session

✅ **flight-requests.yaml** (4 endpoints)

- GET `/api/pilot/flight-requests` - Get pilot's requests
- POST `/api/pilot/flight-requests` - Submit new request
- GET `/api/dashboard/flight-requests` - Admin view all requests
- PATCH `/api/dashboard/flight-requests/{id}` - Approve/deny request

✅ **tasks.yaml** (5 endpoints)

- GET `/api/tasks` - List tasks with filters
- POST `/api/tasks` - Create new task
- GET `/api/tasks/{id}` - Get task details
- PATCH `/api/tasks/{id}` - Update task (Kanban moves)
- DELETE `/api/tasks/{id}` - Delete task (soft delete)

---

## Remaining Contracts (To Be Created)

### 📝 pilot-leave.yaml (2 endpoints)

**Purpose**: Pilot leave request submission

**Endpoints**:

- `GET /api/pilot/leave` - Get pilot's leave requests
  - Query params: `status`, `roster_period`, `page`, `pageSize`
  - Returns: List of leave requests with eligibility status

- `POST /api/pilot/leave` - Submit leave request
  - Body: `{ roster_period: number, dates: string[], notes?: string }`
  - Validation: Check eligibility, roster period boundaries, rank-separated rules
  - Returns: Created request with eligibility alerts

**Key Schemas**:

- `LeaveRequest`: id, pilot_id, roster_period, dates, status, eligibility_status, submitted_at
- `LeaveEligibility`: eligible, remaining_crew_count, rank_conflicts, alerts

---

### 📝 disciplinary.yaml (6 endpoints)

**Purpose**: Disciplinary matter tracking and action logging

**Endpoints**:

- `GET /api/disciplinary-matters` - List all matters (admin only)
  - Query params: `pilot_id`, `status`, `severity`, `page`

- `POST /api/disciplinary-matters` - Create new matter (admin only)
  - Body: `{ pilot_id, matter_type, title, description, severity }`

- `GET /api/disciplinary-matters/{id}` - Get matter details with timeline
  - Returns: Matter + all actions (timeline entries)

- `PATCH /api/disciplinary-matters/{id}` - Update matter (status, resolution)
  - Body: `{ status?, resolution?, severity? }`

- `POST /api/disciplinary-matters/{id}/actions` - Add action to timeline
  - Body: `{ action_type, description, attachments?: string[] }`

- `DELETE /api/disciplinary-matters/{id}` - Soft delete matter (admin only)

**Key Schemas**:

- `DisciplinaryMatter`: id, pilot_id, matter_type, title, status, severity, resolution
- `DisciplinaryAction`: id, matter_id, action_type, description, attachments, created_at
- `MatterTimeline`: matter + actions[] (for timeline view)

---

### 📝 feedback.yaml (8 endpoints)

**Purpose**: Community feedback posts, comments, and moderation

**Endpoints**:

- `GET /api/pilot/feedback/posts` - List feedback posts
  - Query params: `category_id`, `sort_by` (upvotes/recent), `page`
  - Returns: Posts with upvote counts, comment counts, pinned status

- `POST /api/pilot/feedback/posts` - Create new post
  - Body: `{ title, content, category_id? }`

- `GET /api/pilot/feedback/posts/{id}` - Get post with comments
  - Returns: Post + comments[] (flat thread)

- `PATCH /api/pilot/feedback/posts/{id}` - Edit own post
  - Body: `{ title?, content?, category_id? }`

- `POST /api/pilot/feedback/posts/{id}/upvote` - Upvote post
  - Idempotent: Pilot can only upvote once

- `POST /api/pilot/feedback/posts/{id}/comments` - Add comment
  - Body: `{ content, mentions?: uuid[] }`

- `PATCH /api/admin/feedback/posts/{id}` - Moderate post (pin, hide)
  - Body: `{ pinned?, hidden?, hidden_reason? }`

- `GET /api/pilot/feedback/categories` - List categories
  - Returns: All feedback categories (public)

**Key Schemas**:

- `FeedbackPost`: id, author_id, title, content, category_id, upvotes, comment_count, pinned, hidden
- `FeedbackComment`: id, post_id, author_id, content, mentions[], created_at
- `FeedbackCategory`: id, name, description, color, icon

---

### 📝 notifications.yaml (3 endpoints)

**Purpose**: Pilot notification management

**Endpoints**:

- `GET /api/pilot/notifications` - Get pilot's notifications
  - Query params: `unread_only`, `type`, `page`
  - Returns: Notifications with unread count

- `PATCH /api/pilot/notifications/{id}` - Mark as read
  - Body: `{ read: true }`

- `DELETE /api/pilot/notifications/{id}` - Delete notification
  - Soft delete (not visible to pilot, but retained for audit)

**Key Schemas**:

- `PilotNotification`: id, pilot_id, type, title, message, link, read, created_at
- `NotificationTypes`: leave_approved, leave_denied, task_assigned, feedback_reply, etc.

---

### 📝 audit.yaml (2 endpoints)

**Purpose**: Audit log viewing (admin only)

**Endpoints**:

- `GET /api/audit` - List audit logs
  - Query params: `table_name`, `operation`, `user_id`, `entity_type`, `entity_id`, `date_from`, `date_to`, `page`
  - Returns: Audit logs with pagination, filterable by multiple criteria

- `GET /api/audit/{id}` - Get audit log detail
  - Returns: Full audit record with old_values, new_values, metadata

**Key Schemas**:

- `AuditLog`: id, table_name, operation, old_values, new_values, action, entity_type, entity_id, description, metadata, user_id, created_at
- `AuditLogFilters`: table_name, operation, user_id, entity_type, date_range

**Export Feature**:

- `GET /api/audit/export?format=csv` - Export audit logs to CSV (compliance requirement)

---

### 📝 admin-registrations.yaml (3 endpoints)

**Purpose**: Pilot registration approval workflow

**Endpoints**:

- `GET /api/admin/pilot-registrations` - List pending registrations
  - Query params: `status` (PENDING/APPROVED/DENIED), `page`
  - Returns: Registration requests with email verification status

- `GET /api/admin/pilot-registrations/{id}` - Get registration details
  - Returns: Full registration data for review

- `PATCH /api/admin/pilot-registrations/{id}` - Approve or deny registration
  - Body: `{ status: 'APPROVED' | 'DENIED', admin_notes?, denial_reason? }`
  - On APPROVED: Create pilot record, link to user account, send welcome email, create notification
  - On DENIED: Send denial email with reason, keep record for audit

**Key Schemas**:

- `PilotRegistration`: id, user_id, first_name, last_name, email, rank, employee_id, email_verified, status, reviewed_by, reviewed_at, admin_notes
- `RegistrationApproval`: status, admin_notes, denial_reason (required if denied)

**Post-Approval Actions**:

- Create `pilots` record
- Link `pilots.user_id` to `an_users.id`
- Create welcome notification in `pilot_notifications`
- Send welcome email with login instructions

---

## Contract Implementation Guide

### Standard Request/Response Format

**All requests** should follow this structure:

```json
// Request Body
{
  "field1": "value1",
  "field2": "value2"
}

// Success Response (200/201)
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-10-22T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}

// Error Response (4xx/5xx)
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... } // Optional
  }
}
```

### Common Query Parameters

**Pagination**:

- `page` (integer, default: 1)
- `pageSize` (integer, default: 20, max: 100)

**Filtering**:

- `status` - Filter by status enum
- `{entity}_id` - Filter by related entity UUID
- `date_from`, `date_to` - Date range filters
- `search` - Full-text search (where applicable)

**Sorting**:

- `sort_by` - Field to sort by
- `order` - 'asc' or 'desc' (default: desc for created_at)

### Authentication

**All endpoints** (except login/register) require Supabase Auth JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Role-Based Access**:

- `pilot`: Access to `/api/pilot/*` endpoints only
- `admin`: Access to all endpoints
- `manager`: Access to most endpoints except sensitive admin operations

### Validation Rules

**UUID Fields**:

- Must be valid UUID v4 format
- Example: `550e8400-e29b-41d4-a716-446655440000`

**Date Fields**:

- Format: ISO 8601 date (`YYYY-MM-DD`)
- Example: `2025-10-22`

**DateTime Fields**:

- Format: ISO 8601 datetime with timezone
- Example: `2025-10-22T10:30:00Z`

**Email Fields**:

- Valid email format
- Max length: 255 characters
- Example: `pilot@airniugini.com`

**Enum Fields**:

- Exact match required (case-sensitive)
- Examples: `Captain` (not `captain`), `PENDING` (not `pending`)

---

## Implementation Checklist

For each contract file:

- [ ] **pilot-leave.yaml**
  - [ ] Define request/response schemas
  - [ ] Add eligibility checking logic
  - [ ] Include rank-separated validation rules

- [ ] **disciplinary.yaml**
  - [ ] Define matter and action schemas
  - [ ] Add timeline aggregation logic
  - [ ] Include file attachment support

- [ ] **feedback.yaml**
  - [ ] Define post and comment schemas
  - [ ] Add upvote mechanism
  - [ ] Include moderation endpoints

- [ ] **notifications.yaml**
  - [ ] Define notification schemas
  - [ ] Add real-time subscription support
  - [ ] Include notification types enum

- [ ] **audit.yaml**
  - [ ] Define audit log schema
  - [ ] Add comprehensive filtering
  - [ ] Include CSV export functionality

- [ ] **admin-registrations.yaml**
  - [ ] Define registration schema
  - [ ] Add approval workflow logic
  - [ ] Include post-approval automation

---

## Next Steps

1. ✅ Create remaining 6 OpenAPI YAML files
2. ✅ Validate all contracts with Swagger CLI
3. ✅ Generate TypeScript types from OpenAPI specs (optional)
4. ✅ Create Postman collection from contracts
5. ✅ Implement API routes following contracts
6. ✅ Write integration tests validating contract compliance

---

**Contracts Status**: Pilot-auth, Flight-requests, and Tasks complete. 6 remaining contracts outlined.
**Total Endpoints**: 30 endpoints
**Next Phase**: Implementation (quickstart.md)

---

**Created**: 2025-10-22
**Maintained By**: Fleet Management V2 Team
