/**
 * Pilot Portal Service
 *
 * Handles pilot authentication, registration, and portal operations.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 2.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { handleConstraintError } from '@/lib/utils/constraint-error-handler'
import {
  PilotLoginInput,
  PilotRegistrationInput,
  RegistrationApprovalInput,
} from '@/lib/validations/pilot-portal-schema'

// Type aliases for cleaner code
type PilotRegistration = Database['public']['Tables']['pilot_users']['Row']
type PilotRegistrationInsert = Database['public']['Tables']['pilot_users']['Insert']

/**
 * Service response type
 */
interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Portal statistics type
 */
interface PortalStats {
  total_pilots: number
  total_captains: number
  total_first_officers: number
  active_certifications: number
  pending_leave_requests: number
  pending_flight_requests: number
  upcoming_checks: number
  upcoming_checks_details: Array<{
    id: string
    check_code: string
    check_description: string
    expiry_date: string
  }>
  expired_certifications: number
  expired_certifications_details: Array<{
    id: string
    check_code: string
    check_description: string
    expiry_date: string
  }>
  critical_certifications: number
  critical_certifications_details: Array<{
    id: string
    check_code: string
    check_description: string
    expiry_date: string
  }>
}

// ===================================
// AUTHENTICATION OPERATIONS
// ===================================

/**
 * Pilot login with email and password
 *
 * @param credentials - Login credentials
 * @returns Service response with user session
 */
export async function pilotLogin(
  credentials: PilotLoginInput
): Promise<ServiceResponse<{ user: any; session: any }>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
      }
    }

    // Check if user is an approved pilot in pilot_users table
    const { data: pilotUser, error: pilotError } = await supabase
      .from('pilot_users')
      .select('id, email, registration_approved, first_name, last_name, rank')
      .eq('id', data.user.id)
      .single()

    if (pilotError || !pilotUser) {
      // If not a pilot, check if user is an admin/manager in an_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('an_users')
        .select('id, role, email')
        .eq('id', data.user.id)
        .single()

      if (adminError || !adminUser) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'User not found in system.',
        }
      }

      // Allow admins to access pilot portal
      if (adminUser.role !== 'admin') {
        await supabase.auth.signOut()
        return {
          success: false,
          error: ERROR_MESSAGES.AUTH.FORBIDDEN.message,
        }
      }
    } else {
      // Verify pilot registration is approved
      if (!pilotUser.registration_approved) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Your registration is pending admin approval.',
        }
      }
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    }
  } catch (error) {
    console.error('Pilot login error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
    }
  }
}

/**
 * Pilot logout
 *
 * @returns Service response
 */
export async function pilotLogout(): Promise<ServiceResponse<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: 'Logout failed. Please try again.',
      }
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Pilot logout error:', error)
    return {
      success: false,
      error: 'Logout failed. Please try again.',
    }
  }
}

// ===================================
// REGISTRATION OPERATIONS
// ===================================

/**
 * Submit pilot registration
 *
 * Creates a pending registration for admin approval.
 * Uses Supabase Auth to create the user account.
 *
 * @param registration - Registration data
 * @returns Service response with registration ID
 */
export async function submitPilotRegistration(
  registration: PilotRegistrationInput
): Promise<ServiceResponse<{ id: string; status: string }>> {
  try {
    const supabase = await createClient()

    // Step 1: Create auth user (unconfirmed until approved)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: registration.email,
      password: registration.password,
      options: {
        data: {
          first_name: registration.first_name,
          last_name: registration.last_name,
          rank: registration.rank,
        },
      },
    })

    if (authError) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED.message,
      }
    }

    // Step 2: Create registration record in pilot_users
    const registrationData: PilotRegistrationInsert = {
      id: authData.user.id,
      first_name: registration.first_name,
      last_name: registration.last_name,
      email: registration.email,
      employee_id: registration.employee_id || null,
      rank: registration.rank,
      date_of_birth: registration.date_of_birth || null,
      phone_number: registration.phone_number || null,
      address: registration.address || null,
      registration_approved: null, // Pending approval
      registration_date: new Date().toISOString(),
    }

    const { data: regData, error: regError } = await supabase
      .from('pilot_users')
      .insert(registrationData)
      .select('id, registration_approved')
      .single()

    if (regError) {
      // Rollback: Delete the auth user if registration insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)

      return {
        success: false,
        error: handleConstraintError(regError),
      }
    }

    return {
      success: true,
      data: {
        id: regData.id,
        status: regData.registration_approved === null ? 'PENDING' : (regData.registration_approved ? 'APPROVED' : 'DENIED'),
      },
    }
  } catch (error) {
    console.error('Pilot registration error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED.message,
    }
  }
}

