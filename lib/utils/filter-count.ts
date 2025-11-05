/**
 * Filter Count Utilities
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Phase 2.4: Helper functions to count active filters in report forms
 */

import type { ReportFilters } from '@/types/reports'

/**
 * Count the number of active filters in a ReportFilters object
 */
export function countActiveFilters(filters: ReportFilters): number {
  let count = 0

  // Date range filter
  if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
    count++
  }

  // Status filters
  if (filters.status && filters.status.length > 0) {
    count++
  }

  // Rank filters
  if (filters.rank && filters.rank.length > 0) {
    count++
  }

  // Check types filter (certifications only)
  if (filters.checkTypes && filters.checkTypes.length > 0) {
    count++
  }

  // Roster periods filter (leave only)
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    count++
  }

  // Expiry threshold filter (certifications only)
  if (filters.expiryThreshold !== undefined) {
    count++
  }

  return count
}

/**
 * Get a human-readable summary of active filters
 */
export function getFilterSummary(filters: ReportFilters): string[] {
  const summary: string[] = []

  if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
    summary.push(`Date range: ${filters.dateRange.startDate} to ${filters.dateRange.endDate}`)
  }

  if (filters.status && filters.status.length > 0) {
    summary.push(`Status: ${filters.status.join(', ')}`)
  }

  if (filters.rank && filters.rank.length > 0) {
    summary.push(`Rank: ${filters.rank.join(', ')}`)
  }

  if (filters.checkTypes && filters.checkTypes.length > 0) {
    summary.push(`Check types: ${filters.checkTypes.length} selected`)
  }

  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    summary.push(`Roster periods: ${filters.rosterPeriods.length} selected`)
  }

  if (filters.expiryThreshold !== undefined) {
    summary.push(`Expiry: ${filters.expiryThreshold} days`)
  }

  return summary
}
