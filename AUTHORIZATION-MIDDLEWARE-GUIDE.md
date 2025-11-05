# Authorization Middleware Implementation Guide

**Date**: November 4, 2025
**Phase**: 2C - Authorization & Security Hardening
**Status**: ✅ Middleware Created

---

## Overview

The authorization middleware provides **resource ownership verification** and **role-based access control (RBAC)** for all API endpoints.

### Key Features

1. **Resource Ownership Verification** - Users can only access their own resources
2. **Role-Based Access Control** - Admin/Manager bypass for management operations
3. **Type-Safe** - Full TypeScript support with enums
4. **Flexible** - Easy to integrate into existing endpoints

---

## Available Functions

### 1. `verifyRequestAuthorization()`

**Purpose**: Verify user owns a specific resource

**Usage**:
```typescript
import { verifyRequestAuthorization, ResourceType } from '@/lib/middleware/authorization-middleware'

const authResult = await verifyRequestAuthorization(
  request,
  ResourceType.TASK,
  taskId
)

if (!authResult.authorized) {
  return NextResponse.json(
    { success: false, error: authResult.error },
    { status: authResult.statusCode }
  )
}
```

**Behavior**:
- ✅ Admin/Manager: Always authorized
- ✅ Regular users: Must own the resource
- ❌ Non-owners: 403 Forbidden

---

### 2. `requireRole()`

**Purpose**: Restrict endpoint to specific roles

**Usage**:
```typescript
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'

const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])

if (!roleCheck.authorized) {
  return NextResponse.json(
    { success: false, error: roleCheck.error },
    { status: roleCheck.statusCode }
  )
}
```

**Example**: Admin-only endpoint
```typescript
const roleCheck = await requireRole(request, [UserRole.ADMIN])
```

---

### 3. `verifyResourceOwnership()`

**Purpose**: Check if user ID owns a resource (low-level)

**Usage**:
```typescript
import { verifyResourceOwnership, ResourceType } from '@/lib/middleware/authorization-middleware'

const result = await verifyResourceOwnership(
  userId,
  ResourceType.LEAVE_REQUEST,
  leaveRequestId
)
```

---

### 4. Helper Functions

```typescript
// Check if user is admin
const isUserAdmin = await isAdmin(userId)

// Check if user is manager or admin
const canManage = await isManagerOrAdmin(userId)

// Get user's role
const role = await getUserRole(userId)
```

---

## Resource Types

```typescript
enum ResourceType {
  TASK = 'task',
  LEAVE_REQUEST = 'leave_request',
  FLIGHT_REQUEST = 'flight_request',
  FEEDBACK = 'feedback',
  DISCIPLINARY = 'disciplinary_action',
  LEAVE_BID = 'leave_bid',
  CERTIFICATION = 'pilot_check',
}
```

---

## User Roles

```typescript
enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  USER = 'User',
  PILOT = 'Pilot',
}
```

---

## Implementation Examples

### Example 1: Protect Task Update Endpoint

**Before** (Only authentication):
```typescript
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // ❌ Any authenticated user can update ANY task!
    const result = await updateTask(id, body)

    return NextResponse.json({ success: true, data: result })
  }
}
```

**After** (With authorization):
```typescript
import { verifyRequestAuthorization, ResourceType } from '@/lib/middleware/authorization-middleware'

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // ✅ AUTHORIZATION: Verify user owns this task
    const authResult = await verifyRequestAuthorization(
      request,
      ResourceType.TASK,
      id
    )

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    // ✅ User is authorized - proceed with update
    const result = await updateTask(id, body)

    return NextResponse.json({ success: true, data: result })
  }
}
```

---

### Example 2: Admin-Only Endpoint

```typescript
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'

export async function DELETE(request: NextRequest) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // ✅ AUTHORIZATION: Admin-only endpoint
    const roleCheck = await requireRole(request, [UserRole.ADMIN])

    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: roleCheck.statusCode }
      )
    }

    // ✅ User is admin - proceed with dangerous operation
    await dangerousOperation()

    return NextResponse.json({ success: true })
  }
}
```

---

### Example 3: Manager or Admin Access

```typescript
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'

export async function POST(request: NextRequest) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // ✅ AUTHORIZATION: Managers and Admins only
    const roleCheck = await requireRole(request, [
      UserRole.ADMIN,
      UserRole.MANAGER
    ])

    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: roleCheck.statusCode }
      )
    }

    // ✅ User has required role - proceed
    const result = await performManagementOperation()

    return NextResponse.json({ success: true, data: result })
  }
}
```

---

