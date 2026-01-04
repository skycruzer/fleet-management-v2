'use client'

/**
 * Deadline Widget Wrapper Component
 *
 * Client-side wrapper for DeadlineWidget that handles navigation
 * when user clicks "Review Requests" button.
 *
 * Author: Maurice Rondeau
 * Date: November 12, 2025
 */

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DeadlineWidget } from './deadline-widget'

interface DeadlineWidgetWrapperProps {
  maxPeriods?: number
  compact?: boolean
}

export function DeadlineWidgetWrapper({
  maxPeriods = 3,
  compact = false,
}: DeadlineWidgetWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleReviewClick = useCallback(
    (rosterPeriodCode: string) => {
      // Create new URLSearchParams with roster period filter
      const params = new URLSearchParams()
      params.set('roster_period', rosterPeriodCode)
      params.set('status', 'pending') // Show only pending requests
      params.set('tab', 'leave') // Default to leave tab

      // Navigate to requests page with filters
      router.push(`/dashboard/requests?${params.toString()}`)
    },
    [router]
  )

  return (
    <DeadlineWidget maxPeriods={maxPeriods} compact={compact} onReviewClick={handleReviewClick} />
  )
}
