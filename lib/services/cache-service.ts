/**
 * @fileoverview Cache Service for Fleet Management System v2
 * Provides in-memory caching for frequently accessed static data to improve performance.
 * Implements TTL-based cache invalidation and refresh strategies for optimal balance
 * between performance and data freshness.
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { logError, logInfo, logWarning, ErrorSeverity } from '@/lib/error-logger'

/**
 * Helper function to get appropriate Supabase client
 * Server-side: Use server client (bypasses RLS with service role key)
 * Client-side: Use regular client (RLS enforced)
 */
async function getSupabaseClient() {
  // Always use server client for service layer
  return await createClient()
}

/**
 * Interface for cached data entry with timestamp tracking
 * @interface CacheEntry
 * @template T - Type of the cached data
 * @property {T} data - The cached data
 * @property {number} timestamp - When the data was cached (Unix timestamp)
 * @property {number} ttl - Time-to-live in milliseconds
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Cache configuration constants
 * TTL values optimized for data change frequency patterns
 */
const CACHE_CONFIG = {
  /** Check types rarely change - cache for 1 hour */
  CHECK_TYPES_TTL: 60 * 60 * 1000,
  /** Contract types very stable - cache for 2 hours */
  CONTRACT_TYPES_TTL: 2 * 60 * 60 * 1000,
  /** Settings change infrequently - cache for 30 minutes */
  SETTINGS_TTL: 30 * 60 * 1000,
  /** Pilot stats need regular updates - cache for 5 minutes */
  PILOT_STATS_TTL: 5 * 60 * 1000,
  /** Maximum cache entries to prevent memory leaks */
  MAX_CACHE_SIZE: 100,
  /** Cache cleanup interval - every 5 minutes */
  CLEANUP_INTERVAL: 5 * 60 * 1000,
} as const

/**
 * In-memory cache storage with automatic cleanup
 * Uses Map for O(1) lookup performance and prevents memory leaks
 */
