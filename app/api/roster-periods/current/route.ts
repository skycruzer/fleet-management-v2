/**
 * Current Roster Period API Route
 * Get current roster period based on today's date
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/roster-periods/current - Get roster period containing today
 *
 * @version 1.1.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import {
  getRosterPeriodCodeFromDate,
  getRosterPeriodByCode,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
  ensureRosterPeriodsExist,
} from '@/lib/services/roster-period-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/roster-periods/current
 * Get current roster period based on today's date
 */
export const GET = createAdminRoute(
  {
    operation: 'getCurrentRosterPeriod',
    endpoint: '/api/roster-periods/current',
    rateLimit: { limiter: authRateLimit, by: 'ip' },
  },
  async () => {
    // Ensure roster periods exist (auto-create if missing)
    await ensureRosterPeriodsExist()

    // Get current roster period code based on today's date
    const today = new Date()
    const currentCode = getRosterPeriodCodeFromDate(today)

    // Parse the code to get period number and year
    const parsed = parseRosterPeriodCode(currentCode)
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Could not determine current roster period' },
        { status: 500 }
      )
    }

    // Get roster period data (will calculate on-the-fly if not in database)
    const rosterPeriod = await getRosterPeriodByCode(currentCode)

    if (!rosterPeriod) {
      return NextResponse.json(
        { success: false, error: 'Current roster period not found' },
        { status: 404 }
      )
    }

    // Calculate detailed dates for enriched response
    const detailedDates = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)

    // Format response with detailed information
    const response = {
      code: rosterPeriod.code,
      periodNumber: rosterPeriod.period_number,
      year: rosterPeriod.year,
      startDate: rosterPeriod.start_date,
      endDate: rosterPeriod.end_date,
      publishDate: rosterPeriod.publish_date,
      deadlineDate: rosterPeriod.request_deadline_date,
      daysUntilDeadline: detailedDates.daysUntilDeadline,
      daysUntilPublish: detailedDates.daysUntilPublish,
      daysUntilStart: detailedDates.daysUntilStart,
      isOpen: detailedDates.isOpen,
      isPastDeadline: detailedDates.isPastDeadline,
      status: rosterPeriod.status,
      isCurrent: true, // This is always the current period
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  }
)
