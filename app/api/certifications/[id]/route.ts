/**
 * Individual Certification API Route
 * Handles single certification operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getCertificationById,
  updateCertification,
  deleteCertification,
} from '@/lib/services/certification-service'
import { CertificationUpdateSchema } from '@/lib/validations/certification-validation'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/certifications/[id]
 * Get a single certification by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Fetch certification
    const certification = await getCertificationById(id)

    if (!certification) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certification not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: certification,
    })
  } catch (error) {
    console.error('GET /api/certifications/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch certification',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/certifications/[id]
 * Update a certification
 */
export async function PUT(_request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CertificationUpdateSchema.parse(body)

    // Update certification
    const updatedCertification = await updateCertification(id, validatedData)

    if (!updatedCertification) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certification not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedCertification,
      message: 'Certification updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/certifications/[id] error:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update certification',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/certifications/[id]
 * Delete a certification
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Delete certification
    await deleteCertification(id)

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/certifications/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete certification',
      },
      { status: 500 }
    )
  }
}