class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    // Start automatic cleanup to prevent memory leaks
    this.startCleanup()
  }

  /**
   * Start automatic cleanup process
   */
  private startCleanup(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, CACHE_CONFIG.CLEANUP_INTERVAL)
  }

  /**
   * Stop automatic cleanup (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * Perform cache cleanup to prevent memory leaks
   */
  private performCleanup(): void {
    const now = Date.now()
    let expiredCount = 0

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        expiredCount++
      }
    }

    // If still too many entries, remove oldest ones
    if (this.cache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )

      const toRemove = entries.slice(0, this.cache.size - CACHE_CONFIG.MAX_CACHE_SIZE)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * Generic cache retrieval method with automatic expiry checking
   * @template T - Type of the cached data
   * @param {string} key - Cache key identifier
   * @returns {T | null} Cached data if valid and not expired, null otherwise
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Generic cache storage method with TTL configuration
   * @template T - Type of the data to cache
   * @param {string} key - Cache key identifier
   * @param {T} data - Data to cache
   * @param {number} ttl - Time-to-live in milliseconds
   */
  public set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Retrieves check types from cache or database
   * Check types are aviation certification categories that rarely change
   * @returns {Promise<any[]>} Array of check type records
   */
  async getCheckTypes(): Promise<any[]> {
    const cacheKey = 'check_types'
    let checkTypes = this.get<any[]>(cacheKey)

    if (!checkTypes) {
      const supabase = await getSupabaseClient()

      const { data, error } = await supabase.from('check_types').select('*').order('check_code')

      if (error) {
        logError(error as Error, {
          source: 'CacheService',
          severity: ErrorSeverity.HIGH,
          metadata: { operation: 'getCheckTypes' },
        })
        throw error
      }

      checkTypes = data || []
      this.set(cacheKey, checkTypes, CACHE_CONFIG.CHECK_TYPES_TTL)
    }

    return checkTypes || []
  }

  /**
   * Retrieves contract types from cache or database
   * Contract types (Fulltime, Commuting, Tours) are very stable
   * @returns {Promise<any[]>} Array of contract type records
   */
  async getContractTypes(): Promise<any[]> {
    const cacheKey = 'contract_types'
    let contractTypes = this.get<any[]>(cacheKey)

    if (!contractTypes) {
      const supabase = await getSupabaseClient()

      const { data, error } = await supabase
        .from('contract_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        logError(error as Error, {
          source: 'CacheService',
          severity: ErrorSeverity.HIGH,
          metadata: { operation: 'getContractTypes' },
        })
        throw error
      }

      contractTypes = data || []
      this.set(cacheKey, contractTypes, CACHE_CONFIG.CONTRACT_TYPES_TTL)
    }

    return contractTypes || []
  }

  /**
   * Retrieves system settings from cache or database
   * Settings include configurable parameters like retirement age
   * @returns {Promise<any[]>} Array of settings records
   */
  async getSettings(): Promise<any[]> {
    const cacheKey = 'settings'
    let settings = this.get<any[]>(cacheKey)

    if (!settings) {
      const supabase = await getSupabaseClient()

      const { data, error } = await supabase.from('settings').select('*')

      if (error) {
        logError(error as Error, {
          source: 'CacheService',
          severity: ErrorSeverity.HIGH,
          metadata: { operation: 'getSettings' },
        })
        throw error
      }

      settings = data || []
      this.set(cacheKey, settings, CACHE_CONFIG.SETTINGS_TTL)
    }

    return settings || []
  }

  /**
   * Retrieves pilot statistics from cache or database
   * Statistics include total counts and certification metrics
   * @returns {Promise<any>} Pilot statistics object
   */
  async getPilotStats(): Promise<any> {
    const cacheKey = 'pilot_stats'
    let stats = this.get<any>(cacheKey)

    if (!stats) {
      const supabase = await getSupabaseClient()

      try {
        // Execute multiple queries in parallel for better performance
        const [pilotsResult, checksResult, checkTypesResult] = await Promise.all([
          supabase
            .from('pilots')
            .select('id, is_active, role, captain_qualifications, date_of_birth')
            .eq('is_active', true),

          supabase.from('pilot_checks').select('expiry_date'),

          supabase.from('check_types').select('id'),
        ])

        if (pilotsResult.error) throw pilotsResult.error
        if (checksResult.error) throw checksResult.error
        if (checkTypesResult.error) throw checkTypesResult.error

        const pilots = pilotsResult.data || []
        const checks = checksResult.data || []
        const checkTypes = checkTypesResult.data || []

        // Calculate certification status statistics
        const today = new Date()
        const certificationStats = checks.reduce(
          (acc: any, check: any) => {
            if (!check.expiry_date) return acc

            const expiryDate = new Date(check.expiry_date)
            const daysUntilExpiry = Math.ceil(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )

            if (daysUntilExpiry < 0) {
              acc.expired++
            } else if (daysUntilExpiry <= 30) {
              acc.expiring++
            } else {
              acc.current++
            }

            return acc
          },
          { current: 0, expiring: 0, expired: 0 }
        )

        // Calculate captain qualifications
        let trainingCaptains = 0
        let examiners = 0
        let nearingRetirement = 0

        const retirementAge = 65 // Standard retirement age for pilots

        pilots.forEach((pilot: any) => {
          // Count training captains and examiners from captain_qualifications JSONB array
          if (pilot.captain_qualifications && Array.isArray(pilot.captain_qualifications)) {
            if (pilot.captain_qualifications.includes('training_captain')) {
              trainingCaptains++
            }
            if (pilot.captain_qualifications.includes('examiner')) {
              examiners++
            }
          }

          // Calculate pilots nearing retirement (within 2 years)
          if (pilot.date_of_birth) {
            const birthDate = new Date(pilot.date_of_birth)
            const age = today.getFullYear() - birthDate.getFullYear()
            const birthdayThisYear = new Date(
              today.getFullYear(),
              birthDate.getMonth(),
              birthDate.getDate()
            )
            const actualAge = birthdayThisYear <= today ? age : age - 1

            if (actualAge >= retirementAge - 2) {
              // Within 2 years of retirement
              nearingRetirement++
            }
          }
        })

        stats = {
          totalPilots: pilots.length,
          captains: pilots.filter((p: any) => p.role === 'Captain').length,
          firstOfficers: pilots.filter((p: any) => p.role === 'First Officer').length,
          trainingCaptains,
          examiners,
          nearingRetirement,
          totalCertifications: checks.length,
          totalCheckTypes: checkTypes.length,
          certificationStatus: certificationStats,
          lastUpdated: new Date().toISOString(),
        }

        this.set(cacheKey, stats, CACHE_CONFIG.PILOT_STATS_TTL)
      } catch (error) {
        logError(error as Error, {
          source: 'CacheService',
          severity: ErrorSeverity.MEDIUM,
          metadata: { operation: 'getPilotStatistics' },
        })
        throw error
      }
    }

    return stats
  }

  /**
   * Manually invalidate specific cache entry
   * Useful when data is updated and immediate refresh is needed
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
  }

  /**
   * Invalidate all cached data
   * Use sparingly, typically only during major data updates
   */
  invalidateAll(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics for monitoring and debugging
   * @returns {object} Cache statistics including size and hit rates
   */
  getStats(): object {
    const entries = Array.from(this.cache.entries())
    const now = Date.now()

    const stats = {
      totalEntries: this.cache.size,
      entries: entries.map(([key, entry]) => ({
        key,
        ageMinutes: Math.round((now - entry.timestamp) / 1000 / 60),
        ttlMinutes: Math.round(entry.ttl / 1000 / 60),
        expired: now - entry.timestamp > entry.ttl,
      })),
    }

    return stats
  }

  /**
   * Warm up cache by pre-loading frequently accessed data
   * Call this during application startup for optimal performance
   */
  async warmUp(): Promise<void> {
    try {
      await Promise.all([this.getCheckTypes(), this.getContractTypes(), this.getSettings()])
    } catch (error) {
      logError(error as Error, {
        source: 'CacheService',
        severity: ErrorSeverity.LOW,
        metadata: { operation: 'warmUp' },
      })
      // Don't throw error - application should still work without cache
    }
  }
}

