# Connection Error Handling Guide

**Version**: 1.0.0
**Last Updated**: October 19, 2025

## Overview

This guide provides comprehensive documentation for implementing proper connection error handling in the Fleet Management application. It covers offline detection, network failure scenarios, retry logic, and user feedback.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Available Tools](#available-tools)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)
6. [Testing](#testing)
7. [API Reference](#api-reference)

---

## Quick Start

### Basic Offline Detection

```tsx
import { useOnlineStatus } from '@/lib/hooks/use-online-status'
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator'

function MyComponent() {
  const { isOnline, isOffline } = useOnlineStatus()

  return (
    <div>
      <NetworkStatusIndicator
        isOnline={isOnline}
        variant="banner"
        showOnlyWhenOffline={true}
      />
      <button disabled={isOffline}>Submit</button>
    </div>
  )
}
```

### With Automatic Retry

```tsx
import { useRetryState } from '@/lib/hooks/use-retry-state'
import { RetryIndicator } from '@/components/ui/retry-indicator'

function DataLoader() {
  const { executeWithRetry, isRetrying, statusMessage, progress } = useRetryState(3)

  const loadData = async () => {
    const data = await executeWithRetry(
      async () => {
        const res = await fetch('/api/data')
        if (!res.ok) throw new Error('Failed')
        return res.json()
      },
      { maxRetries: 3, retryDelay: 1000 }
    )
  }

  return (
    <div>
      {isRetrying && <RetryIndicator isRetrying={isRetrying} statusMessage={statusMessage} />}
      <button onClick={loadData}>Load</button>
    </div>
  )
}
```

---

## Core Concepts

### 1. Online/Offline Detection

The application monitors network connectivity using the **Navigator.onLine** API and browser events:

- **`online` event**: Fires when connection is restored
- **`offline` event**: Fires when connection is lost
- **`navigator.onLine`**: Current connectivity status

**Important**: This detects browser connectivity to the network, not necessarily internet access or API server availability.

### 2. Error Classification

Errors are categorized for appropriate handling:

| Category | Description | User Message |
|----------|-------------|--------------|
| **Offline** | Browser is offline | "You are currently offline" |
| **Network** | Connection failure | "Network connection error" |
| **Timeout** | Request took too long | "Request timed out" |
| **Server** | 5xx server errors | "Server error" |
| **Auth** | 401/403 errors | "Authentication error" |
| **Validation** | Input validation | "Validation error" |

### 3. Retry Strategy

Automatic retry with exponential backoff:

```typescript
{
  maxRetries: 3,          // Maximum retry attempts
  retryDelay: 1000,       // Initial delay (ms)
  backoffMultiplier: 2,   // Delay multiplier per retry
  // Delays: 1000ms, 2000ms, 4000ms
}
```

### 4. User Feedback Layers

**Progressive disclosure** of error information:

1. **Inline indicators** - Minimal disruption (badges, icons)
2. **Banners** - Moderate disruption (top/bottom of page)
3. **Retry indicators** - Active retry in progress
4. **Error messages** - Explicit failure notification

---

## Available Tools

### Hooks

#### `useOnlineStatus(options?)`

Monitor online/offline status with callbacks.

```tsx
const { isOnline, isOffline, lastChanged, checkStatus } = useOnlineStatus({
  onOnline: () => console.log('Connected!'),
  onOffline: () => console.log('Disconnected!'),
  debounceDelay: 500, // Optional debouncing
})
```

**Returns:**
- `isOnline: boolean` - Online status
- `isOffline: boolean` - Offline status (inverse)
- `lastChanged: string | null` - ISO timestamp of last status change
- `checkStatus: () => boolean` - Manual status check function

#### `useRetryState(maxRetries?)`

Execute functions with automatic retry and state tracking.

```tsx
const {
  executeWithRetry,
  isRetrying,
  statusMessage,
  progress,
  retryState,
  reset
} = useRetryState(3)
```

**Returns:**
- `executeWithRetry: (fn, config?) => Promise<T>` - Execute with retry
- `isRetrying: boolean` - Whether retry is in progress
- `statusMessage: string` - User-friendly status message
- `progress: number` - Retry progress (0-100%)
- `retryState: RetryState` - Full retry state object
- `reset: () => void` - Reset retry state

#### `useOnlineStatusWithReconnect(options)`

Online status with automatic reconnection handling.

```tsx
const { isOnline, reconnect, isReconnecting } = useOnlineStatusWithReconnect({
  onReconnect: async () => {
    await refetchData()
  },
  autoReconnect: true,
})
```

### Components

#### `NetworkStatusIndicator`

Visual indicator of network connectivity status.

```tsx
<NetworkStatusIndicator
  isOnline={isOnline}
  variant="banner"           // 'banner' | 'badge' | 'inline' | 'floating'
  showOnlyWhenOffline={true}
  showReconnectButton={true}
  onReconnect={handleReconnect}
  isReconnecting={isReconnecting}
/>
```

**Variants:**
- **banner** - Full-width alert at top/bottom
- **badge** - Compact pill indicator
- **inline** - Minimal text with icon
- **floating** - Toast-like overlay

#### `RetryIndicator`

Shows retry progress and status.

```tsx
<RetryIndicator
  isRetrying={isRetrying}
  statusMessage={statusMessage}
  progress={progress}
  attempt={retryState.attempt}
  maxRetries={retryState.maxRetries}
  variant="default"  // 'default' | 'compact' | 'toast'
/>
```

#### `NetworkErrorBanner`

Error banner with retry button.

```tsx
<NetworkErrorBanner
  show={hasError}
  message="Failed to load data"
  onRetry={handleRetry}
/>
```

#### `OfflineWarning`

Simple yellow warning for offline state.

```tsx
<OfflineWarning
  show={isOffline}
  message="You are offline. Changes may not be saved."
/>
```

### Error Logger Functions

#### Error Classification

```typescript
import {
  isNetworkError,
  isOfflineError,
  isServerError,
  isTimeoutError,
  isAuthError,
  isValidationError,
  getUserFriendlyMessage,
  getErrorCategory,
} from '@/lib/error-logger'

if (isNetworkError(error)) {
  // Handle network error
}

const message = getUserFriendlyMessage(error)
const category = getErrorCategory(error) // 'offline' | 'network' | 'timeout' | ...
```

---

## Common Patterns

### Pattern 1: Form Submission with Offline Check

```tsx
function MyForm() {
  const { isOnline, isOffline } = useOnlineStatus()
  const { executeWithRetry, isRetrying } = useRetryState()

  const handleSubmit = async (data: FormData) => {
    if (isOffline) {
      toast.error('Cannot submit while offline')
      return
    }

    try {
      await executeWithRetry(
        async () => {
          const res = await fetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify(data),
          })
          if (!res.ok) throw new Error('Submission failed')
          return res.json()
        },
        { maxRetries: 3 }
      )
      toast.success('Submitted successfully')
    } catch (error) {
      toast.error(getUserFriendlyMessage(error as Error))
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <OfflineWarning show={isOffline} />
      <button type="submit" disabled={isOffline || isRetrying}>
        Submit
      </button>
    </form>
  )
}
```

### Pattern 2: Data Fetching with Auto-Retry

```tsx
function DataTable() {
  const { isOnline } = useOnlineStatus({
    onOnline: () => refetch(), // Auto-refetch when coming back online
  })
  const { executeWithRetry, isRetrying, retryState } = useRetryState()
  const [data, setData] = useState([])

  const fetchData = async () => {
    const result = await executeWithRetry(
      async () => {
        const res = await fetch('/api/pilots')
        if (!res.ok) throw new Error('Fetch failed')
        return res.json()
      },
      { maxRetries: 3, retryDelay: 2000 }
    )
    setData(result)
  }

  return (
    <div>
      <NetworkStatusIndicator isOnline={isOnline} variant="banner" />
      {isRetrying && <RetryIndicator {...retryState} />}
      <Table data={data} />
    </div>
  )
}
```

### Pattern 3: Global Offline Detection

```tsx
// app/layout.tsx
'use client'

function RootLayout({ children }) {
  const { isOnline } = useOnlineStatus({
    onOffline: () => {
      toast.error('Connection lost')
    },
    onOnline: () => {
      toast.success('Connection restored')
    },
  })

  return (
    <html>
      <body>
        <NetworkStatusIndicator
          isOnline={isOnline}
          variant="floating"
          position="top"
          showOnlyWhenOffline={true}
        />
        {children}
      </body>
    </html>
  )
}
```

### Pattern 4: Conditional API Calls

```tsx
function ConditionalDataLoader() {
  const { isOnline } = useOnlineStatus()
  const [cachedData, setCachedData] = useState(null)

  const loadData = async () => {
    if (!isOnline) {
      // Use cached data when offline
      const cached = localStorage.getItem('cached-data')
      if (cached) {
        setCachedData(JSON.parse(cached))
        return
      }
      throw new Error('No cached data available')
    }

    // Fetch fresh data when online
    const data = await fetch('/api/data').then(r => r.json())
    localStorage.setItem('cached-data', JSON.stringify(data))
    setCachedData(data)
  }

  return (
    <div>
      {!isOnline && <OfflineWarning message="Showing cached data" />}
      <button onClick={loadData} disabled={!isOnline && !cachedData}>
        Load Data
      </button>
    </div>
  )
}
```

---

## Best Practices

### ✅ DO

1. **Show offline status immediately**
   - Use `NetworkStatusIndicator` in global layout
   - Disable actions that require connectivity

2. **Provide clear, actionable messages**
   - "You are offline. Check your connection."
   - NOT: "Network error occurred"

3. **Auto-retry with visual feedback**
   - Use `RetryIndicator` during retry attempts
   - Show progress and attempt count

4. **Gracefully degrade functionality**
   - Show cached data when offline
   - Queue actions for when connection returns

5. **Distinguish error types**
   - Different messages for offline vs server errors
   - Use `getUserFriendlyMessage()` for consistency

6. **Test offline scenarios**
   - Use Chrome DevTools → Network → Offline
   - Test reconnection behavior

### ❌ DON'T

1. **Don't show generic "Error" messages**
   - Users need to know WHY it failed
   - Provide context and next steps

2. **Don't retry indefinitely**
   - Use reasonable `maxRetries` (3-5)
   - Implement exponential backoff

3. **Don't block UI completely**
   - Allow navigation to other pages
   - Show what's still usable offline

4. **Don't ignore online/offline events**
   - Listen for connection changes
   - Auto-reconnect when possible

5. **Don't assume navigator.onLine is 100% accurate**
   - It detects network interface, not internet access
   - Validate with actual API calls when critical

---

## Testing

### Manual Testing

1. **Chrome DevTools**
   ```
   DevTools → Network Tab → Throttling → Offline
   ```

2. **Firefox DevTools**
   ```
   DevTools → Network → Toggle "Disable Cache" and "Offline mode"
   ```

3. **Safari DevTools**
   ```
   Develop → Network → Disable Network
   ```

### Automated Testing (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('handles offline state', async ({ page, context }) => {
  await page.goto('/dashboard')

  // Go offline
  await context.setOffline(true)

  // Verify offline indicator appears
  await expect(page.getByText('You are currently offline')).toBeVisible()

  // Verify actions are disabled
  const submitButton = page.getByRole('button', { name: 'Submit' })
  await expect(submitButton).toBeDisabled()

  // Go back online
  await context.setOffline(false)

  // Verify offline indicator disappears
  await expect(page.getByText('You are currently offline')).not.toBeVisible()

  // Verify actions are enabled
  await expect(submitButton).toBeEnabled()
})

test('retries failed requests', async ({ page, route }) => {
  // Simulate network failure
  let attempts = 0
  await route('/api/data', (route) => {
    attempts++
    if (attempts < 3) {
      route.abort('failed')
    } else {
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
    }
  })

  await page.goto('/data-page')
  await page.click('button:has-text("Load Data")')

  // Verify retry indicator appears
  await expect(page.getByText(/Retrying/i)).toBeVisible()

  // Wait for success after retries
  await expect(page.getByText('Data loaded successfully')).toBeVisible()
})
```

### Test Scenarios

- [ ] User goes offline mid-operation
- [ ] User comes back online (auto-reconnect)
- [ ] Network request times out
- [ ] Server returns 500 error
- [ ] Server returns 503 (service unavailable)
- [ ] Rapid offline/online toggles
- [ ] Form submission while offline
- [ ] Data fetching with retry
- [ ] Cached data fallback

---

## API Reference

### useOnlineStatus

```typescript
interface UseOnlineStatusOptions {
  onOnline?: () => void
  onOffline?: () => void
  debounceDelay?: number
}

interface UseOnlineStatusReturn {
  isOnline: boolean
  isOffline: boolean
  lastChanged: string | null
  checkStatus: () => boolean
}

function useOnlineStatus(options?: UseOnlineStatusOptions): UseOnlineStatusReturn
```

### useRetryState

```typescript
interface RetryConfig {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
}

interface UseRetryStateReturn {
  retryState: RetryState
  isRetrying: boolean
  statusMessage: string
  progress: number
  executeWithRetry: <T>(fn: () => Promise<T>, config?: RetryConfig) => Promise<T>
  reset: () => void
}

function useRetryState(maxRetries?: number): UseRetryStateReturn
```

### Error Logger Functions

```typescript
// Error classification
function isNetworkError(error: Error): boolean
function isOfflineError(error: Error): boolean
function isServerError(error: Error): boolean
function isTimeoutError(error: Error): boolean
function isAuthError(error: Error): boolean
function isValidationError(error: Error): boolean

// Error messaging
function getUserFriendlyMessage(error: Error): string
function getErrorCategory(error: Error): string
```

---

## Examples

See complete working examples in:
- `components/examples/connection-error-handling-example.tsx`

Run Storybook to view interactive examples:
```bash
npm run storybook
```

---

## Support

For questions or issues:
1. Check the examples directory
2. Review this documentation
3. Contact the development team

**Last Updated**: October 19, 2025
**Version**: 1.0.0
