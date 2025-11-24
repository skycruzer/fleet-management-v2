/**
 * Unified Cache Service - Memory Optimized
 * Author: Maurice Rondeau
 * Date: November 21, 2025
 *
 * Consolidates cache-service.ts and enhanced features
 * Fixes memory leaks from unbounded access tracking
 *
 * Key Improvements:
 * - Single cache instance (reduces overhead)
 * - Bounded access tracking (prevents memory leaks)
 * - Enhanced cleanup with tracking map management
 * - Redis fallback when available
 */

import { createClient } from '@/lib/supabase/server'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { redisCacheService, CACHE_TTL } from '@/lib/services/redis-cache-service'

/**
 * Cache configuration constants
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
  /** Maximum access tracking entries (NEW) */
  MAX_TRACKING_SIZE: 200,
  /** Cache cleanup interval - every 5 minutes */
  CLEANUP_INTERVAL: 5 * 60 * 1000,
} as const

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

/**
 * Unified Cache Service with Memory Optimization
 */
class UnifiedCacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private accessCounts = new Map<string, number>()
  private lastAccessTime = new Map<string, number>()
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
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

    // Prevent timer from keeping process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
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
   * Enhanced cleanup that manages all maps
   */
  private performCleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    // 1. Remove expired cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    // 2. Delete expired entries and their tracking data
    for (const key of keysToDelete) {
      this.cache.delete(key)
      this.accessCounts.delete(key)
      this.lastAccessTime.delete(key)
    }

    // 3. Enforce cache size limit
    if (this.cache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )

      const toRemove = entries.slice(0, this.cache.size - CACHE_CONFIG.MAX_CACHE_SIZE)
      toRemove.forEach(([key]) => {
        this.cache.delete(key)
        this.accessCounts.delete(key)
        this.lastAccessTime.delete(key)
      })
    }

    // 4. NEW: Enforce tracking size limit (prevents unbounded growth)
    if (this.accessCounts.size > CACHE_CONFIG.MAX_TRACKING_SIZE) {
      // Keep only most recently accessed entries
      const sortedByAccess = Array.from(this.lastAccessTime.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(CACHE_CONFIG.MAX_TRACKING_SIZE)

      for (const [key] of sortedByAccess) {
        this.accessCounts.delete(key)
        this.lastAccessTime.delete(key)
      }
    }
  }

  /**
   * Get cached value with access tracking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.accessCounts.delete(key)
      this.lastAccessTime.delete(key)
      return null
    }

    // Track access
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1)
    this.lastAccessTime.set(key, now)

    return entry.data
  }

  /**
   * Set cached value with optional tags
   */
  set<T>(key: string, data: T, ttl: number, tags?: string[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    })
  }

  /**
   * Get or compute and cache (with Redis fallback)
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl: number,
    useRedis: boolean = true
  ): Promise<T> {
    // Try local cache first
    let value = this.get<T>(key)
    if (value !== null) return value

    // Try Redis if enabled
    if (useRedis) {
      const redisValue = await redisCacheService.get<T>(key)
      if (redisValue !== null) {
        // Populate local cache from Redis
        this.set(key, redisValue, ttl)
        return redisValue
      }
    }

    // Compute value
    value = await computeFn()

    // Store in both caches
    this.set(key, value, ttl)
    if (useRedis) {
      await redisCacheService.set(key, value, Math.floor(ttl / 1000))
    }

    return value
  }

  /**
   * Invalidate cache by tag
   */
  invalidateByTag(tag: string): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
      this.accessCounts.delete(key)
      this.lastAccessTime.delete(key)
    }
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    this.accessCounts.delete(key)
    this.lastAccessTime.delete(key)
  }

  /**
   * Invalidate all cached data
   */
  invalidateAll(): void {
    this.cache.clear()
    this.accessCounts.clear()
    this.lastAccessTime.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries())
    const now = Date.now()

    return {
      totalEntries: this.cache.size,
      trackingEntries: this.accessCounts.size,
      entries: entries.map(([key, entry]) => ({
        key,
        ageMinutes: Math.round((now - entry.timestamp) / 1000 / 60),
        ttlMinutes: Math.round(entry.ttl / 1000 / 60),
        expired: now - entry.timestamp > entry.ttl,
        accessCount: this.accessCounts.get(key) || 0,
        tags: entry.tags,
      })),
    }
  }

  /**
   * Get top accessed keys
   */
  getTopAccessedKeys(limit: number = 10): Array<{ key: string; count: number }> {
    return Array.from(this.accessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }))
  }

  /**
   * Batch get multiple keys
   */
  mget<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>()

    for (const key of keys) {
      const value = this.get<T>(key)
      if (value !== null) {
        results.set(key, value)
      }
    }

    return results
  }

  /**
   * Batch set multiple keys
   */
  mset<T>(entries: Array<[string, T, number, string[]?]>): void {
    for (const [key, value, ttl, tags] of entries) {
      this.set(key, value, ttl, tags)
    }
  }

  /**
   * Increment numeric value
   */
  increment(key: string, delta: number = 1): number {
    const currentValue = this.get<number>(key) || 0
    const newValue = currentValue + delta

    const existingEntry = this.cache.get(key)
    const ttl = existingEntry?.ttl || CACHE_CONFIG.PILOT_STATS_TTL

    this.set(key, newValue, ttl, existingEntry?.tags)
    return newValue
  }

  /**
   * Check if key exists
   */
  exists(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    return now - entry.timestamp <= entry.ttl
  }

  /**
   * Get remaining TTL
   */
  ttl(key: string): number {
    const entry = this.cache.get(key)
    if (!entry) return -1

    const now = Date.now()
    const elapsed = now - entry.timestamp
    const remaining = entry.ttl - elapsed

    return remaining > 0 ? remaining : 0
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(): Promise<void> {
    try {
      await Promise.all([
        this.getCheckTypes(),
        this.getContractTypes(),
        this.getSettings(),
      ])
    } catch (error) {
      logError(error as Error, {
        source: 'UnifiedCacheService',
        severity: ErrorSeverity.LOW,
        metadata: { operation: 'warmUp' },
      })
    }
  }

  // ========================================================================
  // Domain-specific cache methods
  // ========================================================================

  async getCheckTypes(): Promise<any[]> {
    return this.getOrSet(
      'check_types',
      async () => {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('check_types')
          .select('*')
          .order('check_code')

        if (error) throw error
        return data || []
      },
      CACHE_CONFIG.CHECK_TYPES_TTL
    )
  }

  async getContractTypes(): Promise<any[]> {
    return this.getOrSet(
      'contract_types',
      async () => {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('contract_types')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        return data || []
      },
      CACHE_CONFIG.CONTRACT_TYPES_TTL
    )
  }

  async getSettings(): Promise<any[]> {
    return this.getOrSet(
      'settings',
      async () => {
        const supabase = await createClient()
        const { data, error } = await supabase.from('settings').select('*')

        if (error) throw error
        return data || []
      },
      CACHE_CONFIG.SETTINGS_TTL
    )
  }
}

// Export singleton instance
export const unifiedCacheService = new UnifiedCacheService()

/**
 * Pre-defined cache invalidation patterns
 */
export const CACHE_INVALIDATION_PATTERNS = {
  CHECK_TYPES_UPDATED: 'check_types',
  CONTRACT_TYPES_UPDATED: 'contract_types',
  SETTINGS_UPDATED: 'settings',
  PILOT_DATA_UPDATED: 'pilot_stats',
} as const

// Convenience exports
export const invalidateCache = (keys: string[]) => {
  keys.forEach((key) => unifiedCacheService.invalidate(key))
}

export const invalidateCacheByTag = (tag: string) => {
  unifiedCacheService.invalidateByTag(tag)
}

export const getCacheStats = () => unifiedCacheService.getStats()
