# Retry Logic Documentation

**Version**: 1.0.0
**Last Updated**: October 19, 2025
**Status**: Implemented ✅

## Overview

The Fleet Management V2 application implements comprehensive retry logic for failed network requests. This system provides automatic recovery from transient failures with exponential backoff, user-facing status indicators, and configurable retry policies.

## Features

✅ **Automatic Retry for Transient Failures**
- Network errors (connection failures, timeouts)
- Server errors (5xx HTTP status codes)
- Configurable retry attempts (default: 3)

✅ **Exponential Backoff Strategy**
- Initial delay: 1000ms (configurable)
- Backoff multiplier: 2x (configurable)
- Maximum delay: 30000ms (configurable)
- Jitter to prevent thundering herd

✅ **Smart Error Classification**
- Network errors → Retry
- 5xx server errors → Retry
- 4xx client errors → No retry
- Timeout errors → Retry

✅ **User-Facing Status Indicators**
- Retry progress tracking
- Status messages ("Retrying in 2s...")
- Visual progress bars
- Toast notifications

## Architecture

### Core Utilities

```
lib/utils/retry-utils.ts         # Core retry logic
lib/supabase/retry-client.ts     # Supabase integration
lib/hooks/use-retry-state.ts     # React hooks
components/ui/retry-indicator.tsx # UI components
```

### Component Hierarchy

```
┌─────────────────────────────────┐
│   Application Components       │
│   (Use retry hooks)             │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│   React Hooks                   │
│   useRetryState()               │
│   useRetry()                    │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│   Core Retry Logic              │
│   retryWithBackoff()            │
│   calculateBackoffDelay()       │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│   Network Requests              │
│   Supabase, Fetch, etc.         │
└─────────────────────────────────┘
```

## Usage Examples

### 1. Basic Retry with Hook

```tsx
import { useRetryState } from '@/lib/hooks/use-retry-state'
import { RetryIndicator } from '@/components/ui/retry-indicator'

function PilotList() {
  const { executeWithRetry, isRetrying, statusMessage, progress, retryState } = useRetryState(3)
  const [pilots, setPilots] = useState([])

  const loadPilots = async () => {
    try {
      const data = await executeWithRetry(
        async () => {
          const response = await fetch('/api/pilots')
          if (!response.ok) throw new Error('Failed to fetch pilots')
          return response.json()
        },
        { maxRetries: 3 }
      )
      setPilots(data)
    } catch (error) {
      console.error('Failed after retries:', error)
    }
  }

  return (
    <div>
      <RetryIndicator
        isRetrying={isRetrying}
        statusMessage={statusMessage}
        progress={progress}
        attempt={retryState.attempt}
        maxRetries={retryState.maxRetries}
      />
      <button onClick={loadPilots}>Load Pilots</button>
      {/* Render pilots */}
    </div>
  )
}
```

### 2. Supabase Query with Retry

```tsx
import { createClient } from '@/lib/supabase/server'
import { selectWithRetry } from '@/lib/supabase/retry-client'

async function getPilots() {
  const supabase = await createClient()

  const { data, error } = await selectWithRetry(
    async () => supabase.from('pilots').select('*'),
    { maxRetries: 3 }
  )

  if (error) throw error
  return data
}
```

### 3. Custom Retry Configuration

```tsx
import { retryWithBackoff } from '@/lib/utils/retry-utils'

const data = await retryWithBackoff(
  async () => fetchData(),
  {
    maxRetries: 5,           // More attempts
    initialDelayMs: 500,     // Start with shorter delay
    maxDelayMs: 10000,       // Lower maximum delay
    backoffMultiplier: 1.5,  // Gentler exponential growth
    useJitter: true,         // Add randomness
    timeoutMs: 20000,        // 20 second timeout per attempt
    onRetry: (attempt, max, delay, error) => {
      console.log(`Retry ${attempt}/${max} in ${delay}ms:`, error.message)
    },
    onFinalFailure: (error, attempts) => {
      console.error(`Failed after ${attempts} attempts:`, error)
    }
  }
)
```

### 4. Retry State Tracking

