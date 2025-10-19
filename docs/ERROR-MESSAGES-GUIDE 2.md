# Error Message Standardization Guide

**Version:** 1.0.0
**Last Updated:** October 19, 2025
**Related TODO:** [049-ready-p2-consistent-error-messages.md](/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/todos/049-ready-p2-consistent-error-messages.md)

## Overview

This guide documents the standardized error message system implemented across the Fleet Management V2 application. All error messages follow consistent patterns to provide clear, actionable feedback to users.

## Design Principles

1. **User-Friendly**: Use clear, professional language appropriate for an aviation management system
2. **Consistent**: Same patterns for similar error types
3. **Actionable**: Tell users what they can do to resolve the issue
4. **Context-Aware**: Specific to the operation that failed
5. **Professional**: Maintain appropriate tone for business users

## Error Message Structure

Every error message follows this structure:

```typescript
interface ErrorMessage {
  message: string          // Clear description of what went wrong
  action?: string          // Optional: What the user can do next
  category: ErrorCategory  // Classification for handling/logging
  severity: ErrorSeverity  // Importance level
}
```

### Error Categories

```typescript
enum ErrorCategory {
  AUTHENTICATION = 'authentication'   // Login/session issues
  AUTHORIZATION = 'authorization'     // Permission denied
  VALIDATION = 'validation'          // Invalid input
  DATABASE = 'database'              // Database operations
  NETWORK = 'network'                // Network connectivity
  NOT_FOUND = 'not_found'           // Resource doesn't exist
  CONFLICT = 'conflict'              // Duplicate/constraint violations
  SERVER = 'server'                  // Internal server errors
  CLIENT = 'client'                  // Client-side errors
}
```

### Severity Levels

```typescript
enum ErrorSeverity {
  INFO = 'info'          // Informational only
  WARNING = 'warning'    // User should be aware
  ERROR = 'error'        // Operation failed
  CRITICAL = 'critical'  // System-level issue
}
```

## Usage Examples

### API Routes

```typescript
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

// Authentication check
if (!user) {
  return NextResponse.json(
    formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401),
    { status: 401 }
  )
}

// Database fetch error
try {
  const pilots = await getPilots()
  return NextResponse.json({ success: true, data: pilots })
} catch (error) {
  return NextResponse.json(
    formatApiError(ERROR_MESSAGES.PILOT.FETCH_FAILED, 500),
    { status: 500 }
  )
}

// Validation error
if (error instanceof Error && error.name === 'ZodError') {
  const validationError = ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('pilot data')
  return NextResponse.json(
    {
      ...formatApiError(validationError, 400),
      details: error.message,
    },
    { status: 400 }
  )
}
```

### Service Functions

```typescript
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export async function createPilot(data: PilotFormData) {
  try {
    const result = await supabase.from('pilots').insert(data)

    if (result.error) {
      logError(new Error(ERROR_MESSAGES.PILOT.CREATE_FAILED.message), {
        source: 'createPilot',
        severity: ErrorSeverity.ERROR,
        metadata: { data }
      })
      throw new Error(ERROR_MESSAGES.PILOT.CREATE_FAILED.message)
    }

    return result.data
  } catch (error) {
    throw error
  }
}
```

### React Components

```typescript
import { ERROR_MESSAGES, formatUserError } from '@/lib/utils/error-messages'
import { toast } from '@/hooks/use-toast'

function PilotForm() {
  const handleSubmit = async (data: PilotFormData) => {
    try {
      await createPilot(data)
      toast({ title: 'Success', description: 'Pilot created successfully' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: formatUserError(ERROR_MESSAGES.PILOT.CREATE_FAILED)
      })
    }
  }
}
```

### Constraint Violations

```typescript
import {
  isUniqueConstraintViolation,
  handleUniqueConstraintViolation
} from '@/lib/utils/constraint-error-handler'

try {
  await supabase.from('leave_requests').insert(data)
} catch (error) {
  if (isUniqueConstraintViolation(error)) {
    const duplicateError = handleUniqueConstraintViolation(error)
    // duplicateError.message is user-friendly and standardized
    throw duplicateError
  }
  throw error
}
```

