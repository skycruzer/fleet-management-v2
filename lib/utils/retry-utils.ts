/**
 * Retry Logic Utility for Failed Network Requests
 *
 * Implements exponential backoff retry strategy for transient failures.
 * Complies with TODO 046: Add retry logic for failed requests
 *
 * Features:
 * - Automatic retry for network errors and 5xx responses
 * - Exponential backoff with jitter
 * - Configurable retry limits and timeouts
 * - User-facing retry status notifications
 * - No retry for 4xx client errors
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

import { logError, logWarning, logInfo, ErrorSeverity } from '@/lib/error-logger'

// ===================================
// TYPES & INTERFACES
// ===================================

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number
  /** Backoff multiplier (default: 2 for exponential) */
  backoffMultiplier?: number
  /** Add jitter to prevent thundering herd (default: true) */
  useJitter?: boolean
  /** Timeout for each attempt in milliseconds (default: 30000) */
  timeoutMs?: number
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean
  /** Callback for retry status updates */
  onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
  /** Callback for final failure */
  onFinalFailure?: (error: Error, attempts: number) => void
}

/**
 * Retry state for tracking
 */
export interface RetryState {
  attempt: number
  maxRetries: number
  nextDelayMs: number
  isRetrying: boolean
  lastError: Error | null
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'onRetry' | 'onFinalFailure'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  useJitter: true,
  timeoutMs: 30000,
  isRetryable: isRetryableError,
}

// ===================================
// ERROR CLASSIFICATION
// ===================================

/**
 * Check if error is a network error (should retry)
 */
export function isNetworkError(error: Error): boolean {
  const networkErrorPatterns = [
    'fetch',
    'network',
    'Failed to fetch',
    'NetworkError',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'Network request failed',
  ]

  return networkErrorPatterns.some((pattern) =>
    error.message.toLowerCase().includes(pattern.toLowerCase())
  )
}

/**
 * Check if error is a 5xx server error (should retry)
 */
export function isServerError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // Check for HTTP 5xx status codes
  const serverErrorCodes = ['500', '502', '503', '504', '505', '507', '508', '509', '510', '511']

  return serverErrorCodes.some(
    (code) =>
      message.includes(code) ||
      message.includes(`status ${code}`) ||
      message.includes(`status code ${code}`)
  )
}

/**
 * Check if error is a 4xx client error (should NOT retry)
 */
export function isClientError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // Check for HTTP 4xx status codes
  const clientErrorCodes = ['400', '401', '403', '404', '405', '406', '407', '408', '409', '410']

  return clientErrorCodes.some(
    (code) =>
      message.includes(code) ||
      message.includes(`status ${code}`) ||
      message.includes(`status code ${code}`)
  )
}

/**
 * Check if error is a timeout error (should retry)
 */
export function isTimeoutError(error: Error): boolean {
  const timeoutPatterns = ['timeout', 'timed out', 'ETIMEDOUT']

  return timeoutPatterns.some((pattern) =>
    error.message.toLowerCase().includes(pattern.toLowerCase())
  )
}

/**
 * Default retry predicate - determines if error should trigger retry
 */
export function isRetryableError(error: Error): boolean {
  // Always retry network errors, timeouts, and 5xx errors
  if (isNetworkError(error) || isTimeoutError(error) || isServerError(error)) {
    return true
  }

  // Never retry 4xx client errors (bad request, unauthorized, etc.)
  if (isClientError(error)) {
    return false
  }

  // Default: don't retry unknown errors
  return false
}

// ===================================
// BACKOFF CALCULATION
// ===================================