### Example 4: Leave Request - User Must Own Resource

```typescript
import { verifyRequestAuthorization, ResourceType } from '@/lib/middleware/authorization-middleware'

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leaveRequestId } = await params

    // ✅ AUTHORIZATION: Verify user owns this leave request
    // (Admins/Managers can delete any leave request)
    const authResult = await verifyRequestAuthorization(
      request,
      ResourceType.LEAVE_REQUEST,
      leaveRequestId
    )

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    // ✅ User owns leave request or is Admin/Manager
    const result = await cancelLeaveRequest(leaveRequestId)

    return NextResponse.json({ success: true, data: result })
  }
}
```

---

## Standard Authorization Pattern

For consistency, follow this pattern in all endpoints:

```typescript
export async function [METHOD](request: NextRequest, context: RouteContext) {
  try {
    // STEP 1: CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // STEP 2: Authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // STEP 3: Rate Limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      )
    }

    // STEP 4: AUTHORIZATION (NEW!)
    const { id: resourceId } = await context.params

    const authResult = await verifyRequestAuthorization(
      request,
      ResourceType.TASK, // Change based on resource type
      resourceId
    )

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    // STEP 5: Business Logic
    // User is authenticated, rate-limited, and authorized
    // ...
  } catch (error) {
    // Error handling
  }
}
```

---

## Authorization Flow Diagram

```
Request
   │
   ├─> CSRF Check ──────────────> 403 (if invalid token)
   │
   ├─> Authentication ──────────> 401 (if not logged in)
   │
   ├─> Rate Limiting ───────────> 429 (if too many requests)
   │
   ├─> Authorization ───────────> 403 (if not authorized)
   │   │
   │   ├─> Is Admin/Manager? ──> ✅ Authorized
   │   │
   │   └─> Owns resource? ─────> ✅ Authorized
   │                            └> ❌ 403 Forbidden
   │
   └─> Business Logic ──────────> 200 (success)
```

---

## Endpoints That Need Authorization

### Priority 1: Resource-Specific Mutations

These endpoints should verify resource ownership:

1. ✅ `/api/tasks/[id]` (PATCH, DELETE)
2. ✅ `/api/feedback/[id]` (PUT)
3. ✅ `/api/pilot/flight-requests/[id]` (DELETE)
4. ✅ `/api/pilot/leave/[id]` (DELETE)
5. ⏳ `/api/disciplinary/[id]` (PATCH, DELETE) - Needs auth

### Priority 2: Admin-Only Operations

These endpoints should require Admin role:

1. ⏳ `/api/user/delete-account` (DELETE) - Admin-only
2. ⏳ `/api/cache/invalidate` (POST, DELETE) - Already has role check
3. ⏳ `/api/settings/[id]` (PUT) - Admin-only

### Priority 3: Manager/Admin Operations

These endpoints should require Manager or Admin role:

1. ⏳ `/api/admin/leave-bids/[id]` (PATCH) - Manager/Admin
2. ⏳ `/api/renewal-planning/*` - Manager/Admin

---

## Testing Authorization

### Test Case 1: Non-Owner Access

```bash
# User A creates task
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -d '{"title":"My Task"}'

# Response: {"id": "task-123"}

# User B tries to update User A's task
curl -X PATCH http://localhost:3000/api/tasks/task-123 \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -d '{"title":"Hacked Task"}'

# Expected: 403 Forbidden
# {"success":false,"error":"You do not have permission to access this resource"}
```

### Test Case 2: Admin Bypass

```bash
# Admin updates any user's task (should succeed)
curl -X PATCH http://localhost:3000/api/tasks/task-123 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"title":"Admin Update"}'

# Expected: 200 Success
```

### Test Case 3: Role Requirement

```bash
# Regular user tries admin-only operation
curl -X DELETE http://localhost:3000/api/cache/invalidate \
  -H "Authorization: Bearer USER_TOKEN"

# Expected: 403 Forbidden
# {"success":false,"error":"Insufficient permissions"}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden (Not Owner)
```json
{
  "success": false,
  "error": "You do not have permission to access this resource"
}
```

### 403 Forbidden (Insufficient Role)
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found (Resource)
```json
{
  "success": false,
  "error": "Resource not found"
}
```

---

## Next Steps

1. ✅ Authorization middleware created
2. ⏳ Apply authorization to resource-specific endpoints
3. ⏳ Apply role requirements to admin endpoints
4. ⏳ Write E2E tests for authorization
5. ⏳ Update API documentation

---

**Version**: 1.0.0
**Author**: Maurice Rondeau
**Status**: ✅ Ready for Integration