```tsx
import { createRetryState, retryWithState } from '@/lib/utils/retry-utils'

function DataLoader() {
  const [retryState, setRetryState] = useState(createRetryState(3))

  const loadData = async () => {
    try {
      await retryWithState(
        async () => fetchData(),
        retryState,
        (newState) => setRetryState({ ...newState })
      )
    } catch (error) {
      console.error('Load failed:', error)
    }
  }

  return (
    <div>
      {retryState.isRetrying && (
        <p>Retrying... {retryState.attempt}/{retryState.maxRetries}</p>
      )}
      <button onClick={loadData}>Load</button>
    </div>
  )
}
```

## UI Components

### RetryIndicator

Full-featured retry status display with progress bar.

```tsx
<RetryIndicator
  isRetrying={isRetrying}
  statusMessage="Connection issue. Retrying in 2s..."
  progress={33}
  attempt={1}
  maxRetries={3}
  variant="default" // or "compact" | "toast"
  showProgress={true}
/>
```

**Variants**:
- `default`: Full banner with progress bar
- `compact`: Minimal inline indicator
- `toast`: Fixed position notification

### NetworkErrorBanner

Error banner with manual retry button.

```tsx
<NetworkErrorBanner
  show={hasError}
  message="Failed to load data after multiple attempts"
  onRetry={() => {
    setHasError(false)
    loadData()
  }}
/>
```

### InlineRetryStatus

Minimal inline retry indicator.

```tsx
<InlineRetryStatus
  isRetrying={isRetrying}
  message="Loading pilots..."
  size="md" // or "sm" | "lg"
/>
```

## Configuration

### Default Retry Policies

**Read Operations (SELECT)**:
- Max retries: 3
- Initial delay: 500ms
- Max delay: 5000ms
- Timeout: 15s

**Write Operations (INSERT/UPDATE/DELETE)**:
- Max retries: 2
- Initial delay: 1000ms
- Max delay: 8000ms
- Timeout: 30s

**RPC/Function Calls**:
- Max retries: 3
- Initial delay: 1000ms
- Max delay: 10000ms
- Timeout: 45s

### Error Classification

| Error Type | Retry? | Examples |
|------------|--------|----------|
| Network errors | ✅ Yes | Failed to fetch, ECONNREFUSED, NetworkError |
| Server errors (5xx) | ✅ Yes | 500, 502, 503, 504 |
| Client errors (4xx) | ❌ No | 400, 401, 403, 404 |
| Timeout errors | ✅ Yes | Request timeout, ETIMEDOUT |
| Unknown errors | ❌ No | All other errors |

## Exponential Backoff

Delay calculation: `initialDelay * (multiplier ^ attempt)`

**Example** (initial: 1000ms, multiplier: 2):
- Attempt 0 (initial): 1000ms
- Attempt 1: 2000ms
- Attempt 2: 4000ms
- Attempt 3: 8000ms

**With Jitter** (adds 0-25% randomness):
- Attempt 1: 2000-2500ms (random)
- Attempt 2: 4000-5000ms (random)
- Attempt 3: 8000-10000ms (random)

## Best Practices

### 1. Choose Appropriate Retry Counts

```tsx
// Read operations: More retries (data fetch is idempotent)
await selectWithRetry(query, { maxRetries: 3 })

// Write operations: Fewer retries (avoid duplicate writes)
await insertWithRetry(mutation, { maxRetries: 2 })

// Critical operations: Even fewer retries
await executeWithRetry(criticalOp, { maxRetries: 1 })
```

### 2. Use UI Feedback

```tsx
// Always show retry status to users
const { executeWithRetry, isRetrying, statusMessage } = useRetryState()

return (
  <>
    <RetryIndicator isRetrying={isRetrying} statusMessage={statusMessage} />
    <YourContent />
  </>
)
```

### 3. Handle Final Failures

```tsx
await retryWithBackoff(
  async () => fetchData(),
  {
    maxRetries: 3,
    onFinalFailure: (error, attempts) => {
      // Log to error monitoring
      logError(error, { attempts })

      // Show user-friendly message
      toast.error('Unable to load data. Please try again later.')
    }
  }
)
```

### 4. Timeout Configuration

```tsx
// Fast operations: Short timeout
await retryWithBackoff(fastOp, { timeoutMs: 5000 })

// Slow operations: Longer timeout
await retryWithBackoff(slowOp, { timeoutMs: 60000 })
```

## Testing

Tests are located in `lib/utils/__tests__/retry-utils.test.ts`.

Run tests:
```bash
npm test lib/utils/__tests__/retry-utils.test.ts
```

### Test Coverage