/**
 * Get registration status by email
 *
 * @param email - Pilot email address
 * @returns Service response with registration record
 */
export async function getRegistrationStatus(
  email: string
): Promise<ServiceResponse<PilotRegistration | null>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pilot_users')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registration status').message,
      }
    }

    return {
      success: true,
      data: data,
    }
  } catch (error) {
    console.error('Get registration status error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registration status').message,
    }
  }
}

/**
 * Get all pending registrations (admin only)
 *
 * @returns Service response with pending registrations
 */
export async function getPendingRegistrations(): Promise<ServiceResponse<PilotRegistration[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pilot_users')
      .select('*')
      .is('registration_approved', null) // NULL means pending
      .order('created_at', { ascending: true })

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('pending registrations').message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Get pending registrations error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('pending registrations').message,
    }
  }
}

/**
 * Approve or deny pilot registration (admin only)
 *
 * @param registrationId - Registration ID
 * @param approval - Approval decision
 * @param reviewerId - Admin user ID
 * @returns Service response
 */
export async function reviewPilotRegistration(
  registrationId: string,
  approval: RegistrationApprovalInput,
  reviewerId: string
): Promise<ServiceResponse<{ status: string }>> {
  try {
    const supabase = await createClient()

    // Step 1: Update registration status in pilot_users
    const { data: registration, error: updateError } = await supabase
      .from('pilot_users')
      .update({
        registration_approved: approval.status === 'APPROVED',
        denial_reason: approval.denial_reason || null,
        approved_by: reviewerId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', registrationId)
      .select('id, registration_approved, email, first_name, last_name, rank')
      .single()

    if (updateError) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.APPROVAL_FAILED.message,
      }
    }

    // Step 2: If approved, the user role is already set via registration_approved field
    // No additional updates needed - the registration_approved flag controls access
    if (approval.status === 'APPROVED' && registration.id) {
      // Note: Pilot operational record creation is handled separately
      // when employee_id is assigned to the pilot_users record
      console.log(`Pilot registration approved for user ${registration.id}`)
    }

    // Step 3: If denied, optionally delete the auth user
    if (approval.status === 'DENIED' && registration.id) {
      // Note: You might want to keep the auth user for audit purposes
      // Uncomment if you want to delete denied registrations
      // await supabase.auth.admin.deleteUser(registration.id)
    }

    return {
      success: true,
      data: { status: approval.status === 'APPROVED' ? 'approved' : 'denied' },
    }
  } catch (error) {
    console.error('Review registration error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.APPROVAL_FAILED.message,
    }
  }
}

// ===================================
// PILOT PORTAL OPERATIONS
// ===================================

/**
 * Get pilot portal statistics for dashboard
 *
 * @param pilotId - Pilot ID
 * @returns Service response with portal stats
 */
