---
status: completed
priority: p2
issue_id: '048'
tags: [error-handling, resilience, offline]
dependencies: []
completed_date: 2025-10-19
---

# Add Connection Error Handling

## Problem Statement

App shows generic errors for network failures without distinguishing offline vs server errors. Users don't know if issue is on their end or server.

## Findings

- **Severity**: 🟡 P2 (IMPORTANT)
- **Impact**: Poor error messages, user confusion
- **Agent**: architecture-strategist

## Proposed Solution

Detect connection status, show appropriate messages for offline/network errors.

## Acceptance Criteria

- [x] Detect offline status
- [x] Show "You are offline" message
- [x] Retry when connection restored

## Implementation Summary

### Files Created

1. **`lib/hooks/use-online-status.ts`** (270 lines)
   - `useOnlineStatus()` - Monitor online/offline with callbacks
   - `useIsOffline()` - Shorthand for offline state
   - `useIsOnline()` - Shorthand for online state
   - `useOnlineStatusWithReconnect()` - Auto-reconnect support

2. **`components/ui/network-status-indicator.tsx`** (361 lines)
   - `NetworkStatusIndicator` - Visual status indicators (4 variants)
   - `OfflineWarning` - Yellow warning banner
   - `NetworkStatusBadge` - Compact status badge

3. **`components/examples/connection-error-handling-example.tsx`** (310 lines)
   - Complete working examples demonstrating all features
   - Forms, data fetching, auto-reconnect patterns

4. **`lib/docs/CONNECTION-ERROR-HANDLING.md`** (600+ lines)
   - Comprehensive guide with examples and API reference
   - Testing strategies and best practices

5. **`components/ui/network-status-indicator.stories.tsx`** (400+ lines)
   - Interactive Storybook stories for all components

### Files Enhanced

1. **`lib/error-logger.ts`**
   - Added `isOfflineError()` - Detect offline-specific errors
   - Added `isServerError()` - Detect 5xx server errors
   - Added `isTimeoutError()` - Detect timeout errors
   - Enhanced `getUserFriendlyMessage()` - Context-aware messages
   - Added `getErrorCategory()` - Error categorization

2. **`lib/hooks/README.md`**
   - Added "Network & Connection Hooks" section
   - Complete usage examples and API documentation

### Key Features Implemented

1. **Offline Detection**
   - Real-time monitoring via Navigator.onLine API
   - Browser online/offline event listeners
   - Debouncing support for rapid changes
   - SSR-safe implementation

2. **Network Status Indicators**
   - Banner variant (full-width alert)
   - Badge variant (compact pill)
   - Inline variant (minimal text)
   - Floating variant (toast-like)
   - Auto-hide when online (configurable)

3. **Retry & Reconnection**
   - Manual reconnect button
   - Auto-reconnect when coming back online
   - Visual reconnection feedback
   - Integration with retry system

4. **Error Classification**
   - Offline errors vs network errors
   - Server errors (5xx) vs client errors (4xx)
   - Timeout errors vs connection failures
   - User-friendly, context-aware messages

5. **User Feedback**
   - Progressive disclosure (inline → banner → error)
   - Clear, actionable error messages
   - Retry indicators during reconnection
   - Disabled state for actions requiring connectivity

### Usage Example

```typescript
import { useOnlineStatus } from '@/lib/hooks/use-online-status'
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator'

function MyForm() {
  const { isOnline, isOffline } = useOnlineStatus({
    onOffline: () => toast.error('Connection lost'),
    onOnline: () => toast.success('Back online'),
  })

  return (
    <div>
      <NetworkStatusIndicator
        isOnline={isOnline}
        variant="banner"
        showOnlyWhenOffline={true}
        showReconnectButton={true}
        onReconnect={handleReconnect}
      />
      <button disabled={isOffline}>Submit</button>
    </div>
  )
}
```

## Work Log

### 2025-10-19 - Implementation Complete

**By:** Claude Code

**Changes:**

- Created offline detection hooks with callbacks
- Implemented 4 network status indicator variants
- Enhanced error logger with better error classification
- Added comprehensive documentation and examples
- Created Storybook stories for interactive testing

### 2025-10-19 - Initial Discovery

**By:** architecture-strategist

## Testing

Manual testing:

1. Chrome DevTools → Network → Offline mode
2. Toggle offline/online to verify indicators
3. Test form submissions while offline
4. Verify auto-reconnect behavior

Automated testing:

- See `lib/docs/CONNECTION-ERROR-HANDLING.md` for Playwright examples

## Notes

**Source**: Error Handling Review
**Documentation**: See `lib/docs/CONNECTION-ERROR-HANDLING.md`
**Examples**: See `components/examples/connection-error-handling-example.tsx`
**Storybook**: Run `npm run storybook` to view interactive examples