// Export singleton instance for consistent cache across application
export const cacheService = new CacheService()

/**
 * Utility function to invalidate cache when data is updated
 * Use this in API routes and mutations to ensure data freshness
 * @param {string[]} keys - Array of cache keys to invalidate
 */
export function invalidateCache(keys: string[]): void {
  keys.forEach((key) => cacheService.invalidate(key))
}

/**
 * Pre-defined cache invalidation patterns for common operations
 */
export const CACHE_INVALIDATION_PATTERNS = {
  /** Invalidate when check types are modified */
  CHECK_TYPES_UPDATED: ['check_types'],
  /** Invalidate when contract types are modified */
  CONTRACT_TYPES_UPDATED: ['contract_types'],
  /** Invalidate when settings are modified */
  SETTINGS_UPDATED: ['settings'],
  /** Invalidate when pilots or certifications are modified */
  PILOT_DATA_UPDATED: ['pilot_stats'],
  /** Invalidate everything for major updates */
  FULL_REFRESH: ['check_types', 'contract_types', 'settings', 'pilot_stats'],
} as const

// =============================================================================
// ENHANCED CACHING FEATURES
// =============================================================================

/**
 * Enhanced cache service with advanced Redis-like features
 */
class EnhancedCacheService extends CacheService {
  private accessCounts = new Map<string, number>()
  private lastAccessTime = new Map<string, number>()

  /**
   * Get cache entry with access tracking
   * @template T
   * @param key - Cache key
   * @returns Cached value or null
   */
  getWithTracking<T>(key: string): T | null {
    const value = this.get<T>(key)

    if (value !== null) {
      // Track access
      this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1)
      this.lastAccessTime.set(key, Date.now())
    }

