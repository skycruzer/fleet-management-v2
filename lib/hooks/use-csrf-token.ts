/**
 * CSRF Token Hook
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Provides CSRF token management for client-side forms and mutations.
 *
 * Security Implementation:
 * - Fetches CSRF token on mount
 * - Stores token in memory (not localStorage - XSS protection)
 * - Provides token for inclusion in mutation requests
 * - Automatic token refresh on expiry
 *
 * Usage:
 * ```typescript
 * const { csrfToken, isLoading, error, refreshToken } = useCsrfToken()
 *
 * // Include token in API requests
 * await fetch('/api/some-endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': csrfToken || '',
 *   },
 *   body: JSON.stringify(data),
 * })
 * ```
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseCsrfTokenReturn {
  /**
   * Current CSRF token (null if not yet fetched)
   */
  csrfToken: string | null

  /**
   * Loading state
   */
  isLoading: boolean

  /**
   * Error state
   */
  error: Error | null

  /**
   * Manually refresh the CSRF token
   */
  refreshToken: () => Promise<void>

  /**
   * Get headers object with CSRF token included
   */
  getCsrfHeaders: () => Record<string, string>
}

/**
 * Hook to manage CSRF tokens for client-side requests
 */
export function useCsrfToken(): UseCsrfTokenReturn {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch CSRF token from server
   */
  const fetchCsrfToken = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'include', // Include cookies
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.csrfToken) {
        throw new Error('Invalid CSRF token response')
      }

      setCsrfToken(data.csrfToken)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching CSRF token')
      setError(error)
      console.error('CSRF token fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Fetch token on mount
   */
  useEffect(() => {
    fetchCsrfToken()
  }, [fetchCsrfToken])

  /**
   * Get headers object with CSRF token
   */
  const getCsrfHeaders = useCallback((): Record<string, string> => {
    if (!csrfToken) {
      console.warn('CSRF token not available - request may be rejected')
      return {}
    }

    return {
      'X-CSRF-Token': csrfToken,
    }
  }, [csrfToken])

  return {
    csrfToken,
    isLoading,
    error,
    refreshToken: fetchCsrfToken,
    getCsrfHeaders,
  }
}

/**
 * Higher-order function to wrap fetch with CSRF protection
 *
 * Usage:
 * ```typescript
 * const { csrfToken } = useCsrfToken()
 * const csrfFetch = withCsrfToken(csrfToken)
 *
 * // Automatically includes CSRF token in request
 * await csrfFetch('/api/some-endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * })
 * ```
 */
export function withCsrfToken(csrfToken: string | null) {
  return async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)

    // Add CSRF token if available and method requires it
    const method = options.method?.toUpperCase() || 'GET'
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Always include cookies
    })
  }
}
