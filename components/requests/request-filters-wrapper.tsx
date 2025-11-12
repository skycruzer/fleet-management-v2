/**
 * Request Filters Wrapper Component
 *
 * Server component wrapper that converts URL searchParams to RequestFilters props
 * and manages URL updates when filters change.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { RequestFilters, RequestFiltersClient } from './request-filters-client'

interface RequestFiltersWrapperProps {
  searchParams: {
    roster_period?: string
    pilot_id?: string
    status?: string
    category?: string
    channel?: string
    is_late?: string
    is_past_deadline?: string
  }
}

export function RequestFiltersWrapper({ searchParams }: RequestFiltersWrapperProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  // Convert searchParams to filters
  const filters: RequestFilters = {
    roster_period: searchParams.roster_period?.split(',').filter(Boolean) || undefined,
    status: searchParams.status?.split(',').filter(Boolean) || [],
    category: searchParams.category?.split(',').filter(Boolean) || [],
    channel: searchParams.channel?.split(',').filter(Boolean) || [],
    is_late: searchParams.is_late === 'true',
    is_past_deadline: searchParams.is_past_deadline === 'true',
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: RequestFilters) => {
    const params = new URLSearchParams(currentSearchParams.toString())

    // Update roster period (comma-separated for multiple)
    if (newFilters.roster_period) {
      const periods = Array.isArray(newFilters.roster_period)
        ? newFilters.roster_period
        : [newFilters.roster_period]
      params.set('roster_period', periods.join(','))
    } else {
      params.delete('roster_period')
    }

    // Update status (comma-separated)
    if (newFilters.status && newFilters.status.length > 0) {
      params.set('status', newFilters.status.join(','))
    } else {
      params.delete('status')
    }

    // Update category (comma-separated)
    if (newFilters.category && newFilters.category.length > 0) {
      params.set('category', newFilters.category.join(','))
    } else {
      params.delete('category')
    }

    // Update channel (comma-separated)
    if (newFilters.channel && newFilters.channel.length > 0) {
      params.set('channel', newFilters.channel.join(','))
    } else {
      params.delete('channel')
    }

    // Update boolean flags
    if (newFilters.is_late) {
      params.set('is_late', 'true')
    } else {
      params.delete('is_late')
    }

    if (newFilters.is_past_deadline) {
      params.set('is_past_deadline', 'true')
    } else {
      params.delete('is_past_deadline')
    }

    // Update URL
    router.push(`/dashboard/requests?${params.toString()}`)
  }

  return (
    <RequestFiltersClient
      filters={filters}
      onFiltersChange={handleFiltersChange}
    />
  )
}