    return value
  }

  /**
   * Set cache entry with tags for group invalidation
   * @template T
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds
   * @param tags - Array of tags for grouped invalidation
   */
  setWithTags<T>(key: string, data: T, ttl: number, tags: string[] = []): void {
    this.set(key, data, ttl)

    // Store tags for this key
    if (tags.length > 0) {
      this.set(`tags:${key}`, tags, ttl)
    }
  }

  /**
   * Invalidate all cache entries with a specific tag
   * @param tag - Tag to invalidate
   */
  invalidateByTag(tag: string): void {
    for (const [key] of this['cache'].entries()) {
      if (key.startsWith('tags:')) continue

      const tags = this.get<string[]>(`tags:${key}`)
      if (tags && tags.includes(tag)) {
        this.invalidate(key)
        this.invalidate(`tags:${key}`)
      }
    }
  }

  /**
   * Get multiple keys at once (batch get)
   * @param keys - Array of cache keys
   * @returns Map of key-value pairs
   */
  mget<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>()

    for (const key of keys) {
      const value = this.getWithTracking<T>(key)
      if (value !== null) {
        results.set(key, value)
      }
    }

    return results
  }

  /**
   * Set multiple keys at once (batch set)
   * @param entries - Array of [key, value, ttl] tuples
   */
  mset<T>(entries: Array<[string, T, number]>): void {
    for (const [key, value, ttl] of entries) {
      this.set(key, value, ttl)
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   * @template T
   * @param key - Cache key
   * @param computeFn - Function to compute value if not cached
   * @param ttl - Time to live in milliseconds
   * @returns Cached or computed value
   */
  async getOrSet<T>(key: string, computeFn: () => Promise<T>, ttl: number): Promise<T> {
    let value = this.getWithTracking<T>(key)

    if (value === null) {
      value = await computeFn()
      this.set(key, value, ttl)
    }

    return value
  }

  /**
   * Increment a numeric value in cache
   * @param key - Cache key
   * @param delta - Amount to increment (default: 1)
   * @returns New value after increment
   */
  increment(key: string, delta: number = 1): number {
    const currentValue = this.get<number>(key) || 0
    const newValue = currentValue + delta

    // Keep same TTL if entry exists
    const existingEntry = this['cache'].get(key)
    const ttl = existingEntry?.ttl || CACHE_CONFIG.PILOT_STATS_TTL

    this.set(key, newValue, ttl)
    return newValue
  }

  /**
   * Decrement a numeric value in cache
   * @param key - Cache key
   * @param delta - Amount to decrement (default: 1)
   * @returns New value after decrement
   */
  decrement(key: string, delta: number = 1): number {
    return this.increment(key, -delta)
  }

  /**
   * Check if a key exists in cache (without updating access time)
   * @param key - Cache key
   * @returns True if key exists and not expired
   */
  exists(key: string): boolean {
    const entry = this['cache'].get(key)
    if (!entry) return false

    const now = Date.now()
    return now - entry.timestamp <= entry.ttl
  }

  /**
   * Get time to live for a cached key (in milliseconds)
   * @param key - Cache key
   * @returns Remaining TTL in milliseconds, or -1 if not found
   */
  ttl(key: string): number {
    const entry = this['cache'].get(key)
    if (!entry) return -1

    const now = Date.now()
    const elapsed = now - entry.timestamp
    const remaining = entry.ttl - elapsed

    return remaining > 0 ? remaining : 0
  }

  /**
   * Extend TTL for an existing cache entry
   * @param key - Cache key
   * @param additionalTtl - Additional TTL in milliseconds
   * @returns True if successful, false if key not found
   */
  extend(key: string, additionalTtl: number): boolean {
    const entry = this['cache'].get(key)
    if (!entry) return false

    entry.ttl += additionalTtl
    return true
  }

  /**
   * Get cache access statistics
   * @returns Access statistics for all keys
   */
  getAccessStats(): Array<{
    key: string
    accessCount: number
    lastAccess: Date | null
    ttlRemaining: number
  }> {
    const stats = []

    for (const [key, count] of this.accessCounts.entries()) {
      const lastAccess = this.lastAccessTime.get(key)
      const ttlRemaining = this.ttl(key)

      stats.push({
        key,
        accessCount: count,
        lastAccess: lastAccess ? new Date(lastAccess) : null,
        ttlRemaining,
      })
    }

    return stats.sort((a, b) => b.accessCount - a.accessCount)
  }

  /**
   * Get top N most accessed cache keys
   * @param limit - Number of top keys to return
   * @returns Array of most accessed keys
   */
  getTopAccessedKeys(limit: number = 10): Array<{ key: string; count: number }> {
    const sorted = Array.from(this.accessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    return sorted.map(([key, count]) => ({ key, count }))
  }

  /**
   * Get cache hit/miss statistics
   * @returns Hit rate percentage
   */
  getHitRate(): number {
    const totalAccess = Array.from(this.accessCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    )

    const hits = Array.from(this.accessCounts.values()).length

    return totalAccess > 0 ? Math.round((hits / totalAccess) * 100) : 0
  }

  /**
   * Warm cache with predefined queries for optimal performance
   * @param queries - Array of cache warming queries
   */
  async warmCacheAdvanced(
    queries: Array<{
      key: string
      computeFn: () => Promise<any>
      ttl: number
      tags?: string[]
    }>
  ): Promise<void> {
    await Promise.allSettled(
      queries.map(async ({ key, computeFn, ttl, tags }) => {
        const value = await computeFn()
        this.setWithTags(key, value, ttl, tags || [])
        return key
      })
    )
  }
}

// Export enhanced singleton instance
export const enhancedCacheService = new EnhancedCacheService()

/**
 * Convenience functions for enhanced caching
 */
export const getOrSetCache = <T>(key: string, computeFn: () => Promise<T>, ttl: number) =>
  enhancedCacheService.getOrSet(key, computeFn, ttl)

export const invalidateCacheByTag = (tag: string) => enhancedCacheService.invalidateByTag(tag)

export const getCacheAccessStats = () => enhancedCacheService.getAccessStats()

export const getCacheHitRate = () => enhancedCacheService.getHitRate()
