/**
 * Pilot API Route - Individual Pilot Operations
 * Handles DELETE requests for pilot deletion
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PUT and DELETE methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.2.0
 * @since 2025-10-20
 * @updated 2025-10-27 - Added rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getPilotById, updatePilot, deletePilot } from '@/lib/services/pilot-service'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { createClient } from '@/lib/supabase/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/pilots/[id]
 * Fetch a single pilot by ID with certification status and system settings
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    // Fetch pilot and system settings in parallel
    const [pilot, requirements] = await Promise.all([getPilotById(pilotId), getPilotRequirements()])

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: pilot,
      systemSettings: {
        pilot_retirement_age: requirements.pilot_retirement_age,
      },
    })
  } catch (error: any) {
    console.error('Error fetching pilot:', error)
    const { id: pilotId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'getPilotById',
      resourceId: pilotId,
      endpoint: '/api/pilots/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PUT /api/pilots/[id]
 * Update a pilot's information
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('🌐 [API PUT /api/pilots/[id]] Request received')

    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset, remaining } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      console.error('❌ [API] CSRF validation failed')
      return csrfError
    }

    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API] Authentication failed')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [API] User authenticated:', user.email)

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

    if (!pilotId) {
      console.error('❌ [API] No pilot ID provided')
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    console.log('🔑 [API] Pilot ID:', pilotId)

    // Parse request body
    const body = await request.json()
    console.log('📦 [API] Request body:', JSON.stringify(body, null, 2))

    // Update pilot using service layer
    console.log('🔄 [API] Calling updatePilot service...')
    const updatedPilot = await updatePilot(pilotId, body)

    console.log('✅ [API] Pilot updated successfully')
    console.log('📤 [API] Returning updated pilot with role:', updatedPilot.role)

    // Revalidate cache for pilot-related pages
    revalidatePath('/dashboard/pilots')
    revalidatePath(`/dashboard/pilots/${pilotId}`)
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      data: updatedPilot,
      message: 'Pilot updated successfully',
    })
  } catch (error: any) {
    console.error('❌ [API] Error updating pilot:', error)
    const { id: pilotId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'updatePilot',
      resourceId: pilotId,
      endpoint: '/api/pilots/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE /api/pilots/[id]
 * Delete a pilot and all related records (atomic)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset, remaining } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    // Delete pilot using service layer (includes cascade deletion)
    await deletePilot(pilotId)

    // Revalidate cache for pilot-related pages
    revalidatePath('/dashboard/pilots')
    revalidatePath(`/dashboard/pilots/${pilotId}`)
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Pilot deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting pilot:', error)
    const { id: pilotId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'deletePilot',
      resourceId: pilotId,
      endpoint: '/api/pilots/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
