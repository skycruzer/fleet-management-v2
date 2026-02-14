/**
 * Request Deduplication Utility
 *
 * Provides mechanisms to prevent duplicate API requests from being executed simultaneously.
 * This is useful for scenarios where TanStack Query's built-in deduplication doesn't apply
 * (e.g., manual fetch calls, form submissions, etc.).
 *
 * Features:
 * - In-flight request tracking
 * - Request key-based deduplication
 * - Automatic cleanup of completed requests
 * - Promise sharing for concurrent identical requests
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

/**
 * Type for a pending request entry
 */
interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

/**
 * Request Deduplication Manager
 *
 * Singleton class that manages in-flight requests and prevents duplicates.
 * All callers requesting the same resource will receive the same promise.
 */
class RequestDeduplicationManager {
  private pendingRequests: Map<string, PendingRequest<unknown>> = new Map()
  private readonly REQUEST_TIMEOUT = 30000 // 30 seconds

  /**
   * Execute a request with deduplication
   *
   * If an identical request is already in-flight, returns the existing promise.
   * Otherwise, executes the request and caches the promise.
   *
   * @param key - Unique identifier for the request (e.g., "GET:/api/pilots?role=Captain")
   * @param requestFn - Function that executes the actual request
   * @returns Promise that resolves to the request result
   *
   * @example
   * ```typescript
   * const pilots = await requestDeduplicator.deduplicate(
   *   'GET:/api/pilots',
   *   () => fetch('/api/pilots').then(r => r.json())
   * )
   * ```
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already in-flight
    const existing = this.pendingRequests.get(key)

    if (existing) {
      // Check if request has timed out
      if (Date.now() - existing.timestamp > this.REQUEST_TIMEOUT) {
        // Request timed out, remove it and create new one
        this.pendingRequests.delete(key)
      } else {
        // Return existing promise
        return existing.promise as Promise<T>
      }
    }

    // Create new request
    const promise = requestFn()
      .then((result) => {
        // Clean up completed request
        this.pendingRequests.delete(key)
        return result
      })
      .catch((error) => {
        // Clean up failed request
        this.pendingRequests.delete(key)
        throw error
      })

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    })

    return promise
  }

  /**
   * Clear all pending requests
   * Useful for testing or manual cleanup
   */
  clear(): void {
    this.pendingRequests.clear()
  }

  /**
   * Get count of pending requests
   * Useful for debugging and monitoring
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }

  /**
   * Check if a specific request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key)
  }

  /**
   * Clear stale requests that have exceeded the timeout
   */
  clearStaleRequests(): void {
    const now = Date.now()
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        this.pendingRequests.delete(key)
      }
    }
  }
}

/**
 * Global request deduplication instance
 * Use this singleton throughout your application
 */
export const requestDeduplicator = new RequestDeduplicationManager()

/**
 * Helper function to generate request keys
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - Request URL
 * @param params - Optional query parameters or request body
 * @returns Unique request key
 *
 * @example
 * ```typescript
 * const key = generateRequestKey('GET', '/api/pilots', { role: 'Captain' })
 * // Returns: "GET:/api/pilots?role=Captain"
 * ```
 */
export function generateRequestKey(
  method: string,
  url: string,
  params?: Record<string, unknown>
): string {
  let key = `${method}:${url}`

  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join('&')
    key += `?${sortedParams}`
  }

  return key
}

/**
 * Debounced fetch wrapper with deduplication
 *
 * Wraps the native fetch API with automatic deduplication.
 * Identical requests made simultaneously will share the same promise.
 *
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Promise that resolves to the Response
 *
 * @example
 * ```typescript
 * const response = await deduplicatedFetch('/api/pilots')
 * const data = await response.json()
 * ```
 */
export async function deduplicatedFetch(url: string, options?: RequestInit): Promise<Response> {
  const method = options?.method || 'GET'
  let parsedBody: Record<string, unknown> | undefined
  if (options?.body) {
    try {
      parsedBody = JSON.parse(options.body as string)
    } catch {
      console.error(
        'Failed to parse request body JSON:',
        (options.body as string)?.substring(0, 100)
      )
      parsedBody = { _raw: options.body as string }
    }
  }
  const key = generateRequestKey(method, url, parsedBody)

  return requestDeduplicator.deduplicate(key, () => fetch(url, options))
}

/**
 * Hook for form submission deduplication
 * Returns a wrapped submit handler that prevents duplicate submissions
 *
 * @param submitFn - Original submit function
 * @param key - Unique key for this form (e.g., "pilot-form", "leave-request-form")
 * @returns Deduplicated submit function and loading state
 *
 * @example
 * ```typescript
 * const { handleSubmit, isSubmitting } = useDeduplicatedSubmit(
 *   async (data) => {
 *     await fetch('/api/pilots', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     })
 *   },
 *   'pilot-form'
 * )
 * ```
 */
export function createDeduplicatedSubmitHandler<T>(
  submitFn: (data: T) => Promise<void>,
  key: string
): (data: T) => Promise<void> {
  return async (data: T) => {
    return requestDeduplicator.deduplicate(`submit:${key}`, () => submitFn(data))
  }
}

/**
 * Cleanup interval for stale requests
 * Automatically clears requests that have exceeded the timeout
 */
if (typeof window !== 'undefined') {
  // Run cleanup every minute in the browser
  setInterval(() => {
    requestDeduplicator.clearStaleRequests()
  }, 60000)
}