- ✅ Error classification (network, server, client)
- ✅ Backoff calculation (exponential, jitter, max delay)
- ✅ Retry logic (success, failure, max retries)
- ✅ Callbacks (onRetry, onFinalFailure)
- ✅ Fetch integration
- ✅ State management
- ✅ Status messages

## Monitoring

### Logging

Retry attempts are automatically logged:

```
ℹ️ Info: Retrying select operation
  Source: SupabaseRetryClient
  Metadata: {
    operation: 'executeWithRetry',
    operationType: 'select',
    attempt: 1,
    maxRetries: 3,
    delayMs: 2000,
    errorMessage: 'Failed to fetch'
  }
```

### Error Tracking

Final failures are logged with high severity:

```
🔴 Error: Failed to fetch
  Source: RetryUtils
  Severity: HIGH
  Metadata: {
    operation: 'retryWithBackoff',
    attempts: 4,
    maxRetries: 3,
    retryable: true,
    errorType: 'network'
  }
  Tags: ['retry-failed', 'network-error']
```

## Integration Points

### Supabase Service Layer

All service functions in `lib/services/` can use retry wrappers:

```typescript
import { selectWithRetry } from '@/lib/supabase/retry-client'

export async function getPilots() {
  const supabase = await createClient()

  return await selectWithRetry(
    async () => supabase.from('pilots').select('*'),
    { maxRetries: 3 }
  )
}
```

### API Routes

API routes can use `fetchWithRetry`:

```typescript
import { fetchWithRetry } from '@/lib/utils/retry-utils'

export async function GET(request: Request) {
  try {
    const response = await fetchWithRetry(
      'https://external-api.com/data',
      { method: 'GET' },
      { maxRetries: 3 }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
```

## Performance Considerations

### Total Retry Time

With default config (initial: 1000ms, multiplier: 2, max retries: 3):
- Attempt 0: 0ms
- Attempt 1: +1000ms delay = 1000ms
- Attempt 2: +2000ms delay = 3000ms
- Attempt 3: +4000ms delay = 7000ms

**Total max time**: ~7 seconds (plus request time)

### Optimization Tips

1. **Reduce retries for fast operations**
   ```typescript
   await retryWithBackoff(fastOp, { maxRetries: 1 })
   ```

2. **Use shorter timeouts for quick requests**
   ```typescript
   await retryWithBackoff(quickRequest, { timeoutMs: 5000 })
   ```

3. **Disable retry for non-critical operations**
   ```typescript
   // Just fetch without retry
   const data = await fetch('/api/optional-data')
   ```

## Accessibility

All retry indicators follow accessibility best practices:

- ARIA live regions for status updates
- Screen reader friendly messages
- Keyboard navigation support
- Color-independent status indication
- Semantic HTML elements

## Browser Compatibility

Retry logic works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements for future releases:

1. **Circuit Breaker Pattern**
   - Temporarily disable retries after repeated failures
   - Prevent overwhelming failing services

2. **Adaptive Retry**
   - Adjust retry strategy based on historical success rates
   - Machine learning for optimal backoff parameters

3. **Retry Queue**
   - Queue failed requests for background retry
   - Persist across page reloads

4. **Advanced Error Recovery**
   - Automatic token refresh on auth errors
   - Fallback to cached data

5. **Analytics Dashboard**
   - Track retry success rates
   - Identify problematic endpoints
   - Monitor network health

## Support

For issues or questions:
- Check logs in browser console (development mode)
- Review error tracking in production logs
- File issues in project repository

## Changelog

### v1.0.0 (2025-10-19)
- ✅ Initial implementation
- ✅ Exponential backoff with jitter
- ✅ React hooks for state management
- ✅ UI components (RetryIndicator, NetworkErrorBanner)
- ✅ Supabase integration
- ✅ Comprehensive test suite
- ✅ Documentation

---

**Related Files**:
- `lib/utils/retry-utils.ts` - Core retry logic
- `lib/supabase/retry-client.ts` - Supabase integration
- `lib/hooks/use-retry-state.ts` - React hooks
- `components/ui/retry-indicator.tsx` - UI components
- `lib/utils/__tests__/retry-utils.test.ts` - Tests
- `todos/046-ready-p2-retry-logic.md` - Original TODO

**Related Documentation**:
- Error logging: `lib/error-logger.ts`
- Service layer: `CLAUDE.md` (Service Layer Pattern)