## Standard Error Messages

### Authentication & Authorization

| Scenario | Message | Action |
|----------|---------|--------|
| Not logged in | "Authentication required. Please sign in to continue." | "Sign in to your account" |
| Session expired | "Your session has expired. Please sign in again." | "Sign in again" |
| Invalid credentials | "Invalid email or password. Please check your credentials and try again." | "Verify your email and password" |
| No permission | "You do not have permission to perform this action." | "Contact your administrator for access" |

### Validation Errors

| Scenario | Message Pattern | Example |
|----------|----------------|---------|
| Required field | "{Field} is required. Please provide a value." | "Employee ID is required. Please provide a value." |
| Invalid format | "{Field} format is invalid. Please check your input." | "Email format is invalid. Please check your input." |
| Invalid date | "Invalid date format. Please select a valid date." | - |
| Date range | "End date must be after start date. Please check your date range." | - |

### Database Operations

| Operation | Message Pattern | Example |
|-----------|----------------|---------|
| Fetch failed | "Unable to load {resource}. Please try again." | "Unable to load pilot data. Please try again." |
| Create failed | "Unable to create {resource}. Please check your input and try again." | "Unable to create pilot. Please check your input and try again." |
| Update failed | "Unable to update {resource}. Please try again." | "Unable to update certification. Please try again." |
| Delete failed | "Unable to delete {resource}. This record may be referenced by other data." | "Unable to delete pilot. This record may be referenced by other data." |
| Not found | "{Resource} not found. It may have been deleted or moved." | "Pilot not found. It may have been deleted or moved." |

### Network Errors

| Scenario | Message | Action |
|----------|---------|--------|
| Connection failed | "Network connection failed. Please check your internet connection." | "Check your network connection and try again" |
| Timeout | "Request timed out. The server is taking too long to respond." | "Try again or contact support if the issue persists" |
| Server error | "Server error occurred. Our team has been notified." | "Please try again in a few minutes" |

### Resource-Specific Errors

#### Pilots
- `PILOT.FETCH_FAILED` - Unable to load pilot data
- `PILOT.CREATE_FAILED` - Unable to create pilot
- `PILOT.UPDATE_FAILED` - Unable to update pilot
- `PILOT.DELETE_FAILED` - Unable to delete pilot
- `PILOT.NOT_FOUND` - Pilot not found
- `PILOT.DUPLICATE_EMPLOYEE_ID` - Employee ID already exists

#### Certifications
- `CERTIFICATION.FETCH_FAILED` - Unable to load certification data
- `CERTIFICATION.CREATE_FAILED` - Unable to create certification
- `CERTIFICATION.UPDATE_FAILED` - Unable to update certification
- `CERTIFICATION.DELETE_FAILED` - Unable to delete certification
- `CERTIFICATION.DUPLICATE_CERTIFICATION` - Certification already exists

#### Leave Requests
- `LEAVE.FETCH_FAILED` - Unable to load leave request data
- `LEAVE.CREATE_FAILED` - Unable to create leave request
- `LEAVE.DUPLICATE_REQUEST` - Leave request already exists for these dates
- `LEAVE.INSUFFICIENT_CREW` - Minimum crew requirements not met
- `LEAVE.PAST_DATE` - Cannot create leave request for past dates

#### Flight Requests
- `FLIGHT.FETCH_FAILED` - Unable to load flight request data
- `FLIGHT.CREATE_FAILED` - Unable to create flight request
- `FLIGHT.DUPLICATE_REQUEST` - Flight request already exists for this date

## Utility Functions

### formatApiError

Formats error for API JSON responses:

```typescript
formatApiError(error: ErrorMessage, statusCode: number = 500)
// Returns:
{
  success: false,
  error: string,
  action?: string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  statusCode: number
}
```

### formatUserError

Formats error for user display (toasts, alerts):

```typescript
formatUserError(error: ErrorMessage): string
// Returns: "Message. Action." (combined with proper punctuation)
```

### getErrorByStatusCode

Get appropriate error message based on HTTP status:

