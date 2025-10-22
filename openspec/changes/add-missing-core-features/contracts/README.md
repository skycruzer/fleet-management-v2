# API Contracts

**Feature**: 001-missing-core-features
**Format**: OpenAPI 3.0.3 (YAML)
**Base URL**: `https://fleet-management-v2.vercel.app/api` (production)
**Local Dev**: `http://localhost:3000/api`

---

## Overview

This directory contains OpenAPI 3.0 specifications for all new API endpoints in the Missing Core Features implementation.

**Total Endpoints**: ~30 endpoints across 9 contract files

---

## Contract Files

| File | Endpoints | Purpose |
|------|-----------|---------|
| `pilot-auth.yaml` | 3 | Pilot authentication (login, register, logout) |
| `pilot-leave.yaml` | 2 | Pilot leave request submission |
| `flight-requests.yaml` | 4 | Flight request submission and admin review |
| `tasks.yaml` | 5 | Task management CRUD + Kanban operations |
| `disciplinary.yaml` | 6 | Disciplinary matter tracking and actions |
| `feedback.yaml` | 8 | Feedback posts, comments, categories |
| `notifications.yaml` | 3 | Pilot notification management |
| `audit.yaml` | 2 | Audit log viewing (admin-only) |
| `admin-registrations.yaml` | 3 | Pilot registration approval workflow |

---

## Authentication

All endpoints (except `/api/pilot/login` and `/api/pilot/register`) require authentication.

**Method**: Supabase Auth (JWT token in cookie)

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Roles**:
- `pilot`: Access to `/api/pilot/*` endpoints
- `admin`: Access to all endpoints including `/api/admin/*` and `/api/dashboard/*`
- `manager`: Access to most admin endpoints except sensitive ones

---

## Error Responses

All endpoints follow a standardized error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Email format invalid"
    }
  }
}
```

**HTTP Status Codes**:
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request (validation errors)
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `500 Internal Server Error`: Server error

---

## Success Responses

All successful responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-10-22T10:30:00Z",
    "requestId": "uuid"
  }
}
```

**Paginated Responses**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false,
    "nextCursor": "uuid",
    "previousCursor": null
  }
}
```

---

## Validation

All endpoints use Zod schemas for request validation.

**Common Validation Rules**:
- Email: Valid email format, max 255 characters
- UUID: Valid UUID v4 format
- Dates: ISO 8601 format (YYYY-MM-DD)
- Text fields: Min/max lengths specified per endpoint
- Enums: Exact match required (case-sensitive)

---

## Rate Limiting

**Pilot endpoints**: 100 requests/minute per user
**Admin endpoints**: 500 requests/minute per user

**Headers returned**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

**Rate limit exceeded response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## Testing

Use provided OpenAPI specs for:
- **Postman**: Import YAML files to generate collections
- **Swagger UI**: View interactive documentation
- **API Mocking**: Generate mock servers for frontend development
- **Contract Testing**: Validate API responses against schemas

**Example**: Import into Postman
```bash
# Install Postman CLI
npm install -g postman-cli

# Import contract
postman import contracts/pilot-auth.yaml
```

---

## Versioning

**Current Version**: v1
**Base Path**: `/api/v1` (future - currently `/api`)

When breaking changes are introduced:
- New version released as `/api/v2`
- Old version supported for 6 months
- Deprecation warnings added to responses

---

## Development Workflow

1. **Design Phase**: Update OpenAPI specs before implementation
2. **Review**: Team reviews contract changes
3. **Implementation**: Backend implements per spec
4. **Testing**: Validate responses match contracts
5. **Documentation**: Auto-generate API docs from specs

---

## Tools

**Recommended tools for working with OpenAPI specs**:

- **Swagger Editor**: https://editor.swagger.io/ (validate and preview)
- **Redoc**: Generate beautiful API documentation
- **OpenAPI Generator**: Generate client SDKs
- **Prism**: Mock API server from OpenAPI specs

**Validate contracts**:
```bash
npx @apidevtools/swagger-cli validate contracts/pilot-auth.yaml
```

---

## Next Steps

After reviewing contracts:
1. Generate TypeScript types from OpenAPI specs (optional)
2. Implement API routes following contracts
3. Write integration tests verifying contract compliance
4. Generate API documentation for developers

---

**Contracts Version**: 1.0
**Created**: 2025-10-22
**Maintained By**: Fleet Management V2 Team
