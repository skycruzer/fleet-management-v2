# Error Handling Guide

This guide explains how to use the centralized error handling system in Fleet Management V2.

## Overview

The error handling system consists of two main components:

1. **Error Boundary Component** (`components/error-boundary.tsx`) - Catches React component errors
2. **Error Logger Service** (`lib/error-logger.ts`) - Centralized error logging and monitoring

## Quick Start

### 1. Wrap Your App with Error Boundary

Add the ErrorBoundary to your root layout:

```tsx
// app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### 2. Use Error Logger in Your Code

```tsx
import { logError, ErrorSeverity } from '@/lib/error-logger'

async function fetchPilots() {
  try {
    const response = await fetch('/api/pilots')
    if (!response.ok) throw new Error('Failed to fetch pilots')
    return await response.json()
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService.fetchPilots',
      severity: ErrorSeverity.HIGH,
      metadata: { endpoint: '/api/pilots' },
      tags: ['api', 'pilots', 'fetch']
    })
    throw error
  }
}
```

## Error Boundary Usage

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

export function PilotDashboard() {
  return (
    <ErrorBoundary>
      <PilotList />
      <PilotStats />
    </ErrorBoundary>
  )
}
```

### With Custom Fallback

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

const customFallback = (
  <div className="p-6 text-center">
    <h2>Unable to load pilots</h2>
    <p>Please refresh the page</p>
  </div>
)

export function PilotDashboard() {
  return (
    <ErrorBoundary fallback={customFallback}>
      <PilotList />
    </ErrorBoundary>
  )
}
```

### With Custom Error Handler

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

function handleError(error: Error, errorInfo: React.ErrorInfo) {
  // Custom error handling logic
  console.log('Custom handler:', error.message)
}

export function PilotDashboard() {
  return (
    <ErrorBoundary onError={handleError}>
      <PilotList />
    </ErrorBoundary>
  )
}
```

### Using HOC Pattern

```tsx
import { withErrorBoundary } from '@/components/error-boundary'

// Wrap a component
const SafePilotCard = withErrorBoundary(PilotCard)

// Use it
export function PilotList() {
  return (
    <div>
      {pilots.map(pilot => (
        <SafePilotCard key={pilot.id} pilot={pilot} />
      ))}
    </div>
  )
}
```

## Error Logger Usage

### Basic Error Logging

```tsx
import { logError } from '@/lib/error-logger'

try {
  await riskyOperation()
} catch (error) {
  logError(error as Error, {
    source: 'MyComponent.riskyOperation',
  })
}
```

### With Error Context

```tsx
import { logError, ErrorSeverity } from '@/lib/error-logger'

try {
  await updatePilot(pilotId, data)
} catch (error) {
  logError(error as Error, {
    source: 'PilotService.updatePilot',
    severity: ErrorSeverity.HIGH,
    userId: currentUser.id,
    metadata: {
      pilotId,
      action: 'update',
      fields: Object.keys(data)
    },
    tags: ['pilot', 'update', 'mutation']
  })
  throw error
}
```

### Logging Warnings

```tsx
import { logWarning } from '@/lib/error-logger'

if (pilotAge > retirementAge) {
  logWarning('Pilot exceeds retirement age', {
    source: 'PilotValidation',
    metadata: { pilotId, age: pilotAge, retirementAge },
    tags: ['validation', 'retirement']
  })
}
```

### Logging Info Messages

```tsx
import { logInfo } from '@/lib/error-logger'

logInfo('Pilot certification updated successfully', {
  source: 'CertificationService',
  metadata: { pilotId, certificationType }
})
```

### Automatic Error Logging with HOC

```tsx
import { withErrorLogging, ErrorSeverity } from '@/lib/error-logger'

// Original function
async function fetchPilots() {
  const response = await fetch('/api/pilots')
  return await response.json()
}

// Wrapped with automatic error logging
const safeFetchPilots = withErrorLogging(
  fetchPilots,
  {
    source: 'PilotService.fetchPilots',
    severity: ErrorSeverity.HIGH,
    tags: ['api', 'pilots']
  }
)

// Use it - errors are automatically logged
const pilots = await safeFetchPilots()
```

## Error Severity Levels

```tsx
import { ErrorSeverity } from '@/lib/error-logger'

ErrorSeverity.LOW       // Minor issues, warnings
ErrorSeverity.MEDIUM    // Non-critical errors
ErrorSeverity.HIGH      // Critical errors affecting functionality
ErrorSeverity.CRITICAL  // System-breaking errors
```

## Error Type Helpers

```tsx
import {
  isNetworkError,
  isAuthError,
  isValidationError,
  getUserFriendlyMessage
} from '@/lib/error-logger'

try {
  await fetchData()
} catch (error) {
  const err = error as Error

  if (isNetworkError(err)) {
    toast.error('Network connection error')
  } else if (isAuthError(err)) {
    router.push('/login')
  } else if (isValidationError(err)) {
    setValidationErrors(err.message)
  } else {
    toast.error(getUserFriendlyMessage(err))
  }
}
```

## Service Layer Integration

When implementing service functions, always use error logging:

