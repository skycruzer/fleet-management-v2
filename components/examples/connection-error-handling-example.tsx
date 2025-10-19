/**
 * Connection Error Handling Example
 *
 * Comprehensive example demonstrating proper offline/network failure handling.
 * Shows integration of online status detection, retry logic, and user feedback.
 *
 * Features demonstrated:
 * - Online/offline status detection
 * - Automatic retry with visual feedback
 * - Network status indicators
 * - Graceful degradation
 * - Reconnection handling
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import * as React from 'react'
import { useState } from 'react'
import { useOnlineStatus } from '@/lib/hooks/use-online-status'
import { useRetryState } from '@/lib/hooks/use-retry-state'
import { NetworkStatusIndicator, OfflineWarning } from '@/components/ui/network-status-indicator'
import { RetryIndicator, NetworkErrorBanner } from '@/components/ui/retry-indicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isNetworkError } from '@/lib/error-logger'

// ===================================
// EXAMPLE 1: BASIC OFFLINE DETECTION
// ===================================

/**
 * Simple component with offline detection
 */
export function BasicOfflineExample() {
  const { isOnline, isOffline } = useOnlineStatus({
    onOffline: () => {
      console.log('Connection lost!')
    },
    onOnline: () => {
      console.log('Connection restored!')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Offline Detection</CardTitle>
        <CardDescription>Shows current network status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show banner when offline */}
        <NetworkStatusIndicator
          isOnline={isOnline}
          variant="banner"
          showOnlyWhenOffline={true}
        />

        {/* Disable actions when offline */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Status: <strong>{isOnline ? 'Online' : 'Offline'}</strong>
          </p>
          <Button disabled={isOffline}>Submit Data</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ===================================
// EXAMPLE 2: RETRY WITH OFFLINE DETECTION
// ===================================

/**
 * Component with retry logic and offline detection
 */
export function RetryWithOfflineExample() {
  const { isOnline } = useOnlineStatus()
  const { executeWithRetry, isRetrying, statusMessage, progress, retryState } = useRetryState(3)
  const [data, setData] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setError(null)
    setData(null)

    try {
      const result = await executeWithRetry(
        async () => {
          const response = await fetch('/api/pilots')
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          return response.json()
        },
        {
          maxRetries: 3,
          retryDelay: 1000,
          backoffMultiplier: 2,
        }
      )

      setData(result)
    } catch (err) {
      setError(err as Error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retry with Offline Detection</CardTitle>
        <CardDescription>Automatic retry with network awareness</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Offline warning */}
        <OfflineWarning show={!isOnline} />

        {/* Retry indicator */}
        {isRetrying && (
          <RetryIndicator
            isRetrying={isRetrying}
            statusMessage={statusMessage}
            progress={progress}
            attempt={retryState.attempt}
            maxRetries={retryState.maxRetries}
          />
        )}

        {/* Error banner */}
        {error && !isRetrying && (
          <NetworkErrorBanner
            show={true}
            message={
              isNetworkError(error)
                ? 'Network error. Check your connection and try again.'
                : error.message
            }
            onRetry={fetchData}
          />
        )}

        {/* Data display */}
        {data && <div className="text-sm text-green-600">Data loaded successfully!</div>}

        {/* Action button */}
        <Button onClick={fetchData} disabled={!isOnline || isRetrying}>
          {isRetrying ? 'Loading...' : 'Fetch Data'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ===================================
// EXAMPLE 3: AUTO-RECONNECT
// ===================================

/**
 * Component with automatic reconnection when coming back online
 */
export function AutoReconnectExample() {
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { isOnline } = useOnlineStatus({
    onOnline: async () => {
      // Auto-reconnect: refresh data when coming back online
      console.log('Back online! Refreshing data...')
      await refreshData()
    },
  })

  const refreshData = async () => {
    setIsLoading(true)
    try {
      // Simulate data fetch
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setLastFetch(new Date().toISOString())
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Reconnect</CardTitle>
        <CardDescription>Automatically refreshes data when reconnecting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Floating status indicator */}
        <NetworkStatusIndicator
          isOnline={isOnline}
          variant="floating"
          position="top"
          showOnlyWhenOffline={true}
          showReconnectButton={true}
          onReconnect={refreshData}
          isReconnecting={isLoading}
        />

        <div className="space-y-2">
          {lastFetch && (
            <p className="text-sm text-muted-foreground">
              Last refreshed: {new Date(lastFetch).toLocaleTimeString()}
            </p>
          )}
          {isLoading && <p className="text-sm text-blue-600">Refreshing data...</p>}
        </div>

        <Button onClick={refreshData} disabled={!isOnline || isLoading}>
          Manual Refresh
        </Button>
      </CardContent>
    </Card>
  )
}

// ===================================
// EXAMPLE 4: COMPREHENSIVE FORM
// ===================================

/**
 * Form with complete connection error handling
 */
export function FormWithConnectionHandling() {
  const { isOnline, isOffline } = useOnlineStatus()
  const { executeWithRetry, isRetrying, statusMessage, progress, retryState } = useRetryState(3)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Don't allow submission when offline
    if (isOffline) {
      setError(new Error('Cannot submit while offline'))
      return
    }

    setError(null)
    setSubmitted(false)

    try {
      await executeWithRetry(
        async () => {
          const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: 'example' }),
          })

          if (!response.ok) {
            throw new Error(`Submission failed: ${response.statusText}`)
          }

          return response.json()
        },
        {
          maxRetries: 3,
          retryDelay: 2000,
          backoffMultiplier: 1.5,
        }
      )

      setSubmitted(true)
    } catch (err) {
      setError(err as Error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form with Connection Handling</CardTitle>
        <CardDescription>Complete example with all error handling features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network status banner */}
        <NetworkStatusIndicator isOnline={isOnline} variant="banner" showOnlyWhenOffline={true} />

        {/* Retry indicator */}
        {isRetrying && (
          <RetryIndicator
            isRetrying={isRetrying}
            statusMessage={statusMessage}
            progress={progress}
            attempt={retryState.attempt}
            maxRetries={retryState.maxRetries}
            variant="default"
          />
        )}

        {/* Error display */}
        {error && !isRetrying && (
          <NetworkErrorBanner
            show={true}
            message={error.message}
            onRetry={() => {
              setError(null)
              // Retry submission (would need to store form data)
            }}
          />
        )}

        {/* Success message */}
        {submitted && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Form submitted successfully!
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Offline warning in form */}
          {isOffline && (
            <OfflineWarning message="You must be online to submit this form." show={true} />
          )}

          {/* Form fields would go here */}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Form fields would appear here...</p>
          </div>

          {/* Submit button */}
          <Button type="submit" disabled={isOffline || isRetrying}>
            {isRetrying ? 'Submitting...' : 'Submit Form'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ===================================
// COMPLETE DEMO PAGE
// ===================================

/**
 * Demo page showing all connection error handling examples
 */
export function ConnectionErrorHandlingDemo() {
  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Connection Error Handling Examples</h1>
        <p className="text-muted-foreground">
          Comprehensive examples of offline detection and network error handling
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BasicOfflineExample />
        <RetryWithOfflineExample />
        <AutoReconnectExample />
        <FormWithConnectionHandling />
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <h2 className="mb-2 text-lg font-semibold">Testing Tips</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Open DevTools → Network tab → Toggle "Offline" to simulate network failure</li>
          <li>• Watch how components handle offline state and retry logic</li>
          <li>• Toggle back to "Online" to see reconnection behavior</li>
          <li>• Check console for offline/online event logs</li>
        </ul>
      </div>
    </div>
  )
}
