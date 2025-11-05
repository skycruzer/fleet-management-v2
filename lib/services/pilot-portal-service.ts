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
import { createPilotSession, validatePilotSession, revokePilotSession, getCurrentPilotSession } from './session-service'

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
 * @param metadata - Optional request metadata (IP address, user agent)
 * @returns Service response with user session
 */
export async function pilotLogin(
  credentials: PilotLoginInput,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<ServiceResponse<{ user: any; session: any }>> {
  try {
    // SECURITY: Authentication attempt (email not logged for privacy)
    const supabase = await createClient()
    const bcrypt = require('bcrypt')

    // Find pilot user by email
    const { data: pilotUser, error: pilotError } = await supabase
      .from('pilot_users')
      .select('id, email, password_hash, auth_user_id, registration_approved, first_name, last_name, rank')
      .eq('email', credentials.email)
      .single()

    console.log('📊 Query result:', {
      hasPilotUser: !!pilotUser,
      hasError: !!pilotError,
      errorMessage: pilotError?.message,
      errorDetails: pilotError
    })

    if (pilotError || !pilotUser) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
      }
    }

    // Verify registration is approved
    if (!pilotUser.registration_approved) {
      return {
        success: false,
        error: 'Your registration is pending admin approval.',
      }
    }

    // PRIORITY: Check password_hash first (direct registration with bcrypt)
    // Fall back to Supabase Auth only if no password_hash exists
    if (pilotUser.password_hash) {
      // Pilot registered with password hash - use bcrypt verification
      // SECURITY: Using bcrypt authentication

      const passwordMatch = await bcrypt.compare(credentials.password, pilotUser.password_hash)

      if (!passwordMatch) {
        // SECURITY: Password mismatch - do not log details
        return {
          success: false,
          error: ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
        }
      }

      // SECURITY: Password validated successfully

      // Update last login time
      await supabase
        .from('pilot_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', pilotUser.id)

      // SECURITY FIX: Create secure server-side session (no longer using user ID as token)
      const sessionResult = await createPilotSession(pilotUser.id, metadata)

      if (!sessionResult.success || !sessionResult.sessionToken) {
        console.error('Failed to create pilot session:', sessionResult.error)
        return {
          success: false,
          error: 'Session creation failed. Please try again.',
        }
      }

      // Return session data with secure token
      const sessionData = {
        user: {
          id: pilotUser.id,
          email: pilotUser.email,
          user_metadata: {
            first_name: pilotUser.first_name,
            last_name: pilotUser.last_name,
            rank: pilotUser.rank,
          },
        },
        session: {
          access_token: sessionResult.sessionToken, // ✅ Secure cryptographic token
          user: {
            id: pilotUser.id,
            email: pilotUser.email,
          },
        },
      }

      return {
        success: true,
        data: sessionData,
      }
    } else if (pilotUser.auth_user_id) {
      // Pilot registered via Supabase Auth - use Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError || !authData.session) {
        // Check if this is because the Supabase Auth user doesn't exist
        // (can happen if registration had connectivity issues)
        if (authError?.message?.includes('Invalid login credentials') ||
            authError?.message?.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Your account setup is incomplete. Please contact the administrator for assistance.',
          }
        }

        return {
          success: false,
          error: ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
        }
      }

      // Update last login time
      await supabase
        .from('pilot_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', pilotUser.id)

      // Return Supabase Auth session
      return {
        success: true,
        data: {
          user: authData.user,
          session: authData.session,
        },
      }
    } else {
      // No password set at all
      return {
        success: false,
        error: 'Password not set. Please contact administrator.',
      }
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
    // SECURITY FIX: Revoke secure server-side session
    const session = await getCurrentPilotSession()

    if (session) {
      // Revoke the secure session
      const revokeResult = await revokePilotSession(session.session_token, 'User logout')

      if (!revokeResult.success) {
        console.error('Failed to revoke session:', revokeResult.error)
        return {
          success: false,
          error: 'Logout failed. Please try again.',
        }
      }
    }

    // Also sign out from Supabase Auth (for pilots using Supabase Auth)
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      // Log error but don't fail - session already revoked
      console.error('Supabase auth sign out error:', error)
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

    // Hash password using bcrypt
    const bcrypt = require('bcrypt')
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(registration.password, saltRounds)

    // SECURITY: Creating direct registration with bcrypt password hash

    // Create registration record in pilot_users
    const registrationData = {
      // Let database generate UUID via default gen_random_uuid()
      first_name: registration.first_name,
      last_name: registration.last_name,
      email: registration.email,
      password_hash: passwordHash, // Store hashed password
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
      console.error('Pilot registration insert failed:', regError)

      return {
        success: false,
        error: handleConstraintError(regError),
      }
    }

    // SECURITY: Registration created successfully (ID not logged for privacy)

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
      // SECURITY: Pilot registration approved (user ID not logged)
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

    // Use getPilotByUserId to get the pilot record
    const { getPilotByUserId } = await import('./pilot-service')
    const pilot = await getPilotByUserId(user.id)

    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.PILOT.NOT_FOUND.message,
      }
    }

    // Return pilot data with user email from auth
    return {
      success: true,
      data: {
        id: pilot.id,
        first_name: pilot.first_name,
        last_name: pilot.last_name,
        role: pilot.role,
        employee_id: pilot.employee_id,
        seniority_number: pilot.seniority_number,
        email: user.email,
        pilot_id: pilot.id, // For backward compatibility
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

// ===================================
// PASSWORD RESET OPERATIONS
// ===================================

/**
 * Request password reset - generates token and sends email
 *
 * @param email - Pilot user email address
 * @returns Service response with success status
 */
export async function requestPasswordReset(
  email: string
): Promise<ServiceResponse<{ message: string }>> {
  try {
    const supabase = await createClient()
    const crypto = require('crypto')

    // Find pilot user by email
    const { data: pilotUser, error: pilotError } = await supabase
      .from('pilot_users')
      .select('id, email, first_name, last_name, rank, registration_approved')
      .eq('email', email.toLowerCase().trim())
      .single()

    // Always return success to prevent email enumeration attacks
    // Don't reveal if email exists or not
    if (pilotError || !pilotUser) {
      // SECURITY: Password reset requested for non-existent email (email not logged)
      return {
        success: true,
        data: {
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
      }
    }

    // Check if registration is approved
    if (!pilotUser.registration_approved) {
      // SECURITY: Password reset requested for unapproved account (email not logged)
      return {
        success: true,
        data: {
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
      }
    }

    // Generate secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex')

    // Token expires in 1 hour
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Store token in database
    const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
      user_id: pilotUser.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      console.error('Failed to create password reset token:', tokenError)
      return {
        success: false,
        error: 'Failed to process password reset request. Please try again.',
      }
    }

    // Send password reset email
    const { sendPasswordResetEmail } = await import('./pilot-email-service')
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/portal/reset-password?token=${token}`
    const emailResult = await sendPasswordResetEmail({
      firstName: pilotUser.first_name,
      lastName: pilotUser.last_name,
      email: pilotUser.email,
      resetLink,
      expiresIn: '1 hour',
    })

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      // Don't fail the request - token is still valid
      // User might need to contact support
    }

    // SECURITY: Password reset email sent (email not logged for privacy)

    return {
      success: true,
      data: {
        message: 'If an account exists with this email, a password reset link has been sent.',
      },
    }
  } catch (error) {
    console.error('Request password reset error:', error)
    return {
      success: false,
      error: 'Failed to process password reset request. Please try again.',
    }
  }
}

/**
 * Validate password reset token
 *
 * @param token - Reset token from email link
 * @returns Service response with validation status
 */
export async function validatePasswordResetToken(
  token: string
): Promise<ServiceResponse<{ userId: string; email: string }>> {
  try {
    const supabase = await createClient()

    // Find token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select(
        `
        id,
        user_id,
        expires_at,
        used_at,
        pilot_users (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq('token', token)
      .single()

    if (tokenError || !resetToken) {
      return {
        success: false,
        error: 'Invalid or expired reset link. Please request a new one.',
      }
    }

    // Check if token was already used
    if (resetToken.used_at) {
      return {
        success: false,
        error: 'This reset link has already been used. Please request a new one.',
      }
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)
    if (now > expiresAt) {
      return {
        success: false,
        error: 'This reset link has expired. Please request a new one.',
      }
    }

    return {
      success: true,
      data: {
        userId: resetToken.user_id,
        email: (resetToken.pilot_users as any)?.email || '',
      },
    }
  } catch (error) {
    console.error('Validate password reset token error:', error)
    return {
      success: false,
      error: 'Failed to validate reset link. Please try again.',
    }
  }
}

/**
 * Reset password using valid token
 *
 * @param token - Reset token from email
 * @param newPassword - New password to set
 * @returns Service response with success status
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ServiceResponse<{ message: string }>> {
  try {
    const supabase = await createClient()
    const bcrypt = require('bcrypt')

    // Validate token first
    const validation = await validatePasswordResetToken(token)
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: validation.error || 'Invalid reset token',
      }
    }

    const { userId } = validation.data

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabase
      .from('pilot_users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return {
        success: false,
        error: 'Failed to reset password. Please try again.',
      }
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    // SECURITY: Password reset successful

    return {
      success: true,
      data: {
        message: 'Password reset successfully. You can now log in with your new password.',
      },
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      success: false,
      error: 'Failed to reset password. Please try again.',
    }
  }
}

/**
 * Verify pilot session from API request
 * SECURITY: Validates secure session token
 *
 * Usage in API routes:
 * ```typescript
 * const pilotId = await verifyPilotSession(request)
 * if (!pilotId) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 * }
 * ```
 *
 * @param request - NextRequest object from API route
 * @returns Pilot user ID if valid session, null otherwise
 */
export async function verifyPilotSession(
  request?: Request
): Promise<string | null> {
  try {
    // Validate session token (from cookie or header)
    const validation = await validatePilotSession()

    if (!validation.isValid || !validation.userId) {
      return null
    }

    return validation.userId
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}

// Note: getCurrentPilot function moved to lib/auth/pilot-helpers.ts
// to avoid duplicate function definitions. Import from there if needed.
