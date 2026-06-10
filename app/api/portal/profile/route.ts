/**
 * Pilot Portal Profile API Route
 *
 * GET /api/portal/profile - Fetch pilot personal information
 * PUT /api/portal/profile - Update pilot contact information
 *
 * Security pipeline (CSRF, auth, rate limiting) via createPilotRoute.
 * GET is intentionally not rate limited — shared office IPs would pool
 * into one bucket (see lib/rate-limit.ts prefix note).
 *
 * @version 2.0.0
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { createPilotRoute } from '@/lib/middleware/create-api-route'

/**
 * GET /api/portal/profile
 * Fetch pilot personal information for the authenticated pilot
 */
export const GET = createPilotRoute(
  {
    operation: 'getPilotProfile',
    endpoint: '/api/portal/profile',
    rateLimit: false,
  },
  async ({ pilot }) => {
    const supabase = createAdminClient()

    // Get requirements first
    const requirements = await getPilotRequirements()

    // Check if pilot has a linked pilots table record
    if (pilot.pilot_id) {
      // Fetch full pilot details from pilots table
      const { data: pilotData, error: pilotError } = await supabase
        .from('pilots')
        .select('*')
        .eq('id', pilot.pilot_id)
        .single()

      if (pilotError) {
        console.error('Fetch pilot details error:', pilotError)
        // Fall back to pilot_users data
        return NextResponse.json({
          success: true,
          data: {
            id: pilot.id,
            first_name: pilot.first_name,
            last_name: pilot.last_name,
            rank: pilot.rank,
            email: pilot.email,
            employee_id: pilot.employee_id,
            seniority_number: null,
            date_of_birth: null,
            commencement_date: null,
            status: 'active',
            phone_number: null,
            address: null,
          },
          systemSettings: {
            pilot_retirement_age: requirements.pilot_retirement_age,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ...pilotData,
          email: pilot.email,
        },
        systemSettings: {
          pilot_retirement_age: requirements.pilot_retirement_age,
        },
      })
    } else {
      // Pilot only exists in pilot_users table (no linked pilots record)
      // Return data from pilot_users
      return NextResponse.json({
        success: true,
        data: {
          id: pilot.id,
          first_name: pilot.first_name,
          last_name: pilot.last_name,
          rank: pilot.rank,
          email: pilot.email,
          employee_id: pilot.employee_id,
          seniority_number: null,
          date_of_birth: null,
          commencement_date: null,
          status: 'active',
          phone_number: null,
          address: null,
        },
        systemSettings: {
          pilot_retirement_age: requirements.pilot_retirement_age,
        },
      })
    }
  }
)

/**
 * PUT /api/portal/profile
 * Update pilot contact information (email & phone number)
 */
export const PUT = createPilotRoute(
  {
    operation: 'updatePilotProfile',
    endpoint: '/api/portal/profile',
  },
  async ({ request, pilot }) => {
    const supabase = createAdminClient()

    const body = await request.json()
    const { email, phone_number } = body

    // Validate email is present
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required' },
        { status: 400 }
      )
    }

    // Update pilot_users table (contact info lives here for portal users)
    const { error: userUpdateError } = await supabase
      .from('pilot_users')
      .update({
        email: email.trim(),
        phone_number: phone_number?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pilot.id)

    if (userUpdateError) {
      console.error('Update pilot_users contact error:', userUpdateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update contact information' },
        { status: 500 }
      )
    }

    // Also update the linked pilots table if it exists
    if (pilot.pilot_id) {
      const { error: pilotUpdateError } = await supabase
        .from('pilots')
        .update({
          phone_number: phone_number?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pilot.pilot_id)

      if (pilotUpdateError) {
        console.error('Update linked pilots table error:', pilotUpdateError)
      }
    }

    revalidatePath('/portal/profile')
    revalidatePath('/portal/dashboard')

    return NextResponse.json({ success: true })
  }
)
