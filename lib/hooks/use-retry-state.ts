/**
 * React Hook for Retry State Management
 *
 * Provides UI components with retry state tracking and status messages.
 * Shows retry progress to users for better UX during network failures.
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  retryWithState,
  createRetryState,
  getRetryStatusMessage,
  getRetryProgress,
  type RetryState,
  type RetryConfig,
} from '@/lib/utils/retry-utils'

// ===================================
// TYPES
// ===================================

export interface UseRetryStateReturn {
  /** Current retry state */
  retryState: RetryState
  /** Whether a retry is in progress */
  isRetrying: boolean
  /** User-friendly status message */
  statusMessage: string
  /** Retry progress (0-100%) */
  progress: number
  /** Execute function with retry */
  executeWithRetry: <T>(fn: () => Promise<T>, config?: RetryConfig) => Promise<T>
  /** Reset retry state */
  reset: () => void
}

// ===================================
// HOOK
// ===================================

/**
 * Hook for managing retry state in React components
 *
 * @example
 * ```tsx
 * function PilotList() {
 *   const { executeWithRetry, isRetrying, statusMessage, progress } = useRetryState()
 *
 *   const fetchPilots = async () => {
 *     try {
 *       const data = await executeWithRetry(
 *         async () => {
 *           const response = await fetch('/api/pilots')
 *           if (!response.ok) throw new Error('Failed to fetch')
 *           return response.json()
 *         },
 *         { maxRetries: 3 }
 *       )
 *       setPilots(data)
 *     } catch (error) {
 *       console.error('Failed after retries:', error)
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       {isRetrying && (
 *         <div>
 *           <p>{statusMessage}</p>
 *           <ProgressBar value={progress} />
 *         </div>
 *       )}
 *       <button onClick={fetchPilots}>Load Pilots</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRetryState(maxRetries: number = 3): UseRetryStateReturn {
  const [retryState, setRetryState] = useState<RetryState>(() => createRetryState(maxRetries))
  const stateRef = useRef(retryState)

  // Keep ref in sync - must be in useEffect, not during render
  useEffect(() => {
    stateRef.current = retryState
  }, [retryState])

  /**
   * Execute function with retry and state tracking
   */
  const executeWithRetry = useCallback(
    async <T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T> => {
      // Create fresh state for this execution
      const executionState = createRetryState(config?.maxRetries || maxRetries)
      setRetryState(executionState)

      try {
        const result = await retryWithState(
          fn,
          executionState,
          (newState) => {
            setRetryState({ ...newState })
          },
          config
        )

        // Reset state on success
        setRetryState(createRetryState(maxRetries))

        return result
      } catch (error) {
        // Keep error state visible
        throw error
      }
    },
    [maxRetries]
  )

  /**
   * Reset retry state
   */
  const reset = useCallback(() => {
    setRetryState(createRetryState(maxRetries))
  }, [maxRetries])

  // Derived state
  const isRetrying = retryState.isRetrying
  const statusMessage = getRetryStatusMessage(retryState)
  const progress = getRetryProgress(retryState)

  return {
    retryState,
    isRetrying,
    statusMessage,
    progress,
    executeWithRetry,
    reset,
  }
}

// ===================================
// SIMPLIFIED HOOKS
// ===================================

/**
 * Simplified hook for basic retry without state tracking
 *
 * @example
 * ```tsx
 * const { execute, isLoading, error } = useRetry()
 *
 * const loadData = () => execute(async () => {
 *   const res = await fetch('/api/data')
 *   return res.json()
 * })
 * ```
 */
export function useRetry(config?: RetryConfig) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { executeWithRetry, isRetrying, statusMessage, progress } = useRetryState(
    config?.maxRetries
  )

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await executeWithRetry(fn, config)
        setIsLoading(false)
        return result
      } catch (err) {
        setError(err as Error)
        setIsLoading(false)
        return null
      }
    },
    [executeWithRetry, config]
  )

  return {
    execute,
    isLoading: isLoading || isRetrying,
    isRetrying,
    error,
    statusMessage,
    progress,
  }
}
