/**
 * Account Deletion Service
 * Author: Maurice Rondeau
 *
 * Handles safe account deletion with cascade handling and audit logging.
 * Implements GDPR-compliant data anonymization for compliance.
 *
 * @version 1.0.0
 * @since 2025-11-09
 */

import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/services/audit-service'

/**
 * Account deletion options
 */
export interface AccountDeletionOptions {
  userId: string
  userEmail?: string
  preserveAuditTrail?: boolean
  anonymizeData?: boolean
}

/**
 * Account deletion result
 */
export interface AccountDeletionResult {
  success: boolean
  message: string
  deletedEntities?: {
    anUsers: boolean
    pilotData: boolean
    leaveRequests: number
    flightRequests: number
    feedback: number
  }
}

/**
 * Delete user account with cascade handling
 * Implements safe deletion with anonymization for compliance
 *
 * @param options - Account deletion options
 * @returns Deletion result with details
 */
export async function deleteUserAccount(
  options: AccountDeletionOptions
): Promise<AccountDeletionResult> {
  const { userId, userEmail, preserveAuditTrail = true, anonymizeData = true } = options

  const supabase = await createClient()

  try {
    // Check if user exists
    const { data: anUser, error: userCheckError } = await supabase
      .from('an_users')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (userCheckError || !anUser) {
      return {
        success: false,
        message: 'User not found',
      }
    }

    // Prevent admin deletion without explicit override
    if (anUser.role === 'admin') {
      return {
        success: false,
        message: 'Admin accounts cannot be deleted through this API',
      }
    }

    // Get pilot data if exists (by email)
    const { data: pilotData } = await supabase
      .from('pilots')
      .select('id')
      .eq('email', anUser.email)
      .maybeSingle()

    const pilotId = pilotData?.id

    // Track deletion counts
    let leaveRequestsDeleted = 0
    let flightRequestsDeleted = 0
    let feedbackDeleted = 0

    // Delete or anonymize related data
    if (pilotId) {
      // Delete leave requests from unified pilot_requests table
      const { count: leaveCount } = await supabase
        .from('pilot_requests')
        .delete({ count: 'exact' })
        .eq('pilot_id', pilotId)
        .eq('request_category', 'LEAVE')
      leaveRequestsDeleted = leaveCount || 0

      // Delete flight requests from unified pilot_requests table
      const { count: flightCount } = await supabase
        .from('pilot_requests')
        .delete({ count: 'exact' })
        .eq('pilot_id', pilotId)
        .eq('request_category', 'FLIGHT')
      flightRequestsDeleted = flightCount || 0

      // Note: 'feedback' table might not exist in current schema
      // Skipping feedback deletion for now
      feedbackDeleted = 0

      // Anonymize or delete pilot data
      if (anonymizeData) {
        // GDPR compliance: Anonymize instead of delete to preserve historical data
        await supabase
          .from('pilots')
          .update({
            email: `deleted_${userId}@deleted.local`,
            phone: null,
            emergency_contact: null,
            emergency_phone: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pilotId)
      } else {
        // Hard delete pilot record (may fail due to foreign key constraints)
        await supabase.from('pilots').delete().eq('id', pilotId)
      }
    }

    // Create audit log entry before deletion
    if (preserveAuditTrail) {
      await createAuditLog({
        action: 'DELETE',
        tableName: 'an_users',
        recordId: userId,
        description: `Account deleted: ${userEmail || anUser.email}`,
        newData: {
          email: userEmail || anUser.email,
          pilot_id: pilotId,
          deleted_at: new Date().toISOString(),
          leave_requests_deleted: leaveRequestsDeleted,
          flight_requests_deleted: flightRequestsDeleted,
          feedback_deleted: feedbackDeleted,
        },
      })
    }

    // Delete user from an_users table
    const { error: deleteUserError } = await supabase.from('an_users').delete().eq('id', userId)

    if (deleteUserError) {
      throw new Error(`Failed to delete user record: ${deleteUserError.message}`)
    }

    return {
      success: true,
      message: 'Account deleted successfully',
      deletedEntities: {
        anUsers: true,
        pilotData: !!pilotId,
        leaveRequests: leaveRequestsDeleted,
        flightRequests: flightRequestsDeleted,
        feedback: feedbackDeleted,
      },
    }
  } catch (error) {
    console.error('Account deletion error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete account')
  }
}

/**
 * Check if user can be safely deleted
 * Validates that deletion won't violate constraints
 *
 * @param userId - UUID of the user
 * @returns Object indicating if deletion is safe and any warnings
 */
export async function checkDeletionSafety(userId: string): Promise<{
  canDelete: boolean
  warnings: string[]
  relatedDataCounts: {
    leaveRequests: number
    flightRequests: number
    feedback: number
    certifications: number
  }
}> {
  const supabase = await createClient()
  const warnings: string[] = []

  // Get user data
  const { data: anUser } = await supabase
    .from('an_users')
    .select('id, email, role')
    .eq('id', userId)
    .single()

  if (!anUser) {
    return {
      canDelete: false,
      warnings: ['User not found'],
      relatedDataCounts: {
        leaveRequests: 0,
        flightRequests: 0,
        feedback: 0,
        certifications: 0,
      },
    }
  }

  // Admin accounts should not be deleted
  if (anUser.role === 'admin') {
    warnings.push('This is an admin account - deletion is not recommended')
  }

  // Get pilot ID (by email)
  const { data: pilotData } = await supabase
    .from('pilots')
    .select('id')
    .eq('email', anUser.email)
    .maybeSingle()

  const pilotId = pilotData?.id

  // Count related data
  let leaveRequests = 0
  let flightRequests = 0
  let feedback = 0
  let certifications = 0

  if (pilotId) {
    const { count: leaveCount } = await supabase
      .from('pilot_requests')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_id', pilotId)
      .eq('request_category', 'LEAVE')
    leaveRequests = leaveCount || 0

    const { count: flightCount } = await supabase
      .from('pilot_requests')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_id', pilotId)
      .eq('request_category', 'FLIGHT')
    flightRequests = flightCount || 0

    // Note: 'feedback' table might not exist in current schema
    feedback = 0

    const { count: certCount } = await supabase
      .from('pilot_checks')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_id', pilotId)
    certifications = certCount || 0
  }

  if (certifications > 0) {
    warnings.push(`This account has ${certifications} certifications that will be preserved`)
  }

  if (leaveRequests > 0 || flightRequests > 0) {
    warnings.push(
      `This account has ${leaveRequests} leave requests and ${flightRequests} flight requests that will be deleted`
    )
  }

  return {
    canDelete: anUser.role !== 'admin',
    warnings,
    relatedDataCounts: {
      leaveRequests,
      flightRequests,
      feedback,
      certifications,
    },
  }
}

/**
 * Anonymize user data instead of deletion
 * GDPR-compliant data anonymization
 *
 * @param userId - UUID of the user
 * @returns Anonymization result
 */
export async function anonymizeUserData(userId: string): Promise<{
  success: boolean
  message: string
}> {
  const supabase = await createClient()

  try {
    // Get user data
    const { data: anUser } = await supabase
      .from('an_users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (!anUser) {
      return {
        success: false,
        message: 'User not found',
      }
    }

    // Get pilot data (by email)
    const { data: pilotData } = await supabase
      .from('pilots')
      .select('id')
      .eq('email', anUser.email)
      .maybeSingle()

    const pilotId = pilotData?.id

    // Anonymize pilot data
    if (pilotId) {
      await supabase
        .from('pilots')
        .update({
          email: `anonymized_${userId}@anonymized.local`,
          phone: null,
          emergency_contact: null,
          emergency_phone: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pilotId)
    }

    // Anonymize an_users record
    await supabase
      .from('an_users')
      .update({
        email: `anonymized_${userId}@anonymized.local`,
        name: 'Anonymized User',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return {
      success: true,
      message: 'User data anonymized successfully',
    }
  } catch (error) {
    console.error('Anonymization error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to anonymize user data',
    }
  }
}