```tsx
// lib/services/pilot-service.ts
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { createClient } from '@/lib/supabase/server'

export async function getPilots() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .order('name')

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    logError(error as Error, {
      source: 'PilotService.getPilots',
      severity: ErrorSeverity.HIGH,
      tags: ['service', 'pilots', 'database']
    })
    return { success: false, error: (error as Error).message }
  }
}
```

## API Route Integration

Add error logging to API routes:

```tsx
// app/api/pilots/route.ts
import { NextResponse } from 'next/server'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { getPilots } from '@/lib/services/pilot-service'

export async function GET() {
  try {
    const result = await getPilots()

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    logError(error as Error, {
      source: 'API.GET /api/pilots',
      severity: ErrorSeverity.HIGH,
      tags: ['api', 'pilots', 'route']
    })

    return NextResponse.json(
      { success: false, error: 'Failed to fetch pilots' },
      { status: 500 }
    )
  }
}
```

## Development vs Production

### Development Mode
- Detailed error messages shown in UI
- Rich console logging with stack traces
- Error details visible in ErrorBoundary

### Production Mode
- Generic user-friendly messages in UI
- Errors stored in localStorage (last 50)
- Ready for Sentry integration
- Optional logging endpoint support

## Debugging Production Errors

Access stored errors in browser console:

```javascript
import { getStoredErrors, clearStoredErrors } from '@/lib/error-logger'

// View all stored errors
const errors = getStoredErrors()
console.table(errors)

// Clear stored errors
clearStoredErrors()
```

## Next Steps

### 1. Add Error Boundaries to Key Routes

```tsx
// app/dashboard/pilots/page.tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function PilotsPage() {
  return (
    <ErrorBoundary>
      <PilotDashboard />
    </ErrorBoundary>
  )
}
```

### 2. Replace Console.log Calls

Find and replace console.log/error calls with proper error logging:

```bash
# Find all console calls
grep -r "console\.(log|error|warn)" --include="*.ts" --include="*.tsx" .
```

Replace with appropriate logging:
- `console.error()` → `logError()`
- `console.warn()` → `logWarning()`
- `console.log()` → `logInfo()` (or remove if not needed)

### 3. Integrate Sentry (Future)

Add environment variable:
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

Update `lib/error-logger.ts`:
```tsx
import * as Sentry from '@sentry/nextjs'

// In logError function
if (process.env.NODE_ENV === 'production') {
  Sentry.captureException(error, {
    level: mapSeverityToSentryLevel(context?.severity),
    tags: context?.tags,
    contexts: {
      custom: context?.metadata,
    },
  })
}
```

## Best Practices

1. **Always provide context** - Include source, severity, and metadata
2. **Use appropriate severity levels** - Don't mark everything as CRITICAL
3. **Add descriptive tags** - Helps with filtering and analysis
4. **Wrap critical components** - Use ErrorBoundary for complex UI sections
5. **Log before throwing** - Log the error before re-throwing
6. **Use HOC for repetitive patterns** - `withErrorLogging` and `withErrorBoundary`
7. **Keep error messages user-friendly** - Use `getUserFriendlyMessage()` helper
8. **Test error scenarios** - Ensure error boundaries and logging work correctly

## Examples from Project

### Pilot Service

```tsx
// lib/services/pilot-service.ts
import { logError, ErrorSeverity, withErrorLogging } from '@/lib/error-logger'

export const getPilotById = withErrorLogging(
  async (id: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },
  {
    source: 'PilotService.getPilotById',
    severity: ErrorSeverity.HIGH,
    tags: ['service', 'pilot', 'read']
  }
)
```

### Form Submission

```tsx
// components/forms/pilot-form.tsx
import { logError, ErrorSeverity } from '@/lib/error-logger'

async function onSubmit(data: PilotFormData) {
  try {
    setIsSubmitting(true)
    await updatePilot(pilot.id, data)
    toast.success('Pilot updated successfully')
    router.refresh()
  } catch (error) {
    logError(error as Error, {
      source: 'PilotForm.onSubmit',
      severity: ErrorSeverity.HIGH,
      userId: user?.id,
      metadata: {
        pilotId: pilot.id,
        action: 'update'
      },
      tags: ['form', 'pilot', 'update']
    })
    toast.error('Failed to update pilot')
  } finally {
    setIsSubmitting(false)
  }
}
```

### Component with Error Boundary

```tsx
// app/dashboard/pilots/page.tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function PilotsPage() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, {
          source: 'PilotsPage',
          severity: ErrorSeverity.CRITICAL,
          componentStack: errorInfo.componentStack,
          tags: ['page', 'pilots', 'render-error']
        })
      }}
    >
      <div className="container py-6">
        <PilotList />
      </div>
    </ErrorBoundary>
  )
}
```

## Summary

The centralized error handling system provides:

- ✅ Consistent error handling across the app
- ✅ User-friendly error messages
- ✅ Comprehensive error logging with context
- ✅ Development debugging tools
- ✅ Production error tracking ready
- ✅ Type-safe TypeScript API
- ✅ Easy integration with existing code

Start by wrapping your app with ErrorBoundary and gradually add error logging to service functions and critical operations.