/**
 * Calculate delay with exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Required<Omit<RetryConfig, 'onRetry' | 'onFinalFailure' | 'isRetryable'>>
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt)

  // Cap at maximum delay
  let delay = Math.min(exponentialDelay, config.maxDelayMs)

  // Add jitter to prevent thundering herd problem
  if (config.useJitter) {
    // Random jitter: 0-25% of the delay
    const jitter = Math.random() * 0.25 * delay
    delay = delay + jitter
  }

  return Math.floor(delay)
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ===================================
// RETRY WRAPPER
// ===================================

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   async () => fetchDataFromAPI(),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, max, delay) => {
 *       console.log(`Retry ${attempt}/${max} in ${delay}ms`)
 *     }
 *   }
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  // Merge with default config
  const mergedConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      // Create timeout wrapper
      const result = await withTimeout(fn(), mergedConfig.timeoutMs)

      // Success - log if it was a retry
      if (attempt > 0) {
        logInfo('Request succeeded after retry', {
          source: 'RetryUtils',
          metadata: {
            operation: 'retryWithBackoff',
            attempt,
            maxRetries: mergedConfig.maxRetries,
          },
        })
      }

      return result
    } catch (error) {
      lastError = error as Error

      // Check if we should retry
      const shouldRetry = mergedConfig.isRetryable
        ? mergedConfig.isRetryable(lastError)
        : isRetryableError(lastError)

      // Last attempt or non-retryable error
      if (attempt >= mergedConfig.maxRetries || !shouldRetry) {
        // Log final failure
        logError(lastError, {
          source: 'RetryUtils',
          severity: ErrorSeverity.HIGH,
          metadata: {
            operation: 'retryWithBackoff',
            attempts: attempt + 1,
            maxRetries: mergedConfig.maxRetries,
            retryable: shouldRetry,
            errorType: getErrorType(lastError),
          },
          tags: ['retry-failed', 'network-error'],
        })

        // Call failure callback
        if (config.onFinalFailure) {
          config.onFinalFailure(lastError, attempt + 1)
        }

        throw lastError
      }

      // Calculate delay for next attempt
      const delayMs = calculateBackoffDelay(attempt, mergedConfig)

      // Log retry attempt
      logWarning('Request failed, retrying', {
        source: 'RetryUtils',
        metadata: {
          operation: 'retryWithBackoff',
          attempt: attempt + 1,
          maxRetries: mergedConfig.maxRetries,
          delayMs,
          errorMessage: lastError.message,
          errorType: getErrorType(lastError),
        },
        tags: ['retry-attempt', 'network-error'],
      })

      // Call retry callback
      if (config.onRetry) {
        config.onRetry(attempt + 1, mergedConfig.maxRetries, delayMs, lastError)
      }

      // Wait before retrying
      await sleep(delayMs)
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Retry failed with unknown error')
}

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Get human-readable error type
 */
function getErrorType(error: Error): string {
  if (isNetworkError(error)) return 'network'
  if (isServerError(error)) return 'server-5xx'
  if (isClientError(error)) return 'client-4xx'
  if (isTimeoutError(error)) return 'timeout'
  return 'unknown'
}

// ===================================
// RETRY WITH STATE TRACKING
// ===================================

/**
 * Create a retry state tracker
 */
export function createRetryState(maxRetries: number = 3): RetryState {
  return {
    attempt: 0,
    maxRetries,
    nextDelayMs: 0,
    isRetrying: false,
    lastError: null,
  }
}

/**
 * Retry with state tracking (useful for UI feedback)
 *
 * @example
 * ```typescript
 * const state = createRetryState(3)
 * const data = await retryWithState(
 *   async () => fetchData(),
 *   state,
 *   (currentState) => {
 *     console.log(`Retrying ${currentState.attempt}/${currentState.maxRetries}`)
 *   }
 * )
 * ```
 */
export async function retryWithState<T>(
  fn: () => Promise<T>,
  state: RetryState,
  onStateChange?: (state: RetryState) => void,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig = {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: state.maxRetries,
    ...config,
  }

  return retryWithBackoff(fn, {
    ...mergedConfig,
    onRetry: (attempt, maxRetries, delayMs, error) => {
      state.attempt = attempt
      state.isRetrying = true
      state.nextDelayMs = delayMs
      state.lastError = error

      if (onStateChange) {
        onStateChange({ ...state })
      }

      if (config.onRetry) {
        config.onRetry(attempt, maxRetries, delayMs, error)
      }
    },
    onFinalFailure: (error, attempts) => {
      state.isRetrying = false
      state.lastError = error
      state.attempt = attempts

      if (onStateChange) {
        onStateChange({ ...state })
      }

      if (config.onFinalFailure) {
        config.onFinalFailure(error, attempts)
      }
    },
  })
}

// ===================================
// FETCH WITH RETRY
// ===================================

/**
 * Fetch with automatic retry logic
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/pilots', {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer token' }
 * })
 * const data = await response.json()
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  config?: RetryConfig
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options)

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'}`)
      }

      return response
    },
    {
      ...config,
      isRetryable: (error) => {
        // Custom retry logic for fetch
        const shouldRetry = isRetryableError(error)

        // Override with custom predicate if provided
        if (config?.isRetryable) {
          return config.isRetryable(error)
        }

        return shouldRetry
      },
    }
  )
}

// ===================================
// USER-FACING STATUS MESSAGES
// ===================================

/**
 * Generate user-friendly retry status message
 */
export function getRetryStatusMessage(state: RetryState): string {
  if (!state.isRetrying) {
    if (state.lastError) {
      return 'Request failed. Please try again.'
    }
    return ''
  }

  const attemptsLeft = state.maxRetries - state.attempt
  const seconds = Math.ceil(state.nextDelayMs / 1000)

  if (attemptsLeft === 0) {
    return `Retrying... (last attempt)`
  }

  return `Connection issue. Retrying in ${seconds}s... (${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} left)`
}

/**
 * Get retry progress percentage
 */
export function getRetryProgress(state: RetryState): number {
  if (state.maxRetries === 0) return 100
  return Math.floor((state.attempt / state.maxRetries) * 100)
}
