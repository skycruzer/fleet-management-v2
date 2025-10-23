# Error Logging Guide

**Fleet Management V2 - Comprehensive Error Logging System**
**Last Updated**: October 22, 2025

---

## 🎯 Overview

This guide documents the comprehensive error logging system implemented in the Fleet Management application. The system provides centralized logging for both client-side and server-side errors with multiple log levels, structured context, and persistent storage.

---

## 📊 Logger Architecture

### Two Logging Systems

The application has two complementary logging systems:

1. **New Comprehensive Logger** (`/lib/utils/logger.ts`)
   - Multi-level logging (debug, info, warn, error, fatal)
   - Client-side log persistence
   - Specialized logging functions
   - Global error handlers
   - Development vs production behavior

2. **Existing Error Logger** (`/lib/error-logger.ts`)
   - Used by ErrorBoundary component
   - Focused on React error boundaries
   - Simple error context interface

**Recommendation**: Use the new comprehensive logger (`/lib/utils/logger.ts`) for all new error logging implementations.

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { logger, logError, logInfo, logWarn } from '@/lib/utils/logger'

// Log informational message
logInfo('User logged in successfully', { userId: 'user123' })

// Log warning
logWarn('API response slow', { duration: 5000, endpoint: '/api/pilots' })

// Log error
try {
  await fetchData()
} catch (error) {
  logError('Failed to fetch pilot data', error, {
    component: 'PilotList',
    action: 'fetchPilots'
  })
}

// Log fatal error (critical system failures)
logger.fatal('Database connection lost', error, {
  component: 'Database',
  database: 'supabase'
})
```

---

## 📐 Log Levels

### When to Use Each Level

| Level | Purpose | Example Use Case |
|-------|---------|------------------|
| `debug` | Development debugging | API request/response details, state changes |
| `info` | Informational events | User actions, page views, successful operations |
| `warn` | Warning conditions | Slow performance, deprecated features, fallback behavior |
| `error` | Error conditions | Failed API calls, validation errors, caught exceptions |
| `fatal` | Critical failures | Database unavailable, authentication system down |

### Log Level Methods

```typescript
// Debug (development only)
logger.debug('Component rendered', { component: 'PilotCard', renderCount: 5 })

// Info
logger.info('User submitted leave request', { userId: '123', leaveType: 'Annual' })

// Warn
logger.warn('Session expiring soon', { expiresIn: 300 })

// Error
logger.error('Failed to save certification', error, { certId: 'cert-456' })

// Fatal
logger.fatal('Critical system failure', error, { system: 'authentication' })
```

---

## 🎨 Log Context

### LogContext Interface

```typescript
export interface LogContext {
  userId?: string      // Current user ID
  pilotId?: string     // Pilot ID if applicable
  route?: string       // Current route/page
  action?: string      // Action being performed
  component?: string   // Component name
  [key: string]: any   // Additional custom fields
}
```

### Using Context Effectively

```typescript
// Example 1: API Error with Context
logError('Failed to update pilot', error, {
  component: 'PilotEditForm',
  pilotId: pilot.id,
  action: 'updatePilot',
  userId: user.id,
  route: '/dashboard/pilots/edit'
})

// Example 2: Performance Warning with Context
logWarn('Slow database query', {
  component: 'CertificationList',
  query: 'fetchExpiring',
  duration: 3500,
  resultCount: 150
})

// Example 3: User Action with Context
logInfo('Pilot created successfully', {
  component: 'PilotNewForm',
  pilotId: newPilot.id,
  userId: user.id,
  rank: newPilot.rank
})
```

---

## 🔧 Specialized Logging Functions

### API Request/Response Logging

```typescript
import { logApiRequest, logApiResponse } from '@/lib/utils/logger'

// Log API request (development only)
logApiRequest('POST', '/api/certifications', {
  component: 'CertificationForm',
  userId: user.id
})

