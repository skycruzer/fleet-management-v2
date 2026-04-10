/**
 * Roster Periods API Route
 * List all roster periods with optional filters
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/roster-periods - List roster periods with filters
 *
 * Query Parameters:
 * - year: Filter by year (e.g., 2025)
 * - status: Filter by status (OPEN, LOCKED, PUBLISHED, ARCHIVED)
 * - upcoming: Boolean to get only upcoming periods (default: false)
 * - count: Number of periods to return for upcoming (default: 6)
 *
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getUpcomingRosterPeriods,
  getRosterPeriodsByYear,
  calculateRosterPeriodDates,
  ensureRosterPeriodsExist,
} from '@/lib/services/roster-period-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { authRateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/roster-periods
 * List all roster periods with optional filters
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
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Ensure roster periods exist (auto-create if missing)
    await ensureRosterPeriodsExist()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const yearParam = searchParams.get('year')
    const statusParam = searchParams.get('status')
    const upcomingParam = searchParams.get('upcoming')
    const countParam = searchParams.get('count')

    // Handle upcoming periods request
    if (upcomingParam === 'true') {
      const count = countParam ? parseInt(countParam, 10) : 6
      if (isNaN(count) || count < 1 || count > 24) {
        return NextResponse.json(
          { success: false, error: 'Count must be between 1 and 24' },
          { status: 400 }
        )
      }

      const periods = getUpcomingRosterPeriods(count)

      // Convert to API response format
      const formattedPeriods = periods.map((period) => ({
        code: period.code,
        periodNumber: period.periodNumber,
        year: period.year,
        startDate: period.startDate.toISOString().split('T')[0],
        endDate: period.endDate.toISOString().split('T')[0],
        publishDate: period.publishDate.toISOString().split('T')[0],
        deadlineDate: period.deadlineDate.toISOString().split('T')[0],
        daysUntilDeadline: period.daysUntilDeadline,
        daysUntilPublish: period.daysUntilPublish,
        daysUntilStart: period.daysUntilStart,
        isOpen: period.isOpen,
        isPastDeadline: period.isPastDeadline,
        status: period.status,
      }))

      return NextResponse.json({
        success: true,
        data: formattedPeriods,
        count: formattedPeriods.length,
      })
    }

    // Handle year-based query
    if (yearParam) {
      const year = parseInt(yearParam, 10)
      if (isNaN(year) || year < 2020 || year > 2040) {
        return NextResponse.json(
          { success: false, error: 'Year must be between 2020 and 2040' },
          { status: 400 }
        )
      }

      const periods = await getRosterPeriodsByYear(year)

      // Apply status filter if provided
      let filteredPeriods = periods
      if (statusParam) {
        const validStatuses = ['OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED']
        if (!validStatuses.includes(statusParam)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid status. Must be OPEN, LOCKED, PUBLISHED, or ARCHIVED',
            },
            { status: 400 }
          )
        }
        filteredPeriods = periods.filter((p) => p.status === statusParam)
      }

      return NextResponse.json({
        success: true,
        data: filteredPeriods,
        count: filteredPeriods.length,
        year,
      })
    }

    // Default: Return current year + next 2 years
    const currentYear = new Date().getFullYear()
    const allPeriods = []

    for (let year = currentYear; year <= currentYear + 2; year++) {
      const yearPeriods = await getRosterPeriodsByYear(year)
      allPeriods.push(...yearPeriods)
    }

    // Apply status filter if provided
    let filteredPeriods = allPeriods
    if (statusParam) {
      const validStatuses = ['OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED']
      if (!validStatuses.includes(statusParam)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status. Must be OPEN, LOCKED, PUBLISHED, or ARCHIVED' },
          { status: 400 }
        )
      }
      filteredPeriods = allPeriods.filter((p) => p.status === statusParam)
    }

    return NextResponse.json({
      success: true,
      data: filteredPeriods,
      count: filteredPeriods.length,
    })
  } catch (error) {
    console.error('GET /api/roster-periods error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getRosterPeriods',
      endpoint: '/api/roster-periods',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
