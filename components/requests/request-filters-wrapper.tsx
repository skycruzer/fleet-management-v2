/**
 * Request Filters Wrapper Component
 *
 * Client component that uses nuqs for URL state management of request filters.
 * Replaces manual useSearchParams + URLSearchParams + router.push() pattern.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @updated February 2026 - Migrated to nuqs for URL state management
 */

'use client'

import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs'
import { RequestFilters, RequestFiltersClient } from './request-filters-client'
import { generateRosterPeriods, rosterPeriodToDateRange } from '@/lib/utils/roster-periods'

// Generate roster periods with date ranges for filter buttons
const rosterPeriodData = generateRosterPeriods([2025, 2026], { currentAndFutureOnly: true }).map(
  (code) => {
    const range = rosterPeriodToDateRange(code)
    const now = new Date().toISOString().split('T')[0]
    const status =
      range && range.startDate <= now && range.endDate >= now
        ? 'current'
        : range && range.startDate > now
          ? 'future'
          : 'past'
    return {
      code,
      startDate: range?.startDate || '',
      endDate: range?.endDate || '',
      status,
    }
  }
)

export function RequestFiltersWrapper() {
  // nuqs manages URL sync automatically for each filter param
  // IMPORTANT: shallow: false triggers full server-side navigation so server
  // components (RequestsTableWrapper) re-render with updated searchParams
  const nuqsOptions = { shallow: false } as const
  const [rosterPeriod, setRosterPeriod] = useQueryState(
    'roster_period',
    parseAsString.withDefault('').withOptions(nuqsOptions)
  )
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('').withOptions(nuqsOptions)
  )
  const [category] = useQueryState(
    'category',
    parseAsString.withDefault('').withOptions(nuqsOptions)
  )
  const [channel, setChannel] = useQueryState(
    'channel',
    parseAsString.withDefault('').withOptions(nuqsOptions)
  )
  const [isLate, setIsLate] = useQueryState(
    'is_late',
    parseAsBoolean.withDefault(false).withOptions(nuqsOptions)
  )
  const [isPastDeadline, setIsPastDeadline] = useQueryState(
    'is_past_deadline',
    parseAsBoolean.withDefault(false).withOptions(nuqsOptions)
  )
  const [startDateFrom, setStartDateFrom] = useQueryState(
    'start_date_from',
    parseAsString.withDefault('').withOptions(nuqsOptions)
  )
  const [startDateTo, setStartDateTo] = useQueryState(
    'start_date_to',
    parseAsString.withDefault('').withOptions(nuqsOptions)
  )

  // Convert nuqs state to RequestFilters for the child component
  const filters: RequestFilters = {
    roster_period: rosterPeriod ? rosterPeriod.split(',').filter(Boolean) : undefined,
    status: status ? status.split(',').filter(Boolean) : [],
    category: category ? category.split(',').filter(Boolean) : [],
    channel: channel ? channel.split(',').filter(Boolean) : [],
    is_late: isLate,
    is_past_deadline: isPastDeadline,
    start_date_from: startDateFrom || undefined,
    start_date_to: startDateTo || undefined,
  }

  // Handle filter changes — nuqs automatically syncs URL
  const handleFiltersChange = (newFilters: RequestFilters) => {
    // Update roster period (comma-separated for multiple)
    if (newFilters.roster_period) {
      const periods = Array.isArray(newFilters.roster_period)
        ? newFilters.roster_period
        : [newFilters.roster_period]
      setRosterPeriod(periods.join(',') || null)
    } else {
      setRosterPeriod(null)
    }

    // Update status (comma-separated)
    if (newFilters.status && newFilters.status.length > 0) {
      setStatus(newFilters.status.join(','))
    } else {
      setStatus(null)
    }

    // Update channel (comma-separated)
    if (newFilters.channel && newFilters.channel.length > 0) {
      setChannel(newFilters.channel.join(','))
    } else {
      setChannel(null)
    }

    // Update boolean flags — set to null to remove from URL when false
    setIsLate(newFilters.is_late || null)
    setIsPastDeadline(newFilters.is_past_deadline || null)

    // Update date range
    setStartDateFrom(newFilters.start_date_from || null)
    setStartDateTo(newFilters.start_date_to || null)
  }

  return (
    <RequestFiltersClient
      filters={filters}
      onFiltersChange={handleFiltersChange}
      rosterPeriods={rosterPeriodData}
    />
  )
}
