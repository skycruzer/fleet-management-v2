/**
 * Individual Certification API Route
 * Handles single certification operations (GET, PUT, DELETE)
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PUT and DELETE methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getCertificationById,
  updateCertification,
  deleteCertification,
} from '@/lib/services/certification-service'
import { CertificationUpdateSchema } from '@/lib/validations/certification-validation'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

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
    const { id } = await context.params
    const sanitized = sanitizeError(error, {
      operation: 'getCertificationById',
      resourceId: id,
      endpoint: '/api/certifications/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PUT /api/certifications/[id]
 * Update a certification
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    console.log('🌐 [API PUT /api/certifications/[id]] Request received')

    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      console.error('❌ [API] CSRF validation failed')
      return csrfError
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ [API] Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [API] User authenticated:', user.email)

    const { id } = await context.params
    console.log('🔑 [API] Certification ID:', id)

    // Parse and validate request body
    const body = await request.json()
    console.log('📦 [API] Request body:', JSON.stringify(body, null, 2))

    const validatedData = CertificationUpdateSchema.parse(body)
    console.log('✅ [API] Validation passed')
    console.log('🔄 [API] Calling updateCertification service...')

    // Update certification
    const updatedCertification = await updateCertification(id, validatedData)

    if (!updatedCertification) {
      console.error('❌ [API] Certification not found')
      return NextResponse.json(
        {
          success: false,
          error: 'Certification not found',
        },
        { status: 404 }
      )
    }

    console.log('✅ [API] Certification updated successfully')
    console.log(
      '📤 [API] Returning updated certification with expiry:',
      updatedCertification.expiry_date
    )

    // Revalidate certification pages to clear Next.js cache
    revalidatePath('/dashboard/certifications')
    revalidatePath(`/dashboard/certifications/${id}`)
    revalidatePath(`/dashboard/certifications/${id}/edit`)

    // CRITICAL: Revalidate pilot detail page (where certifications are edited from)
    if (updatedCertification.pilot_id) {
      revalidatePath(`/dashboard/pilots/${updatedCertification.pilot_id}`)
    }

    // Also revalidate pilots list page to update certification counts
    revalidatePath('/dashboard/pilots')

    return NextResponse.json({
      success: true,
      data: updatedCertification,
      message: 'Certification updated successfully',
    })
  } catch (error) {
    console.error('❌ [API] Error updating certification:', error)

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

    const { id } = await context.params
    const sanitized = sanitizeError(error, {
      operation: 'updateCertification',
      resourceId: id,
      endpoint: '/api/certifications/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE /api/certifications/[id]
 * Delete a certification
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Fetch certification before deleting to get pilot_id for cache invalidation
    const certification = await getCertificationById(id)
    if (!certification) {
      return NextResponse.json(
        { success: false, error: 'Certification not found' },
        { status: 404 }
      )
    }

    // Delete certification
    await deleteCertification(id)

    // CRITICAL: Revalidate cache paths after deletion (was missing!)
    revalidatePath('/dashboard/certifications')
    revalidatePath(`/dashboard/certifications/${id}`)
    if (certification.pilot_id) {
      revalidatePath(`/dashboard/pilots/${certification.pilot_id}`)
    }
    revalidatePath('/dashboard/pilots')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/certifications/[id] error:', error)
    const { id } = await context.params
    const sanitized = sanitizeError(error, {
      operation: 'deleteCertification',
      resourceId: id,
      endpoint: '/api/certifications/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
