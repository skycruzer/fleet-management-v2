/**
 * Cache Headers Utility
 * Developer: Maurice Rondeau
 *
 * Provides HTTP Cache-Control headers for API responses.
 * Enables browser and CDN caching to reduce server load.
 *
 * @version 1.0.0
 * @since 2026-01
 */

/**
 * Cache visibility options
 * - public: Can be cached by browsers and CDNs (appropriate for non-user-specific data)
 * - private: Can only be cached by the user's browser (for user-specific data)
 */
type CacheVisibility = 'public' | 'private'

/**
 * Cache header options
 */
interface CacheHeaderOptions {
  /** Time in seconds for browser caching (max-age) */
  maxAge: number
  /** Time in seconds for CDN/proxy caching (s-maxage). Defaults to maxAge * 2 */
  sMaxAge?: number
  /** Cache visibility: 'public' for shared, 'private' for user-specific */
  visibility: CacheVisibility
  /** Whether to add stale-while-revalidate directive */
  staleWhileRevalidate?: number
  /** Additional Vary headers (Authorization is always included for private caches) */
  vary?: string[]
}

/**
 * Generate Cache-Control headers for HTTP responses
 *
 * @param options - Cache configuration options
 * @returns Headers object to spread into NextResponse
 *
 * @example
 * // For reference data (public, 2 hour cache)
 * return NextResponse.json(data, {
 *   headers: getCacheHeaders({ maxAge: 7200, visibility: 'public' })
 * })
 *
 * @example
 * // For authenticated user data (private, 5 minute cache)
 * return NextResponse.json(data, {
 *   headers: getCacheHeaders({ maxAge: 300, visibility: 'private' })
 * })
 */
export function getCacheHeaders(options: CacheHeaderOptions): Record<string, string> {
  const { maxAge, sMaxAge, visibility, staleWhileRevalidate, vary = [] } = options

  // Build Cache-Control directives
  const directives: string[] = [visibility, `max-age=${maxAge}`]

  // Add s-maxage for CDN caching (only for public resources)
  if (visibility === 'public') {
    const cdnMaxAge = sMaxAge ?? maxAge * 2
    directives.push(`s-maxage=${cdnMaxAge}`)
  }

  // Add stale-while-revalidate if specified
  if (staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  }

  // Build Vary header
  const varyHeaders = ['Accept-Encoding']
  if (visibility === 'private') {
    varyHeaders.push('Authorization')
  }
  varyHeaders.push(...vary)

  return {
    'Cache-Control': directives.join(', '),
    Vary: varyHeaders.join(', '),
  }
}

/**
 * Get no-cache headers for mutation endpoints
 * Use this for POST, PUT, PATCH, DELETE endpoints
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }
}

// ============================================
// Pre-configured cache header presets
// ============================================

/**
 * Cache presets for common scenarios
 */
export const CACHE_PRESETS = {
  /**
   * Reference data that rarely changes (check types, contract types, settings)
   * Public, 2 hour browser cache, 4 hour CDN cache
   */
  REFERENCE_DATA: {
    maxAge: 2 * 60 * 60, // 2 hours
    visibility: 'public' as const,
    staleWhileRevalidate: 60 * 60, // 1 hour
  },

  /**
   * List data for authenticated users (pilots, certifications)
   * Private, 5 minute browser cache
   */
  LIST_DATA: {
    maxAge: 5 * 60, // 5 minutes
    visibility: 'private' as const,
    staleWhileRevalidate: 60, // 1 minute
  },

  /**
   * Dashboard/analytics data (frequently updated)
   * Private, 1 minute browser cache
   */
  DASHBOARD_DATA: {
    maxAge: 60, // 1 minute
    visibility: 'private' as const,
    staleWhileRevalidate: 30, // 30 seconds
  },

  /**
   * Real-time data that needs fresh responses
   * Private, no browser cache, but allows stale-while-revalidate
   */
  REAL_TIME: {
    maxAge: 0,
    visibility: 'private' as const,
    staleWhileRevalidate: 10, // 10 seconds
  },
} as const

/**
 * Get cache headers using a preset
 *
 * @param preset - One of the CACHE_PRESETS keys
 * @returns Headers object to spread into NextResponse
 *
 * @example
 * return NextResponse.json(data, {
 *   headers: getCacheHeadersPreset('REFERENCE_DATA')
 * })
 */
export function getCacheHeadersPreset(preset: keyof typeof CACHE_PRESETS): Record<string, string> {
  return getCacheHeaders(CACHE_PRESETS[preset])
}