// Log API response
const startTime = Date.now()
const response = await fetch('/api/certifications', { method: 'POST' })
const duration = Date.now() - startTime

logApiResponse('POST', '/api/certifications', response.status, duration, {
  component: 'CertificationForm',
  certId: result.id
})
```

**Auto-Categorization**:
- Status 500+: Logged as error
- Status 400-499: Logged as warning
- Status 200-399: Logged as debug

### User Action Logging

```typescript
import { logUserAction } from '@/lib/utils/logger'

// Track user interactions
logUserAction('Clicked Export Button', {
  component: 'CertificationList',
  userId: user.id,
  exportType: 'CSV'
})

logUserAction('Submitted Leave Request', {
  component: 'LeaveRequestForm',
  userId: user.id,
  leaveType: 'Annual',
  startDate: '2025-01-15'
})
```

### Page View Logging

```typescript
import { logPageView } from '@/lib/utils/logger'

// Track page navigation
useEffect(() => {
  logPageView('/dashboard/pilots', {
    userId: user.id,
    previousRoute: router.previousRoute
  })
}, [])
```

### Performance Logging

```typescript
import { logPerformance } from '@/lib/utils/logger'

// Track performance metrics
const startTime = performance.now()
await loadData()
const duration = performance.now() - startTime

logPerformance('Data Load Time', duration, 'ms', {
  component: 'Dashboard',
  recordCount: data.length
})

// Memory usage
const memoryUsage = performance.memory?.usedJSHeapSize || 0
logPerformance('Heap Size', memoryUsage / 1024 / 1024, 'MB', {
  component: 'Analytics'
})
```

---

## 🌐 Client-Side vs Server-Side Logging

### Client-Side Logging

**Features**:
- Logs stored in sessionStorage (last 100 entries)
- Includes userAgent and URL
- Global error handlers for unhandled errors
- Log download functionality

**Example**:
```typescript
'use client'

import { logError, logInfo } from '@/lib/utils/logger'

export function PilotCard({ pilot }: { pilot: Pilot }) {
  const handleClick = () => {
    logInfo('Pilot card clicked', {
      component: 'PilotCard',
      pilotId: pilot.id
    })
  }

  const handleError = (error: Error) => {
    logError('Failed to load pilot details', error, {
      component: 'PilotCard',
      pilotId: pilot.id
    })
  }

  return <div onClick={handleClick}>...</div>
}
```

### Server-Side Logging

**Features**:
- No sessionStorage access
- No userAgent/URL capture
- Server-only logs go to console/external service

**Example**:
```typescript
// app/api/pilots/route.ts
import { logError, logInfo } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    logInfo('Creating new pilot', {
      component: 'API:Pilots',
      action: 'create'
    })

    const pilot = await createPilot(data)
    return Response.json(pilot)

  } catch (error) {
    logError('Failed to create pilot', error, {
      component: 'API:Pilots',
      action: 'create'
    })
    return Response.json({ error: 'Failed to create pilot' }, { status: 500 })
  }
}
```

---

## 🛡️ Global Error Handlers

### Setup

Add to root layout or app initialization:

```typescript
// app/layout.tsx
import { setupGlobalErrorHandlers } from '@/lib/utils/logger'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])

  return <html>{children}</html>
}
```

### What Gets Caught

**Unhandled Errors**:
```typescript
// This will be automatically logged
throw new Error('Something went wrong')

// Logged with context:
// {
//   component: 'global',
//   message: 'Something went wrong',
//   filename: 'app.js',
//   lineno: 123,
//   colno: 45
// }
```

**Unhandled Promise Rejections**:
```typescript
// This will be automatically logged
fetch('/api/data').then(res => {
  throw new Error('Fetch failed')
})

// Logged with context:
// {
//   component: 'global',
//   promise: '[object Promise]'
// }
```

---

## 💾 Log Storage & Retrieval

### Accessing Stored Logs

```typescript
import { logger } from '@/lib/utils/logger'

