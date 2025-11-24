/**
 * Memory Pressure Monitoring Utility
 * Author: Maurice Rondeau
 * Date: November 21, 2025
 *
 * Monitors memory usage and triggers cleanup when thresholds exceeded
 * Prevents out-of-memory crashes in production
 */

import { unifiedCacheService } from '@/lib/services/unified-cache-service'
import { logError, logWarning, ErrorSeverity } from '@/lib/error-logger'

export type MemoryPressureLevel = 'normal' | 'warning' | 'critical'

interface MemoryThresholds {
  warning: number // Percentage (e.g., 80 = 80%)
  critical: number // Percentage (e.g., 90 = 90%)
}

/**
 * Memory Pressure Monitor
 */
export class MemoryPressureMonitor {
  private thresholds: MemoryThresholds = {
    warning: 80,
    critical: 90,
  }

  private monitoringInterval: NodeJS.Timeout | null = null
  private lastCheckTime: number = 0
  private checkInterval: number = 60000 // Check every minute

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) return

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryPressure()
    }, this.checkInterval)

    // Prevent timer from keeping process alive
    if (this.monitoringInterval.unref) {
      this.monitoringInterval.unref()
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Check current memory pressure
   */
  checkMemoryPressure(): MemoryPressureLevel {
    const usage = process.memoryUsage()
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100

    this.lastCheckTime = Date.now()

    if (heapPercent >= this.thresholds.critical) {
      this.handleCriticalPressure(heapPercent)
      return 'critical'
    } else if (heapPercent >= this.thresholds.warning) {
      this.handleWarningPressure(heapPercent)
      return 'warning'
    }

    return 'normal'
  }

  /**
   * Handle warning-level memory pressure
   */
  private handleWarningPressure(heapPercent: number): void {
    logWarning('Memory pressure warning detected', {
      source: 'MemoryPressureMonitor',
      metadata: {
        heapPercent: `${heapPercent.toFixed(2)}%`,
        action: 'clearing non-essential caches',
      },
    })

    try {
      // Clear non-essential caches
      unifiedCacheService.invalidate('pilot_stats')

      // Could also clear other non-critical caches here
    } catch (error) {
      logError(error as Error, {
        source: 'MemoryPressureMonitor',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'handleWarningPressure' },
      })
    }
  }

  /**
   * Handle critical memory pressure
   */
  private handleCriticalPressure(heapPercent: number): void {
    logError(new Error('CRITICAL memory pressure detected'), {
      source: 'MemoryPressureMonitor',
      severity: ErrorSeverity.CRITICAL,
      metadata: {
        heapPercent: `${heapPercent.toFixed(2)}%`,
        action: 'forcing garbage collection',
      },
    })

    try {
      // Clear all non-essential caches
      unifiedCacheService.invalidateAll()

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
        logWarning('Forced garbage collection executed', {
          source: 'MemoryPressureMonitor',
          metadata: { heapPercent: `${heapPercent.toFixed(2)}%` },
        })
      } else {
        logWarning('Garbage collection not available (run with --expose-gc)', {
          source: 'MemoryPressureMonitor',
          metadata: {},
        })
      }
    } catch (error) {
      logError(error as Error, {
        source: 'MemoryPressureMonitor',
        severity: ErrorSeverity.CRITICAL,
        metadata: { operation: 'handleCriticalPressure' },
      })
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): {
    heapUsed: number
    heapTotal: number
    heapPercent: number
    external: number
    rss: number
    arrayBuffers: number
    pressureLevel: MemoryPressureLevel
  } {
    const usage = process.memoryUsage()
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100

    let pressureLevel: MemoryPressureLevel = 'normal'
    if (heapPercent >= this.thresholds.critical) {
      pressureLevel = 'critical'
    } else if (heapPercent >= this.thresholds.warning) {
      pressureLevel = 'warning'
    }

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      heapPercent: parseFloat(heapPercent.toFixed(2)),
      external: usage.external,
      rss: usage.rss,
      arrayBuffers: usage.arrayBuffers,
      pressureLevel,
    }
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }

  /**
   * Get formatted memory report
   */
  getMemoryReport(): string {
    const stats = this.getMemoryStats()

    return `
Memory Report (${new Date().toISOString()}):
  Heap Used: ${this.formatBytes(stats.heapUsed)}
  Heap Total: ${this.formatBytes(stats.heapTotal)}
  Heap Usage: ${stats.heapPercent}%
  External: ${this.formatBytes(stats.external)}
  RSS: ${this.formatBytes(stats.rss)}
  Array Buffers: ${this.formatBytes(stats.arrayBuffers)}
  Pressure Level: ${stats.pressureLevel.toUpperCase()}
    `.trim()
  }
}

// Export singleton instance
export const memoryMonitor = new MemoryPressureMonitor()

/**
 * Utility function to check memory before expensive operations
 *
 * @example
 * if (!canAllocateMemory(50 * 1024 * 1024)) { // 50 MB
 *   throw new Error('Insufficient memory for operation')
 * }
 */
export function canAllocateMemory(estimatedBytes: number): boolean {
  const usage = process.memoryUsage()
  const available = usage.heapTotal - usage.heapUsed

  return available >= estimatedBytes * 1.5 // 50% safety margin
}

/**
 * Log current memory usage
 */
export function logMemoryUsage(context: string): void {
  const report = memoryMonitor.getMemoryReport()
  console.log(`[${context}] ${report}`)
}
