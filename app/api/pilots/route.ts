/**
 * Pilots API Route
 * Handles pilot listing and creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPilots, createPilot } from '@/lib/services/pilot-service'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

/**
 * GET /api/pilots
 * List all pilots with optional filters
 */
export async function GET(_request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = _request.nextUrl.searchParams
    const role = searchParams.get('role') as 'Captain' | 'First Officer' | null
    const status = searchParams.get('status') as 'active' | 'inactive' | null

    // Fetch pilots
    const pilots = await getPilots({
      role: role || undefined,
      is_active: status === 'active' ? true : status === 'inactive' ? false : undefined,
    })

    return NextResponse.json({
      success: true,
      data: pilots,
      count: pilots.length,
    })
  } catch (error) {
    console.error('GET /api/pilots error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.PILOT.FETCH_FAILED, 500), {
      status: 500,
    })
  }
}

/**
 * POST /api/pilots
 * Create a new pilot
 */
export async function POST(_request: NextRequest) {
  try {
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

    // Parse and validate request body
    const body = await _request.json()
    const validatedData = PilotCreateSchema.parse(body)

    // Create pilot
    const newPilot = await createPilot(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: newPilot,
        message: 'Pilot created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/pilots error:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('pilot data')
      return NextResponse.json(
        {
          ...formatApiError(validationError, 400),
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(formatApiError(ERROR_MESSAGES.PILOT.CREATE_FAILED, 500), {
      status: 500,
    })
  }
}
