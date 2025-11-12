/**
 * Current Roster Period API Route
 * Get current roster period based on today's date
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/roster-periods/current - Get roster period containing today
 *
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getRosterPeriodCodeFromDate,
  getRosterPeriodByCode,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
  ensureRosterPeriodsExist,
} from '@/lib/services/roster-period-service'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { authRateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/roster-periods/current
 * Get current roster period based on today's date
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIp(request)
    const { success } = await authRateLimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

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
  } catch (error) {
    console.error('GET /api/roster-periods/current error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getCurrentRosterPeriod',
      endpoint: '/api/roster-periods/current',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