// Get all stored logs
const logs = logger.getStoredLogs()
console.log(logs) // Array of LogEntry objects

// Clear logs
logger.clearLogs()

// Download logs as JSON file
logger.downloadLogs() // Downloads logs_2025-10-22T12:34:56.json
```

### Log Entry Structure

```typescript
interface LogEntry {
  timestamp: string      // ISO 8601 timestamp
  level: LogLevel        // debug | info | warn | error | fatal
  message: string        // Log message
  error?: Error          // Error object (if applicable)
  context?: LogContext   // Additional context
  stack?: string         // Error stack trace
  userAgent?: string     // Browser userAgent (client-side only)
  url?: string           // Current URL (client-side only)
}
```

### Example Log Entry

```json
{
  "timestamp": "2025-10-22T10:30:45.123Z",
  "level": "error",
  "message": "Failed to save certification",
  "error": {
    "name": "ValidationError",
    "message": "Expiry date must be in the future"
  },
  "context": {
    "component": "CertificationForm",
    "pilotId": "pilot-123",
    "userId": "user-456",
    "certType": "Line Check"
  },
  "stack": "Error: Expiry date must be in the future\n    at validateCert...",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "url": "https://fleet-management.example.com/dashboard/certifications/new"
}
```

---

## 📋 Common Use Cases

### Use Case 1: Form Submission

```typescript
'use client'

import { logError, logInfo } from '@/lib/utils/logger'