export async function getPilotPortalStats(pilotId: string): Promise<ServiceResponse<PortalStats>> {
  try {
    const supabase = await createClient()

    // Get total pilots count
    const { count: pilotsCount } = await supabase
      .from('pilots')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total captains count
    const { count: captainsCount } = await supabase
      .from('pilots')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('role', 'Captain')

    // Get total first officers count
    const { count: firstOfficersCount } = await supabase
      .from('pilots')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('role', 'First Officer')

    // Get active certifications count for this pilot
    const { count: certsCount } = await supabase
      .from('pilot_checks')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_id', pilotId)
      .gte('expiry_date', new Date().toISOString())

    // Get pending leave requests count for this pilot
    const { count: leaveCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_id', pilotId)
      .eq('status', 'pending')

    // Get pending flight requests count for this pilot
    const { count: flightCount } = await supabase
      .from('flight_requests')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_id', pilotId)
      .in('status', ['PENDING', 'UNDER_REVIEW'])

    // Get upcoming checks (expiring within 60 days) with details
    const sixtyDaysFromNow = new Date()
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

    const { data: upcomingChecks } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        check_types (
          check_code,
          check_description
        )
      `
      )
      .eq('pilot_id', pilotId)
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', sixtyDaysFromNow.toISOString())
      .order('expiry_date', { ascending: true })
      .limit(5)

    // Get expired certifications
    const { data: expiredChecks } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        check_types (
          check_code,
          check_description
        )
      `
      )
      .eq('pilot_id', pilotId)
      .lt('expiry_date', new Date().toISOString())
      .order('expiry_date', { ascending: false })
      .limit(10)

    // Get critical certifications (expiring within 14 days)
    const fourteenDaysFromNow = new Date()
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)

    const { data: criticalChecks } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        check_types (
          check_code,
          check_description
        )
      `
      )
      .eq('pilot_id', pilotId)
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', fourteenDaysFromNow.toISOString())
      .order('expiry_date', { ascending: true })
      .limit(10)

    return {
      success: true,
      data: {
        total_pilots: pilotsCount || 0,
        total_captains: captainsCount || 0,
        total_first_officers: firstOfficersCount || 0,
        active_certifications: certsCount || 0,
        pending_leave_requests: leaveCount || 0,
        pending_flight_requests: flightCount || 0,
        upcoming_checks: upcomingChecks?.length || 0,
        upcoming_checks_details:
          upcomingChecks?.map((check: any) => ({
            id: check.id,
            check_code: check.check_types?.check_code || 'Unknown',
            check_description: check.check_types?.check_description || 'Unknown',
            expiry_date: check.expiry_date,
          })) || [],
        expired_certifications: expiredChecks?.length || 0,
        expired_certifications_details:
          expiredChecks?.map((check: any) => ({
            id: check.id,
            check_code: check.check_types?.check_code || 'Unknown',
            check_description: check.check_types?.check_description || 'Unknown',
            expiry_date: check.expiry_date,
          })) || [],
        critical_certifications: criticalChecks?.length || 0,
        critical_certifications_details:
          criticalChecks?.map((check: any) => ({
            id: check.id,
            check_code: check.check_types?.check_code || 'Unknown',
            check_description: check.check_types?.check_description || 'Unknown',
            expiry_date: check.expiry_date,
          })) || [],
      },
    }
  } catch (error) {
    console.error('Get pilot portal stats error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('portal statistics').message,
    }
  }
}

/**
 * Get current authenticated pilot information
 *
 * @returns Service response with pilot user data (includes both pilot_users.id and pilots.id)
 */
export async function getCurrentPilot(): Promise<ServiceResponse<any | null>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get pilot_users record (which has all portal user info)
    const { data: pilotUser, error: pilotError } = await supabase
      .from('pilot_users')
      .select(
        'id, email, first_name, last_name, rank, employee_id, registration_approved, seniority_number'
      )
      .eq('id', user.id)
      .single()

    if (pilotError || !pilotUser) {
      return {
        success: false,
        error: ERROR_MESSAGES.PILOT.NOT_FOUND.message,
      }
    }

    // Verify registration is approved
    if (!pilotUser.registration_approved) {
      return {
        success: false,
        error: 'Your registration is pending admin approval.',
      }
    }

    // Get the corresponding pilots table record (for operational data queries)
    let pilotsRecord = null
    if (pilotUser.employee_id) {
      const { data, error: pilotsError } = await supabase
        .from('pilots')
        .select('id')
        .eq('employee_id', pilotUser.employee_id)
        .single()

      if (pilotsError || !data) {
        console.warn('Pilot record not found in pilots table for employee_id:', pilotUser.employee_id)
        // Continue without pilots.id - portal still works but with no operational data
      } else {
        pilotsRecord = data
      }
    }

    return {
      success: true,
      data: {
        ...pilotUser,
        pilot_id: pilotsRecord?.id || null, // Add pilots.id for operational queries
      },
    }
  } catch (error) {
    console.error('Get current pilot error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PILOT.FETCH_FAILED.message,
    }
  }
}
