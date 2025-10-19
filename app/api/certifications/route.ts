/**
 * Certifications API Route
 * Handles certification listing and creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCertifications, createCertification } from '@/lib/services/certification-service'
import { CertificationCreateSchema } from '@/lib/validations/certification-validation'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

/**
 * GET /api/certifications
 * List all certifications with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401),
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'current' | 'expiring' | 'expired' | 'all' | null
    const pilotId = searchParams.get('pilotId')
    const checkTypeId = searchParams.get('checkTypeId')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    // Fetch certifications
    const result = await getCertifications(page, pageSize, {
      status: status || undefined,
      pilotId: pilotId || undefined,
      checkTypeId: checkTypeId || undefined,
      category: category || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result.certifications,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      },
    })
  } catch (error) {
    console.error('GET /api/certifications error:', error)
    return NextResponse.json(
      formatApiError(ERROR_MESSAGES.CERTIFICATION.FETCH_FAILED, 500),
      { status: 500 }
    )
  }
}

/**
 * POST /api/certifications
 * Create a new certification
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401),
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CertificationCreateSchema.parse(body)

    // Create certification
    const newCertification = await createCertification(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: newCertification,
        message: 'Certification created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/certifications error:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('certification data')
      return NextResponse.json(
        {
          ...formatApiError(validationError, 400),
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      formatApiError(ERROR_MESSAGES.CERTIFICATION.CREATE_FAILED, 500),
      { status: 500 }
    )
  }
}