```typescript
getErrorByStatusCode(statusCode: number): ErrorMessage
// Maps 400, 401, 403, 404, 409, 500, 503 to standard messages
```

### isRetryableError

Check if an error type can be retried:

```typescript
isRetryableError(error: ErrorMessage): boolean
// Returns true for network and server errors
```

## Migration Guide

### Before (Inconsistent)

```typescript
// ❌ Inconsistent error messages
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Failed to fetch pilots' }, { status: 500 })
throw new Error('Unable to create pilot')
console.error('Error:', error)
```

### After (Standardized)

```typescript
// ✅ Consistent, user-friendly messages
return NextResponse.json(
  formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401),
  { status: 401 }
)
return NextResponse.json(
  formatApiError(ERROR_MESSAGES.PILOT.FETCH_FAILED, 500),
  { status: 500 }
)
throw new Error(ERROR_MESSAGES.PILOT.CREATE_FAILED.message)
logError(error, { source: 'component', severity: ErrorSeverity.ERROR })
```

## Best Practices

### DO ✅

1. **Use standardized messages** from `ERROR_MESSAGES`
2. **Include actionable guidance** in error messages
3. **Log errors** with proper context using `logError()`
4. **Categorize errors** properly for analytics
5. **Provide specific context** (e.g., "pilot data" not just "data")

### DON'T ❌

1. **Don't hardcode** error strings
2. **Don't expose** technical details to users in production
3. **Don't use** generic "Error occurred" messages
4. **Don't forget** to specify the action users can take
5. **Don't skip** error logging

## Integration with Existing Systems

### Error Logger

The error logger automatically categorizes errors:

```typescript
import { logError, ErrorSeverity } from '@/lib/error-logger'

logError(new Error(ERROR_MESSAGES.PILOT.CREATE_FAILED.message), {
  source: 'createPilot',
  severity: ErrorSeverity.ERROR,
  metadata: { pilotId, data }
})
```

### Constraint Error Handler

Automatically maps database constraints to user-friendly messages:

```typescript
// Constraint violations are automatically converted
// leave_requests_pilot_dates_unique → ERROR_MESSAGES.LEAVE.DUPLICATE_REQUEST
// pilots_employee_id_unique → ERROR_MESSAGES.PILOT.DUPLICATE_EMPLOYEE_ID
```

### Toast Notifications

Use `formatUserError()` for toast messages:

```typescript
import { formatUserError } from '@/lib/utils/error-messages'

toast({
  variant: 'destructive',
  title: 'Error',
  description: formatUserError(ERROR_MESSAGES.PILOT.CREATE_FAILED)
})
```

## Testing

When testing error scenarios, verify:

1. ✅ Correct error message from `ERROR_MESSAGES` is used
2. ✅ Proper HTTP status code is returned
3. ✅ Error is logged with appropriate severity
4. ✅ User receives actionable feedback
5. ✅ Error category matches the scenario

```typescript
// Example test
expect(response.status).toBe(401)
expect(response.body.error).toBe(ERROR_MESSAGES.AUTH.UNAUTHORIZED.message)
expect(response.body.category).toBe(ErrorCategory.AUTHENTICATION)
```

## File Reference

- **Main utility**: `/lib/utils/error-messages.ts`
- **Constraint handler**: `/lib/utils/constraint-error-handler.ts`
- **Error logger**: `/lib/error-logger.ts`
- **API routes**: `/app/api/**/*.ts`
- **Services**: `/lib/services/**/*.ts`

## Contributing

When adding new error scenarios:

1. Add the error message to the appropriate section in `error-messages.ts`
2. Follow the naming convention: `RESOURCE.OPERATION_FAILED`
3. Provide both `message` and `action` fields
4. Use proper category and severity
5. Update this documentation
6. Add tests for the new error scenario

## Support

For questions or issues with error messages:
- Review this guide
- Check existing error message patterns in `error-messages.ts`
- Contact the development team
- See related TODO: `049-ready-p2-consistent-error-messages.md`

---

**Remember**: Consistent, clear error messages improve user experience and reduce support tickets. Always use the standardized error message system!
