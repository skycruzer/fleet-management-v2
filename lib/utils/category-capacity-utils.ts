/**
 * Category Capacity Utils
 *
 * Utilities for calculating and displaying capacity utilization.
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

/**
 * Default capacity values per category
 */
export const CATEGORY_CAPACITY_DEFAULTS: Record<string, number> = {
  'Flight Checks': 4,
  'Simulator Checks': 6,
  'Ground Courses Refresher': 10,
  default: 5,
}

/**
 * Capacity record from roster_period_capacity table
 */
interface CapacityRecord {
  roster_period: string
  period_start_date: string
  period_end_date: string
  flight_check_capacity?: number | null
  flight_capacity?: number | null
  simulator_capacity?: number | null
  ground_course_capacity?: number | null
  ground_capacity?: number | null
  medical_capacity?: number | null
  total_capacity?: number | null
  [key: string]: unknown
}

/**
 * Get capacity for a specific category from a capacity record
 *
 * @param record - Capacity record from database
 * @param category - Category name
 * @returns Capacity for the category
 */
export function getCategoryCapacity(record: CapacityRecord, category: string): number {
  const categoryMap: Record<string, keyof CapacityRecord> = {
    'Flight Checks': 'flight_capacity',
    'Simulator Checks': 'simulator_capacity',
    'Ground Courses Refresher': 'ground_capacity',
  }

  const key = categoryMap[category]
  const value = key ? record[key] : null
  if (typeof value === 'number') {
    return value
  }

  return CATEGORY_CAPACITY_DEFAULTS[category] ?? CATEGORY_CAPACITY_DEFAULTS.default
}

/**
 * Get total capacity from a capacity record
 *
 * @param record - Capacity record from database
 * @returns Total capacity across all categories
 */
export function getTotalCapacity(record: CapacityRecord): number {
  if (typeof record.total_capacity === 'number') {
    return record.total_capacity
  }

  // Sum individual capacities if total not provided
  const flight =
    typeof record.flight_capacity === 'number'
      ? record.flight_capacity
      : CATEGORY_CAPACITY_DEFAULTS['Flight Checks']
  const simulator =
    typeof record.simulator_capacity === 'number'
      ? record.simulator_capacity
      : CATEGORY_CAPACITY_DEFAULTS['Simulator Checks']
  const ground =
    typeof record.ground_capacity === 'number'
      ? record.ground_capacity
      : CATEGORY_CAPACITY_DEFAULTS['Ground Courses Refresher']

  return flight + simulator + ground
}

/**
 * Utilization status levels
 */
export type UtilizationStatus = 'low' | 'normal' | 'medium' | 'high' | 'critical' | 'over'

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
  if (utilization > 100) return 'over'
  if (utilization >= 90) return 'critical'
  if (utilization >= 75) return 'high'
  if (utilization >= 50) return 'medium'
  if (utilization >= 25) return 'normal'
  return 'low'
}

/**
 * Get CSS color classes for utilization status
 *
 * @param statusOrPercentage - Utilization status string or percentage number
 * @returns Tailwind CSS classes
 */
export function getUtilizationColorClass(statusOrPercentage: UtilizationStatus | number): string {
  // If passed a number, convert to status first
  const status =
    typeof statusOrPercentage === 'number'
      ? getUtilizationStatus(statusOrPercentage)
      : statusOrPercentage

  const colorMap: Record<UtilizationStatus, string> = {
    low: 'text-[var(--color-success-600)] bg-[var(--color-success-muted)]',
    normal: 'text-[var(--color-primary-600)] bg-[var(--color-info-bg)]',
    medium: 'text-[var(--color-warning-500)] bg-[var(--color-warning-muted)]',
    high: 'text-[var(--color-badge-orange)] bg-[var(--color-badge-orange-bg)]',
    critical: 'text-[var(--color-danger-600)] bg-[var(--color-destructive-muted)]',
    over: 'text-[var(--color-danger-500)] bg-[var(--color-destructive-muted)]',
  }
  return colorMap[status]
}
