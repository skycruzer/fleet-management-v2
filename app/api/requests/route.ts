/**
 * Unified Pilot Requests API Route
 * Handles all pilot request types (leave, flight, bids)
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/requests - List all requests with filters
 * POST /api/requests - Create new request
 *
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllPilotRequests,
  createPilotRequest,
  PilotRequestFilters,
  CreatePilotRequestInput,
} from '@/lib/services/unified-request-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { authRateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'
import { CreatePilotRequestSchema } from '@/lib/validations/pilot-request-schema'

/**
 * GET /api/requests
 * List all pilot requests with optional filters
 *
 * Query Parameters:
 * - roster_period: Filter by roster period code (e.g., "RP01/2026")
 * - pilot_id: Filter by pilot ID
 * - status: Filter by workflow status (comma-separated: "SUBMITTED,APPROVED")
 * - category: Filter by request category (comma-separated: "LEAVE,FLIGHT")
 * - channel: Filter by submission channel (comma-separated: "EMAIL,PHONE")
 * - is_late: Filter late requests (true/false)
 * - is_past_deadline: Filter past-deadline requests (true/false)
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters: PilotRequestFilters = {}

    // Roster period filter
    const rosterPeriod = searchParams.get('roster_period')
    if (rosterPeriod) {
      filters.roster_period = rosterPeriod
    }

    // Pilot ID filter
    const pilotId = searchParams.get('pilot_id')
    if (pilotId) {
      filters.pilot_id = pilotId
    }

    // Status filter (comma-separated)
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',').map((s) => s.trim()) as any
    }

    // Category filter (comma-separated)
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      filters.request_category = categoryParam.split(',').map((c) => c.trim()) as any
    }

    // Submission channel filter (comma-separated)
    const channelParam = searchParams.get('channel')
    if (channelParam) {
      filters.submission_channel = channelParam.split(',').map((c) => c.trim()) as any
    }

    // Date range filters
    const startDateFrom = searchParams.get('start_date_from')
    if (startDateFrom) {
      filters.start_date_from = startDateFrom
    }

    const startDateTo = searchParams.get('start_date_to')
    if (startDateTo) {
      filters.start_date_to = startDateTo
    }

    // Boolean filters
    const isLate = searchParams.get('is_late')
    if (isLate !== null) {
      filters.is_late_request = isLate === 'true'
    }

    const isPastDeadline = searchParams.get('is_past_deadline')
    if (isPastDeadline !== null) {
      filters.is_past_deadline = isPastDeadline === 'true'
    }

    // Get requests with filters
    const result = await getAllPilotRequests(filters)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0,
      filters,
    })
  } catch (error) {
    console.error('GET /api/requests error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getAllPilotRequests',
      endpoint: '/api/requests',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * POST /api/requests
 * Create a new pilot request
 *
 * Request Body:
 * {
 *   pilot_id: string
 *   employee_number: string
 *   rank: "Captain" | "First Officer"
 *   name: string
 *   request_category: "LEAVE" | "FLIGHT" | "LEAVE_BID"
 *   request_type: string
 *   submission_channel: "PILOT_PORTAL" | "EMAIL" | "PHONE" | "ORACLE" | "ADMIN_PORTAL"
 *   start_date: string (ISO date)
 *   end_date?: string (ISO date)
 *   flight_date?: string (ISO date)
 *   reason?: string
 *   notes?: string
 *   submitted_by_admin_id?: string
 *   source_reference?: string
 *   source_attachment_url?: string
 * }
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body with Zod
    const body = await request.json()
    const validation = CreatePilotRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Build input from validated data
    const input: CreatePilotRequestInput = {
      ...validation.data,
      submitted_by_admin_id: validation.data.submitted_by_admin_id || auth.userId!,
    }

    // Create request
    const result = await createPilotRequest(input)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflicts: result.conflicts,
          warnings: result.warnings,
        },
        { status: 400 }
      )
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/requests')

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: 'Request created successfully',
        conflicts: result.conflicts,
        warnings: result.warnings,
        canApprove: result.canApprove,
        crewImpact: result.crewImpact,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/requests error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'createPilotRequest',
      endpoint: '/api/requests',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
