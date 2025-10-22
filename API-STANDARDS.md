# API Standards Guide

**Fleet Management V2 - API Response Standards**
**Last Updated**: October 22, 2025

---

## 🎯 Overview

This document defines the standardized API response formats for all API routes in the Fleet Management application. Consistent responses make the API predictable, easier to consume, and improve error handling.

---

## 📋 Response Format Standards

### Success Response Format

All successful API responses follow this structure:

```typescript
{
  success: true,
  data: T,           // The actual response data
  message?: string,  // Optional success message (for mutations)
  count?: number,    // Optional count (for lists)
  meta?: object      // Optional metadata (pagination, etc.)
}
```

### Error Response Format

All error responses follow this structure:

```typescript
{
  success: false,
  error: string,     // Error type (e.g., "Validation Error")
  message: string,   // Human-readable error message
  details?: unknown, // Optional error details (validation errors, stack trace)
  code?: string      // Optional error code (e.g., "NOT_FOUND")
}
```

---

## 🛠️ Using API Response Utilities

### Import Utilities

```typescript
import {
  successResponse,
  listResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  conflictResponse,
  serverErrorResponse,
  badRequestResponse,
  methodNotAllowedResponse,
} from '@/lib/utils/api-response'
```

---

## ✅ Success Responses

### Basic Success Response

```typescript
// GET /api/pilots/123
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const pilot = await getPilot(params.id)

  return successResponse(pilot)
}

// Response:
{
  "success": true,
  "data": {
    "id": "123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "Captain"
  }
}
```

---

### List Response

```typescript
// GET /api/pilots
export async function GET(request: NextRequest) {
  const pilots = await getPilots()

  return listResponse(pilots)
}

// Response:
{
  "success": true,
  "data": [
    { "id": "1", "first_name": "John", "last_name": "Doe" },
    { "id": "2", "first_name": "Jane", "last_name": "Smith" }
  ],
  "count": 2
}
```

---

### List Response with Pagination

```typescript
// GET /api/pilots?page=2&pageSize=25
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')

  const { data, total } = await getPaginatedPilots(page, pageSize)

  const pagination: PaginationMeta = {
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    totalCount: total,
    hasNextPage: page * pageSize < total,
    hasPreviousPage: page > 1,
  }

  return listResponse(data, pagination)
}

// Response:
{
  "success": true,
  "data": [...],
  "count": 25,
  "meta": {
    "page": 2,
    "pageSize": 25,
    "totalPages": 5,
    "totalCount": 120,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

---

### Created Response (HTTP 201)

```typescript
// POST /api/pilots
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validatedData = PilotCreateSchema.parse(body)

  const newPilot = await createPilot(validatedData)

  return createdResponse(newPilot, 'Pilot created successfully')
}

// Response (Status: 201):
{
  "success": true,
  "data": {
    "id": "new-123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "Captain"
  },
  "message": "Pilot created successfully"
}
```

---

### Custom Success Response

```typescript
// PUT /api/pilots/123
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const updatedPilot = await updatePilot(params.id, body)

  return successResponse(updatedPilot, {
    message: 'Pilot updated successfully',
    status: 200
  })
}
```

---

## ❌ Error Responses

### Not Found (HTTP 404)

```typescript
// GET /api/pilots/999
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const pilot = await getPilot(params.id)

  if (!pilot) {
    return notFoundResponse('Pilot')
  }

  return successResponse(pilot)
}

// Response (Status: 404):
{
  "success": false,
  "error": "Pilot not found",
  "message": "The requested pilot could not be found",
  "code": "NOT_FOUND"
}
```

---

### Unauthorized (HTTP 401)

```typescript
// GET /api/pilots
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return unauthorizedResponse()
  }

  // ... fetch pilots
}

// Response (Status: 401):
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

---

### Forbidden (HTTP 403)

```typescript
// DELETE /api/pilots/123
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()

  if (user.role !== 'admin') {
    return forbiddenResponse('Only administrators can delete pilots')
  }

  // ... delete pilot
}

// Response (Status: 403):
{
  "success": false,
  "error": "Forbidden",
  "message": "Only administrators can delete pilots",
  "code": "FORBIDDEN"
}
```

---

### Validation Error (HTTP 400)

```typescript
// POST /api/pilots
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = PilotCreateSchema.parse(body)

    // ... create pilot
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(
        'Invalid pilot data provided',
        error.errors
      )
    }

    return serverErrorResponse(error)
  }
}

// Response (Status: 400):
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid pilot data provided",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["first_name"],
      "message": "Required"
    }
  ]
}
```

---

### Conflict (HTTP 409)

```typescript
// POST /api/pilots
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Check if pilot with employee_id already exists
  const existing = await getPilotByEmployeeId(body.employee_id)

  if (existing) {
    return conflictResponse('A pilot with this employee ID already exists')
  }

  // ... create pilot
}

// Response (Status: 409):
{
  "success": false,
  "error": "Conflict",
  "message": "A pilot with this employee ID already exists",
  "code": "CONFLICT"
}
```

---

### Server Error (HTTP 500)

```typescript
// GET /api/pilots
export async function GET(request: NextRequest) {
  try {
    const pilots = await getPilots()
    return successResponse(pilots)
  } catch (error) {
    console.error('Failed to fetch pilots:', error)
    return serverErrorResponse(error as Error)
  }
}

// Response (Status: 500):
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later.",
  "code": "INTERNAL_ERROR",
  "details": "Database connection failed" // Only in development
}
```

---

### Bad Request (HTTP 400)