export function LeaveRequestForm() {
  const handleSubmit = async (data: FormData) => {
    try {
      logInfo('Submitting leave request', {
        component: 'LeaveRequestForm',
        leaveType: data.leaveType,
        userId: user.id
      })

      const result = await submitLeaveRequest(data)

      logInfo('Leave request submitted successfully', {
        component: 'LeaveRequestForm',
        requestId: result.id,
        userId: user.id
      })

      toast.success('Leave request submitted!')

    } catch (error) {
      logError('Failed to submit leave request', error, {
        component: 'LeaveRequestForm',
        leaveType: data.leaveType,
        userId: user.id
      })

      toast.error('Failed to submit leave request')
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### Use Case 2: Data Fetching

```typescript
'use client'

import { logError, logWarn } from '@/lib/utils/logger'

export function usePilots() {
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPilots = async () => {
      const startTime = Date.now()

      try {
        const data = await getPilots()
        setPilots(data)

        const duration = Date.now() - startTime
        if (duration > 3000) {
          logWarn('Slow pilot fetch', {
            component: 'usePilots',
            duration,
            pilotCount: data.length
          })
        }

      } catch (error) {
        logError('Failed to fetch pilots', error, {
          component: 'usePilots'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPilots()
  }, [])

  return { pilots, loading }
}
```

### Use Case 3: Error Boundary Integration

```typescript
'use client'

import { Component, ReactNode } from 'react'
import { logFatal } from '@/lib/utils/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logFatal('React Error Boundary caught error', error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}
```

### Use Case 4: API Route Error Handling

```typescript
// app/api/certifications/route.ts
import { logError, logInfo } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate
    if (!data.pilot_id || !data.check_type_id) {
      logWarn('Invalid certification data', {
        component: 'API:Certifications',
        data
      })
      return Response.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Create
    const cert = await createCertification(data)

    logInfo('Certification created', {
      component: 'API:Certifications',
      certId: cert.id,
      pilotId: data.pilot_id
    })

    return Response.json(cert)

  } catch (error) {
    logError('Failed to create certification', error, {
      component: 'API:Certifications'
    })
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
```

---

## 🔍 Production Configuration

### Environment-Specific Behavior

**Development** (`NODE_ENV=development`):
- All log levels enabled (debug, info, warn, error, fatal)
- Logs to console with color coding
- No external service integration

**Production** (`NODE_ENV=production`):
- Debug logs disabled
- Logs persisted to sessionStorage
- Fatal errors can be sent to external service (when configured)

### External Service Integration

The logger includes a placeholder for external logging services:

```typescript
// lib/utils/logger.ts
private sendToExternalService(entry: Partial<LogEntry>): void {
  // Future implementation:
  // - Sentry
  // - LogRocket
  // - DataDog
  // - CloudWatch
  // - Custom logging API

  // Example Sentry integration:
  // if (window.Sentry) {
  //   window.Sentry.captureException(entry.error, {
  //     level: entry.level,
  //     extra: entry.context,
  //   })
  // }
}
```

**To Enable External Logging**:
1. Install logging service SDK (e.g., `@sentry/nextjs`)
2. Configure in `next.config.js`
3. Uncomment and customize `sendToExternalService()`

---

## 📊 Log Analysis

### Viewing Logs in Development

```typescript
// Browser Console
import { logger } from '@/lib/utils/logger'

// View all logs
console.table(logger.getStoredLogs())

// Filter by level
const errors = logger.getStoredLogs().filter(log => log.level === 'error')
console.table(errors)

// Filter by component
const formLogs = logger.getStoredLogs().filter(
  log => log.context?.component?.includes('Form')
)
console.table(formLogs)
```

### Downloading Logs

```typescript
// Add to admin page or debug panel
import { logger } from '@/lib/utils/logger'

export function DebugPanel() {
  const handleDownload = () => {
    logger.downloadLogs()
  }

  const handleClear = () => {
    logger.clearLogs()
  }

  return (
    <div>
      <button onClick={handleDownload}>Download Logs</button>
      <button onClick={handleClear}>Clear Logs</button>
    </div>
  )
}
```

---

## ✅ Best Practices

### DO These Things

1. ✅ **Use appropriate log levels**
   ```typescript
   // Good
   logInfo('User logged in', { userId })
   logError('Login failed', error, { username })

   // Bad
   logError('User logged in', undefined, { userId }) // Wrong level
   ```

2. ✅ **Provide meaningful context**
   ```typescript
   // Good
   logError('Failed to save', error, {
     component: 'PilotForm',
     pilotId: pilot.id,
     action: 'update'
   })

   // Bad
   logError('Failed to save', error) // No context
   ```

3. ✅ **Log user actions for analytics**
   ```typescript
   logUserAction('Exported certifications', {
     component: 'CertificationList',
     format: 'CSV',
     recordCount: 150
   })
   ```

4. ✅ **Log performance issues**
   ```typescript
   if (duration > 3000) {
     logWarn('Slow operation', { duration, operation: 'fetchPilots' })
   }
   ```

5. ✅ **Use structured error context**
   ```typescript
   catch (error) {
     logError('Operation failed', error, {
       component: 'ComponentName',
       operation: 'operationName',
       userId: user?.id
     })
   }
   ```

### DON'T Do These Things

1. ❌ **Don't log sensitive data**
   ```typescript
   // Bad - Never log passwords, tokens, or PII
   logInfo('User authenticated', {
     password: user.password,  // ❌ NEVER
     token: authToken          // ❌ NEVER
   })

   // Good - Log only necessary info
   logInfo('User authenticated', {
     userId: user.id,
     timestamp: new Date()
   })
   ```

2. ❌ **Don't log in tight loops**
   ```typescript
   // Bad - Creates thousands of log entries
   data.forEach(item => {
     logInfo('Processing item', { item }) // ❌
   })

   // Good - Log once with summary
   logInfo('Processing batch', {
     itemCount: data.length,
     batchId: batch.id
   })
   ```

3. ❌ **Don't use debug logs in production**
   ```typescript
   // Bad - Debug logs are disabled in production anyway
   if (process.env.NODE_ENV === 'production') {
     logger.debug('This will never log') // ❌ Pointless
   }

   // Good - Use appropriate level
   logger.info('Production event', { ... })
   ```

4. ❌ **Don't ignore caught errors**
   ```typescript
   // Bad - Error swallowed
   try {
     await riskyOperation()
   } catch (error) {
     // Silent failure ❌
   }

   // Good - Log the error
   try {
     await riskyOperation()
   } catch (error) {
     logError('Risky operation failed', error, {
       component: 'ComponentName'
     })
   }
   ```

---

## 🔧 Troubleshooting

### Logs Not Appearing

**Issue**: Logs not showing in console

**Solutions**:
1. Check log level (debug only works in development)
2. Verify logger is imported correctly
3. Check browser console filters

**Issue**: Logs not persisting in sessionStorage

**Solutions**:
1. Check browser privacy settings (sessionStorage enabled?)
2. Verify production environment
3. Check sessionStorage quota (should store ~100 logs)

### Performance Issues

**Issue**: Logging causing performance problems

**Solutions**:
1. Reduce debug logging in production
2. Avoid logging in tight loops
3. Limit context object size
4. Use sampling for high-frequency events

---

## 📚 Migration Guide

### From Old Error Logger

If you have existing code using `/lib/error-logger.ts`:

**Before**:
```typescript
import { logError } from '@/lib/error-logger'

logError(error, { component: 'MyComponent' })
```

**After**:
```typescript
import { logError } from '@/lib/utils/logger'

logError('Operation failed', error, {
  component: 'MyComponent'
})
```

**Key Differences**:
1. New logger requires a message as first parameter
2. Error is second parameter (optional)
3. Context is third parameter
4. More log levels available (debug, info, warn, error, fatal)

---

## 📊 Examples

### Complete Component Example

```typescript
'use client'

import { useState, useEffect } from 'react'
import { logError, logInfo, logWarn, logUserAction } from '@/lib/utils/logger'
import { toast } from '@/components/ui/use-toast'

export function PilotCertificationCard({ pilotId }: { pilotId: string }) {
  const [certs, setCerts] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCertifications = async () => {
      const startTime = Date.now()

      try {
        logInfo('Fetching certifications', {
          component: 'PilotCertificationCard',
          pilotId
        })

        const data = await getCertifications(pilotId)
        setCerts(data)

        const duration = Date.now() - startTime
        if (duration > 2000) {
          logWarn('Slow certification fetch', {
            component: 'PilotCertificationCard',
            pilotId,
            duration,
            certCount: data.length
          })
        }

      } catch (error) {
        logError('Failed to fetch certifications', error, {
          component: 'PilotCertificationCard',
          pilotId
        })
        toast({
          title: 'Error',
          description: 'Failed to load certifications',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCertifications()
  }, [pilotId])

  const handleExport = () => {
    logUserAction('Exported certifications', {
      component: 'PilotCertificationCard',
      pilotId,
      certCount: certs.length,
      format: 'CSV'
    })

    exportToCsv(certs)
  }

  return (
    <div>
      {/* Component UI */}
      <button onClick={handleExport}>Export</button>
    </div>
  )
}
```

---

## 📈 Future Enhancements

### Planned Improvements

1. **External Service Integration**
   - Sentry for error tracking
   - LogRocket for session replay
   - DataDog for APM

2. **Advanced Filtering**
   - Log level filtering UI
   - Component filtering
   - Time range filtering

3. **Log Aggregation**
   - Server-side log collection
   - Log analytics dashboard
   - Error trend analysis

4. **Performance Monitoring**
   - Automatic performance logging
   - Core Web Vitals tracking
   - API response time tracking

---

## 🔍 Resources

- [Winston (Node.js logging)](https://github.com/winstonjs/winston)
- [Sentry Documentation](https://docs.sentry.io/)
- [LogRocket](https://logrocket.com/)
- [DataDog APM](https://www.datadoghq.com/)
- [MDN: Console API](https://developer.mozilla.org/en-US/docs/Web/API/Console)

---

**Version**: 1.0.0
**Author**: Claude (Sprint 6: Final Polish)
**Status**: Active - Use new logger (`/lib/utils/logger.ts`) for all logging needs
