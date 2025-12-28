/**
 * Category Capacity Utils
 *
 * Utilities for calculating and displaying capacity utilization.
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

/**
 * Utilization status levels
 */
export type UtilizationStatus = 'low' | 'normal' | 'high' | 'critical'

/**
 * Calculate utilization percentage
 *
 * @param current - Current count
 * @param capacity - Maximum capacity
 * @returns Utilization percentage (0-100)
 */
export function calculateUtilization(current: number, capacity: number): number {
  if (capacity <= 0) return 0
  return Math.round((current / capacity) * 100)
}

/**
 * Get utilization status based on percentage
 *
 * @param utilization - Utilization percentage
 * @returns Status level
 */
export function getUtilizationStatus(utilization: number): UtilizationStatus {
  if (utilization >= 90) return 'critical'
  if (utilization >= 75) return 'high'
  if (utilization >= 50) return 'normal'
  return 'low'
}

/**
 * Get CSS color classes for utilization status
 *
 * @param status - Utilization status
 * @returns Tailwind CSS classes
 */
export function getUtilizationColorClass(status: UtilizationStatus): string {
  const colorMap: Record<UtilizationStatus, string> = {
    low: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    normal: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    high: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    critical: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  }
  return colorMap[status]
}