```typescript
// GET /api/pilots?role=InvalidRole
export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role')

  if (role && !['Captain', 'First Officer'].includes(role)) {
    return badRequestResponse('Invalid role parameter. Must be "Captain" or "First Officer"')
  }

  // ... fetch pilots
}

// Response (Status: 400):
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid role parameter. Must be \"Captain\" or \"First Officer\"",
  "code": "BAD_REQUEST"
}
```

---

### Method Not Allowed (HTTP 405)

```typescript
// PATCH /api/pilots (not supported)
export async function PATCH() {
  return methodNotAllowedResponse(['GET', 'POST'])
}

// Response (Status: 405):
// Headers: Allow: GET, POST
{
  "success": false,
  "error": "Method Not Allowed",
  "message": "This endpoint only supports: GET, POST",
  "code": "METHOD_NOT_ALLOWED"
}
```

---

## 📝 Best Practices

### 1. Use Type-Safe Responses

```typescript
import type { ApiSuccessResponse } from '@/lib/utils/api-response'

// Define response type
interface PilotResponse {
  id: string
  first_name: string
  last_name: string
  role: 'Captain' | 'First Officer'
}

// Use in route
export async function GET(): Promise<NextResponse<ApiSuccessResponse<PilotResponse[]>>> {
  const pilots = await getPilots()
  return listResponse(pilots)
}
```

---

### 2. Consistent Error Handling

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const user = await getUser()
    if (!user) return unauthorizedResponse()

    // 2. Authorization check
    if (!hasPermission(user)) return forbiddenResponse()

    // 3. Validation
    const body = await request.json()
    const validatedData = PilotCreateSchema.parse(body)

    // 4. Business logic
    const newPilot = await createPilot(validatedData)

    // 5. Success response
    return createdResponse(newPilot)

  } catch (error) {
    // Handle specific errors
    if (error instanceof ZodError) {
      return validationErrorResponse('Invalid data', error.errors)
    }

    if (error instanceof ConflictError) {
      return conflictResponse(error.message)
    }

    // Fallback to server error
    console.error('API error:', error)
    return serverErrorResponse(error as Error)
  }
}
```

---

### 3. Include Helpful Messages

```typescript
// ❌ Bad
return notFoundResponse('Resource')

// ✅ Good
return notFoundResponse('Pilot')

// ❌ Bad
return conflictResponse()

// ✅ Good
return conflictResponse('A pilot with employee ID "P12345" already exists')
```

---

### 4. Use Pagination for Large Datasets

```typescript
// Always include pagination for lists
export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
  const pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') || '25')

  // Limit maximum page size
  const limitedPageSize = Math.min(pageSize, 100)

  const { data, total } = await getPilots({ page, pageSize: limitedPageSize })

  return listResponse(data, {
    page,
    pageSize: limitedPageSize,
    totalPages: Math.ceil(total / limitedPageSize),
    totalCount: total,
    hasNextPage: page * limitedPageSize < total,
    hasPreviousPage: page > 1,
  })
}
```

---

### 5. Document API Endpoints

```typescript
/**
 * GET /api/pilots
 * List all pilots with optional filters
 *
 * Query Parameters:
 * - role?: 'Captain' | 'First Officer'
 * - status?: 'active' | 'inactive'
 * - page?: number (default: 1)
 * - pageSize?: number (default: 25, max: 100)
 *
 * Response:
 * - 200: Success with pilot list
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  // Implementation
}
```

---

## 🔍 Client-Side Type Safety

### API Client Example

```typescript
// lib/api/pilots.ts
import type { ApiSuccessResponse, ApiErrorResponse } from '@/lib/utils/api-response'

interface Pilot {
  id: string
  first_name: string
  last_name: string
  role: 'Captain' | 'First Officer'
}

export async function fetchPilots(): Promise<Pilot[]> {
  const response = await fetch('/api/pilots')
  const json = await response.json() as ApiSuccessResponse<Pilot[]> | ApiErrorResponse

  if (!json.success) {
    throw new Error(json.message)
  }

  return json.data
}
```

---

## 📊 HTTP Status Code Reference

| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Service temporarily down |

---

## 🎯 Migration Guide

### Before (Old Pattern)

```typescript
export async function GET() {
  try {
    const pilots = await getPilots()
    return NextResponse.json({
      success: true,
      data: pilots,
      count: pilots.length
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pilots' },
      { status: 500 }
    )
  }
}
```

### After (New Pattern)

```typescript
import { successResponse, serverErrorResponse } from '@/lib/utils/api-response'

export async function GET() {
  try {
    const pilots = await getPilots()
    return listResponse(pilots)
  } catch (error) {
    return serverErrorResponse(error as Error)
  }
}
```

---

## ✅ Checklist for New API Routes

When creating a new API route:

- [ ] Import response utilities
- [ ] Use standardized success responses
- [ ] Use standardized error responses
- [ ] Include authentication check
- [ ] Include authorization check (if needed)
- [ ] Validate request data with Zod
- [ ] Handle all error cases
- [ ] Include JSDoc comments
- [ ] Add pagination for list endpoints
- [ ] Test with Postman/Thunder Client
- [ ] Document in API specification

---

## 📚 Related Documentation

- [Error Messages](../lib/utils/error-messages.ts) - Centralized error messages
- [TypeScript Types](../lib/utils/api-response.ts) - Response type definitions
- [Pilot Service](../lib/services/pilot-service.ts) - Example service layer
- [Validation Schemas](../lib/validations/) - Zod validation schemas

---

**Version**: 1.0.0
**Author**: Claude (Sprint 5: Code Quality)
**Status**: Active - All API routes should follow these standards
