/**
 * Roster Period Detail API Route
 * Get single roster period by code
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/roster-periods/[code] - Get roster period by code (e.g., "RP01/2026")
 *
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getRosterPeriodByCode,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
  isValidRosterPeriodCode,
  ensureRosterPeriodsExist,
} from '@/lib/services/roster-period-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { authRateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/roster-periods/[code]
 * Get single roster period by code
 */
export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
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
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

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
  } catch (error) {
    console.error('GET /api/roster-periods/[code] error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getRosterPeriodByCode',
      endpoint: '/api/roster-periods/[code]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
