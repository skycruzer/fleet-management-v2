/**
 * Roster Period Detail API Route
 * Get single roster period by code
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/roster-periods/[code] - Get roster period by code (e.g., "RP01/2026")
 *
 * @version 1.1.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import {
  getRosterPeriodByCode,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
  isValidRosterPeriodCode,
  ensureRosterPeriodsExist,
} from '@/lib/services/roster-period-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/roster-periods/[code]
 * Get single roster period by code
 */
export const GET = createAdminRoute(
  {
    operation: 'getRosterPeriodByCode',
    endpoint: '/api/roster-periods/[code]',
    rateLimit: { limiter: authRateLimit, by: 'ip' },
  },
  async ({ params }) => {
    // Ensure roster periods exist (auto-create if missing)
    await ensureRosterPeriodsExist()

    // Get roster period code from params
    const code = params.code

    // Validate roster period code format
    if (!isValidRosterPeriodCode(code)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid roster period code format. Expected format: RP1/2025 to RP13/2025',
        },
        { status: 400 }
      )
    }

    // Parse the code to get period number and year
    const parsed = parseRosterPeriodCode(code)
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Could not parse roster period code' },
        { status: 400 }
      )
    }

    // Get roster period data (will calculate on-the-fly if not in database)
    const rosterPeriod = await getRosterPeriodByCode(code)

    if (!rosterPeriod) {
      return NextResponse.json(
        { success: false, error: `Roster period ${code} not found` },
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
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  }
)
