/**
 * Cache Headers Middleware
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Provides HTTP caching strategies and utilities for API routes.
 * Implements Cache-Control headers, ETag generation, and conditional request handling.
 *
 * @version 1.0.0
 *
 * Usage:
 * ```typescript
 * import { CACHE_STRATEGIES, addCacheHeaders, withCacheHeaders } from '@/lib/middleware/cache-headers-middleware'
 *
 * // Option 1: Manual headers
 * export async function GET() {
 *   const data = await fetchData()
 *   return addCacheHeaders(
 *     NextResponse.json({ success: true, data }),
 *     CACHE_STRATEGIES.API_MEDIUM
 *   )
 * }
 *
 * // Option 2: Higher-order function
 * export const GET = withCacheHeaders(
 *   async (request) => {
 *     const data = await fetchData()
 *     return NextResponse.json({ success: true, data })
 *   },
 *   { strategy: 'API_MEDIUM', enableETag: true }
 * )
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Predefined cache control strategies
 */
export const CACHE_STRATEGIES = {
  /**
   * Static assets that never change (fonts, versioned JS/CSS)
   * Cache for 1 year, immutable
   */
  IMMUTABLE: 'public, max-age=31536000, immutable',

  /**
   * Short-lived API responses (dashboard metrics, real-time data)
   * Cache for 1 minute, serve stale for 5 minutes while revalidating
   */
  API_SHORT: 'public, max-age=60, stale-while-revalidate=300',

  /**
   * Medium-lived API responses (pilot stats, compliance data)
   * Cache for 5 minutes, serve stale for 10 minutes while revalidating
   */
  API_MEDIUM: 'public, max-age=300, stale-while-revalidate=600',

  /**
   * Long-lived API responses (reference data, check types)
   * Cache for 1 hour, serve stale for 2 hours while revalidating
   */
  API_LONG: 'public, max-age=3600, stale-while-revalidate=7200',

  /**
   * Very stable data (contract types, settings)
   * Cache for 2 hours, serve stale for 4 hours while revalidating
   */
  API_STABLE: 'public, max-age=7200, stale-while-revalidate=14400',

  /**
   * Private user-specific data (profile, session data)
   * No public caching, must revalidate
   */
  PRIVATE: 'private, max-age=0, must-revalidate',

  /**
   * Dynamic data that should never be cached
   */
  NO_CACHE: 'no-store, no-cache, must-revalidate',
} as const

export type CacheStrategy = keyof typeof CACHE_STRATEGIES

/**
 * Generate ETag from data
 * Uses MD5 hash for fast generation (suitable for cache validation)
 *
 * @param data - Any serializable data
 * @returns ETag string in quoted format
 */
export function generateETag(data: unknown): string {
  const hash = crypto.createHash('md5')
  hash.update(JSON.stringify(data))
  return `"${hash.digest('hex')}"`
}

/**
 * Add cache headers to a response
 *
 * @param response - NextResponse to modify
 * @param strategy - Cache strategy string or predefined key
 * @param options - Additional options
 * @returns Modified response with cache headers
 */
export function addCacheHeaders(
  response: NextResponse,
  strategy: string,
  options: {
    /** ETag value to add */
    etag?: string
    /** Last-Modified date */
    lastModified?: Date
    /** Vary header values */
    vary?: string[]
  } = {}
): NextResponse {
  const { etag, lastModified, vary } = options

  // Set Cache-Control
  response.headers.set('Cache-Control', strategy)

  // Set ETag if provided
  if (etag) {
    response.headers.set('ETag', etag)
  }

  // Set Last-Modified if provided
  if (lastModified) {
    response.headers.set('Last-Modified', lastModified.toUTCString())
  }

  // Set Vary header for proper cache key differentiation
  if (vary && vary.length > 0) {
    response.headers.set('Vary', vary.join(', '))
  }

  return response
}

/**
 * Handle conditional request (If-None-Match / If-Modified-Since)
 * Returns 304 Not Modified if conditions match
 *
 * @param request - Incoming request
 * @param currentETag - Current ETag of the resource
 * @param lastModified - Last modification date (optional)
 * @returns 304 response if not modified, null otherwise
 */
export function handleConditionalRequest(
  request: NextRequest,
  currentETag?: string,
  lastModified?: Date
): NextResponse | null {
  // Check If-None-Match header (ETag validation)
  const ifNoneMatch = request.headers.get('If-None-Match')
  if (ifNoneMatch && currentETag) {
    // Handle multiple ETags (comma-separated)
    const clientETags = ifNoneMatch.split(',').map((tag) => tag.trim())

    // Check for match (including weak comparison)
    const matches = clientETags.some((clientTag) => {
      const normalizedClient = clientTag.replace(/^W\//, '')
      const normalizedCurrent = currentETag.replace(/^W\//, '')
      return normalizedClient === normalizedCurrent || clientTag === '*'
    })

    if (matches) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: currentETag,
          'Cache-Control': CACHE_STRATEGIES.API_MEDIUM,
        },
      })
    }
  }

  // Check If-Modified-Since header (date validation)
  const ifModifiedSince = request.headers.get('If-Modified-Since')
  if (ifModifiedSince && lastModified) {
    const clientDate = new Date(ifModifiedSince)
    if (!isNaN(clientDate.getTime()) && lastModified <= clientDate) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Last-Modified': lastModified.toUTCString(),
          'Cache-Control': CACHE_STRATEGIES.API_MEDIUM,
        },
      })
    }
  }

  return null
}

export default {
  CACHE_STRATEGIES,
  generateETag,
  addCacheHeaders,
  handleConditionalRequest,
}
